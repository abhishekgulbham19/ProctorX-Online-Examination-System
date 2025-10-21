// Admin functionality for examination management

class AdminService {
    constructor() {
        this.currentQuestionCount = 0;
    }

    // Initialize admin dashboard
    initializeDashboard() {
        this.setupTabNavigation();
        this.loadExams();
        this.loadStudents();
        this.loadResults();
        this.setupEventListeners();
    }

    // Setup tab navigation
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('#adminDashboard .nav-btn:not(.logout-btn)');
        const tabContents = document.querySelectorAll('#adminDashboard .tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button
                button.classList.add('active');

                // Show corresponding content
                const tabId = button.id.replace('Tab', 'Content');
                const tabContent = document.getElementById(tabId);
                if (tabContent) {
                    tabContent.classList.add('active');
                    Utils.addAnimation(tabContent, 'fade-in');
                }
            });
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Create exam form
        document.getElementById('createExamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createExam();
        });

        // Add question button
        document.getElementById('addQuestion').addEventListener('click', () => {
            this.addQuestion();
        });

        // Add student button
        document.getElementById('addStudentBtn').addEventListener('click', () => {
            this.showAddStudentForm();
        });

        // Upload Excel button
        document.getElementById('uploadExcelBtn').addEventListener('click', () => {
            document.getElementById('excelFileInput').click();
        });

        // Handle Excel file upload
        document.getElementById('excelFileInput').addEventListener('change', (e) => {
            this.handleExcelUpload(e);
        });

        // Admin logout
        document.getElementById('adminLogout').addEventListener('click', () => {
            Utils.showLoadingScreen('login', 'Logging Out', 'Signing you out securely');
            authService.logout();
            setTimeout(() => {
                Utils.hideLoadingScreen(0);
                window.location.reload();
            }, 3000);
        });

        // Admin menu toggle
        document.getElementById('adminMenuTrigger').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('adminDropdownMenu');
            dropdown.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('adminDropdownMenu');
            if (!dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
            }
        });
        
        // Delete selected students button
        document.getElementById('deleteSelectedStudentsBtn').addEventListener('click', () => {
            this.deleteSelectedStudents();
        });
        
        // Select all students checkbox
        document.getElementById('selectAllStudents').addEventListener('change', (e) => {
            this.handleSelectAllStudents(e.target.checked);
        });
    }

    // Add new question to exam form
    addQuestion() {
        this.currentQuestionCount++;
        const questionsContainer = document.getElementById('questionsContainer');
        
        const questionDiv = Utils.createElement('div', { className: 'question-item' });
        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">Question ${this.currentQuestionCount}</span>
                <button type="button" class="remove-question" onclick="adminService.removeQuestion(this)">Remove</button>
            </div>
            <div class="input-group">
                <label>Question Text</label>
                <textarea name="question_text" required rows="3"></textarea>
            </div>
            <div class="input-group">
                <label>Question Type</label>
                <select name="question_type" onchange="adminService.handleQuestionTypeChange(this)" required>
                    <option value="">Select Type</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="short_answer">Short Answer</option>
                </select>
            </div>
            <div class="input-group">
                <label>Section</label>
                <input type="text" name="section_name" placeholder="e.g., Math, Science">
            </div>
            <div class="input-group">
                <label>Marks</label>
                <input type="number" name="marks" value="1" min="1" required>
            </div>
            <div class="options-container" style="display: none;">
                <label>Options</label>
                <div class="options-list">
                    <!-- Options will be added dynamically -->
                </div>
                <button type="button" class="add-option-btn" onclick="adminService.addOption(this)">Add Option</button>
            </div>
            <div class="correct-answer-container" style="display: none;">
                <div class="input-group">
                    <label>Correct Answer</label>
                    <input type="text" name="correct_answer" placeholder="Enter correct answer">
                </div>
            </div>
        `;
        
        questionsContainer.appendChild(questionDiv);
        Utils.addAnimation(questionDiv, 'slide-in');
    }

    // Remove question
    removeQuestion(button) {
        const questionItem = button.closest('.question-item');
        Utils.addAnimation(questionItem, 'fade-out');
        setTimeout(() => {
            questionItem.remove();
            this.renumberQuestions();
        }, 500);
    }

    // Renumber questions after removal
    renumberQuestions() {
        const questions = document.querySelectorAll('.question-item');
        questions.forEach((question, index) => {
            const questionNumber = question.querySelector('.question-number');
            questionNumber.textContent = `Question ${index + 1}`;
        });
        this.currentQuestionCount = questions.length;
    }

    // Handle question type change
    handleQuestionTypeChange(select) {
        const questionItem = select.closest('.question-item');
        const optionsContainer = questionItem.querySelector('.options-container');
        const correctAnswerContainer = questionItem.querySelector('.correct-answer-container');
        const questionType = select.value;

        // Hide all containers first
        optionsContainer.style.display = 'none';
        correctAnswerContainer.style.display = 'none';

        if (questionType === 'multiple_choice') {
            optionsContainer.style.display = 'block';
            const optionsList = optionsContainer.querySelector('.options-list');
            optionsList.innerHTML = ''; // Clear existing options
            
            // Add first two options by default
            this.addOption(optionsContainer.querySelector('.add-option-btn'));
            this.addOption(optionsContainer.querySelector('.add-option-btn'));
            
            // Update label
            const label = optionsContainer.querySelector('label');
            label.textContent = 'Options (Select the correct answer with the radio button)';
            
            Utils.addAnimation(optionsContainer, 'slide-down');
        } else if (questionType === 'true_false') {
            optionsContainer.style.display = 'block';
            const optionsList = optionsContainer.querySelector('.options-list');
            const radioName = `correct_tf_${Date.now()}`;
            optionsList.innerHTML = `
                <div class="option-input" style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                    <input type="radio" name="${radioName}" value="True" id="true_${radioName}">
                    <label for="true_${radioName}" style="margin-left: 8px; cursor: pointer; font-weight: 500;">True</label>
                </div>
                <div class="option-input" style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                    <input type="radio" name="${radioName}" value="False" id="false_${radioName}">
                    <label for="false_${radioName}" style="margin-left: 8px; cursor: pointer; font-weight: 500;">False</label>
                </div>
            `;
            
            // Update label
            const label = optionsContainer.querySelector('label');
            label.textContent = 'Select the correct answer:';
            
            Utils.addAnimation(optionsContainer, 'slide-down');
        } else if (questionType === 'short_answer') {
            correctAnswerContainer.style.display = 'block';
            Utils.addAnimation(correctAnswerContainer, 'slide-down');
        }
    }

    // Add option to multiple choice question
    addOption(button) {
        const optionsList = button.previousElementSibling;
        const questionItem = button.closest('.question-item');
        const questionNumber = questionItem.querySelector('.question-number').textContent.replace('Question ', '');
        const radioName = `correct_q${questionNumber}_${Date.now()}`;
        const optionNumber = optionsList.children.length + 1;
        
        const optionDiv = Utils.createElement('div', { className: 'option-input' });
        optionDiv.style.cssText = 'display: flex; align-items: center; margin-bottom: 8px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 5px; background: #f8fafc;';
        optionDiv.innerHTML = `
            <input type="radio" name="${radioName}" value="" id="radio_${radioName}_${optionNumber}" 
                   style="margin-right: 8px;" onchange="this.value = this.nextElementSibling.value">
            <label for="radio_${radioName}_${optionNumber}" style="font-weight: 500; color: #38a169; margin-right: 8px; min-width: 20px;">○</label>
            <input type="text" placeholder="Enter option text" 
                   style="flex: 1; border: 1px solid #e2e8f0; border-radius: 3px; padding: 5px;" 
                   onchange="this.previousElementSibling.previousElementSibling.value = this.value; if(this.previousElementSibling.previousElementSibling.checked) this.style.background = '#f0fff4';"
                   onkeyup="this.previousElementSibling.previousElementSibling.value = this.value;">
            <span style="margin: 0 8px; color: #718096; font-size: 0.9em;">Correct?</span>
            <button type="button" onclick="this.parentElement.remove()" 
                    style="margin-left: 8px; padding: 4px 8px; background: #e53e3e; color: white; border: none; border-radius: 3px; cursor: pointer;">
                Remove
            </button>
        `;
        
        // Add event listener to radio button to highlight correct answer
        const radioButton = optionDiv.querySelector('input[type="radio"]');
        const textInput = optionDiv.querySelector('input[type="text"]');
        const label = optionDiv.querySelector('label');
        
        radioButton.addEventListener('change', function() {
            // Reset all options in this question
            const allOptions = questionItem.querySelectorAll('.option-input');
            allOptions.forEach(opt => {
                const optText = opt.querySelector('input[type="text"]');
                const optLabel = opt.querySelector('label');
                optText.style.background = '#fff';
                optLabel.textContent = '○';
                optLabel.style.color = '#718096';
            });
            
            // Highlight selected correct answer
            if (this.checked) {
                textInput.style.background = '#f0fff4';
                label.textContent = '●';
                label.style.color = '#38a169';
            }
        });
        
        optionsList.appendChild(optionDiv);
        Utils.addAnimation(optionDiv, 'slide-in');
        
        // Focus on the text input
        textInput.focus();
    }

    // Create new exam
    async createExam() {
        const form = document.getElementById('createExamForm');
        const formData = new FormData(form);
        const editId = form.getAttribute('data-edit-id');
        const isEditing = !!editId;
        
        try {
            const adminUser = authService.getCurrentUser();
            if (!adminUser) {
                Utils.showError('Please log in first.');
                return;
            }

            // Get form data
            const startTimeLocal = formData.get('examStartTime') || document.getElementById('examStartTime').value;
            const endTimeLocal = formData.get('examEndTime') || document.getElementById('examEndTime').value;
            
            // Validate time fields
            if (!startTimeLocal) {
                Utils.showError('Please select a start time for the exam.');
                return;
            }
            if (!endTimeLocal) {
                Utils.showError('Please select an end time for the exam.');
                return;
            }
            
            // Validate that end time is after start time (compare as IST times)
            const startDate = Utils.parseISTTimestamp(startTimeLocal);
            const endDate = Utils.parseISTTimestamp(endTimeLocal);
            if (endDate <= startDate) {
                Utils.showError('End time must be after start time.');
                return;
            }
            
            // Convert datetime-local to IST timestamp for storage
            const startTime = Utils.datetimeLocalToIST(startTimeLocal);
            const endTime = Utils.datetimeLocalToIST(endTimeLocal);
            
            let examData = {
                title: formData.get('examTitle') || document.getElementById('examTitle').value,
                description: formData.get('examDescription') || document.getElementById('examDescription').value,
                duration: parseInt(formData.get('examDuration') || document.getElementById('examDuration').value),
                startTime: startTime,
                endTime: endTime,
                examCode: Utils.generateRandomString(8),
                questions: []
            };

            // Get questions
            const questionItems = document.querySelectorAll('.question-item');
            questionItems.forEach((item, index) => {
                const questionText = item.querySelector('[name="question_text"]').value;
                const questionType = item.querySelector('[name="question_type"]').value;
                const sectionName = item.querySelector('[name="section_name"]').value;
                const marks = parseInt(item.querySelector('[name="marks"]').value);
                
                let options = null;
                let correctAnswer = '';

                if (questionType === 'multiple_choice') {
                    options = [];
                    const optionInputs = item.querySelectorAll('.option-input');
                    optionInputs.forEach(optionInput => {
                        const text = optionInput.querySelector('input[type="text"]').value;
                        const isCorrect = optionInput.querySelector('input[type="radio"]').checked;
                        if (text) {
                            options.push(text);
                            if (isCorrect) correctAnswer = text;
                        }
                    });
                    
                    // Validate that correct answer is selected
                    if (!correctAnswer || correctAnswer.trim() === '') {
                        Utils.showError(`Please select the correct answer for multiple choice question: "${questionText}"`);
                        return;
                    }
                } else if (questionType === 'true_false') {
                    options = ['True', 'False'];
                    const checkedRadio = item.querySelector('input[type="radio"]:checked');
                    correctAnswer = checkedRadio ? checkedRadio.value : '';
                    
                    // Validate that correct answer is selected
                    if (!correctAnswer || correctAnswer.trim() === '') {
                        Utils.showError(`Please select the correct answer (True or False) for question: "${questionText}"`);
                        return;
                    }
                } else if (questionType === 'short_answer') {
                    correctAnswer = item.querySelector('[name="correct_answer"]').value || '';
                    
                    // Validate that correct answer is provided
                    if (!correctAnswer || correctAnswer.trim() === '') {
                        Utils.showError(`Please provide the correct answer for question: "${questionText}"`);
                        return;
                    }
                }

                examData.questions.push({
                    question_text: questionText,
                    question_type: questionType,
                    section_name: sectionName,
                    marks: marks,
                    options: options,
                    correct_answer: correctAnswer,
                    question_order: index + 1
                });
            });

            // Validate at least one question is required
            if (examData.questions.length === 0) {
                Utils.showError('Please add at least one question to the exam before creating it.');
                return;
            }

            let result;
            if (isEditing) {
                result = await apiClient.updateExam(editId, adminUser.id, examData);
                if (result.success) {
                    Utils.showSuccess(`Exam "${examData.title}" updated successfully!`);
                }
            } else {
                result = await apiClient.createExam(adminUser.id, examData);
                if (result.success) {
                    Utils.showSuccess(`Exam "${examData.title}" created successfully! Exam Code: ${examData.examCode}`);
                }
            }
            
            if (!result.success) {
                Utils.showError(result.message || `Failed to ${isEditing ? 'update' : 'create'} exam.`);
                return;
            }
            
            // Reset form
            form.reset();
            document.getElementById('questionsContainer').innerHTML = '';
            this.currentQuestionCount = 0;
            this.resetFormToCreateMode();
            this.loadExams();

        } catch (error) {
            console.error('Create/Update exam error:', error);
            Utils.showError(`Failed to ${isEditing ? 'update' : 'create'} exam. Please try again.`);
        }
    }

    // Load exams list
    async loadExams() {
        const examsList = document.getElementById('examsList');
        const adminUser = authService.getCurrentUser();
        
        if (!adminUser) {
            examsList.innerHTML = '<p>Please log in to view exams.</p>';
            return;
        }

        const result = await apiClient.getExamsByAdmin(adminUser.id);
        
        if (!result.success || !result.exams || result.exams.length === 0) {
            examsList.innerHTML = '<p>No exams created yet.</p>';
            return;
        }

        const exams = result.exams;

        examsList.innerHTML = exams.map(exam => `
            <div class="exam-item">
                <div class="item-info">
                    <h4>${Utils.escapeHtml(exam.title)}</h4>
                    <p><strong>Code:</strong> ${exam.exam_code} | <strong>Duration:</strong> ${exam.duration} mins</p>
                    <p><strong>Start:</strong> ${Utils.formatDate(exam.start_time)} | <strong>End:</strong> ${Utils.formatDate(exam.end_time)}</p>
                    <p>${Utils.escapeHtml(exam.description || '')}</p>
                </div>
                <div class="item-actions">
                    <button class="action-btn" style="background: #4299e1;" onclick="adminService.manageExamStudents(${exam.id})">Assign Students</button>
                    <button class="action-btn view-btn" onclick="adminService.showAssignedStudents(${exam.id})">Show Students</button>
                    <button class="action-btn edit-btn" onclick="adminService.editExam(${exam.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="adminService.deleteExam(${exam.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Load students list (allowed student emails)
    async loadStudents() {
        const studentsList = document.getElementById('studentsList');
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            studentsList.innerHTML = '<p>Please log in to view students.</p>';
            return;
        }
        
        const result = await apiClient.getAllowedStudents(adminUser.id);
        
        if (!result.success || !result.students || result.students.length === 0) {
            studentsList.innerHTML = '<p>No student emails added yet. Add student emails to give them permission to register.</p>';
            return;
        }

        const students = result.students;
        
        studentsList.innerHTML = students.map(student => `
            <div class="student-item" data-student-id="${student.id}">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                    <input type="checkbox" class="student-checkbox" data-student-id="${student.id}" style="width: 18px; height: 18px; cursor: pointer;">
                    <div class="item-info" style="flex: 1;">
                        <h4>${Utils.escapeHtml(student.student_email)}</h4>
                        <p><strong>Added:</strong> ${Utils.formatDate(student.added_at)}</p>
                        <p style="color: #666; font-size: 0.9em;">Assign exams to this student from the "Manage Exams" section</p>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="action-btn delete-btn" onclick="adminService.deleteAllowedStudent(${student.id})">Remove</button>
                </div>
            </div>
        `).join('');
        
        // Add change event listeners to checkboxes
        document.querySelectorAll('.student-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateDeleteButtonState();
            });
        });
        
        // Reset select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllStudents');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
        
        this.updateDeleteButtonState();
    }

    // Load results
    async loadResults() {
        const resultsList = document.getElementById('resultsList');
        const adminUser = authService.getCurrentUser();
        
        if (!adminUser) {
            resultsList.innerHTML = '<p>Please log in to view results.</p>';
            return;
        }

        const result = await apiClient.getAdminResults(adminUser.id);
        
        if (!result.success || !result.results || result.results.length === 0) {
            resultsList.innerHTML = '<p>No exam results yet.</p>';
            return;
        }

        const attempts = result.results;

        // Group attempts by exam
        const groupedResults = {};
        attempts.forEach(attempt => {
            const examCode = attempt.exam_code || attempt.title;
            if (!groupedResults[examCode]) {
                groupedResults[examCode] = {
                    title: attempt.title,
                    examCode: examCode,
                    attempts: []
                };
            }
            groupedResults[examCode].attempts.push(attempt);
        });

        let resultsHtml = '';
        
        Object.keys(groupedResults).forEach(examCode => {
            const group = groupedResults[examCode];
            const examAttempts = group.attempts;
            
            resultsHtml += `
                <div class="exam-group">
                    <div class="exam-group-header" onclick="this.parentElement.querySelector('.exam-attempts').classList.toggle('hidden')">
                        <h3>${group.title} (${examCode})</h3>
                        <span class="student-count">${examAttempts.length} student${examAttempts.length !== 1 ? 's' : ''}</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <div class="exam-attempts">
                        ${examAttempts.map(attempt => {
                            const percentage = parseFloat(attempt.percentage);
                            const statusColor = percentage >= 60 ? '#38a169' : '#e53e3e';
                            
                            return `
                                <div class="result-item">
                                    <div class="item-info">
                                        <h4>${Utils.escapeHtml(attempt.student_email)} - ${Utils.escapeHtml(attempt.first_name)} ${Utils.escapeHtml(attempt.last_name)}</h4>
                                        <p><strong>Score:</strong> <span style="color: ${statusColor}; font-weight: bold;">${attempt.score}/${attempt.total_points} (${percentage}%)</span></p>
                                        <p><strong>Status:</strong> Completed</p>
                                        <p><strong>Submitted:</strong> ${Utils.formatDate(attempt.submitted_at)}</p>
                                        <p><strong>Violations:</strong> ${attempt.violations || 0}</p>
                                    </div>
                                    <div class="item-actions">
                                        <button class="action-btn view-btn" onclick="adminService.viewDetailedResults(${attempt.id}, ${attempt.student_id})">View Analysis</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });
        
        resultsList.innerHTML = resultsHtml;
    }

    // Show add student form
    async showAddStudentForm() {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }
        
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = 'Add Student Email';
        
        modalMessage.innerHTML = `
            <div style="text-align: left;">
                <div class="input-group" style="margin-bottom: 15px;">
                    <label for="newStudentEmail" style="display: block; margin-bottom: 5px; font-weight: 500;">Student Email (Gmail only)</label>
                    <input type="email" id="newStudentEmail" placeholder="student@gmail.com" 
                           style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 5px;" required>
                </div>
                <div style="padding: 10px; background: #f0f9ff; border-left: 4px solid #3182ce; margin-top: 10px;">
                    <p style="margin: 0; font-size: 0.9em; color: #2c5282;">
                        <strong>Note:</strong> When a user registers with this email, they will be your student. Assign exams to students from the "Manage Exams" section.
                    </p>
                </div>
                <div style="display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;">
                    <button id="cancelAddStudent" style="padding: 0.75rem 1.5rem; border: 1px solid #e2e8f0; background: white; color: #4a5568; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.3s ease;">Cancel</button>
                    <button id="confirmAddStudent" style="padding: 0.75rem 1.5rem; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 1rem; transition: all 0.3s ease;">Add Student</button>
                </div>
            </div>
        `;
        modalOk.style.display = 'none';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        document.getElementById('cancelAddStudent').onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.style.display = 'block';
            modalOk.textContent = 'OK';
        };
        
        document.getElementById('confirmAddStudent').onclick = () => {
            const email = document.getElementById('newStudentEmail').value.trim();
            
            if (!email) {
                Utils.showError('Please enter an email address.');
                return;
            }
            
            if (!email.endsWith('@gmail.com')) {
                Utils.showError('Only Gmail addresses (@gmail.com) are allowed.');
                return;
            }
            
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.style.display = 'block';
            modalOk.textContent = 'OK';
            
            this.addStudent(email);
        };
    }

    // Add new student email
    async addStudent(email) {
        if (!Utils.isValidEmail(email)) {
            Utils.showError('Please enter a valid email address.');
            return;
        }

        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        const result = await apiClient.addAllowedStudent(adminUser.id, email);
        
        if (result.success) {
            Utils.showSuccess(`Student email ${email} added successfully! Assign exams to this student from the "Manage Exams" section.`);
            this.loadStudents();
        } else {
            Utils.showError(result.message);
        }
    }

    // Edit student exam assignments
    async editStudentExams(studentEmail) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        const examResult = await apiClient.getExamsByAdmin(adminUser.id);
        const exams = examResult.success ? examResult.exams : [];
        
        if (exams.length === 0) {
            Utils.showError('No exams available. Please create exams first.');
            return;
        }

        const assignedResult = await apiClient.getStudentAssignedExams(studentEmail);
        const assignedExams = assignedResult.success ? assignedResult.examIds : [];
        
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = `Edit Exam Assignments - ${studentEmail}`;
        modalMessage.innerHTML = `
            <div style="text-align: left;">
                <div style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 5px; max-height: 300px; overflow-y: auto;">
                    <label style="display: block; margin-bottom: 10px; font-weight: 500;">Select Exams:</label>
                    ${exams.map(exam => `
                        <div style="margin-bottom: 8px; padding: 8px; background: ${assignedExams.includes(exam.id) ? '#f0fff4' : '#fff'}; border: 1px solid #e2e8f0; border-radius: 3px;">
                            <input type="checkbox" id="edit_exam_${exam.id}" value="${exam.id}" 
                                   ${assignedExams.includes(exam.id) ? 'checked' : ''} style="margin-right: 8px;">
                            <label for="edit_exam_${exam.id}" style="cursor: pointer;">
                                <strong>${Utils.escapeHtml(exam.title)}</strong><br>
                                <small style="color: #666;">Code: ${exam.exam_code} | Duration: ${exam.duration} mins</small>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div style="padding: 10px; background: #f0f9ff; border-left: 4px solid #3182ce; margin-top: 10px;">
                    <p style="margin: 0; font-size: 0.9em; color: #2c5282;">
                        <strong>Note:</strong> The student can only access exams you select here, even if they have the exam code.
                    </p>
                </div>
            </div>
        `;
        modalOk.textContent = 'Save Changes';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = async () => {
            const selectedExams = [];
            exams.forEach(exam => {
                const checkbox = document.getElementById(`edit_exam_${exam.id}`);
                if (checkbox && checkbox.checked) {
                    selectedExams.push(exam.id);
                }
            });
            
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
            
            const result = await apiClient.assignExamsToStudent(studentEmail, selectedExams);
            if (result.success) {
                Utils.showSuccess(`Exam assignments updated! ${selectedExams.length} exam(s) assigned to ${studentEmail}.`);
                await this.loadStudents();
            } else {
                Utils.showError(result.message || 'Failed to update exam assignments');
            }
        };
    }

    // Show students assigned to an exam
    async showAssignedStudents(examId) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        const examResult = await apiClient.getExamsByAdmin(adminUser.id);
        const exams = examResult.success ? examResult.exams : [];
        const exam = exams.find(e => e.id === examId);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        const result = await apiClient.getExamAssignedStudents(examId);
        
        const modal = document.getElementById('messageModal');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalContent.classList.add('full-screen');
        modalTitle.textContent = `Assigned Students - ${exam.title}`;
        
        if (!result.success || result.students.length === 0) {
            modalMessage.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p>No students assigned to this exam yet.</p>
                    <p style="color: #666; font-size: 0.9em;">Go to "Manage Students" to assign students to this exam.</p>
                </div>
            `;
        } else {
            modalMessage.innerHTML = `
                <div style="text-align: left; height: 100%;">
                    <p style="margin-bottom: 15px;"><strong>Students who can access this exam:</strong></p>
                    <div style="max-height: 60vh; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px;">
                        ${result.students.map(student => `
                            <div style="padding: 10px; margin-bottom: 8px; background: #f8fafc; border-radius: 3px; border-left: 4px solid #38a169;">
                                <strong>${Utils.escapeHtml(student.student_email)}</strong><br>
                                <small style="color: #666;">Assigned: ${Utils.formatDate(student.assigned_at)}</small>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 15px; padding: 10px; background: #f0f9ff; border-radius: 5px;">
                        <p style="margin: 0; font-size: 0.9em; color: #2c5282;">
                            <strong>Total:</strong> ${result.students.length} student(s) assigned
                        </p>
                    </div>
                </div>
            `;
        }
        
        modalOk.textContent = 'Close';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modalContent.classList.remove('full-screen');
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
        };
    }

    // Manage students assigned to an exam
    async manageExamStudents(examId) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        const examResult = await apiClient.getExamsByAdmin(adminUser.id);
        const exams = examResult.success ? examResult.exams : [];
        const exam = exams.find(e => e.id === examId);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        const studentsResult = await apiClient.getAllowedStudents(adminUser.id);
        const students = studentsResult.success ? studentsResult.students : [];

        if (students.length === 0) {
            Utils.showError('No students added yet. Please add student emails in "Manage Students" tab first.');
            return;
        }

        const assignedResult = await apiClient.getExamAssignedStudents(examId);
        const assignedEmails = assignedResult.success ? assignedResult.students.map(s => s.student_email) : [];

        const modal = document.getElementById('messageModal');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalContent.classList.add('full-screen');
        modalTitle.textContent = `Assign Students - ${exam.title}`;
        modalMessage.innerHTML = `
            <div style="text-align: left; height: 100%;">
                <div style="margin-bottom: 15px;">
                    <p style="margin: 0;"><strong>Select students who can access this exam:</strong></p>
                </div>
                <div style="max-height: 60vh; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px;">
                    ${students.map(student => `
                        <div style="padding: 10px; margin-bottom: 8px; background: ${assignedEmails.includes(student.student_email) ? '#f0fff4' : '#fff'}; border: 1px solid #e2e8f0; border-radius: 3px;">
                            <input type="checkbox" id="assign_student_${student.id}" value="${student.student_email}" 
                                   ${assignedEmails.includes(student.student_email) ? 'checked' : ''} style="margin-right: 8px;">
                            <label for="assign_student_${student.id}" style="cursor: pointer;">
                                <strong>${Utils.escapeHtml(student.student_email)}</strong>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div style="padding: 10px; background: #f0f9ff; border-left: 4px solid #3182ce; margin-top: 10px;">
                    <p style="margin: 0; font-size: 0.9em; color: #2c5282;">
                        <strong>Note:</strong> Only selected students will be able to access this exam using the exam code.
                    </p>
                </div>
            </div>
        `;
        modalOk.textContent = 'Save Assignments';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = async () => {
            const selectedEmails = [];
            students.forEach(student => {
                const checkbox = document.getElementById(`assign_student_${student.id}`);
                if (checkbox && checkbox.checked) {
                    selectedEmails.push(student.student_email);
                }
            });
            
            modalContent.classList.remove('full-screen');
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
            
            const result = await apiClient.assignStudentsToExam(examId, selectedEmails);
            if (result.success) {
                Utils.showSuccess(`Successfully assigned ${selectedEmails.length} student(s) to this exam!`);
                await this.loadExams();
            } else {
                Utils.showError(result.message || 'Failed to assign students');
            }
        };
    }

    // Handle select all students checkbox
    handleSelectAllStudents(isChecked) {
        const checkboxes = document.querySelectorAll('.student-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        this.updateDeleteButtonState();
    }
    
    // Update delete button state based on selected checkboxes
    updateDeleteButtonState() {
        const checkboxes = document.querySelectorAll('.student-checkbox:checked');
        const allCheckboxes = document.querySelectorAll('.student-checkbox');
        const deleteBtn = document.getElementById('deleteSelectedStudentsBtn');
        const countSpan = document.getElementById('selectedCount');
        const selectAllCheckbox = document.getElementById('selectAllStudents');
        
        if (checkboxes.length > 0) {
            deleteBtn.style.display = 'block';
            countSpan.textContent = checkboxes.length;
        } else {
            deleteBtn.style.display = 'none';
        }
        
        // Update select all checkbox state
        if (selectAllCheckbox && allCheckboxes.length > 0) {
            selectAllCheckbox.checked = checkboxes.length === allCheckboxes.length;
            selectAllCheckbox.indeterminate = checkboxes.length > 0 && checkboxes.length < allCheckboxes.length;
        }
    }
    
    // Delete selected students
    async deleteSelectedStudents() {
        const checkboxes = document.querySelectorAll('.student-checkbox:checked');
        const studentIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.studentId));
        
        if (studentIds.length === 0) {
            Utils.showError('Please select at least one student to delete.');
            return;
        }
        
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }
        
        const message = studentIds.length === 1 
            ? 'Are you sure you want to remove this student email? Users with this email will no longer be able to attend your exams.'
            : `Are you sure you want to remove ${studentIds.length} student emails? Users with these emails will no longer be able to attend your exams.`;
        
        Utils.showConfirm(
            'Remove Student Emails',
            message,
            async () => {
                let successCount = 0;
                let failCount = 0;
                
                Utils.showModal('Deleting Students', `Deleting 0 of ${studentIds.length} student(s)...`);
                
                for (let i = 0; i < studentIds.length; i++) {
                    const studentId = studentIds[i];
                    try {
                        const result = await apiClient.deleteAllowedStudent(studentId, adminUser.id);
                        if (result.success) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (error) {
                        failCount++;
                    }
                    
                    document.getElementById('modalMessage').textContent = 
                        `Deleting ${i + 1} of ${studentIds.length} student(s)...\nSuccess: ${successCount}, Failed: ${failCount}`;
                }
                
                await this.loadStudents();
                
                const resultMessage = `
                    <div style="text-align: left; line-height: 1.8;">
                        <p style="margin-bottom: 1rem; font-weight: 600;">Deletion completed!</p>
                        <p style="margin: 0.5rem 0;"><strong>Successfully removed:</strong> ${successCount}</p>
                        <p style="margin: 0.5rem 0;"><strong>Failed:</strong> ${failCount}</p>
                    </div>
                `;
                
                Utils.showModal('Students Deleted', resultMessage);
            }
        );
    }
    
    // Delete allowed student email
    async deleteAllowedStudent(studentId) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        Utils.showConfirm(
            'Remove Student Email',
            'Are you sure you want to remove this student email? Users with this email will no longer be able to attend your exams.',
            async () => {
                const result = await apiClient.deleteAllowedStudent(studentId, adminUser.id);
                if (result.success) {
                    Utils.showSuccess('Student email removed successfully');
                    await this.loadStudents();
                } else {
                    Utils.showError(result.message || 'Failed to remove student email');
                }
            }
        );
    }

    // Handle Excel file upload for bulk student email addition
    async handleExcelUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
            Utils.showError('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
            event.target.value = '';
            return;
        }

        Utils.showModal(
            'Processing...',
            'Reading Excel file and extracting emails from first column. Please wait...'
        );

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                const emails = [];
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                
                for (const row of jsonData) {
                    if (row && row.length > 0) {
                        const firstCell = row[0];
                        if (firstCell && typeof firstCell === 'string') {
                            const trimmedCell = firstCell.trim().toLowerCase();
                            if (emailRegex.test(trimmedCell) && trimmedCell.endsWith('@gmail.com')) {
                                if (!emails.includes(trimmedCell)) {
                                    emails.push(trimmedCell);
                                }
                            }
                        }
                    }
                }

                if (emails.length === 0) {
                    Utils.showError('No valid Gmail addresses found in the first column of the Excel file. Please make sure the first column contains Gmail addresses.');
                    event.target.value = '';
                    return;
                }

                Utils.showModal(
                    'Confirm Bulk Email Addition',
                    `Found ${emails.length} valid Gmail address(es) in the first column. Do you want to add them all to your student list?`
                );

                const modalOk = document.getElementById('modalOk');
                modalOk.onclick = async () => {
                    document.getElementById('messageModal').classList.add('hidden');
                    await this.bulkAddStudentEmails(emails);
                    event.target.value = '';
                };

            } catch (error) {
                console.error('Excel parsing error:', error);
                Utils.showError('Failed to read Excel file. Please make sure it is a valid Excel file.');
                event.target.value = '';
            }
        };

        reader.onerror = () => {
            Utils.showError('Failed to read the file. Please try again.');
            event.target.value = '';
        };

        reader.readAsArrayBuffer(file);
    }

    // Bulk add student emails from email list
    async bulkAddStudentEmails(emails) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        let successCount = 0;
        let failCount = 0;
        const failedEmails = [];

        Utils.showModal(
            'Adding Student Emails',
            `Processing 0 of ${emails.length} email(s)...`
        );

        for (let i = 0; i < emails.length; i++) {
            const email = emails[i];

            try {
                const result = await apiClient.addAllowedStudent(adminUser.id, email);
                
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                    failedEmails.push(email);
                }
            } catch (error) {
                failCount++;
                failedEmails.push(email);
            }

            document.getElementById('modalMessage').textContent = 
                `Processing ${i + 1} of ${emails.length} email(s)...\nSuccess: ${successCount}, Failed: ${failCount}`;
        }

        await this.loadStudents();

        let resultMessage = `
            <div style="text-align: left; line-height: 1.8;">
                <p style="margin-bottom: 1rem; font-weight: 600;">Bulk email addition completed!</p>
                <p style="margin: 0.5rem 0;"><strong>Successfully added:</strong> ${successCount}</p>
                <p style="margin: 0.5rem 0;"><strong>Failed (duplicates or errors):</strong> ${failCount}</p>`;
        
        if (failedEmails.length > 0) {
            resultMessage += `
                <div style="margin-top: 1rem;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Failed emails:</p>
                    <div style="background: #fff5f5; padding: 0.8rem; border-radius: 6px; border: 1px solid #e53e3e;">
                        ${failedEmails.map(email => `<p style="margin: 0.2rem 0; color: #e53e3e;">${email}</p>`).join('')}
                    </div>
                </div>`;
        }
        
        if (successCount > 0) {
            resultMessage += `
                <div style="margin-top: 1rem; padding: 0.8rem; background: #f0fff4; border-radius: 6px; border: 1px solid #38a169;">
                    <p style="margin: 0; color: #2d3748;"><strong>Note:</strong> When users register with these emails, they will be your students and can attend your exams.</p>
                </div>`;
        }
        
        resultMessage += '</div>';

        Utils.showModal('Bulk Email Addition Complete', resultMessage);
    }

    // Delete exam
    async deleteExam(examId) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        Utils.showConfirm(
            'Delete Exam',
            'Are you sure you want to delete this exam? This action cannot be undone.',
            async () => {
                const result = await apiClient.deleteExam(examId, adminUser.id);
                if (result.success) {
                    Utils.showSuccess('Exam deleted successfully.');
                    await this.loadExams();
                } else {
                    Utils.showError(result.message || 'Failed to delete exam.');
                }
            }
        );
    }

    // Manage exam participants
    async manageParticipants(examId) {
        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === examId);
        
        const studentsResult = await apiClient.getAllStudents();
        const students = studentsResult.success ? studentsResult.students : [];
        const participants = Utils.getLocalStorage('exam_participants') || [];
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        if (students.length === 0) {
            Utils.showError('No students available. Please add students first.');
            return;
        }

        // Create participants management interface
        const participantsHtml = `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <p style="margin: 0;"><strong>Select students who can take this exam:</strong></p>
                    <div>
                        <button id="addAllStudentsBtn" style="padding: 8px 15px; background: #38a169; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px; font-size: 14px;" onclick="adminService.addAllStudents(${examId})">
                            ✓ Add All Students
                        </button>
                        <button id="removeAllStudentsBtn" style="padding: 8px 15px; background: #e53e3e; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;" onclick="adminService.removeAllStudents(${examId})">
                            ✗ Remove All
                        </button>
                    </div>
                </div>
                <div id="studentCheckboxContainer" style="max-height: 300px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 5px; padding: 10px;">
                    ${students.map(student => {
                        const isAllowed = participants.some(p => p.exam_id === examId && p.user_id === student.id && p.is_allowed);
                        return `
                            <div style="display: flex; align-items: center; margin-bottom: 10px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 5px; background: ${isAllowed ? '#f0fff4' : '#fff'};" class="student-checkbox-item">
                                <input type="checkbox" id="student_${student.id}" data-student-id="${student.id}" ${isAllowed ? 'checked' : ''} 
                                       onchange="adminService.toggleParticipant(${examId}, ${student.id}, this.checked)">
                                <label for="student_${student.id}" style="margin-left: 10px; flex: 1; cursor: pointer;">
                                    <strong>${Utils.escapeHtml(student.first_name)} ${Utils.escapeHtml(student.last_name)}</strong><br>
                                    <small style="color: #666;">${Utils.escapeHtml(student.email)}</small>
                                </label>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 5px;">
                    <small><strong>Note:</strong> Only selected students will be able to access this exam using the exam code.</small>
                </div>
            </div>
        `;

        // Create modal with custom close handler
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = `Manage Participants - ${exam.title}`;
        modalMessage.innerHTML = participantsHtml;
        modalOk.textContent = 'Done';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
            
            // Show success message with participant count
            const currentParticipants = Utils.getLocalStorage('exam_participants') || [];
            const allowedCount = currentParticipants.filter(p => p.exam_id === examId && p.is_allowed).length;
            Utils.showSuccess(`Participants updated successfully! ${allowedCount} student(s) can now access this exam.`);
        };
    }

    // Toggle exam participant
    toggleParticipant(examId, userId, isAllowed) {
        try {
            let participants = Utils.getLocalStorage('exam_participants') || [];
            
            // Remove existing entry
            participants = participants.filter(p => !(p.exam_id === examId && p.user_id === userId));
            
            // Add new entry
            participants.push({
                id: participants.length + 1,
                exam_id: examId,
                user_id: userId,
                is_allowed: isAllowed
            });
            
            Utils.setLocalStorage('exam_participants', participants);
        } catch (error) {
            console.error('Toggle participant error:', error);
        }
    }

    // Add all students to exam
    async addAllStudents(examId) {
        try {
            const studentsResult = await apiClient.getAllStudents();
            const students = studentsResult.success ? studentsResult.students : [];
            
            let participants = Utils.getLocalStorage('exam_participants') || [];
            
            // Remove all existing participants for this exam
            participants = participants.filter(p => p.exam_id !== examId);
            
            // Add all students
            students.forEach(student => {
                participants.push({
                    id: participants.length + 1,
                    exam_id: examId,
                    user_id: student.id,
                    is_allowed: true
                });
                
                // Update checkbox
                const checkbox = document.getElementById(`student_${student.id}`);
                if (checkbox) {
                    checkbox.checked = true;
                    const item = checkbox.closest('.student-checkbox-item');
                    if (item) {
                        item.style.background = '#f0fff4';
                    }
                }
            });
            
            Utils.setLocalStorage('exam_participants', participants);
            Utils.showSuccess(`All ${students.length} students have been added to this exam!`);
        } catch (error) {
            console.error('Add all students error:', error);
            Utils.showError('Failed to add all students.');
        }
    }

    // Remove all students from exam
    removeAllStudents(examId) {
        try {
            let participants = Utils.getLocalStorage('exam_participants') || [];
            
            // Remove all participants for this exam
            participants = participants.filter(p => p.exam_id !== examId);
            
            // Update all checkboxes
            const checkboxes = document.querySelectorAll('#studentCheckboxContainer input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
                const item = checkbox.closest('.student-checkbox-item');
                if (item) {
                    item.style.background = '#fff';
                }
            });
            
            Utils.setLocalStorage('exam_participants', participants);
            Utils.showSuccess('All students have been removed from this exam.');
        } catch (error) {
            console.error('Remove all students error:', error);
            Utils.showError('Failed to remove all students.');
        }
    }

    // View exam details
    viewExamDetails(examId) {
        const exams = Utils.getLocalStorage('exams') || [];
        const exam = exams.find(e => e.id === examId);
        
        if (!exam) {
            Utils.showError('Exam not found.');
            return;
        }

        const participants = Utils.getLocalStorage('exam_participants') || [];
        const allowedParticipants = participants.filter(p => p.exam_id === examId && p.is_allowed);
        const attempts = Utils.getLocalStorage('exam_attempts') || [];
        const examAttempts = attempts.filter(a => a.exam_id === examId);

        const questionsHtml = exam.questions.map((q, index) => {
            let optionsDisplay = '';
            if (q.options && q.question_type === 'multiple_choice') {
                optionsDisplay = q.options.map(option => 
                    `<li style="color: ${option === q.correct_answer ? '#38a169' : '#4a5568'}; font-weight: ${option === q.correct_answer ? 'bold' : 'normal'};">
                        ${Utils.escapeHtml(option)} ${option === q.correct_answer ? '✓ (Correct)' : ''}
                    </li>`
                ).join('');
                optionsDisplay = `<ul style="margin: 5px 0; padding-left: 20px;">${optionsDisplay}</ul>`;
            } else if (q.question_type === 'true_false') {
                optionsDisplay = `<ul style="margin: 5px 0; padding-left: 20px;">
                    <li style="color: ${q.correct_answer === 'True' ? '#38a169' : '#4a5568'}; font-weight: ${q.correct_answer === 'True' ? 'bold' : 'normal'};">
                        True ${q.correct_answer === 'True' ? '✓ (Correct)' : ''}
                    </li>
                    <li style="color: ${q.correct_answer === 'False' ? '#38a169' : '#4a5568'}; font-weight: ${q.correct_answer === 'False' ? 'bold' : 'normal'};">
                        False ${q.correct_answer === 'False' ? '✓ (Correct)' : ''}
                    </li>
                </ul>`;
            }

            return `
                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #2d3748;">Q${index + 1}:</strong>
                        <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">
                            ${q.marks} mark${q.marks > 1 ? 's' : ''}
                        </span>
                    </div>
                    <p style="margin: 8px 0; color: #2d3748; font-weight: 500;">${Utils.escapeHtml(q.question_text)}</p>
                    <div style="margin: 8px 0;">
                        <strong style="color: #4a5568;">Type:</strong> 
                        <span style="text-transform: capitalize;">${q.question_type.replace('_', ' ')}</span>
                        ${q.section_name ? `| <strong>Section:</strong> ${Utils.escapeHtml(q.section_name)}` : ''}
                    </div>
                    ${optionsDisplay}
                    ${q.question_type === 'short_answer' ? 
                        `<div style="margin: 8px 0;"><strong style="color: #38a169;">Correct Answer:</strong> ${Utils.escapeHtml(q.correct_answer)}</div>` : 
                        ''
                    }
                </div>
            `;
        }).join('');

        const detailsHtml = `
            <div style="text-align: left; max-height: 500px; overflow-y: auto;">
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div><strong>Exam Code:</strong> <span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 4px;">${exam.exam_code}</span></div>
                        <div><strong>Duration:</strong> ${exam.duration_minutes} minutes</div>
                        <div><strong>Total Questions:</strong> ${exam.questions.length}</div>
                        <div><strong>Total Marks:</strong> ${exam.total_marks}</div>
                        <div><strong>Participants:</strong> ${allowedParticipants.length} student(s)</div>
                        <div><strong>Attempts:</strong> ${examAttempts.length} attempt(s)</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <strong>Available:</strong> ${Utils.formatDate(exam.start_time)} to ${Utils.formatDate(exam.end_time)}
                    </div>
                    ${exam.description ? `<div><strong>Description:</strong> ${Utils.escapeHtml(exam.description)}</div>` : ''}
                </div>
                
                
                <h4 style="color: #2d3748; margin-bottom: 15px;">Questions:</h4>
                ${questionsHtml}
            </div>
        `;

        // Create modal with custom styling
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = `Exam Details - ${exam.title}`;
        modalMessage.innerHTML = detailsHtml;
        modalOk.textContent = 'Close';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
        };
    }

    // View detailed results
    async viewDetailedResults(attemptId, studentId) {
        const result = await apiClient.getDetailedResult(attemptId, studentId);
        
        if (!result.success || !result.result) {
            Utils.showError('Failed to load detailed results.');
            return;
        }

        const attempt = result.result;
        const questions = attempt.questions || [];
        
        let totalCorrect = 0;
        let questionsHtml = '';
        
        questions.forEach((question, index) => {
            const isCorrect = question.is_correct;
            if (isCorrect) totalCorrect++;
            
            const resultColor = isCorrect ? '#38a169' : '#e53e3e';
            const resultStatus = isCorrect ? 'Correct' : 'Incorrect';
            const studentAnswerText = question.student_answer || 'No answer provided';
            
            let optionsHtml = '';
            if ((question.question_type === 'multiple_choice' || question.question_type === 'true_false') && question.options) {
                const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
                optionsHtml = '<div style="margin-top: 1rem; text-align: left;"><p style="margin: 0 0 0.8rem 0; font-weight: 600; color: #2d3748; text-align: left;">Options:</p>';
                options.forEach(option => {
                    const isStudentAnswer = option === studentAnswerText;
                    const isCorrectAnswer = option === question.correct_answer;
                    let borderColor = '#e2e8f0';
                    let borderWidth = '1px';
                    
                    if (isStudentAnswer && isCorrectAnswer) {
                        borderColor = '#38a169';
                        borderWidth = '2px';
                    } else if (isStudentAnswer && !isCorrectAnswer) {
                        borderColor = '#e53e3e';
                        borderWidth = '2px';
                    } else if (isCorrectAnswer) {
                        borderColor = '#38a169';
                        borderWidth = '2px';
                    }
                    
                    optionsHtml += `
                        <div style="padding: 0.8rem; margin-bottom: 0.5rem; border: ${borderWidth} solid ${borderColor}; border-radius: 6px; background: ${isCorrectAnswer ? '#f0fff4' : '#fff'}; text-align: left;">
                            <span style="color: #2d3748;">${Utils.escapeHtml(option)}</span>
                            ${isStudentAnswer ? '<span style="margin-left: 10px; color: #667eea; font-weight: 600;">Selected</span>' : ''}
                            ${isCorrectAnswer ? '<span style="margin-left: 10px; color: #38a169; font-weight: 600;">✓ Correct</span>' : ''}
                        </div>
                    `;
                });
                optionsHtml += '</div>';
            } else if (question.question_type === 'short_answer') {
                optionsHtml = `
                    <div style="margin-top: 1rem; text-align: left;">
                        <p style="margin: 0 0 0.8rem 0; font-weight: 600; color: #2d3748; text-align: left;">Your Answer:</p>
                        <div style="padding: 0.8rem; border: 2px solid ${resultColor}; border-radius: 6px; background: ${isCorrect ? '#f0fff4' : '#fff5f5'}; text-align: left;">
                            <span style="color: #2d3748;">${Utils.escapeHtml(studentAnswerText)}</span>
                        </div>
                        ${!isCorrect ? `
                            <p style="margin: 1rem 0 0.5rem 0; font-weight: 600; color: #2d3748; text-align: left;">Correct Answer:</p>
                            <div style="padding: 0.8rem; border: 2px solid #38a169; border-radius: 6px; background: #f0fff4; text-align: left;">
                                <span style="color: #38a169; font-weight: 600;">${Utils.escapeHtml(question.correct_answer)}</span>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            
            questionsHtml += `
                <div style="margin-bottom: 1.5rem; padding: 1.5rem; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 6px solid ${resultColor}; text-align: left;">
                    <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                        <span style="color: white; font-size: 0.9rem; font-weight: 600; margin-right: 0.75rem; padding: 0.4rem 0.8rem; background: ${resultColor}; border-radius: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${resultStatus}</span>
                        <h5 style="margin: 0; color: #2d3748; flex: 1; font-size: 1.1rem; font-weight: 600; text-align: left;">Question ${index + 1} (${question.points} mark${question.points > 1 ? 's' : ''})</h5>
                    </div>
                    <div style="background: #f7fafc; padding: 1.2rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #e2e8f0; text-align: left;">
                        <p style="margin: 0; color: #2d3748; font-weight: 500; line-height: 1.6; font-size: 1rem; text-align: left;">${Utils.escapeHtml(question.question_text)}</p>
                    </div>
                    ${optionsHtml}
                </div>
            `;
        });
        
        const percentage = parseFloat(attempt.percentage);
        const statusColor = percentage >= 60 ? '#38a169' : '#e53e3e';
        const passStatus = percentage >= 60 ? 'PASSED' : 'NEEDS REVIEW';
        
        const detailsHtml = `
            <div style="width: 100%; flex: 1; overflow-y: auto; padding: 1.5rem; padding-bottom: 0;">
                <div style="text-align: center; padding: 0.4rem; margin-bottom: 1.5rem; background: ${statusColor}; color: white; border-radius: 8px;">
                    <h3 style="margin: 0; color: white; font-size: 1rem;">${Utils.escapeHtml(attempt.title)} - Detailed Results</h3>
                    <h2 style="margin: 0.15rem 0; font-size: 1.2rem;">${attempt.score}/${attempt.total_points}</h2>
                    <p style="margin: 0.1rem 0; font-size: 0.85rem; opacity: 0.9;">${percentage}% - ${passStatus}</p>
                    <p style="margin: 0.1rem 0 0 0; font-size: 0.8rem; opacity: 0.8;">${totalCorrect} out of ${questions.length} questions correct</p>
                    <p style="margin: 0.1rem 0 0 0; font-size: 0.8rem; opacity: 0.8;">Violations: ${attempt.violations || 0}</p>
                </div>
                <div style="margin-bottom: 0;">
                    <h4 style="color: #2d3748; margin-bottom: 1rem; text-align: left;">Question by Question Review</h4>
                    ${questionsHtml}
                </div>
            </div>
        `;

        // Create modal with custom styling - full screen for better view
        const modal = document.getElementById('messageModal');
        const modalContent = modal.querySelector('.modal-content');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalContent.classList.add('results-fullscreen');
        modalTitle.textContent = '';
        modalMessage.innerHTML = detailsHtml;
        modalMessage.style.padding = '0';
        modalMessage.style.margin = '0';
        modalOk.textContent = 'Close';
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modalContent.classList.remove('results-fullscreen');
            modalMessage.style.padding = '';
            modalMessage.style.margin = '';
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            modalOk.textContent = 'OK';
        };
    }

    // Edit exam functionality
    async editExam(examId) {
        const adminUser = authService.getCurrentUser();
        if (!adminUser) {
            Utils.showError('Please log in first.');
            return;
        }

        const result = await apiClient.getExamById(examId, adminUser.id);
        
        if (!result.success) {
            Utils.showError(result.message || 'Failed to load exam.');
            return;
        }

        const exam = result.exam;

        // Switch to create exam tab and populate form
        document.getElementById('createExamTab').click();
        
        // Populate form fields
        document.getElementById('examTitle').value = exam.title;
        document.getElementById('examDescription').value = exam.description || '';
        document.getElementById('examDuration').value = exam.duration;
        
        // Set datetime-local values from database (convert IST timestamps to input format)
        document.getElementById('examStartTime').value = Utils.timestampToDatetimeLocal(exam.start_time);
        document.getElementById('examEndTime').value = Utils.timestampToDatetimeLocal(exam.end_time);
        
        // Clear existing questions
        const questionsContainer = document.getElementById('questionsContainer');
        questionsContainer.innerHTML = '';
        this.currentQuestionCount = 0;
        
        // Add existing questions
        exam.questions.forEach((question, index) => {
            try {
                this.addQuestion();
                const questionItem = questionsContainer.lastElementChild;
                
                // Fill question details
                questionItem.querySelector('[name="question_text"]').value = question.question_text || '';
                questionItem.querySelector('[name="question_type"]').value = question.question_type || 'multiple_choice';
                questionItem.querySelector('[name="section_name"]').value = question.section_name || '';
                questionItem.querySelector('[name="marks"]').value = question.points || 1;
                
                // Manually show the appropriate containers based on question type
                const optionsContainer = questionItem.querySelector('.options-container');
                const correctAnswerContainer = questionItem.querySelector('.correct-answer-container');
                
                // Hide all containers first
                optionsContainer.style.display = 'none';
                correctAnswerContainer.style.display = 'none';
                
                // Fill options and correct answers based on question type
                if (question.question_type === 'multiple_choice' && question.options) {
                    optionsContainer.style.display = 'block';
                    const optionsList = questionItem.querySelector('.options-list');
                    optionsList.innerHTML = '';
                    
                    const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
                    
                    options.forEach((option, optIndex) => {
                        this.addOption(questionItem.querySelector('.add-option-btn'));
                        const optionInput = optionsList.lastElementChild;
                        const textInput = optionInput.querySelector('input[type="text"]');
                        const radioInput = optionInput.querySelector('input[type="radio"]');
                        
                        textInput.value = option;
                        radioInput.value = option;
                        
                        if (option === question.correct_answer) {
                            radioInput.checked = true;
                            textInput.style.background = '#f0fff4';
                            optionInput.querySelector('label').textContent = '●';
                            optionInput.querySelector('label').style.color = '#38a169';
                        }
                    });
                } else if (question.question_type === 'true_false') {
                    optionsContainer.style.display = 'block';
                    const optionsList = questionItem.querySelector('.options-list');
                    const radioName = `correct_tf_${Date.now()}_${index}`;
                    optionsList.innerHTML = `
                        <div class="option-input" style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <input type="radio" name="${radioName}" value="True" id="true_${radioName}" ${question.correct_answer === 'True' ? 'checked' : ''}>
                            <label for="true_${radioName}" style="margin-left: 8px; cursor: pointer; font-weight: 500;">True</label>
                        </div>
                        <div class="option-input" style="background: #f8fafc; padding: 10px; border-radius: 5px; margin-bottom: 8px;">
                            <input type="radio" name="${radioName}" value="False" id="false_${radioName}" ${question.correct_answer === 'False' ? 'checked' : ''}>
                            <label for="false_${radioName}" style="margin-left: 8px; cursor: pointer; font-weight: 500;">False</label>
                        </div>
                    `;
                } else if (question.question_type === 'short_answer') {
                    correctAnswerContainer.style.display = 'block';
                    questionItem.querySelector('[name="correct_answer"]').value = question.correct_answer || '';
                }
                
                console.log(`Successfully loaded question ${index + 1}:`, question.question_text);
            } catch (error) {
                console.error(`Error loading question ${index + 1}:`, error, question);
                Utils.showError(`Failed to load question ${index + 1}. Please check console for details.`);
            }
        });
        
        // Store exam ID for update
        document.getElementById('createExamForm').setAttribute('data-edit-id', examId);
        
        // Change form title and button text
        document.querySelector('#createExamContent h3').textContent = 'Edit Examination';
        document.querySelector('#createExamForm .submit-btn').textContent = 'Update Exam';
        
        Utils.showSuccess('Exam loaded for editing. Make your changes and click "Update Exam".');
    }

    // Reset form to create mode
    resetFormToCreateMode() {
        document.querySelector('#createExamContent h3').textContent = 'Create New Examination';
        document.querySelector('#createExamForm .submit-btn').textContent = 'Create Exam';
        document.getElementById('createExamForm').removeAttribute('data-edit-id');
    }
}

// Initialize admin service
const adminService = new AdminService();

// Make admin service available globally
window.adminService = adminService;