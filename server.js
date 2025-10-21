require('dotenv').config();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const zlib = require('zlib');

const db = require('./db/database');
const authAPI = require('./api/auth');
const examsAPI = require('./api/exams');
const studentsAPI = require('./api/students');

const PORT = 5000;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
};

const compressibleTypes = ['.html', '.css', '.js', '.json', '.svg'];

function parseRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

async function handleAPIRequest(req, res, pathname) {
    res.setHeader('Content-Type', 'application/json');

    try {
        const body = await parseRequestBody(req);

        if (pathname === '/api/auth/register') {
            const result = await authAPI.register(body.email, body.password, body.role, body.firstName, body.lastName);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/auth/login') {
            const result = await authAPI.login(body.email, body.password, body.role);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/auth/change-password') {
            const result = await authAPI.changePassword(body.email, body.currentPassword, body.newPassword, body.role);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/auth/send-otp') {
            const result = await authAPI.sendOTP(body.email, body.firstName);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/auth/verify-otp') {
            const result = await authAPI.verifyOTP(body.email, body.otp);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/auth/send-reset-otp') {
            const result = await authAPI.sendResetPasswordOTP(body.email, body.role);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/auth/reset-password') {
            const result = await authAPI.resetPassword(body.email, body.otp, body.newPassword, body.role);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/create') {
            const result = await examsAPI.createExam(body.adminId, body.examData);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/admin-list') {
            const result = await examsAPI.getExamsByAdmin(body.adminId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/by-code') {
            const result = await examsAPI.getExamByCode(body.examCode, body.studentEmail);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/get-by-id') {
            const result = await examsAPI.getExamById(body.examId, body.adminId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/update') {
            const result = await examsAPI.updateExam(body.examId, body.adminId, body.examData);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/delete') {
            const result = await examsAPI.deleteExam(body.examId, body.adminId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/submit') {
            const result = await examsAPI.submitExamAttempt(body.examId, body.studentId, body.answers, body.violations);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/results/student') {
            const result = await examsAPI.getStudentResults(body.studentId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/results/admin') {
            const result = await examsAPI.getAllResults(body.adminId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/results/detailed') {
            const result = await examsAPI.getDetailedResult(body.attemptId, body.studentId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/list') {
            const result = await studentsAPI.getAllStudents();
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/delete') {
            const result = await studentsAPI.deleteStudent(body.studentId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/update-status') {
            const result = await studentsAPI.updateStudentStatus(body.studentId, body.isActive);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/allowed/list') {
            const result = await studentsAPI.getAllowedStudents(body.adminId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/allowed/add') {
            const result = await studentsAPI.addAllowedStudent(body.adminId, body.email);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/allowed/delete') {
            const result = await studentsAPI.deleteAllowedStudent(body.studentId, body.adminId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/allowed/check') {
            const result = await studentsAPI.isStudentAllowed(body.adminId, body.email);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/assign-exams') {
            const result = await studentsAPI.assignExamsToStudent(body.studentEmail, body.examIds);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/assign-students-to-exam') {
            const result = await studentsAPI.assignStudentsToExam(body.examId, body.studentEmails);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/students/assigned-exams') {
            const result = await studentsAPI.getStudentAssignedExams(body.studentEmail);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/assigned-students') {
            const result = await studentsAPI.getExamAssignedStudents(body.examId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else if (pathname === '/api/exams/check-assignment') {
            const result = await studentsAPI.isStudentAssignedToExam(body.studentEmail, body.examId);
            res.writeHead(200);
            res.end(JSON.stringify(result));
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, message: 'API endpoint not found' }));
        }
    } catch (error) {
        console.error('API Error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ success: false, message: 'Internal server error' }));
    }
}

function serveStaticFile(req, res, pathname) {
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - File Not Found</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        h1 { color: #e53e3e; }
                    </style>
                </head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested file <strong>${pathname}</strong> was not found.</p>
                    <a href="/">Go back to home</a>
                </body>
                </html>
            `);
            return;
        }

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Server Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #e53e3e; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Server Error</h1>
                        <p>Unable to read file: ${pathname}</p>
                        <a href="/">Go back to home</a>
                    </body>
                    </html>
                `);
                return;
            }

            const acceptEncoding = req.headers['accept-encoding'] || '';
            const canCompress = compressibleTypes.includes(ext);
            
            const cacheControl = (ext === '.css' || ext === '.js' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.svg' || ext === '.ico')
                ? 'public, max-age=31536000, immutable'
                : 'no-cache, no-store, must-revalidate';
            
            if (canCompress && acceptEncoding.includes('gzip')) {
                zlib.gzip(content, (err, compressed) => {
                    if (err) {
                        res.writeHead(200, { 
                            'Content-Type': contentType,
                            'Cache-Control': cacheControl
                        });
                        res.end(content);
                        return;
                    }
                    res.writeHead(200, {
                        'Content-Type': contentType,
                        'Content-Encoding': 'gzip',
                        'Vary': 'Accept-Encoding',
                        'Cache-Control': cacheControl
                    });
                    res.end(compressed);
                });
            } else if (canCompress && acceptEncoding.includes('deflate')) {
                zlib.deflate(content, (err, compressed) => {
                    if (err) {
                        res.writeHead(200, { 
                            'Content-Type': contentType,
                            'Cache-Control': cacheControl
                        });
                        res.end(content);
                        return;
                    }
                    res.writeHead(200, {
                        'Content-Type': contentType,
                        'Content-Encoding': 'deflate',
                        'Vary': 'Accept-Encoding',
                        'Cache-Control': cacheControl
                    });
                    res.end(compressed);
                });
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Cache-Control': cacheControl
                });
                res.end(content);
            }
        });
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const pathname = url.parse(req.url).pathname;

    if (pathname.startsWith('/api/') && req.method === 'POST') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        handleAPIRequest(req, res, pathname);
    } else {
        serveStaticFile(req, res, pathname);
    }
});

async function startServer() {
    try {
        console.log('Initializing database...');
        await db.initializeDatabase();
        console.log('Database ready!');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`ExamSecure server is running on http://0.0.0.0:${PORT}`);
            console.log(`Local access: http://localhost:${PORT}`);
            console.log('Server is ready with centralized database!');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\nShutting down ExamSecure server...');
    server.close(() => {
        db.pool.end();
        console.log('Server stopped.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nShutting down ExamSecure server...');
    server.close(() => {
        db.pool.end();
        console.log('Server stopped.');
        process.exit(0);
    });
});

startServer();
