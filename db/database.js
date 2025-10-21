const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: process.env.NODE_ENV === 'production' ? 1 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Handle pool errors to prevent crashes
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    // Don't crash the application
});

// Track if database is initialized (for serverless)
let isInitialized = false;

async function initializeDatabase() {
    // Skip if already initialized in this instance (serverless optimization)
    if (isInitialized) {
        console.log('Database already initialized in this instance');
        return;
    }

    const client = await pool.connect();
    try {
        // Use PostgreSQL advisory lock to ensure only ONE instance initializes
        // Lock ID: 999999 (arbitrary number for our initialization lock)
        console.log('Attempting to acquire initialization lock...');
        const lockResult = await client.query('SELECT pg_try_advisory_lock(999999) as acquired');
        
        if (!lockResult.rows[0].acquired) {
            console.log('Another instance is initializing database, skipping...');
            isInitialized = true;
            return;
        }

        console.log('Lock acquired, running database initialization...');
        
        // Check if initialization has been completed before (using a meta table)
        await client.query(`
            CREATE TABLE IF NOT EXISTS _db_meta (
                key VARCHAR(255) PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const initCheck = await client.query(`
            SELECT value FROM _db_meta WHERE key = 'initialized'
        `);

        if (initCheck.rows.length > 0 && initCheck.rows[0].value === 'true') {
            console.log('Database already initialized, skipping...');
            await client.query('SELECT pg_advisory_unlock(999999)');
            isInitialized = true;
            return;
        }

        console.log('First-time initialization, creating schema...');
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                is_active BOOLEAN DEFAULT true,
                email_verified BOOLEAN DEFAULT false,
                otp VARCHAR(6),
                otp_expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS exams (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                duration INTEGER NOT NULL,
                start_time TIMESTAMPTZ NOT NULL,
                end_time TIMESTAMPTZ NOT NULL,
                exam_code VARCHAR(10) UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                question_text TEXT NOT NULL,
                question_type VARCHAR(20) DEFAULT 'multiple_choice',
                options JSONB,
                correct_answer TEXT NOT NULL,
                points INTEGER DEFAULT 1,
                question_order INTEGER
            );

            CREATE TABLE IF NOT EXISTS exam_attempts (
                id SERIAL PRIMARY KEY,
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                answers JSONB,
                score INTEGER,
                total_points INTEGER,
                percentage DECIMAL(5,2),
                status VARCHAR(20) DEFAULT 'in_progress',
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                violations INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS allowed_students (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES users(id),
                student_email VARCHAR(255) NOT NULL,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(admin_id, student_email)
            );

            CREATE TABLE IF NOT EXISTS exam_student_assignments (
                id SERIAL PRIMARY KEY,
                exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
                student_email VARCHAR(255) NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(exam_id, student_email)
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_exams_code ON exams(exam_code);
            CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
            CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
            CREATE INDEX IF NOT EXISTS idx_allowed_students_admin ON allowed_students(admin_id);
            CREATE INDEX IF NOT EXISTS idx_allowed_students_email ON allowed_students(student_email);
            CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam ON exam_student_assignments(exam_id);
            CREATE INDEX IF NOT EXISTS idx_exam_assignments_email ON exam_student_assignments(student_email);
        `);

        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='email_verified') THEN
                    ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='otp') THEN
                    ALTER TABLE users ADD COLUMN otp VARCHAR(6);
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='otp_expires_at') THEN
                    ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP;
                END IF;
                
                -- Migrate exam timestamp columns to TIMESTAMPTZ if they aren't already
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exams' AND column_name='start_time' AND data_type='timestamp without time zone') THEN
                    ALTER TABLE exams ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'Asia/Kolkata';
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exams' AND column_name='end_time' AND data_type='timestamp without time zone') THEN
                    ALTER TABLE exams ALTER COLUMN end_time TYPE TIMESTAMPTZ USING end_time AT TIME ZONE 'Asia/Kolkata';
                END IF;
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='exams' AND column_name='created_at' AND data_type='timestamp without time zone') THEN
                    ALTER TABLE exams ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'Asia/Kolkata';
                END IF;
            END $$;
        `);

        const adminCheck = await client.query(
            'SELECT * FROM users WHERE email = $1',
            ['admin@examsecure.com']
        );

        if (adminCheck.rows.length === 0) {
            await client.query(
                'INSERT INTO users (email, password, role, first_name, last_name, email_verified) VALUES ($1, $2, $3, $4, $5, $6)',
                ['admin@examsecure.com', 'c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec', 'admin', 'System', 'Administrator', true]
            );
        }

        // Mark initialization as complete
        await client.query(`
            INSERT INTO _db_meta (key, value, updated_at)
            VALUES ('initialized', 'true', CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = CURRENT_TIMESTAMP
        `);

        // Release the advisory lock
        await client.query('SELECT pg_advisory_unlock(999999)');

        console.log('Database initialized successfully');
        isInitialized = true;
    } catch (error) {
        console.error('Database initialization error:', error);
        // Try to release lock on error
        try {
            await client.query('SELECT pg_advisory_unlock(999999)');
        } catch (unlockError) {
            console.error('Failed to release advisory lock:', unlockError);
        }
        throw error;
    } finally {
        client.release();
    }
}

async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function getClient() {
    return await pool.connect();
}

module.exports = {
    query,
    getClient,
    initializeDatabase,
    pool
};
