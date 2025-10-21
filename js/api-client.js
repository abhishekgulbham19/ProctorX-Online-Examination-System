class APIClient {
    constructor() {
        this.baseURL = '';
    }

    async request(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    }

    async register(email, password, role, firstName = '', lastName = '') {
        return await this.request('/api/auth/register', {
            email,
            password,
            role,
            firstName,
            lastName
        });
    }

    async login(email, password, role) {
        return await this.request('/api/auth/login', {
            email,
            password,
            role
        });
    }

    async sendOTP(email, firstName = '') {
        return await this.request('/api/auth/send-otp', {
            email,
            firstName
        });
    }

    async verifyOTP(email, otp) {
        return await this.request('/api/auth/verify-otp', {
            email,
            otp
        });
    }

    async changePassword(email, currentPassword, newPassword, role) {
        return await this.request('/api/auth/change-password', {
            email,
            currentPassword,
            newPassword,
            role
        });
    }

    async sendResetPasswordOTP(email, role) {
        return await this.request('/api/auth/send-reset-otp', {
            email,
            role
        });
    }

    async resetPassword(email, otp, newPassword, role) {
        return await this.request('/api/auth/reset-password', {
            email,
            otp,
            newPassword,
            role
        });
    }

    async createExam(adminId, examData) {
        return await this.request('/api/exams/create', {
            adminId,
            examData
        });
    }

    async getExamsByAdmin(adminId) {
        return await this.request('/api/exams/admin-list', {
            adminId
        });
    }

    async getExamByCode(examCode, studentEmail = null) {
        return await this.request('/api/exams/by-code', {
            examCode,
            studentEmail
        });
    }

    async getExamById(examId, adminId) {
        return await this.request('/api/exams/get-by-id', {
            examId,
            adminId
        });
    }

    async updateExam(examId, adminId, examData) {
        return await this.request('/api/exams/update', {
            examId,
            adminId,
            examData
        });
    }

    async deleteExam(examId, adminId) {
        return await this.request('/api/exams/delete', {
            examId,
            adminId
        });
    }

    async submitExam(examId, studentId, answers, violations = 0) {
        return await this.request('/api/exams/submit', {
            examId,
            studentId,
            answers,
            violations
        });
    }

    async getStudentResults(studentId) {
        return await this.request('/api/results/student', {
            studentId
        });
    }

    async getAdminResults(adminId) {
        return await this.request('/api/results/admin', {
            adminId
        });
    }

    async getDetailedResult(attemptId, studentId) {
        return await this.request('/api/results/detailed', {
            attemptId,
            studentId
        });
    }

    async getAllStudents() {
        return await this.request('/api/students/list', {});
    }

    async deleteStudent(studentId) {
        return await this.request('/api/students/delete', {
            studentId
        });
    }

    async updateStudentStatus(studentId, isActive) {
        return await this.request('/api/students/update-status', {
            studentId,
            isActive
        });
    }

    async getAllowedStudents(adminId) {
        return await this.request('/api/students/allowed/list', {
            adminId
        });
    }

    async addAllowedStudent(adminId, email) {
        return await this.request('/api/students/allowed/add', {
            adminId,
            email
        });
    }

    async deleteAllowedStudent(studentId, adminId) {
        return await this.request('/api/students/allowed/delete', {
            studentId,
            adminId
        });
    }

    async isStudentAllowed(adminId, email) {
        return await this.request('/api/students/allowed/check', {
            adminId,
            email
        });
    }

    async assignExamsToStudent(studentEmail, examIds) {
        return await this.request('/api/students/assign-exams', {
            studentEmail,
            examIds
        });
    }

    async assignStudentsToExam(examId, studentEmails) {
        return await this.request('/api/students/assign-students-to-exam', {
            examId,
            studentEmails
        });
    }

    async getStudentAssignedExams(studentEmail) {
        return await this.request('/api/students/assigned-exams', {
            studentEmail
        });
    }

    async getExamAssignedStudents(examId) {
        return await this.request('/api/exams/assigned-students', {
            examId
        });
    }

    async isStudentAssignedToExam(studentEmail, examId) {
        return await this.request('/api/exams/check-assignment', {
            studentEmail,
            examId
        });
    }
}

const apiClient = new APIClient();
