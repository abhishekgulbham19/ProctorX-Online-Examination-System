-- Database schema for Online Examination System

-- Users table (both students and admins)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    exam_code VARCHAR(10) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions table
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

-- Exam attempts/results table
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

-- Allowed students table (email whitelist for admin's students)
CREATE TABLE IF NOT EXISTS allowed_students (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    student_email VARCHAR(255) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_id, student_email)
);

-- Create default admin user if not exists
INSERT INTO users (email, password, role, first_name, last_name)
VALUES ('admin@examsecure.com', '$2b$10$rKvFJvXQeP0HjJH5yGx0FuN5tHXK7yQYXGJ5hKNvZ0kZGxJH5yGx0F', 'admin', 'System', 'Administrator')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_exams_code ON exams(exam_code);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student ON exam_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
