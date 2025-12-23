// ===== INDEX ADS MANAGER - TITIK SPORTS HOMEPAGE =====
// For: index.html (match list page)
// Traffic: ~1,000 visitors/day, 95% mobile, 95% Indonesia

const IndexAdsManager = {
    // ===== CONFIGURATION =====
    config: {
        // Testing Strategy
        testingWeek: 1, // 1 = Adsterra popunder, 2 = PopCash popunder
        
        // ExoClick Configuration
        exoclick: {
            enabled: true,
            banner300x250: {
                zoneId: 'YOUR_EXOCLICK_BANNER_ZONE_ID',
                script: 'https://a.exoclick.com/tag_gen.js'
            },
            banner728x90: {
                zoneId: '5808054',
                script: 'https://a.exoclick.com/tag_gen.js'
            }
        },
        
        // Adsterra Configuration
        adsterra: {
            enabled: true,
          
            popunder: {
                enabled: false, // Auto-managed by testingWeek
                key: 'fe017b7e181ae09745827246c3e1df88',
                src: 'https://pl28309446.effectivegatecpm.com/fe/01/7b/fe017b7e181ae09745827246c3e1df88.js'
            }
        },
        
        // Monetag Configuration
        monetag: {
            enabled: true,
        
            smartLink: {
                url: 'https://otieu.com/4/10360280',
                clicksRequired: 2
            },
        },
        
        // PopCash Configuration
        popcash: {
            enabled: true, // Auto-managed by testingWeek
            siteId: '749996',
            frequency: 86400000 // 24 hours
        },
        
        
        // General Settings
        isMobile: window.innerWidth <= 768,
        popunderFrequency: 'session' // 'session' or 'daily'
    },
    
    state: {
        popunderShown: false,
        interstitialTimer: null,
        clickCount: 0,
        lastClickTime: 0,
        clickResetTimer: null,
        stickyBannerShown: false,
        nativeAdsInserted: 0
    },
    
    // ===== INITIALIZATION =====
    init() {
        console.log('🚀 TITIK SPORTS Index Ads Manager Initializing...');
        
        // Apply testing week configuration
        this.applyTestingWeekConfig();
        
        // Check popunder status
        this.checkPopunderStatus();
        
        // Initialize banner ads
        
        // Initialize native ads (in-feed)
        
        // Initialize popunders
        this.initPopunders();
        
        // Setup smartlink click interceptor
        this.setupSmartlinkInterceptor();
        
        console.log('✅ Index Ads Manager Initialized');
        
        // Make globally available
        window.IndexAdsManager = this;
    },
    
    // ===== TESTING WEEK CONFIGURATION =====
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
    
    // ===== BANNER ADS =====
    
    insertAdsterraSocialBar() {
        const banner = document.createElement('div');
        banner.id = 'adsterra-social-bar';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(banner);
        document.body.style.paddingTop = '50px';
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = `
            atOptions = {
                'key': '${this.config.adsterra.socialBar.key}',
                'format': 'iframe',
                'height': 50,
                'width': 320,
                'params': {}
            };
        `;
        banner.appendChild(script);
        
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = this.config.adsterra.socialBar.src;
        banner.appendChild(invokeScript);
        
        console.log('✅ Adsterra Social Bar inserted');
    },
    
    
    
    // ===== POPUNDER ADS =====
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
        
        // Adsterra Popunder (Week 1)
        if (this.config.adsterra.popunder.enabled) {
            this.loadAdsterraPopunder();
        }
        
        // PopCash Popunder (Week 2)
        if (this.config.popcash.enabled) {
            this.loadPopCashPopunder();
        }
    },
    
    loadAdsterraPopunder() {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = `
            atOptions = {
                'key': '${this.config.adsterra.popunder.key}',
                'format': 'iframe',
                'height': 600,
                'width': 1000,
                'params': {}
            };
        `;
        document.body.appendChild(script);
        
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = this.config.adsterra.popunder.src;
        invokeScript.onload = () => {
            this.markPopunderShown();
            console.log('✅ Adsterra Popunder loaded');
        };
        document.body.appendChild(invokeScript);
    },
    
    loadPopCashPopunder() {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = `
            var _pop = _pop || [];
            _pop.push(['siteId', ${this.config.popcash.siteId}]);
            _pop.push(['minBid', 0]);
            _pop.push(['popundersPerIP', 1]);
            _pop.push(['delayBetween', 0]);
            _pop.push(['default', false]);
            _pop.push(['defaultPerDay', 0]);
            _pop.push(['topmostLayer', !0]);
            (function() {
                var pa = document.createElement('script'); pa.type = 'text/javascript'; pa.async = true;
                var s = document.getElementsByTagName('script')[0]; 
                pa.src = '//c1.popads.net/pop.js';
                pa.onerror = function() {console.warn('PopCash load error');};
                s.parentNode.insertBefore(pa, s);
            })();
        `;
        script.onload = () => {
            this.markPopunderShown();
            console.log('✅ PopCash Popunder loaded');
        };
        document.body.appendChild(script);
    },
    
    
    // ===== SMARTLINK CLICK INTERCEPTOR =====
    setupSmartlinkInterceptor() {
        if (!this.config.monetag.smartLink.url) return;
        
        // Intercept match item clicks
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
        
        // Reset counter if timeout passed
        if (now - this.state.lastClickTime > 5 * 60 * 1000) {
            this.state.clickCount = 0;
        }
        
        this.state.lastClickTime = now;
        this.state.clickCount++;
        
        console.log(`📊 Click count: ${this.state.clickCount}/${config.clicksRequired}`);
        
        // First N-1 clicks: Show smartlink, block navigation
        if (this.state.clickCount < config.clicksRequired) {
            this.openSmartlink();
            this.showClickNotification(this.state.clickCount);
            return;
        }
        
        // Nth click: Show smartlink + navigate
        if (this.state.clickCount === config.clicksRequired) {
            this.openSmartlink();
            this.showClickNotification(this.state.clickCount);
            
            setTimeout(() => {
                callback();
                this.scheduleClickReset();
            }, 1500);
            return;
        }
        
        // Subsequent clicks: Direct navigation
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
    
    // ===== CLEANUP =====
    cleanup() {
        if (this.state.interstitialTimer) {
            clearInterval(this.state.interstitialTimer);
        }
        if (this.state.clickResetTimer) {
            clearTimeout(this.state.clickResetTimer);
        }
    }
};

// ===== AUTO-INITIALIZE =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        IndexAdsManager.init();
    });
} else {
    IndexAdsManager.init();
}

// Make globally available
window.IndexAdsManager = IndexAdsManager;

// ===== USAGE NOTES =====
/*
SETUP INSTRUCTIONS FOR INDEX.HTML:

1. REPLACE ALL ZONE IDs / KEYs:
   ExoClick:
   - Banner 300x250 Zone ID
   - Leaderboard 728x90 Zone ID (desktop)
   
   Adsterra:
   - Social Bar Key
   - Banner 300x250 Key
   - Native Banner Key
   - Popunder Key
   
   Monetag:
   - Banner 300x250 Zone ID
   - Interstitial Zone ID
   - Smart Link URL
   
   PopCash:
   - Site ID

2. INTEGRATION:
   - Add this script at the END of index.html (before </body>)
   - After all other scripts have loaded

3. AD POSITIONS:
   - Social Bar: Fixed top (mobile)
   - Leaderboard 728x90: Below header (desktop)
   - Banner 300x250: After date navigation
   - Monetag Banner: After filter tabs
   - Native Ads: Every 4 league sections
   - Sticky Banner: Bottom (after 3 seconds)
   - Popunder: On page load (1x per session)
   - Interstitial: Every 4 minutes

4. TESTING:
   - Week 1: testingWeek = 1 (Adsterra popunder)
   - Week 2: testingWeek = 2 (PopCash popunder)

5. EXPECTED REVENUE (1,000 visitors/day):
   - Social Bar: $1.00/day
   - Banners (3-5): $3-5/day
   - Native Ads (in-feed): $2-3/day
   - Popunder: $4-6/day
   - Interstitial: $1-2/day
   - Smartlink: $0.50-1/day
   ────────────────────────
   Total: $11.50-18/day
   Monthly: $345-540

IMPORTANT:
- Native ads insert automatically after matches load
- Smartlink requires 2 clicks before navigation
- Popunder limited to once per session
- All ads are mobile responsive
- No localStorage for app data (only ad frequency)
*/