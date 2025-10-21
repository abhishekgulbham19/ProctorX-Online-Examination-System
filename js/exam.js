// Exam timer and interface management

class ExamTimer {
    constructor() {
        this.timeRemaining = 0;
        this.timerInterval = null;
        this.onTimeupCallback = null;
        this.isRunning = false;
    }

    // Start timer
    start(seconds, onTimeup) {
        this.timeRemaining = seconds;
        this.onTimeupCallback = onTimeup;
        this.isRunning = true;
        
        this.updateDisplay();
        
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            // Warning when 5 minutes remaining
            if (this.timeRemaining === 300) {
                Utils.showModal(
                    'Time Warning',
                    'You have 5 minutes remaining to complete the exam.'
                );
                Utils.addAnimation(document.getElementById('examTimer'), 'pulse');
            }
            
            // Critical warning when 1 minute remaining
            if (this.timeRemaining === 60) {
                Utils.showModal(
                    'Critical Warning',
                    'You have only 1 minute remaining! Please submit your exam soon.'
                );
                document.getElementById('examTimer').classList.add('timer-warning');
            }
            
            if (this.timeRemaining <= 0) {
                this.stop();
                if (this.onTimeupCallback) {
                    this.onTimeupCallback();
                }
            }
        }, 1000);
    }

    // Stop timer
    stop() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.isRunning = false;
        document.getElementById('examTimer').classList.remove('timer-warning');
    }

    // Update timer display
    updateDisplay() {
        const timerElement = document.getElementById('examTimer');
        if (timerElement) {
            timerElement.textContent = `Time: ${Utils.formatTime(this.timeRemaining)}`;
            
            // Add warning class for last 10 minutes
            // Keep timer background transparent - no red backgrounds
            timerElement.style.backgroundColor = 'transparent';
        }
    }

    // Get remaining time
    getRemainingTime() {
        return this.timeRemaining;
    }
}

// Exam interface management
class ExamInterface {
    constructor() {
        this.setupEventListeners();
    }

    // Setup event listeners for exam interface
    setupEventListeners() {
        // Submit exam button
        document.getElementById('submitExamBtn').addEventListener('click', () => {
            if (window.studentService) {
                window.studentService.submitExam();
            }
        });

        // Previous question button
        document.getElementById('prevQuestion').addEventListener('click', () => {
            if (window.studentService && window.studentService.currentQuestionIndex > 0) {
                window.studentService.showQuestion(window.studentService.currentQuestionIndex - 1);
            }
        });

        // Next question button
        document.getElementById('nextQuestion').addEventListener('click', () => {
            if (window.studentService) {
                const totalQuestions = window.studentService.currentExam.displayQuestions.length;
                if (window.studentService.currentQuestionIndex < totalQuestions - 1) {
                    window.studentService.showQuestion(window.studentService.currentQuestionIndex + 1);
                }
            }
        });

        // Clear answer button
        document.getElementById('clearAnswer').addEventListener('click', () => {
            if (window.studentService) {
                window.studentService.clearCurrentAnswer();
            }
        });

        // Mark for review button
        document.getElementById('markForReview').addEventListener('click', () => {
            if (window.studentService) {
                window.studentService.markForReview();
            }
        });

        // Save and next button
        document.getElementById('saveAndNext').addEventListener('click', () => {
            if (window.studentService) {
                window.studentService.saveAndNext();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when in exam mode
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                switch(e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        document.getElementById('prevQuestion').click();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        document.getElementById('nextQuestion').click();
                        break;
                    case 'Enter':
                        if (e.ctrlKey) {
                            e.preventDefault();
                            document.getElementById('submitExamBtn').click();
                        }
                        break;
                    case 'Escape':
                        e.preventDefault();
                        // Prevent escape key from exiting fullscreen during exam
                        break;
                }
            }
        });

        // Prevent right-click context menu during exam
        document.addEventListener('contextmenu', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                e.preventDefault();
            }
        });

        // Prevent text selection during exam (to prevent copying)
        document.addEventListener('selectstart', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                e.preventDefault();
            }
        });

        // Disable developer tools during exam
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('examInterface').classList.contains('hidden')) {
                // Disable F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+U, etc.
                if (e.key === 'F12' || 
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    Utils.showModal(
                        'Action Blocked',
                        'Developer tools and page source viewing are disabled during the exam.'
                    );
                }
            }
        });
    }

    // Show exam progress
    updateProgress() {
        if (!window.studentService || !window.studentService.currentExam) return;
        
        const questions = window.studentService.currentExam.displayQuestions;
        const answeredQuestions = document.querySelectorAll('.question-nav-btn.answered').length;
        const progress = (answeredQuestions / questions.length) * 100;
        
        // Update progress indicator if it exists
        const progressBar = document.querySelector('.exam-progress');
        if (progressBar) {
            progressBar.style.width = progress + '%';
            progressBar.textContent = `${answeredQuestions}/${questions.length} answered`;
        }
    }

    // Auto-scroll to current question
    scrollToCurrentQuestion() {
        const currentBtn = document.querySelector('.question-nav-btn.current');
        if (currentBtn) {
            currentBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Highlight unanswered questions
    highlightUnanswered() {
        const unansweredBtns = document.querySelectorAll('.question-nav-btn:not(.answered)');
        unansweredBtns.forEach(btn => {
            Utils.addAnimation(btn, 'attention');
        });
    }

    // Show exam summary before submission
    showExamSummary() {
        if (!window.studentService || !window.studentService.currentExam) return;
        
        const questions = window.studentService.currentExam.displayQuestions;
        const answeredQuestions = document.querySelectorAll('.question-nav-btn.answered').length;
        const unansweredCount = questions.length - answeredQuestions;
        
        let summaryHtml = `
            <div style="text-align: left;">
                <h4>Exam Summary</h4>
                <p><strong>Total Questions:</strong> ${questions.length}</p>
                <p><strong>Answered:</strong> ${answeredQuestions}</p>
                <p><strong>Unanswered:</strong> ${unansweredCount}</p>
                <p><strong>Time Remaining:</strong> ${Utils.formatTime(window.examTimer.getRemainingTime())}</p>
        `;
        
        if (unansweredCount > 0) {
            summaryHtml += `
                <div style="color: #e53e3e; margin-top: 10px;">
                    <strong>Warning:</strong> You have ${unansweredCount} unanswered question(s). 
                    These will be marked as incorrect.
                </div>
            `;
        }
        
        summaryHtml += '</div>';
        
        return summaryHtml;
    }

    // Validate exam completion
    validateExamCompletion() {
        if (!window.studentService || !window.studentService.currentExam) return false;
        
        const questions = window.studentService.currentExam.displayQuestions;
        const answeredQuestions = document.querySelectorAll('.question-nav-btn.answered').length;
        
        return answeredQuestions === questions.length;
    }

    // Show completion status
    showCompletionStatus() {
        const isComplete = this.validateExamCompletion();
        const statusElement = document.querySelector('.completion-status');
        
        if (statusElement) {
            if (isComplete) {
                statusElement.innerHTML = '<span style="color: #38a169;">✓ All questions answered</span>';
            } else {
                const unanswered = window.studentService.currentExam.displayQuestions.length - 
                                 document.querySelectorAll('.question-nav-btn.answered').length;
                statusElement.innerHTML = `<span style="color: #e53e3e;">${unanswered} questions remaining</span>`;
            }
        }
    }

    // Add progress indicator to exam interface
    addProgressIndicator() {
        const examHeader = document.querySelector('.exam-header .exam-info');
        if (examHeader && !document.querySelector('.exam-progress-container')) {
            const progressContainer = Utils.createElement('div', { className: 'exam-progress-container' });
            progressContainer.innerHTML = `
                <div class="exam-progress-bar">
                    <div class="exam-progress" style="width: 0%;"></div>
                </div>
                <div class="completion-status">0 questions answered</div>
            `;
            examHeader.appendChild(progressContainer);
        }
    }

    // Update all interface elements
    updateInterface() {
        this.updateProgress();
        this.showCompletionStatus();
        this.scrollToCurrentQuestion();
    }
}

// Question navigation helpers
class QuestionNavigation {
    static markedForReview = [];

    static goToFirstUnanswered() {
        const firstUnanswered = document.querySelector('.question-nav-btn:not(.answered)');
        if (firstUnanswered && window.studentService) {
            const questionIndex = parseInt(firstUnanswered.textContent) - 1;
            window.studentService.showQuestion(questionIndex);
        }
    }

    static goToLastAnswered() {
        const answered = document.querySelectorAll('.question-nav-btn.answered');
        if (answered.length > 0 && window.studentService) {
            const lastAnswered = answered[answered.length - 1];
            const questionIndex = parseInt(lastAnswered.textContent) - 1;
            window.studentService.showQuestion(questionIndex);
        }
    }

    static markForReview(questionIndex) {
        const btn = document.querySelector(`.question-nav-btn:nth-child(${questionIndex + 1})`);
        if (btn) {
            btn.classList.toggle('marked-for-review');
            const isMarked = btn.classList.contains('marked-for-review');
            
            if (isMarked && !this.markedForReview.includes(questionIndex)) {
                this.markedForReview.push(questionIndex);
            } else if (!isMarked && this.markedForReview.includes(questionIndex)) {
                this.markedForReview.splice(this.markedForReview.indexOf(questionIndex), 1);
            }
        }
    }

    static loadMarkedQuestions() {
        this.markedForReview.forEach(questionIndex => {
            const btn = document.querySelector(`.question-nav-btn:nth-child(${questionIndex + 1})`);
            if (btn) {
                btn.classList.add('marked-for-review');
            }
        });
    }

    static clearMarkedQuestions() {
        this.markedForReview = [];
    }
}

// Initialize exam components
const examTimer = new ExamTimer();
const examInterface = new ExamInterface();

// Make components available globally
window.examTimer = examTimer;
window.examInterface = examInterface;
window.QuestionNavigation = QuestionNavigation;