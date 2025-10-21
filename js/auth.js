class AuthService {
    constructor() {
        this.currentUser = null;
        this.loadCurrentUser();
    }

    loadCurrentUser() {
        const user = Utils.getLocalStorage('current_user');
        if (user) {
            this.currentUser = user;
        }
    }

    async login(email, password, role) {
        try {
            const hashedPassword = await Utils.hashPassword(password);
            const result = await apiClient.login(email, hashedPassword, role);
            
            if (result.success) {
                this.currentUser = result.user;
                Utils.setLocalStorage('current_user', result.user);
                Utils.setLocalStorage('login_time', Date.now());
            }
            
            return result;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    async registerStudent(email, firstName, lastName, password = 'test@1234') {
        try {
            const hashedPassword = await Utils.hashPassword(password);
            const result = await apiClient.register(email, hashedPassword, 'student', firstName, lastName);
            return result;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    async registerAdmin(email, firstName, lastName, password) {
        try {
            const hashedPassword = await Utils.hashPassword(password);
            const result = await apiClient.register(email, hashedPassword, 'admin', firstName, lastName);
            return result;
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    async sendOTP(email, firstName = '') {
        try {
            const result = await apiClient.sendOTP(email, firstName);
            return result;
        } catch (error) {
            console.error('Send OTP error:', error);
            return { success: false, message: 'Failed to send OTP. Please try again.' };
        }
    }

    async verifyOTP(email, otp) {
        try {
            const result = await apiClient.verifyOTP(email, otp);
            console.log('OTP verification result:', result);
            
            if (result && result.success) {
                this.currentUser = result.user;
                Utils.setLocalStorage('current_user', result.user);
                Utils.setLocalStorage('login_time', Date.now());
                return result;
            }
            
            return result || { success: false, message: 'OTP verification failed. Please try again.' };
        } catch (error) {
            console.error('Verify OTP error:', error);
            return { success: false, message: 'OTP verification failed. Please try again.' };
        }
    }

    async changePassword(email, currentPassword, newPassword, role) {
        try {
            const hashedCurrentPassword = await Utils.hashPassword(currentPassword);
            const hashedNewPassword = await Utils.hashPassword(newPassword);
            const result = await apiClient.changePassword(email, hashedCurrentPassword, hashedNewPassword, role);
            return result;
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, message: 'Password change failed. Please try again.' };
        }
    }

    logout() {
        this.currentUser = null;
        Utils.removeLocalStorage('current_user');
        Utils.removeLocalStorage('login_time');
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getLoginTime() {
        return Utils.getLocalStorage('login_time');
    }
}

const authService = new AuthService();
