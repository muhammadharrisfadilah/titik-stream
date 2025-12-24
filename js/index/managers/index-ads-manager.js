// ===== INDEX ADS MANAGER - FIXED VERSION =====

const IndexAdsManager = {
    config: {
        testingWeek: 1,
        exoclick: { enabled: true },
        adsterra: { enabled: true, popunder: { enabled: false } },
        monetag: { enabled: true, smartLink: { url: 'https://otieu.com/4/10360280', clicksRequired: 2 } },
        popcash: { enabled: false },
        popunderFrequency: 'session',
        isMobile: window.innerWidth <= 768
    },
    
    state: {
        popunderShown: false,
        clickCount: 0,
        lastClickTime: 0,
        clickResetTimer: null,
        nativeAdsInserted: 0
    },
    
    init() {
        console.log('🚀 TITIK SPORTS Index Ads Manager Initializing...');
        this.applyTestingWeekConfig();
        this.checkPopunderStatus();
        this.initPopunders();
        this.setupSmartlinkInterceptor();
        console.log('✅ Index Ads Manager Initialized');
        window.IndexAdsManager = this;
    },
    
    applyTestingWeekConfig() {
        const week = this.config.testingWeek;
        if (week === 1) {
            this.config.adsterra.popunder.enabled = true;
            this.config.popcash.enabled = false;
            console.log('📊 Testing Week 1: Adsterra Popunder Active');
        } else if (week === 2) {
            this.config.adsterra.popunder.enabled = false;
            this.config.popcash.enabled = true;
            console.log('📊 Testing Week 2: PopCash Popunder Active');
        }
    },
    
    checkPopunderStatus() {
        if (this.config.popunderFrequency === 'session') {
            this.state.popunderShown = sessionStorage.getItem('popunder_shown') === 'true';
        } else if (this.config.popunderFrequency === 'daily') {
            const lastShown = localStorage.getItem('popunder_last_shown');
            if (lastShown) {
                const elapsed = Date.now() - parseInt(lastShown);
                this.state.popunderShown = elapsed < 86400000;
            }
        }
    },
    
    markPopunderShown() {
        if (this.config.popunderFrequency === 'session') {
            sessionStorage.setItem('popunder_shown', 'true');
        } else if (this.config.popunderFrequency === 'daily') {
            localStorage.setItem('popunder_last_shown', Date.now().toString());
        }
        this.state.popunderShown = true;
    },
    
    initPopunders() {
        if (this.state.popunderShown) {
            console.log('ℹ️ Popunder already shown');
            return;
        }
        
        if (this.config.adsterra.popunder.enabled) {
            this.markPopunderShown();
        }
        
        if (this.config.popcash.enabled) {
            this.markPopunderShown();
        }
    },
    
    // ===== FIX: NATIVE ADS INSERTION =====
    insertNativeAds() {
        const leagueSections = document.querySelectorAll('.league-section');
        
        if (leagueSections.length === 0) {
            console.log('ℹ️ No league sections found for native ads');
            return;
        }
        
        console.log(`📰 Inserting native ads every 4 sections (${leagueSections.length} sections found)`);
        
        leagueSections.forEach((section, index) => {
            // Insert ad every 4 sections
            if ((index + 1) % 4 === 0) {
                const adContainer = document.createElement('div');
                adContainer.className = 'native-ad';
                adContainer.innerHTML = `
                    <div class="ad-label">Advertisement</div>
                    <div id="native-ad-${this.state.nativeAdsInserted}" style="min-height: 200px; background: #fafafa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">
                        Native Ad Placeholder ${this.state.nativeAdsInserted + 1}
                    </div>
                `;
                
                // Insert after current section
                section.parentNode.insertBefore(adContainer, section.nextSibling);
                this.state.nativeAdsInserted++;
            }
        });
        
        console.log(`✅ Inserted ${this.state.nativeAdsInserted} native ads`);
    },
    
    // ===== SMARTLINK CLICK INTERCEPTOR =====
    setupSmartlinkInterceptor() {
        if (!this.config.monetag.smartLink.url) return;
        
        document.addEventListener('click', (e) => {
            const matchItem = e.target.closest('.match-item');
            if (matchItem) {
                e.preventDefault();
                const matchId = matchItem.dataset.matchId;
                
                this.handleSmartlinkClick(() => {
                    window.location.href = `match-details.html?matchId=${matchId}`;
                });
            }
        });
    },
    
    handleSmartlinkClick(callback) {
        const now = Date.now();
        const config = this.config.monetag.smartLink;
        
        if (now - this.state.lastClickTime > 5 * 60 * 1000) {
            this.state.clickCount = 0;
        }
        
        this.state.lastClickTime = now;
        this.state.clickCount++;
        
        console.log(`📊 Click count: ${this.state.clickCount}/${config.clicksRequired}`);
        
        if (this.state.clickCount < config.clicksRequired) {
            this.openSmartlink();
            this.showClickNotification(this.state.clickCount);
            return;
        }
        
        if (this.state.clickCount === config.clicksRequired) {
            this.openSmartlink();
            this.showClickNotification(this.state.clickCount);
            
            setTimeout(() => {
                callback();
                this.scheduleClickReset();
            }, 1500);
            return;
        }
        
        callback();
    },
    
    openSmartlink() {
        const url = this.config.monetag.smartLink.url;
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.warn('⚠️ Popup blocked');
        }
    },
    
    scheduleClickReset() {
        if (this.state.clickResetTimer) {
            clearTimeout(this.state.clickResetTimer);
        }
        
        this.state.clickResetTimer = setTimeout(() => {
            console.log('🔄 Resetting click counter');
            this.state.clickCount = 0;
        }, 5 * 60 * 1000);
    },
    
    showClickNotification(clickCount) {
        const remaining = this.config.monetag.smartLink.clicksRequired - clickCount;
        const message = remaining > 0
            ? `📢 Click ${remaining} more time${remaining > 1 ? 's' : ''} to continue`
            : '✅ Loading...';
        
        const toast = document.createElement('div');
        toast.className = 'smartlink-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    },
    
    cleanup() {
        if (this.state.clickResetTimer) {
            clearTimeout(this.state.clickResetTimer);
        }
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        IndexAdsManager.init();
    });
} else {
    IndexAdsManager.init();
}

window.IndexAdsManager = IndexAdsManager;