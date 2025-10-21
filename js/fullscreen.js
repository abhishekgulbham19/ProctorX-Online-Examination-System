// Fullscreen monitoring and enforcement

class FullscreenService {
    constructor() {
        this.isMonitoring = false;
        this.warningCount = 0;
        this.maxWarnings = 2;
        this.warningTimeout = null;
        this.countdownInterval = null;
        this.warningTimeLimit = 10; // seconds
        this.currentCountdown = 0;
        this.onViolationCallback = null;
    }

    // Start fullscreen monitoring
    startMonitoring(onViolation = null) {
        this.isMonitoring = true;
        this.warningCount = 0;
        this.onViolationCallback = onViolation;
        
        // Add event listeners for fullscreen changes
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
        
        // Add event listeners for visibility changes (tab switching)
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Add event listeners for window focus/blur
        window.addEventListener('blur', this.handleWindowBlur.bind(this));
        window.addEventListener('focus', this.handleWindowFocus.bind(this));
        
        // Prevent common shortcuts that could be used to cheat
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        console.log('Fullscreen monitoring started');
    }

    // Stop fullscreen monitoring
    stopMonitoring() {
        this.isMonitoring = false;
        
        // Remove event listeners
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
        document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        window.removeEventListener('blur', this.handleWindowBlur.bind(this));
        window.removeEventListener('focus', this.handleWindowFocus.bind(this));
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Clear any active timeouts
        if (this.warningTimeout) {
            clearTimeout(this.warningTimeout);
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        
        // Hide warning if showing
        this.hideWarning();
        
        console.log('Fullscreen monitoring stopped');
    }

    // Check if browser is in fullscreen mode
    isFullscreen() {
        return !!(document.fullscreenElement || 
                 document.webkitFullscreenElement || 
                 document.mozFullScreenElement || 
                 document.msFullscreenElement);
    }

    // Enter fullscreen mode
    enterFullscreen() {
        const element = document.documentElement;
        
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
        }
    }

    // Exit fullscreen mode
    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    // Handle fullscreen change events
    handleFullscreenChange() {
        if (!this.isMonitoring) return;
        
        if (!this.isFullscreen()) {
            this.handleViolation('Exited fullscreen mode');
        }
    }

    // Handle visibility change (tab switching)
    handleVisibilityChange() {
        if (!this.isMonitoring) return;
        
        if (document.hidden) {
            this.handleViolation('Switched to another tab or window');
        }
    }

    // Handle window blur (clicking outside browser)
    handleWindowBlur() {
        if (!this.isMonitoring) return;
        
        // Small delay to avoid false positives from modal dialogs
        setTimeout(() => {
            if (!document.hasFocus() && this.isMonitoring) {
                this.handleViolation('Lost focus from exam window');
            }
        }, 100);
    }

    // Handle window focus
    handleWindowFocus() {
        // Window regained focus - could check if warning should be hidden
        if (this.isMonitoring && this.isFullscreen() && !document.hidden) {
            // If user returned to proper state, we can hide warning
            // But don't reset warning count
        }
    }

    // Handle key combinations that could be used for cheating
    handleKeyDown(event) {
        if (!this.isMonitoring) return;
        
        const forbiddenKeys = [
            // Alt+Tab (Windows task switching)
            { alt: true, key: 'Tab' },
            // Cmd+Tab (Mac task switching) 
            { meta: true, key: 'Tab' },
            // Ctrl+Shift+Tab (browser tab switching)
            { ctrl: true, shift: true, key: 'Tab' },
            // Ctrl+Tab (browser tab switching)
            { ctrl: true, key: 'Tab' },
            // Windows key
            { key: 'Meta' },
            // Ctrl+N (new window)
            { ctrl: true, key: 'n' },
            // Ctrl+T (new tab)
            { ctrl: true, key: 't' },
            // Ctrl+W (close tab)
            { ctrl: true, key: 'w' },
            // F11 (fullscreen toggle)
            { key: 'F11' },
            // Alt+F4 (close window)
            { alt: true, key: 'F4' },
            // Ctrl+R (refresh)
            { ctrl: true, key: 'r' },
            // F5 (refresh)
            { key: 'F5' }
        ];

        const isMatch = forbiddenKeys.some(combo => {
            return (!combo.ctrl || event.ctrlKey) &&
                   (!combo.alt || event.altKey) &&
                   (!combo.shift || event.shiftKey) &&
                   (!combo.meta || event.metaKey) &&
                   (combo.key.toLowerCase() === event.key.toLowerCase());
        });

        if (isMatch) {
            event.preventDefault();
            event.stopPropagation();
            this.handleViolation(`Used forbidden key combination: ${event.key}`);
        }
    }

    // Handle security violation
    handleViolation(reason) {
        console.warn('Security violation detected:', reason);
        
        this.warningCount++;
        this.updateWarningCount();
        
        // Show warning
        this.showWarning(reason);
        
        // Start countdown
        this.startCountdown();
        
        // Log the violation
        if (window.authService) {
            window.authService.auditLog('exam_violation', {
                reason: reason,
                warning_count: this.warningCount,
                timestamp: new Date().toISOString()
            });
        }
        
        // Update attempt with warning count
        if (window.studentService && window.studentService.currentAttempt) {
            const attempts = Utils.getLocalStorage('exam_attempts') || [];
            const attemptIndex = attempts.findIndex(a => a.id === window.studentService.currentAttempt.id);
            if (attemptIndex !== -1) {
                attempts[attemptIndex].warning_count = this.warningCount;
                Utils.setLocalStorage('exam_attempts', attempts);
                window.studentService.currentAttempt.warning_count = this.warningCount;
            }
        }
        
        // Check if max warnings exceeded
        if (this.warningCount > this.maxWarnings) {
            this.handleMaxWarningsExceeded();
        }
    }

    // Show warning overlay
    showWarning(reason) {
        const warningElement = document.getElementById('fullscreenWarning');
        const reasonElement = warningElement.querySelector('.warning-content p');
        
        if (reasonElement) {
            reasonElement.textContent = `${reason}. You must return to fullscreen mode to continue the exam.`;
        }
        
        warningElement.classList.remove('hidden');
        warningElement.classList.add('fade-in');
        
        // Setup return to fullscreen button
        const returnBtn = document.getElementById('returnFullscreenBtn');
        returnBtn.onclick = () => {
            this.returnToFullscreen();
        };
    }

    // Hide warning overlay
    hideWarning() {
        const warningElement = document.getElementById('fullscreenWarning');
        warningElement.classList.add('hidden');
        warningElement.classList.remove('fade-in');
        
        // Clear countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
    }

    // Start countdown timer
    startCountdown() {
        this.currentCountdown = this.warningTimeLimit;
        this.updateCountdownDisplay();
        
        this.countdownInterval = setInterval(() => {
            this.currentCountdown--;
            this.updateCountdownDisplay();
            
            if (this.currentCountdown <= 0) {
                clearInterval(this.countdownInterval);
                this.handleCountdownExpired();
            }
        }, 1000);
    }

    // Update countdown display
    updateCountdownDisplay() {
        const countdownElement = document.getElementById('warningTimer');
        if (countdownElement) {
            countdownElement.textContent = this.currentCountdown;
            
            // Add urgent styling for last 3 seconds
            if (this.currentCountdown <= 3) {
                countdownElement.style.color = '#e53e3e';
                countdownElement.style.fontWeight = 'bold';
                Utils.addAnimation(countdownElement, 'pulse');
            }
        }
    }

    // Update warning count display
    updateWarningCount() {
        const countElement = document.getElementById('warningCount');
        if (countElement) {
            countElement.textContent = this.warningCount;
            
            // Change color based on warning count
            if (this.warningCount >= this.maxWarnings) {
                countElement.style.color = '#e53e3e';
            } else if (this.warningCount >= 1) {
                countElement.style.color = '#f56565';
            }
        }
    }

    // Handle countdown expiration
    handleCountdownExpired() {
        console.warn('Warning countdown expired');
        
        this.warningCount++;
        this.updateWarningCount();
        
        if (this.warningCount > this.maxWarnings) {
            this.handleMaxWarningsExceeded();
        } else {
            // Give another chance but increase severity
            Utils.addAnimation(document.querySelector('.warning-content'), 'shake');
            this.startCountdown();
        }
    }

    // Handle maximum warnings exceeded
    handleMaxWarningsExceeded() {
        console.warn('Maximum warnings exceeded - auto-submitting exam');
        
        this.hideWarning();
        
        Utils.showModal(
            'Exam Auto-Submitted',
            'You have exceeded the maximum number of warnings (2). Your exam will now be automatically submitted.',
            () => {
                if (window.studentService) {
                    window.studentService.autoSubmitExam('Maximum security violations exceeded');
                } else if (this.onViolationCallback) {
                    this.onViolationCallback();
                }
            }
        );
    }

    // Return to fullscreen mode
    returnToFullscreen() {
        this.enterFullscreen();
        
        // Wait a moment for fullscreen to engage, then check
        setTimeout(() => {
            if (this.isFullscreen() && !document.hidden) {
                this.hideWarning();
                Utils.showSuccess('Successfully returned to fullscreen mode.');
            } else {
                Utils.showError('Please ensure you are in fullscreen mode and the exam window is active.');
            }
        }, 500);
    }

    // Get current violation status
    getViolationStatus() {
        return {
            isMonitoring: this.isMonitoring,
            warningCount: this.warningCount,
            maxWarnings: this.maxWarnings,
            isInViolation: !this.isFullscreen() || document.hidden,
            isFullscreen: this.isFullscreen(),
            isVisible: !document.hidden,
            hasFocus: document.hasFocus()
        };
    }

    // Reset warning count (for testing purposes)
    resetWarnings() {
        this.warningCount = 0;
        this.updateWarningCount();
    }
}

// Initialize fullscreen service
const fullscreenService = new FullscreenService();

// Make fullscreen service available globally
window.fullscreenService = fullscreenService;