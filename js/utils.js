// Utility functions for the examination system

class Utils {
    // Show modal with message
    static showModal(title, message, callback = null) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            if (callback) callback();
        };
    }

    // Show success message
    static showSuccess(message) {
        this.showModal('Success', message);
    }

    // Show error message
    static showError(message) {
        this.showModal('Error', message);
    }

    // Show confirmation dialog
    static showConfirm(title, message, onConfirm, onCancel = null) {
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        const modalOk = document.getElementById('modalOk');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalOk.textContent = 'Confirm';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'modal-btn';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.style.background = '#718096';
        cancelBtn.style.display = 'inline-block';
        
        // Make OK button inline too
        modalOk.style.display = 'inline-block';
        modalOk.style.marginRight = '10px';
        
        modalOk.parentNode.appendChild(cancelBtn);
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        
        modalOk.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            cancelBtn.remove();
            modalOk.textContent = 'OK';
            modalOk.style.display = 'block';
            modalOk.style.marginRight = '';
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            modal.classList.add('hidden');
            modal.classList.remove('fade-in');
            cancelBtn.remove();
            modalOk.textContent = 'OK';
            modalOk.style.display = 'block';
            modalOk.style.marginRight = '';
            if (onCancel) onCancel();
        };
    }

    // Format time (seconds to HH:MM:SS)
    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Generate random string
    static generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    // Convert datetime-local input value to IST timestamp string for storage
    static datetimeLocalToIST(datetimeLocalValue) {
        if (!datetimeLocalValue) return null;
        
        // datetime-local gives us "2025-10-09T16:26" which represents local browser time
        // We interpret this as IST time (what the admin intends)
        // Append IST timezone offset to ensure it's stored as IST in the database
        const [datePart, timePart] = datetimeLocalValue.split('T');
        const timeWithSeconds = timePart && timePart.includes(':') ? `${timePart}:00` : '00:00:00';
        return `${datePart}T${timeWithSeconds}+05:30`;
    }
    
    // Convert stored timestamp to datetime-local format for input fields
    static timestampToDatetimeLocal(timestamp) {
        if (!timestamp) return '';
        
        // Parse the timestamp as IST - this returns a Date object representing the IST time
        const date = this.parseISTTimestamp(timestamp);
        if (!date || isNaN(date.getTime())) return '';
        
        // Get UTC time in milliseconds
        const utcTime = date.getTime();
        
        // Add IST offset (UTC + 5:30) to get IST civil time
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istTime = new Date(utcTime + istOffset);
        
        // Use UTC getters on the offset-adjusted time to get IST components
        const year = istTime.getUTCFullYear();
        const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istTime.getUTCDate()).padStart(2, '0');
        const hours = String(istTime.getUTCHours()).padStart(2, '0');
        const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Parse stored timestamp as IST and create Date object
    static parseISTTimestamp(timestamp) {
        if (!timestamp) return null;
        
        let dateStr = timestamp;
        
        // Convert PostgreSQL format to datetime-local format
        if (timestamp.includes(' ')) {
            dateStr = timestamp.replace(' ', 'T');
        }
        
        // Parse as IST time by appending the IST timezone offset (+05:30)
        if (dateStr.includes('T') && !dateStr.includes('Z') && !dateStr.includes('+')) {
            // Ensure we have at least HH:MM format
            const parts = dateStr.split('T');
            const timePart = parts[1] || '00:00:00';
            const [hour, minute] = timePart.split(':');
            const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`;
            
            // Create ISO string with IST offset
            const istIsoString = `${parts[0]}T${timeStr}+05:30`;
            return new Date(istIsoString);
        }
        
        // Fallback for other formats (already includes timezone)
        return new Date(timestamp);
    }

    // Format date for display (Indian timezone)
    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        const date = this.parseISTTimestamp(dateString);
        
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata'
        });
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Hash password (simple client-side hashing - in production use proper server-side hashing)
    static async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Local storage helpers
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // Add loading state to button
    static setButtonLoading(button, loading = true) {
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    // Shuffle array
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Add animation class and remove after animation
    static addAnimation(element, animationClass, duration = 1000) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }

    // Check if current time is between start and end times (IST)
    static isTimeInRange(startTime, endTime) {
        const now = new Date();
        const start = this.parseISTTimestamp(startTime);
        const end = this.parseISTTimestamp(endTime);
        return now >= start && now <= end;
    }

    // Calculate time remaining until exam end (IST)
    static getTimeRemaining(endTime) {
        const now = new Date();
        const end = this.parseISTTimestamp(endTime);
        const difference = end - now;
        
        if (difference <= 0) return 0;
        
        return Math.floor(difference / 1000); // Return seconds
    }

    // Escape HTML to prevent XSS
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create element with attributes
    static createElement(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    // Auto-save functionality
    static createAutoSave(dataGetter, interval = 30000) {
        return setInterval(() => {
            const data = dataGetter();
            if (data) {
                this.setLocalStorage('auto_save', {
                    data: data,
                    timestamp: Date.now()
                });
            }
        }, interval);
    }

    // Clear auto-save
    static clearAutoSave() {
        this.removeLocalStorage('auto_save');
    }

    // Get auto-save data
    static getAutoSave() {
        const autoSave = this.getLocalStorage('auto_save');
        if (autoSave && (Date.now() - autoSave.timestamp) < 300000) { // 5 minutes
            return autoSave.data;
        }
        return null;
    }

    // Show loading screen with animation
    static showLoadingScreen(type = 'login', message = 'Loading', subMessage = '') {
        const existingOverlay = document.getElementById('loadingOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';

        let animationHTML = '';
        
        if (type === 'exam') {
            animationHTML = `
                <div class="exam-joining-animation">
                    <div class="exam-paper">
                        <div class="exam-header"></div>
                        <div class="exam-questions">
                            <div class="exam-question"></div>
                            <div class="exam-question"></div>
                            <div class="exam-question"></div>
                            <div class="exam-question"></div>
                        </div>
                        <div class="exam-checkmark"></div>
                    </div>
                </div>
            `;
        } else {
            animationHTML = `
                <div class="paper-pencil-animation">
                    <div class="paper">
                        <div class="paper-lines">
                            <div class="paper-line"></div>
                            <div class="paper-line"></div>
                            <div class="paper-line"></div>
                        </div>
                    </div>
                    <div class="pencil">
                        <div class="pencil-tip"></div>
                    </div>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div class="loading-container">
                ${animationHTML}
                <div class="loading-text">${message}<span class="loading-dots"></span></div>
                ${subMessage ? `<div class="loading-subtext">${subMessage}</div>` : ''}
                <div class="loading-progress">
                    <div class="loading-progress-bar"></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
    }

    // Hide loading screen
    static hideLoadingScreen(delay = 500) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('removing');
                setTimeout(() => {
                    overlay.remove();
                }, 500);
            }, delay);
        }
    }
}

// Make Utils available globally
window.Utils = Utils;