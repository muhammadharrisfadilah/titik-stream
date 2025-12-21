// ===== UPGRADED ADS MANAGER - MORE REVENUE 💰 =====

const IndexAdsManager = {
    state: {
        clickCount: 0,
        lastClickTime: 0,
        lastInterstitialTime: 0,
        clickResetTimer: null,
        bannerRefreshTimers: [],
        stickyBannerShown: false
    },
    
    // Initialize ads system
    init() {
        if (!IndexConfig.ads.enabled) {
            IndexConfig.log.info('⚠️ Ads disabled in config');
            return;
        }
        
        IndexConfig.log.info('💰 Upgraded Ads Manager initialized');
        
        this.initInterstitialAd();
        this.setupClickInterceptor();
        this.scheduleStickyBanner();
        
        // Make globally available
        window.IndexAdsManager = this;
    },
    
    // ===== SMARTLINK SYSTEM (2-3 CLICK) =====
    setupClickInterceptor() {
        this.checkAndHandleClick = (callback) => {
            const now = Date.now();
            const config = IndexConfig.ads.smartlink;
            
            // Reset counter if timeout passed
            if (now - this.state.lastClickTime > config.resetTimeout) {
                this.state.clickCount = 0;
            }
            
            this.state.lastClickTime = now;
            this.state.clickCount++;
            
            IndexConfig.log.info(`📊 Click count: ${this.state.clickCount}/${config.clicksRequired}`);
            
            // First N-1 clicks: Show smartlink, block navigation
            if (this.state.clickCount < config.clicksRequired) {
                this.openSmartlink();
                this.showClickNotification(this.state.clickCount);
                return false;
            }
            
            // Nth click: Show smartlink + navigate with delay
            else if (this.state.clickCount === config.clicksRequired) {
                this.openSmartlink();
                this.showClickNotification(this.state.clickCount);
                
                setTimeout(() => {
                    IndexConfig.log.info('🚀 Executing navigation');
                    callback();
                    this.scheduleReset();
                }, 1500);
                
                return false;
            }
            
            // Subsequent clicks: Direct navigation
            else {
                IndexConfig.log.info('✅ Direct navigation');
                callback();
                return true;
            }
        };
    },
    
    openSmartlink() {
        const url = IndexConfig.ads.smartlink.url;
        const newWindow = window.open(url, '_blank');
        
        // Fallback if popup blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            IndexConfig.log.warn('⚠️ Popup blocked, trying alternative');
            window.location.href = url;
        }
    },
    
    scheduleReset() {
        if (this.state.clickResetTimer) {
            clearTimeout(this.state.clickResetTimer);
        }
        
        this.state.clickResetTimer = setTimeout(() => {
            IndexConfig.log.info('🔄 Resetting click counter');
            this.state.clickCount = 0;
        }, IndexConfig.ads.smartlink.resetTimeout);
    },
    
    showClickNotification(clickCount) {
        const clicksRequired = IndexConfig.ads.smartlink.clicksRequired;
        const remaining = clicksRequired - clickCount;
        
        let message;
        if (remaining > 0) {
            message = `📢 Please click ${remaining} more time${remaining > 1 ? 's' : ''} to continue`;
        } else {
            message = '✅ Loading...';
        }
        
        this.showToast(message);
    },
    
    showToast(message) {
        if (typeof window.IndexHelpers !== 'undefined' && window.IndexHelpers.showToast) {
            window.IndexHelpers.showToast(message, 'info', 2000);
        } else {
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.textContent = message;
            toast.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        }
    },
    
    // ===== BANNER ADS =====
    createBanner(type = 'adsterra1') {
        const config = type === 'adsterra1' ? 
                      IndexConfig.ads.adsterra1 : 
                      IndexConfig.ads.adsterra2;
        
        const container = document.createElement('div');
        container.className = `ad-banner-container ad-${type}`;
        container.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div class="ad-content"></div>
        `;
        
        setTimeout(() => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.innerHTML = `
                atOptions = {
                    'key': '${config.key}',
                    'format': '${config.format}',
                    'height': ${config.height},
                    'width': ${config.width},
                    'params': {}
                };
            `;
            container.appendChild(script);
            
            const invokeScript = document.createElement('script');
            invokeScript.type = 'text/javascript';
            invokeScript.src = config.src;
            container.appendChild(invokeScript);
        }, 100);
        
        return container;
    },
    
    insertBanner(targetSelector, position = 'before', adType = 'adsterra1') {
        const target = document.querySelector(targetSelector);
        if (!target) {
            IndexConfig.log.warn(`Target ${targetSelector} not found`);
            return null;
        }
        
        const banner = this.createBanner(adType);
        
        switch(position) {
            case 'before':
                target.parentNode.insertBefore(banner, target);
                break;
            case 'after':
                target.parentNode.insertBefore(banner, target.nextSibling);
                break;
            case 'inside-top':
                target.insertBefore(banner, target.firstChild);
                break;
            case 'inside-bottom':
                target.appendChild(banner);
                break;
        }
        
        IndexConfig.log.info(`✅ Banner ${adType} inserted ${position} ${targetSelector}`);
        return banner;
    },
    
    // ===== NATIVE ADS (IN-FEED) =====
    insertNativeAds() {
        if (!IndexConfig.ads.nativeAds.enabled) return;
        
        const frequency = IndexConfig.ads.nativeAds.frequency;
        const leagueSections = document.querySelectorAll('.league-section');
        
        if (leagueSections.length === 0) {
            IndexConfig.log.info('⏳ No league sections yet, will retry');
            setTimeout(() => this.insertNativeAds(), 500);
            return;
        }
        
        leagueSections.forEach((section, index) => {
            // Insert ad after every Nth section
            if ((index + 1) % frequency === 0 && index > 0) {
                const adType = IndexConfig.ads.nativeAds.alternateTypes && (index + 1) % (frequency * 2) === 0 
                              ? 'adsterra2' 
                              : 'adsterra1';
                
                const banner = this.createBanner(adType);
                banner.classList.add('native-ad');
                section.parentNode.insertBefore(banner, section.nextSibling);
                
                IndexConfig.log.info(`✅ Native ad inserted after league section ${index + 1}`);
            }
        });
    },
    
    // ===== STICKY BANNER (BOTTOM) =====
    scheduleStickyBanner() {
        if (!IndexConfig.ads.stickyBanner.enabled) return;
        
        setTimeout(() => {
            this.showStickyBanner();
        }, IndexConfig.ads.stickyBanner.showAfter);
    },
    
    showStickyBanner() {
        if (this.state.stickyBannerShown) return;
        
        const sticky = document.createElement('div');
        sticky.className = 'sticky-ad-banner';
        sticky.style.cssText = `
            position: fixed;
            bottom: 60px;
            left: 0;
            right: 0;
            z-index: 9998;
            background: white;
            box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
            padding: 8px;
            text-align: center;
        `;
        
        // Close button
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
        `;
        closeBtn.onclick = () => {
            sticky.style.transform = 'translateY(100%)';
            setTimeout(() => sticky.remove(), 300);
        };
        
        const banner = this.createBanner('adsterra2');
        sticky.appendChild(closeBtn);
        sticky.appendChild(banner);
        
        document.body.appendChild(sticky);
        
        // Animate in
        sticky.style.transform = 'translateY(100%)';
        sticky.style.transition = 'transform 0.3s ease';
        setTimeout(() => {
            sticky.style.transform = 'translateY(0)';
        }, 100);
        
        this.state.stickyBannerShown = true;
        IndexConfig.log.info('✅ Sticky banner shown');
    },
    
    // ===== INTERSTITIAL AD =====
    initInterstitialAd() {
        const config = IndexConfig.ads.interstitial;
        
        const script = document.createElement('script');
        script.innerHTML = `
            (function(s){
                s.dataset.zone='${config.zone}';
                s.src='${config.src}';
            })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
        `;
        document.body.appendChild(script);
        
        IndexConfig.log.info('✅ Interstitial ad initialized');
        
        this.scheduleInterstitial();
    },
    
    scheduleInterstitial() {
        const config = IndexConfig.ads.interstitial;
        
        setInterval(() => {
            const now = Date.now();
            if (now - this.state.lastInterstitialTime >= config.interval) {
                this.triggerInterstitial();
                this.state.lastInterstitialTime = now;
            }
        }, 60000); // Check every minute
    },
    
    triggerInterstitial() {
        IndexConfig.log.info('🎯 Triggering interstitial ad');
        // Interstitial will show automatically from Monetag script
    },
    
    // ===== AUTO REFRESH BANNERS =====
    startAutoRefresh() {
        if (!IndexConfig.ads.autoRefresh.enabled) return;
        
        const interval = IndexConfig.ads.autoRefresh.interval;
        
        const timer = setInterval(() => {
            const banners = document.querySelectorAll('.ad-banner-container');
            
            banners.forEach((banner, index) => {
                // Refresh by recreating
                const parent = banner.parentNode;
                const position = Array.from(parent.children).indexOf(banner);
                const adType = banner.classList.contains('ad-adsterra2') ? 'adsterra2' : 'adsterra1';
                
                banner.remove();
                
                const newBanner = this.createBanner(adType);
                newBanner.className = banner.className;
                
                if (position < parent.children.length) {
                    parent.insertBefore(newBanner, parent.children[position]);
                } else {
                    parent.appendChild(newBanner);
                }
            });
            
            IndexConfig.log.info('🔄 Banners refreshed');
        }, interval);
        
        this.state.bannerRefreshTimers.push(timer);
    },
    
    // ===== CLEANUP =====
    cleanup() {
        this.state.bannerRefreshTimers.forEach(timer => clearInterval(timer));
        this.state.bannerRefreshTimers = [];
        
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

// Make globally available
window.IndexAdsManager = IndexAdsManager;