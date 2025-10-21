const db = require('../db/database');

class ExamsAPI {
    async createExam(adminId, examData) {
        const client = await db.getClient();
        try {
            if (!Array.isArray(examData.questions) || examData.questions.length === 0) {
                return { success: false, message: 'Cannot create exam without at least one question. Please add questions to the exam.' };
            }

            await client.query('BEGIN');

            const examResult = await client.query(
                'INSERT INTO exams (admin_id, title, description, duration, start_time, end_time, exam_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [adminId, examData.title, examData.description, examData.duration, examData.startTime, examData.endTime, examData.examCode]
            );

            const examId = examResult.rows[0].id;

            for (let i = 0; i < examData.questions.length; i++) {
                const q = examData.questions[i];
                const correctAnswer = q.correct_answer || q.correctAnswer;
                
                if (!correctAnswer || correctAnswer.trim() === '') {
                    throw new Error(`Question "${q.question_text || q.question}" is missing a correct answer`);
                }
                
                await client.query(
                    'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, points, question_order) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [examId, q.question_text || q.question, q.question_type || q.type || 'multiple_choice', JSON.stringify(q.options), correctAnswer, q.marks || q.points || 1, i]
                );
            }

            await client.query('COMMIT');

            return { success: true, exam: examResult.rows[0] };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create exam error:', error);
            return { success: false, message: 'Failed to create exam: ' + error.message };
        } finally {
            client.release();
        }
    }

    async getExamsByAdmin(adminId) {
        try {
            const result = await db.query(
                'SELECT * FROM exams WHERE admin_id = $1 ORDER BY created_at DESC',
                [adminId]
            );
            return { success: true, exams: result.rows };
        } catch (error) {
            console.error('Get exams error:', error);
            return { success: false, message: error.message };
        }
    }

    async getExamByCode(examCode, studentEmail = null) {
        try {
            const examResult = await db.query(
                'SELECT * FROM exams WHERE exam_code = $1',
                [examCode]
            );

            if (examResult.rows.length === 0) {
                return { success: false, message: 'Exam not found' };
            }

            const exam = examResult.rows[0];
            
            if (studentEmail) {
                const assignmentCheck = await db.query(
                    'SELECT * FROM exam_student_assignments WHERE exam_id = $1 AND student_email = $2',
                    [exam.id, studentEmail.toLowerCase()]
                );

                if (assignmentCheck.rows.length === 0) {
                    return { success: false, message: 'You are not assigned to this exam. Please contact your administrator.' };
                }
            }

            const questionsResult = await db.query(
                'SELECT id, question_text, question_type, options, points, question_order FROM questions WHERE exam_id = $1 ORDER BY question_order',
                [exam.id]
            );

            return {
                success: true,
                exam: {
                    ...exam,
                    questions: questionsResult.rows
                }
            };
        } catch (error) {
            console.error('Get exam by code error:', error);
            return { success: false, message: error.message };
        }
    }

    async getExamById(examId, adminId) {
        try {
            const examResult = await db.query(
                'SELECT * FROM exams WHERE id = $1 AND admin_id = $2',
                [examId, adminId]
            );

            if (examResult.rows.length === 0) {
                return { success: false, message: 'Exam not found or unauthorized' };
            }

            const questionsResult = await db.query(
                'SELECT * FROM questions WHERE exam_id = $1 ORDER BY question_order',
                [examId]
            );

            return {
                success: true,
                exam: {
                    ...examResult.rows[0],
                    questions: questionsResult.rows
                }
            };
        } catch (error) {
            console.error('Get exam by ID error:', error);
            return { success: false, message: error.message };
        }
    }

    async updateExam(examId, adminId, examData) {
        const client = await db.getClient();
        try {
            if (!Array.isArray(examData.questions) || examData.questions.length === 0) {
                return { success: false, message: 'Cannot update exam without at least one question. Please add questions to the exam.' };
            }

            await client.query('BEGIN');

            const examResult = await client.query(
                'UPDATE exams SET title = $1, description = $2, duration = $3, start_time = $4, end_time = $5 WHERE id = $6 AND admin_id = $7 RETURNING *',
                [examData.title, examData.description, examData.duration, examData.startTime, examData.endTime, examId, adminId]
            );

            if (examResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return { success: false, message: 'Exam not found or unauthorized' };
            }

            await client.query('DELETE FROM questions WHERE exam_id = $1', [examId]);

            for (let i = 0; i < examData.questions.length; i++) {
                const q = examData.questions[i];
                const correctAnswer = q.correct_answer || q.correctAnswer;
                
                if (!correctAnswer || correctAnswer.trim() === '') {
                    throw new Error(`Question "${q.question_text || q.question}" is missing a correct answer`);
                }
                
                await client.query(
                    'INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, points, question_order) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [examId, q.question_text || q.question, q.question_type || q.type || 'multiple_choice', JSON.stringify(q.options), correctAnswer, q.marks || q.points || 1, i]
                );
            }

            await client.query('COMMIT');

            return { success: true, exam: examResult.rows[0], message: 'Exam updated successfully' };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Update exam error:', error);
            return { success: false, message: 'Failed to update exam: ' + error.message };
        } finally {
            client.release();
        }
    }

    async deleteExam(examId, adminId) {
        try {
            const result = await db.query(
                'DELETE FROM exams WHERE id = $1 AND admin_id = $2 RETURNING *',
                [examId, adminId]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Exam not found or unauthorized' };
            }

            return { success: true, message: 'Exam deleted successfully' };
        } catch (error) {
            console.error('Delete exam error:', error);
            return { success: false, message: error.message };
        }
    }

    async submitExamAttempt(examId, studentId, answers, violations = 0) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            const questionsResult = await client.query(
                'SELECT * FROM questions WHERE exam_id = $1',
                [examId]
            );

            const questions = questionsResult.rows;
            let score = 0;
            let totalPoints = 0;

            questions.forEach(q => {
                totalPoints += q.points || 1;
                const studentAnswer = answers[q.id];
                if (studentAnswer && studentAnswer === q.correct_answer) {
                    score += q.points || 1;
                }
            });

            const percentage = totalPoints > 0 ? ((score / totalPoints) * 100).toFixed(2) : 0;

            const attemptResult = await client.query(
                'INSERT INTO exam_attempts (exam_id, student_id, answers, score, total_points, percentage, status, submitted_at, violations) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8) RETURNING *',
                [examId, studentId, JSON.stringify(answers), score, totalPoints, percentage, 'completed', violations]
            );

            await client.query('COMMIT');

            return {
                success: true,
                result: {
                    score,
                    totalPoints,
                    percentage,
                    attempt: attemptResult.rows[0]
                }
            };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Submit exam error:', error);
            return { success: false, message: error.message };
        } finally {
            client.release();
        }
    }

    async getStudentResults(studentId) {
        try {
            const result = await db.query(
                `SELECT ea.*, e.title, e.description, e.duration 
                 FROM exam_attempts ea 
                 JOIN exams e ON ea.exam_id = e.id 
                 WHERE ea.student_id = $1 
                 ORDER BY ea.submitted_at DESC`,
                [studentId]
            );

            return { success: true, results: result.rows };
        } catch (error) {
            console.error('Get student results error:', error);
            return { success: false, message: error.message };
        }
    }

    async getDetailedResult(attemptId, studentId) {
        try {
            const attemptResult = await db.query(
                `SELECT ea.*, e.title, e.description, e.duration, e.id as exam_id
                 FROM exam_attempts ea 
                 JOIN exams e ON ea.exam_id = e.id 
                 WHERE ea.id = $1 AND ea.student_id = $2`,
                [attemptId, studentId]
            );

            if (attemptResult.rows.length === 0) {
                return { success: false, message: 'Result not found' };
            }

            const attempt = attemptResult.rows[0];

            const questionsResult = await db.query(
                `SELECT id, question_text, question_type, options, correct_answer, points 
                 FROM questions 
                 WHERE exam_id = $1 
                 ORDER BY question_order`,
                [attempt.exam_id]
            );

            const questions = questionsResult.rows;
            const studentAnswers = typeof attempt.answers === 'string' ? JSON.parse(attempt.answers) : attempt.answers;

            const detailedQuestions = questions.map(q => ({
                ...q,
                student_answer: studentAnswers[q.id] || null,
                is_correct: studentAnswers[q.id] === q.correct_answer
            }));

            return {
                success: true,
                result: {
                    ...attempt,
                    questions: detailedQuestions
                }
            };
        } catch (error) {
            console.error('Get detailed result error:', error);
            return { success: false, message: error.message };
        }
    }

    async getAllResults(adminId) {
        try {
            const result = await db.query(
                `SELECT ea.*, e.title, e.exam_code, u.email as student_email, u.first_name, u.last_name
                 FROM exam_attempts ea
                 JOIN exams e ON ea.exam_id = e.id
                 JOIN users u ON ea.student_id = u.id
                 WHERE e.admin_id = $1
                 ORDER BY ea.submitted_at DESC`,
                [adminId]
            );

            return { success: true, results: result.rows };
        } catch (error) {
            console.error('Get all results error:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = new ExamsAPI();
