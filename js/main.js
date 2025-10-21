// Main application controller

class ExamApp {
    constructor() {
        this.currentView = 'login-selector';
        this.initialize();
    }

    // Initialize the application
    initialize() {
        this.setupEventListeners();
        this.checkAuthStatus();
        this.showInitialView();
    }

    // Setup global event listeners
    setupEventListeners() {
        // Role toggle buttons
        document.getElementById('studentRoleBtn').addEventListener('click', () => {
            this.switchRole('student');
        });

        document.getElementById('adminRoleBtn').addEventListener('click', () => {
            this.switchRole('admin');
        });

        // Direct login form submissions
        document.getElementById('studentDirectLogin').addEventListener('submit', (e) => {
            this.handleDirectLogin(e, 'student');
        });

        document.getElementById('adminDirectLogin').addEventListener('submit', (e) => {
            this.handleDirectLogin(e, 'admin');
        });

        // Direct registration links
        document.getElementById('studentDirectSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('student-register');
        });

        document.getElementById('adminDirectSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('admin-register');
        });

        // Direct password options links
        document.getElementById('studentDirectPasswordOptions').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPasswordOptionsModal('student');
        });

        document.getElementById('adminDirectPasswordOptions').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPasswordOptionsModal('admin');
        });

        // Back to selector buttons
        document.getElementById('backToSelector').addEventListener('click', () => {
            this.showView('login-selector');
        });

        document.getElementById('backToSelectorStudent').addEventListener('click', () => {
            this.showView('login-selector');
        });

        // Login form submissions
        document.getElementById('adminLoginSubmit').addEventListener('submit', (e) => {
            this.handleAdminLogin(e);
        });

        document.getElementById('studentLoginSubmit').addEventListener('submit', (e) => {
            this.handleStudentLogin(e);
        });

        // Password options links
        document.getElementById('adminPasswordOptions').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPasswordOptionsModal('admin');
        });

        document.getElementById('studentPasswordOptions').addEventListener('click', (e) => {
            e.preventDefault();
            this.showPasswordOptionsModal('student');
        });

        // Registration links
        document.getElementById('adminSignupLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('admin-register');
        });

        document.getElementById('studentSignupLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('student-register');
        });

        // Back to login links
        document.getElementById('adminLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('admin-login');
        });

        document.getElementById('studentLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showView('student-login');
        });

        // Back to selector from registration
        document.getElementById('backToSelectorFromAdminReg').addEventListener('click', () => {
            this.showView('login-selector');
        });

        document.getElementById('backToSelectorFromStudentReg').addEventListener('click', () => {
            this.showView('login-selector');
        });

        // Registration form submissions
        document.getElementById('adminRegisterSubmit').addEventListener('submit', (e) => {
            this.handleAdminRegistration(e);
        });

        document.getElementById('studentRegisterSubmit').addEventListener('submit', (e) => {
            this.handleStudentRegistration(e);
        });

        // Student exam code entry
        document.getElementById('studentExamCodeSubmit').addEventListener('submit', (e) => {
            this.handleStudentExamCodeEntry(e);
        });

        document.getElementById('studentLogoutFromCodeEntry').addEventListener('click', () => {
            authService.logout();
            this.showView('login-selector');
        });

        // OTP Verification
        document.getElementById('otpVerifySubmit').addEventListener('submit', (e) => {
            this.handleOTPVerification(e);
        });

        document.getElementById('resendOtpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResendOTP();
        });

        document.getElementById('backToLoginFromOtp').addEventListener('click', () => {
            Utils.removeLocalStorage('pending_verification_email');
            Utils.removeLocalStorage('pending_verification_role');
            this.showView('login-selector');
        });

        // Change Password Form
        document.getElementById('changePasswordSubmit').addEventListener('submit', (e) => {
            this.handleChangePassword(e);
        });

        document.getElementById('backToSelectorFromChangePassword').addEventListener('click', () => {
            this.showView('login-selector');
        });

        // Forgot Password Form
        document.getElementById('forgotPasswordSubmit').addEventListener('submit', (e) => {
            this.handleForgotPassword(e);
        });

        document.getElementById('backToSelectorFromForgotPassword').addEventListener('click', () => {
            this.showView('login-selector');
        });

        // Reset Password Form
        document.getElementById('resetPasswordSubmit').addEventListener('submit', (e) => {
            this.handleResetPassword(e);
        });

        document.getElementById('resendResetOtpLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.handleResendResetOTP();
        });

        document.getElementById('backToSelectorFromResetPassword').addEventListener('click', () => {
            Utils.removeLocalStorage('reset_email');
            Utils.removeLocalStorage('reset_role');
            this.showView('login-selector');
        });

        // Prevent form submission on Enter in exam interface
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !document.getElementById('examInterface').classList.contains('hidden')) {
                // Only prevent if not in textarea or specific input fields
                if (e.target.tagName !== 'TEXTAREA' && !e.target.classList.contains('allow-enter')) {
                    e.preventDefault();
                }
            }
        });

        // Window beforeunload warning during exam
        window.addEventListener('beforeunload', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                e.preventDefault();
                e.returnValue = 'You are currently taking an exam. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                e.preventDefault();
                history.pushState(null, null, location.href);
                Utils.showModal(
                    'Navigation Blocked',
                    'Browser navigation is disabled during the exam.'
                );
            }
        });
    }

    // Check authentication status on page load
    checkAuthStatus() {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            if (user.role === 'admin') {
                this.showAdminDashboard();
            } else if (user.role === 'student') {
                this.showStudentDashboard();
            }
        }
    }

    // Show initial view
    showInitialView() {
        if (!authService.isAuthenticated()) {
            this.showView('login-selector');
            // Ensure student role is properly selected initially
            this.switchRole('student');
        }
    }

    // Show specific view
    showView(viewName) {
        // Hide all views
        this.hideAllViews();
        
        // Show selected view
        switch(viewName) {
            case 'login-selector':
                document.getElementById('loginSelector').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('loginSelector'), 'fade-in');
                break;
            case 'admin-login':
                document.getElementById('adminLoginForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('adminLoginForm'), 'slide-in');
                document.getElementById('adminEmail').focus();
                break;
            case 'student-login':
                document.getElementById('studentLoginForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('studentLoginForm'), 'slide-in');
                document.getElementById('studentEmail').focus();
                break;
            case 'admin-register':
                document.getElementById('adminRegisterForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('adminRegisterForm'), 'slide-in');
                document.getElementById('adminRegEmail').focus();
                break;
            case 'student-register':
                document.getElementById('studentRegisterForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('studentRegisterForm'), 'slide-in');
                document.getElementById('studentRegEmail').focus();
                break;
            case 'otp-verification':
                document.getElementById('otpVerificationForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('otpVerificationForm'), 'slide-in');
                document.getElementById('otpCode').focus();
                break;
            case 'student-exam-code':
                document.getElementById('studentExamCodeEntry').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('studentExamCodeEntry'), 'slide-in');
                document.getElementById('studentExamCodeInput').focus();
                break;
            case 'change-password':
                document.getElementById('changePasswordForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('changePasswordForm'), 'slide-in');
                document.getElementById('changePasswordEmail').focus();
                break;
            case 'forgot-password':
                document.getElementById('forgotPasswordForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('forgotPasswordForm'), 'slide-in');
                document.getElementById('forgotPasswordEmail').focus();
                break;
            case 'reset-password':
                document.getElementById('resetPasswordForm').classList.remove('hidden');
                Utils.addAnimation(document.getElementById('resetPasswordForm'), 'slide-in');
                document.getElementById('resetPasswordOtp').focus();
                break;
        }
        
        this.currentView = viewName;
    }

    // Switch between student and admin roles
    switchRole(role) {
        const studentBtn = document.getElementById('studentRoleBtn');
        const adminBtn = document.getElementById('adminRoleBtn');
        const roleToggle = document.querySelector('.role-toggle');
        const studentLoginSide = document.getElementById('studentLoginSide');
        const adminLoginSide = document.getElementById('adminLoginSide');
        const studentInfoSide = document.getElementById('studentInfoSide');
        const adminInfoSide = document.getElementById('adminInfoSide');

        if (role === 'student') {
            studentBtn.classList.add('active');
            adminBtn.classList.remove('active');
            roleToggle.classList.add('student-active');
            studentLoginSide.classList.remove('hidden');
            adminLoginSide.classList.add('hidden');
            studentInfoSide.classList.remove('hidden');
            adminInfoSide.classList.add('hidden');
        } else {
            adminBtn.classList.add('active');
            studentBtn.classList.remove('active');
            roleToggle.classList.remove('student-active');
            adminLoginSide.classList.remove('hidden');
            studentLoginSide.classList.add('hidden');
            adminInfoSide.classList.remove('hidden');
            studentInfoSide.classList.add('hidden');
        }
    }

    // Handle direct login (from the new layout)
    async handleDirectLogin(e, role) {
        e.preventDefault();
        
        const emailId = role === 'student' ? 'studentDirectEmail' : 'adminDirectEmail';
        const passwordId = role === 'student' ? 'studentDirectPassword' : 'adminDirectPassword';
        
        const email = document.getElementById(emailId).value;
        const password = document.getElementById(passwordId).value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            Utils.showError('Please enter both email and password.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.login(email, password, role);
            
            if (result.success) {
                if (role === 'admin') {
                    Utils.showSuccess('Login successful!');
                    this.showAdminDashboard();
                } else {
                    Utils.showSuccess('Login successful! Welcome to your dashboard.');
                    this.showStudentDashboard();
                }
                
                // Clear form
                e.target.reset();
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Login failed. Please try again.');
            console.error(`${role} login error:`, error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Hide all views
    hideAllViews() {
        const views = [
            'loginSelector',
            'adminLoginForm', 
            'studentLoginForm',
            'adminRegisterForm',
            'studentRegisterForm',
            'otpVerificationForm',
            'studentExamCodeEntry',
            'changePasswordForm',
            'forgotPasswordForm',
            'resetPasswordForm',
            'adminDashboard',
            'studentDashboard',
            'examInterface'
        ];
        
        views.forEach(viewId => {
            document.getElementById(viewId).classList.add('hidden');
        });
    }

    // Handle admin login (legacy form)
    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail')?.value;
        const password = document.getElementById('adminPassword')?.value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            Utils.showError('Please enter both email and password.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.login(email, password, 'admin');
            
            if (result.success) {
                // Clear any old demo data from localStorage
                Utils.removeLocalStorage('exams');
                Utils.removeLocalStorage('exam_participants');
                
                Utils.showSuccess('Login successful!');
                this.showAdminDashboard();
                
                // Clear form
                document.getElementById('adminLoginSubmit').reset();
            } else if (result.requiresVerification) {
                Utils.showError(result.message);
                Utils.setLocalStorage('pending_verification_email', result.email);
                Utils.setLocalStorage('pending_verification_role', 'admin');
                document.getElementById('verificationEmail').textContent = result.email;
                this.showView('otp-verification');
                document.getElementById('adminLoginSubmit').reset();
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Login failed. Please try again.');
            console.error('Admin login error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle student login
    async handleStudentLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('studentEmail').value;
        const password = document.getElementById('studentPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password) {
            Utils.showError('Please enter both email and password.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.login(email, password, 'student');
            
            if (result.success) {
                // Clear any old demo data from localStorage
                Utils.removeLocalStorage('exams');
                Utils.removeLocalStorage('exam_participants');
                
                // Always go to student dashboard
                Utils.showSuccess('Login successful! Welcome to your dashboard.');
                this.showStudentDashboard();
                
                // Clear form
                document.getElementById('studentLoginSubmit').reset();
            } else if (result.requiresVerification) {
                Utils.showError(result.message);
                Utils.setLocalStorage('pending_verification_email', result.email);
                Utils.setLocalStorage('pending_verification_role', 'student');
                document.getElementById('verificationEmail').textContent = result.email;
                this.showView('otp-verification');
                document.getElementById('studentLoginSubmit').reset();
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Login failed. Please try again.');
            console.error('Student login error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Show admin dashboard
    showAdminDashboard() {
        this.hideAllViews();
        document.getElementById('adminDashboard').classList.remove('hidden');
        Utils.addAnimation(document.getElementById('adminDashboard'), 'fade-in');
        
        // Load admin user info
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            const adminInfo = document.getElementById('adminUserInfo');
            if (adminInfo) {
                adminInfo.textContent = `Welcome, ${currentUser.first_name} ${currentUser.last_name}`;
            }
        }
        
        // Initialize admin service
        if (window.adminService) {
            adminService.initializeDashboard();
        }
        
        // Prevent browser navigation during admin session
        history.pushState(null, null, location.href);
        this.currentView = 'admin-dashboard';
    }

    // Show student dashboard
    showStudentDashboard() {
        this.hideAllViews();
        document.getElementById('studentDashboard').classList.remove('hidden');
        Utils.addAnimation(document.getElementById('studentDashboard'), 'fade-in');
        
        // Initialize student service
        if (window.studentService) {
            studentService.initializeDashboard();
        }
        
        // Prevent browser navigation during student session
        history.pushState(null, null, location.href);
        this.currentView = 'student-dashboard';
    }

    // Handle password change with modal form
    handlePasswordReset(role) {
        this.currentPasswordChangeRole = role;
        this.showPasswordChangeModal();
    }

    // Show password change modal
    showPasswordChangeModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.remove('hidden');
        
        // Setup modal event listeners
        this.setupPasswordModalEventListeners();
        
        // Focus on email input
        document.getElementById('modalCurrentEmail').focus();
    }

    // Setup password modal event listeners
    setupPasswordModalEventListeners() {
        const modal = document.getElementById('changePasswordModal');
        const form = document.getElementById('changePasswordForm');
        const closeBtn = document.getElementById('closePasswordModal');
        const cancelBtn = document.getElementById('cancelPasswordChange');

        // Close modal
        closeBtn.onclick = () => this.hidePasswordChangeModal();
        cancelBtn.onclick = () => this.hidePasswordChangeModal();

        // Close when clicking outside modal
        window.onclick = (event) => {
            if (event.target === modal) {
                this.hidePasswordChangeModal();
            }
        };

        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            this.processPasswordChange();
        };
    }

    // Hide password change modal
    hidePasswordChangeModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.classList.add('hidden');
        document.getElementById('changePasswordForm').reset();
    }

    // Process password change from modal
    async processPasswordChange() {
        const email = document.getElementById('modalCurrentEmail').value;
        const currentPassword = document.getElementById('modalCurrentPassword').value;
        const newPassword = document.getElementById('modalNewPassword').value;
        const confirmPassword = document.getElementById('modalConfirmPassword').value;

        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        if (newPassword.length < 8) {
            Utils.showError('New password must be at least 8 characters long.');
            return;
        }

        if (confirmPassword !== newPassword) {
            Utils.showError('Passwords do not match.');
            return;
        }

        const result = await authService.changePassword(email, currentPassword, newPassword, this.currentPasswordChangeRole);
        
        if (result.success) {
            this.hidePasswordChangeModal();
            Utils.showSuccess('Password changed successfully! Please login with your new password.');
        } else {
            Utils.showError(result.message);
        }
    }

    // Handle admin registration
    async handleAdminRegistration(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminRegEmail').value.trim();
        const password = document.getElementById('adminRegPassword').value;
        const confirmPassword = document.getElementById('adminRegConfirmPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password || !confirmPassword) {
            Utils.showError('Please fill in all fields.');
            return;
        }

        if (!email.toLowerCase().endsWith('@gmail.com')) {
            Utils.showError('Only Gmail addresses (@gmail.com) are allowed.');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            Utils.showError('Password must be at least 8 characters long.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        Utils.showLoadingScreen('login', 'Creating Account', 'Setting up your administrator profile');
        
        try {
            const firstName = email.split('@')[0];
            const result = await authService.registerAdmin(email, firstName, '', password);
            
            if (result.success && result.requiresVerification) {
                Utils.hideLoadingScreen(0);
                Utils.showSuccess(result.message);
                Utils.setLocalStorage('pending_verification_email', email);
                Utils.setLocalStorage('pending_verification_role', 'admin');
                document.getElementById('verificationEmail').textContent = email;
                this.showView('otp-verification');
                document.getElementById('adminRegisterSubmit').reset();
            } else if (!result.success) {
                Utils.hideLoadingScreen(0);
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.hideLoadingScreen(0);
            Utils.showError('Registration failed. Please try again.');
            console.error('Admin registration error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle student registration
    async handleStudentRegistration(e) {
        e.preventDefault();
        
        const email = document.getElementById('studentRegEmail').value.trim();
        const password = document.getElementById('studentRegPassword').value;
        const confirmPassword = document.getElementById('studentRegConfirmPassword').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!email || !password || !confirmPassword) {
            Utils.showError('Please fill in all fields.');
            return;
        }

        if (!email.toLowerCase().endsWith('@gmail.com')) {
            Utils.showError('Only Gmail addresses (@gmail.com) are allowed.');
            return;
        }

        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showError('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            Utils.showError('Password must be at least 8 characters long.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        Utils.showLoadingScreen('login', 'Creating Account', 'Setting up your student profile');
        
        try {
            const firstName = email.split('@')[0];
            const result = await authService.registerStudent(email, firstName, '', password);
            
            if (result.success && result.requiresVerification) {
                Utils.hideLoadingScreen(0);
                Utils.showSuccess(result.message);
                Utils.setLocalStorage('pending_verification_email', email);
                Utils.setLocalStorage('pending_verification_role', 'student');
                document.getElementById('verificationEmail').textContent = email;
                this.showView('otp-verification');
                document.getElementById('studentRegisterSubmit').reset();
            } else if (!result.success) {
                Utils.hideLoadingScreen(0);
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.hideLoadingScreen(0);
            Utils.showError('Registration failed. Please try again.');
            console.error('Student registration error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle OTP verification
    async handleOTPVerification(e) {
        e.preventDefault();
        
        const otp = document.getElementById('otpCode').value.trim();
        const email = Utils.getLocalStorage('pending_verification_email');
        const role = Utils.getLocalStorage('pending_verification_role');
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!otp || otp.length !== 6) {
            Utils.showError('Please enter a valid 6-digit code.');
            return;
        }

        if (!email) {
            Utils.showError('Session expired. Please register again.');
            this.showView('login-selector');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            const result = await authService.verifyOTP(email, otp);
            
            if (result.success) {
                Utils.showSuccess(result.message);
                Utils.removeLocalStorage('pending_verification_email');
                Utils.removeLocalStorage('pending_verification_role');
                document.getElementById('otpVerifySubmit').reset();
                
                if (role === 'admin') {
                    this.showAdminDashboard();
                } else {
                    this.showView('student-exam-code');
                }
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Verification failed. Please try again.');
            console.error('OTP verification error:', error);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Handle resend OTP
    async handleResendOTP() {
        const email = Utils.getLocalStorage('pending_verification_email');
        
        if (!email) {
            Utils.showError('Session expired. Please register again.');
            this.showView('login-selector');
            return;
        }

        try {
            const firstName = email.split('@')[0];
            const result = await authService.sendOTP(email, firstName);
            
            if (result.success) {
                Utils.showSuccess('Verification code resent! Please check your email.');
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Failed to resend code. Please try again.');
            console.error('Resend OTP error:', error);
        }
    }

    // Handle student exam code entry
    async handleStudentExamCodeEntry(e) {
        e.preventDefault();
        
        const examCode = document.getElementById('studentExamCodeInput').value.trim().toUpperCase();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!examCode) {
            Utils.showError('Please enter an exam code.');
            return;
        }

        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            Utils.showError('Please log in first.');
            return;
        }

        Utils.setButtonLoading(submitBtn, true);
        
        try {
            // Get exam from database using correct API method
            const response = await apiClient.getExamByCode(examCode, currentUser.email);
            
            if (!response.success) {
                Utils.showError(response.message || 'Invalid exam code or exam not found.');
                Utils.setButtonLoading(submitBtn, false);
                return;
            }

            const exam = response.exam;

            // Check if exam is still available
            if (!Utils.isTimeInRange(exam.start_time, exam.end_time)) {
                Utils.showError('This exam is not currently available.');
                Utils.setButtonLoading(submitBtn, false);
                return;
            }

            // Success - start the exam
            Utils.showSuccess(`Exam "${exam.title}" found! Click OK to start.`);
            
            // Clear form
            document.getElementById('studentExamCodeSubmit').reset();
            
            // Initialize exam with questions from database
            if (window.studentService) {
                window.studentService.initializeExam(exam);
            }

        } catch (error) {
            Utils.showError('Failed to access exam. Please try again.');
            console.error('Exam code entry error:', error);
            Utils.setButtonLoading(submitBtn, false);
        } finally {
            Utils.setButtonLoading(submitBtn, false);
        }
    }

    // Initialize demo data - DISABLED (using database instead)
    initializeDemoData() {
        // Demo data disabled - all data now comes from PostgreSQL database
        console.log('Demo data initialization disabled - using database');
    }

    // Show application info
    showAppInfo() {
        Utils.showModal(
            'ExamSecure - Online Examination System',
            `
                Version: 1.0.0
                
                Features:
                • Secure authentication system
                • Fullscreen enforcement with warnings
                • Real-time exam timer
                • Multiple question types
                • Automatic grading
                • Admin dashboard for exam management
                • Student portal for taking exams
                
                Default Admin Login:
                Email: admin@examsecure.com
                Password: admin123
                
                Sample Student Login:
                Email: student1@test.com
                Password: test@1234
                
                Demo Exam Code: MATH2024
            `
        );
    }

    // Show password options modal
    showPasswordOptionsModal(role) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = 'Password Management';
        modalMessage.innerHTML = `
            <div style="text-align: left;">
                <p style="margin-bottom: 20px;">Choose an option:</p>
                <button id="chooseChangePassword" style="width: 100%; padding: 15px; margin-bottom: 10px; background: #3182ce; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <strong>Change Password</strong><br>
                    <small>I know my current password and want to change it</small>
                </button>
                <button id="chooseForgotPassword" style="width: 100%; padding: 15px; margin-bottom: 10px; background: #e53e3e; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    <strong>Forgot Password</strong><br>
                    <small>I forgot my password and need to reset it</small>
                </button>
                <button id="closePasswordOptions" style="width: 100%; padding: 12px; background: #718096; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
                    ← Back to Login
                </button>
            </div>
        `;
        modalOk.style.display = 'none';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        document.getElementById('chooseChangePassword').onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.style.display = 'block';
            document.getElementById('changePasswordRole').value = role;
            this.showView('change-password');
        };
        
        document.getElementById('chooseForgotPassword').onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.style.display = 'block';
            document.getElementById('forgotPasswordRole').value = role;
            this.showView('forgot-password');
        };
        
        document.getElementById('closePasswordOptions').onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.style.display = 'block';
        };
    }

    // Handle change password
    async handleChangePassword(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Changing Password...';
        
        const email = document.getElementById('changePasswordEmail').value;
        const currentPassword = document.getElementById('changePasswordCurrent').value;
        const newPassword = document.getElementById('changePasswordNew').value;
        const confirmPassword = document.getElementById('changePasswordConfirm').value;
        const role = document.getElementById('changePasswordRole').value;
        
        if (newPassword !== confirmPassword) {
            Utils.showError('New passwords do not match');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Change Password';
            return;
        }
        
        try {
            const result = await apiClient.changePassword(email, currentPassword, newPassword, role);
            
            if (result.success) {
                Utils.showSuccess(result.message);
                e.target.reset();
                this.showView('login-selector');
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Failed to change password. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Change Password';
        }
    }

    // Handle forgot password
    async handleForgotPassword(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending Code...';
        
        const email = document.getElementById('forgotPasswordEmail').value;
        const role = document.getElementById('forgotPasswordRole').value;
        
        try {
            const result = await apiClient.sendResetPasswordOTP(email, role);
            
            if (result.success) {
                Utils.setLocalStorage('reset_email', email);
                Utils.setLocalStorage('reset_role', role);
                document.getElementById('resetPasswordEmail').textContent = email;
                Utils.showSuccess(result.message);
                e.target.reset();
                this.showView('reset-password');
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Failed to send verification code. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Verification Code';
        }
    }

    // Handle reset password
    async handleResetPassword(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting Password...';
        
        const otp = document.getElementById('resetPasswordOtp').value;
        const newPassword = document.getElementById('resetPasswordNew').value;
        const confirmPassword = document.getElementById('resetPasswordConfirm').value;
        const email = Utils.getLocalStorage('reset_email');
        const role = Utils.getLocalStorage('reset_role');
        
        if (newPassword !== confirmPassword) {
            Utils.showError('New passwords do not match');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
            return;
        }
        
        try {
            const result = await apiClient.resetPassword(email, otp, newPassword, role);
            
            if (result.success) {
                Utils.showSuccess(result.message);
                Utils.removeLocalStorage('reset_email');
                Utils.removeLocalStorage('reset_role');
                e.target.reset();
                this.showView('login-selector');
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Failed to reset password. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    }

    // Handle resend reset OTP
    async handleResendResetOTP() {
        const email = Utils.getLocalStorage('reset_email');
        const role = Utils.getLocalStorage('reset_role');
        
        if (!email || !role) {
            Utils.showError('Session expired. Please start the reset process again.');
            this.showView('login-selector');
            return;
        }
        
        try {
            const result = await apiClient.sendResetPasswordOTP(email, role);
            
            if (result.success) {
                Utils.showSuccess('A new verification code has been sent to your email.');
            } else {
                Utils.showError(result.message);
            }
        } catch (error) {
            Utils.showError('Failed to resend verification code. Please try again.');
        }
    }

    // Cleanup on page unload
    cleanup() {
        // Clear intervals and timeouts
        if (window.examTimer) {
            window.examTimer.stop();
        }
        
        if (window.fullscreenService) {
            window.fullscreenService.stopMonitoring();
        }
        
        if (window.studentService && window.studentService.autoSaveInterval) {
            clearInterval(window.studentService.autoSaveInterval);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    const app = new ExamApp();
    
    // Initialize demo data
    app.initializeDemoData();
    
    // Make app available globally for debugging
    window.examApp = app;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });
    
    // Add keyboard shortcut for app info (Ctrl+I)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'i' && document.getElementById('loginSelector')) {
            e.preventDefault();
            app.showAppInfo();
        }
    });
    
    console.log('ExamSecure application initialized successfully');
});

// Make ExamApp available globally
window.ExamApp = ExamApp;