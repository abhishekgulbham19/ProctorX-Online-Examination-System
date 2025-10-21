const db = require('../db/database');
const emailService = require('../services/emailService');

class AuthAPI {
    isValidGmail(email) {
        return email.toLowerCase().endsWith('@gmail.com');
    }

    async sendOTP(email, firstName) {
        try {
            if (!this.isValidGmail(email)) {
                return { success: false, message: 'Only Gmail addresses (@gmail.com) are allowed' };
            }

            const normalizedEmail = email.toLowerCase();
            const otp = emailService.generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const result = await db.query(
                'UPDATE users SET otp = $1, otp_expires_at = $2 WHERE email = $3 RETURNING *',
                [otp, otpExpiresAt, normalizedEmail]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const emailResult = await emailService.sendOTPEmail(email, otp, firstName);
            
            if (!emailResult.success) {
                return { success: false, message: 'Failed to send OTP email' };
            }

            return { success: true, message: 'OTP sent to your email' };
        } catch (error) {
            console.error('Send OTP error:', error);
            return { success: false, message: 'Failed to send OTP: ' + error.message };
        }
    }

    async verifyOTP(email, otp) {
        try {
            const normalizedEmail = email.toLowerCase();
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1',
                [normalizedEmail]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const user = result.rows[0];

            if (!user.otp || user.otp !== otp) {
                return { success: false, message: 'Invalid OTP' };
            }

            if (new Date() > new Date(user.otp_expires_at)) {
                return { success: false, message: 'OTP has expired. Please request a new one.' };
            }

            await db.query(
                'UPDATE users SET email_verified = true, otp = NULL, otp_expires_at = NULL WHERE id = $1',
                [user.id]
            );

            return {
                success: true,
                message: 'Email verified successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            };
        } catch (error) {
            console.error('Verify OTP error:', error);
            return { success: false, message: 'OTP verification failed: ' + error.message };
        }
    }

    async register(email, password, role, firstName = '', lastName = '') {
        try {
            if (!this.isValidGmail(email)) {
                return { success: false, message: 'Only Gmail addresses (@gmail.com) are allowed' };
            }

            const normalizedEmail = email.toLowerCase();

            const existingUser = await db.query(
                'SELECT * FROM users WHERE email = $1',
                [normalizedEmail]
            );

            if (existingUser.rows.length > 0) {
                return { success: false, message: 'User with this email already exists' };
            }

            const otp = emailService.generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            const result = await db.query(
                'INSERT INTO users (email, password, role, first_name, last_name, otp, otp_expires_at, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [normalizedEmail, password, role, firstName || normalizedEmail.split('@')[0], lastName || '', otp, otpExpiresAt, false]
            );

            const user = result.rows[0];

            const emailResult = await emailService.sendOTPEmail(email, otp, user.first_name);
            
            if (!emailResult.success) {
                await db.query('DELETE FROM users WHERE id = $1', [user.id]);
                return { success: false, message: 'Failed to send verification email. Please try again.' };
            }

            return {
                success: true,
                message: 'Registration successful! Please check your email for the verification code.',
                requiresVerification: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name
                }
            };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed: ' + error.message };
        }
    }

    async login(email, password, role) {
        try {
            const normalizedEmail = email.toLowerCase();
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1 AND role = $2',
                [normalizedEmail, role]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'Invalid credentials' };
            }

            const user = result.rows[0];
            
            if (user.password !== password) {
                return { success: false, message: 'Invalid credentials' };
            }

            if (!user.email_verified) {
                return { 
                    success: false, 
                    message: 'Please verify your email first. Check your inbox for the verification code.',
                    requiresVerification: true,
                    email: user.email
                };
            }

            if (!user.is_active) {
                return { success: false, message: 'Account is inactive' };
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    created_at: user.created_at
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed: ' + error.message };
        }
    }

    async changePassword(email, currentPassword, newPassword, role) {
        try {
            const normalizedEmail = email.toLowerCase();
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1 AND role = $2',
                [normalizedEmail, role]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const user = result.rows[0];

            if (user.password !== currentPassword) {
                return { success: false, message: 'Current password is incorrect' };
            }

            await db.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [newPassword, user.id]
            );

            return { success: true, message: 'Password changed successfully' };
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Password change failed: ' + error.message };
        }
    }

    async sendResetPasswordOTP(email, role) {
        try {
            if (!this.isValidGmail(email)) {
                return { success: false, message: 'Only Gmail addresses (@gmail.com) are allowed' };
            }

            const normalizedEmail = email.toLowerCase();
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1 AND role = $2',
                [normalizedEmail, role]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const user = result.rows[0];
            const otp = emailService.generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await db.query(
                'UPDATE users SET otp = $1, otp_expires_at = $2 WHERE id = $3',
                [otp, otpExpiresAt, user.id]
            );

            const emailResult = await emailService.sendOTPEmail(email, otp, user.first_name);
            
            if (!emailResult.success) {
                return { success: false, message: 'Failed to send OTP email' };
            }

            return { success: true, message: 'OTP sent to your email' };
        } catch (error) {
            console.error('Send reset OTP error:', error);
            return { success: false, message: 'Failed to send OTP: ' + error.message };
        }
    }

    async resetPassword(email, otp, newPassword, role) {
        try {
            const normalizedEmail = email.toLowerCase();
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1 AND role = $2',
                [normalizedEmail, role]
            );

            if (result.rows.length === 0) {
                return { success: false, message: 'User not found' };
            }

            const user = result.rows[0];

            if (!user.otp || user.otp !== otp) {
                return { success: false, message: 'Invalid OTP' };
            }

            if (new Date() > new Date(user.otp_expires_at)) {
                return { success: false, message: 'OTP has expired. Please request a new one.' };
            }

            await db.query(
                'UPDATE users SET password = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2',
                [newPassword, user.id]
            );

            return { success: true, message: 'Password reset successfully' };
        } catch (error) {
            console.error('Reset password error:', error);
            return { success: false, message: 'Password reset failed: ' + error.message };
        }
    }

    async getUserById(userId) {
        try {
            const result = await db.query(
                'SELECT id, email, role, first_name, last_name, is_active, created_at FROM users WHERE id = $1',
                [userId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }
}

module.exports = new AuthAPI();
