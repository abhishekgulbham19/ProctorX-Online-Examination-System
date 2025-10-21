const db = require('../db/database');

class StudentsAPI {
    async getAllStudents() {
        try {
            const result = await db.query(
                'SELECT id, email, first_name, last_name, is_active, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
                ['student']
            );

            return { success: true, students: result.rows };
        } catch (error) {
            console.error('Get students error:', error);
            return { success: false, message: error.message };
        }
    }

    async getAllowedStudents(adminId) {
        try {
            const result = await db.query(
                'SELECT id, student_email, added_at FROM allowed_students WHERE admin_id = $1 ORDER BY added_at DESC',
                [adminId]
            );

            return { success: true, students: result.rows };
        } catch (error) {
            console.error('Get allowed students error:', error);
            return { success: false, message: error.message };
        }
    }

    async addAllowedStudent(adminId, email) {
        try {
            if (!email || !email.endsWith('@gmail.com')) {
                return { success: false, message: 'Only Gmail addresses (@gmail.com) are allowed' };
            }

            const result = await db.query(
                'INSERT INTO allowed_students (admin_id, student_email) VALUES ($1, $2) RETURNING *',
                [adminId, email.toLowerCase()]
            );

            return { success: true, student: result.rows[0] };
        } catch (error) {
            if (error.code === '23505') {
                return { success: false, message: 'This email is already in your student list' };
            }
            console.error('Add allowed student error:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteAllowedStudent(studentId, adminId) {
        try {
            const result = await db.query(
                'DELETE FROM allowed_students WHERE id = $1 AND admin_id = $2 RETURNING *',
                [studentId, adminId]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Student email not found' };
            }

            return { success: true, message: 'Student email removed successfully' };
        } catch (error) {
            console.error('Delete allowed student error:', error);
            return { success: false, message: error.message };
        }
    }

    async isStudentAllowed(adminId, email) {
        try {
            const result = await db.query(
                'SELECT * FROM allowed_students WHERE admin_id = $1 AND student_email = $2',
                [adminId, email.toLowerCase()]
            );

            return { success: true, isAllowed: result.rows.length > 0 };
        } catch (error) {
            console.error('Check student allowed error:', error);
            return { success: false, message: error.message };
        }
    }

    async deleteStudent(studentId) {
        try {
            const result = await db.query(
                'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING *',
                [studentId, 'student']
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Student not found' };
            }

            return { success: true, message: 'Student deleted successfully' };
        } catch (error) {
            console.error('Delete student error:', error);
            return { success: false, message: error.message };
        }
    }

    async updateStudentStatus(studentId, isActive) {
        try {
            const result = await db.query(
                'UPDATE users SET is_active = $1 WHERE id = $2 AND role = $3 RETURNING *',
                [isActive, studentId, 'student']
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Student not found' };
            }

            return { success: true, student: result.rows[0] };
        } catch (error) {
            console.error('Update student status error:', error);
            return { success: false, message: error.message };
        }
    }

    async assignExamsToStudent(studentEmail, examIds) {
        try {
            await db.query(
                'DELETE FROM exam_student_assignments WHERE student_email = $1',
                [studentEmail.toLowerCase()]
            );

            if (examIds && examIds.length > 0) {
                const examCheckResult = await db.query(
                    `SELECT id FROM exams WHERE id = ANY($1::int[])`,
                    [examIds]
                );
                
                const validExamIds = examCheckResult.rows.map(row => row.id);
                
                if (validExamIds.length === 0) {
                    return { success: false, message: 'No valid exams found to assign' };
                }
                
                const invalidExamIds = examIds.filter(id => !validExamIds.includes(id));
                if (invalidExamIds.length > 0) {
                    console.warn('Invalid exam IDs filtered out:', invalidExamIds);
                }
                
                const values = validExamIds.map((examId, index) => 
                    `($${index * 2 + 1}, $${index * 2 + 2})`
                ).join(', ');
                
                const params = validExamIds.flatMap(examId => [examId, studentEmail.toLowerCase()]);
                
                await db.query(
                    `INSERT INTO exam_student_assignments (exam_id, student_email) VALUES ${values} ON CONFLICT (exam_id, student_email) DO NOTHING`,
                    params
                );
            }

            return { success: true, message: 'Exam assignments updated successfully' };
        } catch (error) {
            console.error('Assign exams error:', error);
            return { success: false, message: error.message };
        }
    }

    async assignStudentsToExam(examId, studentEmails) {
        try {
            await db.query(
                'DELETE FROM exam_student_assignments WHERE exam_id = $1',
                [examId]
            );

            if (studentEmails && studentEmails.length > 0) {
                const normalizedEmails = studentEmails.map(email => email.toLowerCase());
                
                const values = normalizedEmails.map((email, index) => 
                    `($${index * 2 + 1}, $${index * 2 + 2})`
                ).join(', ');
                
                const params = normalizedEmails.flatMap(email => [examId, email]);
                
                await db.query(
                    `INSERT INTO exam_student_assignments (exam_id, student_email) VALUES ${values} ON CONFLICT (exam_id, student_email) DO NOTHING`,
                    params
                );
            }

            return { success: true, message: 'Student assignments updated successfully' };
        } catch (error) {
            console.error('Assign students to exam error:', error);
            return { success: false, message: error.message };
        }
    }

    async getStudentAssignedExams(studentEmail) {
        try {
            const result = await db.query(
                'SELECT exam_id FROM exam_student_assignments WHERE student_email = $1',
                [studentEmail.toLowerCase()]
            );

            return { success: true, examIds: result.rows.map(row => row.exam_id) };
        } catch (error) {
            console.error('Get student exams error:', error);
            return { success: false, message: error.message };
        }
    }

    async getExamAssignedStudents(examId) {
        try {
            const result = await db.query(
                'SELECT student_email, assigned_at FROM exam_student_assignments WHERE exam_id = $1 ORDER BY assigned_at DESC',
                [examId]
            );

            return { success: true, students: result.rows };
        } catch (error) {
            console.error('Get exam students error:', error);
            return { success: false, message: error.message };
        }
    }

    async isStudentAssignedToExam(studentEmail, examId) {
        try {
            const result = await db.query(
                'SELECT * FROM exam_student_assignments WHERE student_email = $1 AND exam_id = $2',
                [studentEmail.toLowerCase(), examId]
            );

            return { success: true, isAssigned: result.rows.length > 0 };
        } catch (error) {
            console.error('Check exam assignment error:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = new StudentsAPI();
