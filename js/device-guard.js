class DeviceGuard {
    constructor() {
        this.isMobileDevice = false;
        this.initialize();
    }

    initialize() {
        this.detectDevice();
        if (this.isMobileDevice) {
            this.showBlockScreen();
        }
    }

    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipad', 'ipod', 
            'blackberry', 'windows phone', 'mobile', 'tablet',
            'silk', 'kindle', 'playbook', 'opera mini', 'opera mobi'
        ];
        
        const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        
        const isSmallScreen = screenWidth < 1024 || screenHeight < 600;
        
        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        
        const isMobileOrientation = window.matchMedia && (
            window.matchMedia('(orientation: portrait)').matches || 
            (screenWidth < screenHeight && screenWidth < 1024)
        );
        
        const hasLimitedMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
        
        const hasTouchPlatform = navigator.platform && /android|ios|iphone|ipad|ipod/i.test(navigator.platform);
        
        this.isMobileDevice = isMobileUserAgent || 
                             (isTouchDevice && hasCoarsePointer) ||
                             (isTouchDevice && isSmallScreen) ||
                             (isTouchDevice && isMobileOrientation) ||
                             (isTouchDevice && hasLimitedMemory) ||
                             hasTouchPlatform;
        
        if (userAgent.includes('ipad') || 
            (userAgent.includes('macintosh') && isTouchDevice)) {
            this.isMobileDevice = true;
        }
        
        if (userAgent.includes('mobile') || userAgent.includes('tablet')) {
            this.isMobileDevice = true;
        }
        
        if (screenWidth < 1024 && isTouchDevice) {
            this.isMobileDevice = true;
        }
    }

    showBlockScreen() {
        const blockScreen = document.createElement('div');
        blockScreen.id = 'deviceBlockScreen';
        blockScreen.className = 'device-block-screen';
        
        blockScreen.innerHTML = `
            <div class="device-block-content">
                <div class="device-block-icon">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="5" y="4" width="14" height="17" rx="2" stroke="#667eea" stroke-width="2" fill="none"/>
                        <line x1="12" y1="9" x2="12" y2="15" stroke="#e53e3e" stroke-width="2.5" stroke-linecap="round"/>
                        <circle cx="12" cy="18" r="0.5" fill="#e53e3e"/>
                    </svg>
                </div>
                <h1 class="device-block-title">Desktop Access Required</h1>
                <div class="device-block-message">
                    <p class="main-message">This examination platform is designed for desktop and laptop computers only.</p>
                    <div class="requirements-box">
                        <h3>System Requirements:</h3>
                        <ul class="requirements-list">
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="#667eea" stroke-width="2"/>
                                    <path d="M8 21h8M12 17v4" stroke="#667eea" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                Desktop or Laptop Computer
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#667eea" stroke-width="2"/>
                                    <path d="M3 9h18M9 3v18" stroke="#667eea" stroke-width="2"/>
                                </svg>
                                Minimum Screen Size: 1024px
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="9" stroke="#667eea" stroke-width="2"/>
                                    <path d="M12 6v6l4 2" stroke="#667eea" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                Modern Web Browser
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#667eea" stroke-width="2"/>
                                    <path d="M12 15v2M9 7V6a3 3 0 0 1 6 0v1" stroke="#667eea" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                Secure, Monitored Environment
                            </li>
                        </ul>
                    </div>
                    <div class="info-note">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
                            <path d="M12 8v4M12 16h.01" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <p>For exam integrity and security purposes, mobile devices and tablets are not supported. Please use a desktop or laptop computer to access your examinations.</p>
                    </div>
                </div>
                <div class="device-block-footer">
                    <p>If you believe this is an error, please contact your system administrator.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(blockScreen);
        
        document.body.style.overflow = 'hidden';
        
        window.addEventListener('resize', () => {
            this.detectDevice();
            if (!this.isMobileDevice) {
                const existingBlock = document.getElementById('deviceBlockScreen');
                if (existingBlock) {
                    existingBlock.remove();
                    document.body.style.overflow = '';
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.deviceGuard = new DeviceGuard();
    });
} else {
    window.deviceGuard = new DeviceGuard();
}
