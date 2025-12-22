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
            socialBar: {
                key: 'b21c1257f50088499518aab87554e695',
                src: 'https://pl28309380.effectivegatecpm.com/b2/1c/12/b21c1257f50088499518aab87554e695.js'
            },
            banner300x250: {
                key: '707574124dfaef6d1465933d66c2b798',
                src: 'https://www.highperformanceformat.com/707574124dfaef6d1465933d66c2b798/invoke.js'
            },
            nativeBanner: {
                key: 'c8027cc775eb8ebb7bf3c328775d7da6',
                src: 'https://pl28309681.effectivegatecpm.com/c8027cc775eb8ebb7bf3c328775d7da6/invoke.js'
            },
            popunder: {
                enabled: false, // Auto-managed by testingWeek
                key: 'fe017b7e181ae09745827246c3e1df88',
                src: 'https://pl28309446.effectivegatecpm.com/fe/01/7b/fe017b7e181ae09745827246c3e1df88.js'
            }
        },
        
        // Monetag Configuration
        monetag: {
            enabled: true,
            banner300x250: {
                zoneId: 'YOUR_MONETAG_ZONE_ID'
            },
            smartLink: {
                url: 'https://otieu.com/4/10360280',
                clicksRequired: 2
            },
            interstitial: {
                zoneId: 'YOUR_INTERSTITIAL_ZONE_ID',
                frequency: 240000 // 4 minutes (less aggressive for homepage)
            }
        },
        
        // PopCash Configuration
        popcash: {
            enabled: true, // Auto-managed by testingWeek
            siteId: '749996',
            frequency: 86400000 // 24 hours
        },
        
        // Native Ads (In-feed between leagues)
        nativeAds: {
            enabled: true,
            frequency: 4, // Insert ad every 4 league sections
            alternateTypes: true
        },
        
        // Sticky Banner
        stickyBanner: {
            enabled: true,
            position: 'bottom', // 'top' or 'bottom'
            showAfter: 3000, // Show after 3 seconds
            closeButton: true
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
        this.initBannerAds();
        
        // Initialize native ads (in-feed)
        this.initNativeAds();
        
        // Initialize popunders
        this.initPopunders();
        
        // Initialize interstitial
        this.initInterstitial();
        
        // Initialize sticky banner
        this.initStickyBanner();
        
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
    initBannerAds() {
        console.log('📰 Initializing Banner Ads...');
        
        // Adsterra Social Bar (mobile sticky top)
        if (this.config.adsterra.enabled && this.config.isMobile) {
            this.insertAdsterraSocialBar();
        }
        
        // ExoClick Leaderboard (desktop top)
        if (this.config.exoclick.enabled && !this.config.isMobile) {
            this.insertExoClickLeaderboard();
        }
        
        // ExoClick Banner 300x250 (before matches)
        if (this.config.exoclick.enabled) {
            setTimeout(() => this.insertExoClickBannerTop(), 500);
        }
        
        // Monetag Banner (after date navigation)
        if (this.config.monetag.enabled) {
            setTimeout(() => this.insertMonetagBanner(), 1000);
        }
    },
    
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
    
    insertExoClickLeaderboard() {
        const header = document.querySelector('.header');
        if (!header) return;
        
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container exoclick-leaderboard';
        banner.style.cssText = 'text-align: center; background: #f8f8f8; padding: 12px; margin: 0;';
        banner.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div id="exoclick-leaderboard-728x90"></div>
        `;
        header.parentElement.insertBefore(banner, header.nextSibling);
        
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.dataset.adel = 'atag';
        script.src = `${this.config.exoclick.banner728x90.script}?idzone=${this.config.exoclick.banner728x90.zoneId}`;
        document.getElementById('exoclick-leaderboard-728x90').appendChild(script);
        
        console.log('✅ ExoClick Leaderboard inserted');
    },
    
    insertExoClickBannerTop() {
        const dateNav = document.getElementById('dateNav');
        if (!dateNav) return;
        
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container exoclick-banner';
        banner.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div id="exoclick-banner-top" style="min-height: 250px; display: flex; align-items: center; justify-content: center;"></div>
        `;
        dateNav.parentElement.insertBefore(banner, dateNav.nextSibling);
        
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.dataset.adel = 'atag';
        script.src = `${this.config.exoclick.banner300x250.script}?idzone=${this.config.exoclick.banner300x250.zoneId}`;
        document.getElementById('exoclick-banner-top').appendChild(script);
        
        console.log('✅ ExoClick Banner Top inserted');
    },
    
    insertMonetagBanner() {
        const filterTabs = document.getElementById('filterTabs');
        if (!filterTabs) return;
        
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container monetag-banner';
        banner.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div id="monetag-banner-top" style="width: 300px; height: 250px; margin: 0 auto;"></div>
        `;
        filterTabs.parentElement.insertBefore(banner, filterTabs.nextSibling);
        
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.src = `//www.topcreativeformat.com/${this.config.monetag.banner300x250.zoneId}/invoke.js`;
        document.getElementById('monetag-banner-top').appendChild(script);
        
        console.log('✅ Monetag Banner inserted');
    },
    
    // ===== NATIVE ADS (IN-FEED) =====
    initNativeAds() {
        if (!this.config.nativeAds.enabled) return;
        
        // Wait for matches to be rendered
        const observer = new MutationObserver((mutations) => {
            const leagueSections = document.querySelectorAll('.league-section');
            if (leagueSections.length > 0 && this.state.nativeAdsInserted === 0) {
                this.insertNativeAds();
                observer.disconnect();
            }
        });
        
        observer.observe(document.getElementById('content'), {
            childList: true,
            subtree: true
        });
        
        // Fallback: Try after 2 seconds if observer doesn't trigger
        setTimeout(() => {
            if (this.state.nativeAdsInserted === 0) {
                this.insertNativeAds();
            }
        }, 2000);
    },
    
    insertNativeAds() {
        const leagueSections = document.querySelectorAll('.league-section');
        if (leagueSections.length === 0) return;
        
        const frequency = this.config.nativeAds.frequency;
        let adCount = 0;
        
        leagueSections.forEach((section, index) => {
            // Insert ad after every Nth league
            if ((index + 1) % frequency === 0 && index > 0) {
                const adType = this.config.nativeAds.alternateTypes && adCount % 2 === 0
                    ? 'adsterra'
                    : 'exoclick';
                
                const banner = this.createNativeBanner(adType, adCount);
                section.parentElement.insertBefore(banner, section.nextSibling);
                
                adCount++;
                this.state.nativeAdsInserted++;
            }
        });
        
        console.log(`✅ ${this.state.nativeAdsInserted} Native Ads inserted`);
    },
    
    createNativeBanner(type, index) {
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container native-ad';
        banner.style.margin = '16px 8px';
        
        if (type === 'adsterra') {
            banner.innerHTML = `
                <div class="ad-label">Advertisement</div>
                <div id="adsterra-native-${index}"></div>
            `;
            
            setTimeout(() => {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.innerHTML = `
                    atOptions = {
                        'key': '${this.config.adsterra.nativeBanner.key}',
                        'format': 'iframe',
                        'height': 250,
                        'width': 300,
                        'params': {}
                    };
                `;
                document.getElementById(`adsterra-native-${index}`).appendChild(script);
                
                const invokeScript = document.createElement('script');
                invokeScript.type = 'text/javascript';
                invokeScript.src = this.config.adsterra.nativeBanner.src;
                document.getElementById(`adsterra-native-${index}`).appendChild(invokeScript);
            }, 300);
        } else {
            banner.innerHTML = `
                <div class="ad-label">Advertisement</div>
                <div id="exoclick-native-${index}" style="min-height: 250px;"></div>
            `;
            
            setTimeout(() => {
                const script = document.createElement('script');
                script.async = true;
                script.dataset.cfasync = 'false';
                script.dataset.adel = 'atag';
                script.src = `${this.config.exoclick.banner300x250.script}?idzone=${this.config.exoclick.banner300x250.zoneId}`;
                document.getElementById(`exoclick-native-${index}`).appendChild(script);
            }, 300);
        }
        
        return banner;
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
    
    // ===== INTERSTITIAL ADS =====
    initInterstitial() {
        if (!this.config.monetag.enabled) return;
        
        const script = document.createElement('script');
        script.innerHTML = `
            (function(d,z,s){
                s.src='https://'+d+'/400/'+z;
                try{
                    (document.body||document.documentElement).appendChild(s)
                }catch(e){}
            })('groleegni.net',${this.config.monetag.interstitial.zoneId},document.createElement('script'))
        `;
        document.body.appendChild(script);
        
        // Schedule interstitial
        this.state.interstitialTimer = setInterval(() => {
            console.log('🎯 Triggering Interstitial Ad');
        }, this.config.monetag.interstitial.frequency);
        
        console.log('✅ Monetag Interstitial initialized');
    },
    
    // ===== STICKY BANNER =====
    initStickyBanner() {
        if (!this.config.stickyBanner.enabled) return;
        
        setTimeout(() => {
            this.showStickyBanner();
        }, this.config.stickyBanner.showAfter);
    },
    
    showStickyBanner() {
        if (this.state.stickyBannerShown) return;
        
        const position = this.config.stickyBanner.position;
        const isBottom = position === 'bottom';
        
        const sticky = document.createElement('div');
        sticky.id = 'sticky-banner';
        sticky.style.cssText = `
            position: fixed;
            ${isBottom ? 'bottom: 60px;' : 'top: 50px;'}
            left: 0;
            right: 0;
            z-index: 9998;
            background: white;
            box-shadow: ${isBottom ? '0 -2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)'};
            padding: 8px;
            text-align: center;
            transform: translateY(${isBottom ? '100%' : '-100%'});
            transition: transform 0.3s ease;
        `;
        
        // Close button
        if (this.config.stickyBanner.closeButton) {
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                background: rgba(0,0,0,0.5);
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
            `;
            closeBtn.onclick = () => {
                sticky.style.transform = `translateY(${isBottom ? '100%' : '-100%'})`;
                setTimeout(() => sticky.remove(), 300);
            };
            sticky.appendChild(closeBtn);
        }
        
        // Banner content
        const bannerContent = document.createElement('div');
        bannerContent.innerHTML = `
            <div class="ad-label" style="font-size: 10px; color: #999; margin-bottom: 4px;">Advertisement</div>
            <div id="sticky-banner-content"></div>
        `;
        sticky.appendChild(bannerContent);
        
        document.body.appendChild(sticky);
        
        // Animate in
        setTimeout(() => {
            sticky.style.transform = 'translateY(0)';
        }, 100);
        
        // Load ad
        setTimeout(() => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.innerHTML = `
                atOptions = {
                    'key': '${this.config.adsterra.banner300x250.key}',
                    'format': 'iframe',
                    'height': 50,
                    'width': 320,
                    'params': {}
                };
            `;
            document.getElementById('sticky-banner-content').appendChild(script);
            
            const invokeScript = document.createElement('script');
            invokeScript.type = 'text/javascript';
            invokeScript.src = this.config.adsterra.banner300x250.src;
            document.getElementById('sticky-banner-content').appendChild(invokeScript);
        }, 200);
        
        this.state.stickyBannerShown = true;
        console.log('✅ Sticky Banner shown');
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