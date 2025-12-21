// ===== ADS MANAGER - FIXED VERSION =====
// Manage all advertisements for TITIK SPORTS
// FIX: Resolve conflict dengan events.js untuk match click handling

const AdsManager = {
  config: {
    adsterra2: {
      bannerId: 'a907418138c18b5a129a4c98633e548e',
      bannerSrc: 'https://www.highperformanceformat.com/a907418138c18b5a129a4c98633e548e/invoke.js',
      smartlink: 'https://www.effectivegatecpm.com/a907418138c18b5a129a4c98633e548e'
    },
    adsterra: {
      bannerId: 'b563d06cb842eb05b6d065d74b35ee3c',
      bannerSrc: 'https://www.highperformanceformat.com/b563d06cb842eb05b6d065d74b35ee3c/invoke.js',
      smartlink: 'https://www.effectivegatecpm.com/nhm8dyzrtv?key=fab4819a7604d581a7d86b22ca149d42'
    },
    monetag: {
      interstitialZone: '10319821',
      interstitialSrc: 'https://groleegni.net/vignette.min.js',
      interstitialInterval: 3 * 60 * 1000 // 3 minutes
    }
  },

  state: {
    clickCount: 0,
    lastClickTime: 0,
    pendingNavigation: null,
    lastInterstitialTime: 0,
    clickResetTimer: null
  },

  // Initialize ads system
  init() {
    console.log('🎯 Ads Manager initialized (FIXED VERSION)');
    this.initInterstitialAd();
    this.setupClickInterceptor();
    
    // Make checkSmartlinkClick available globally for events.js
    window.AdsManager = this;
  },

  // ===== FIX: NEW APPROACH - Tidak block event, tapi intercept sebelum navigate =====
  setupClickInterceptor() {
    console.log('✅ Click interceptor setup (non-blocking)');
    
    // Expose method untuk dipanggil dari events.js
    this.checkAndHandleClick = (callback) => {
      const now = Date.now();
      
      // Reset counter jika sudah lebih dari 5 menit sejak klik terakhir
      if (now - this.state.lastClickTime > 5 * 60 * 1000) {
        this.state.clickCount = 0;
      }
      
      this.state.lastClickTime = now;
      this.state.clickCount++;
      
      console.log(`📊 Click count: ${this.state.clickCount}/2`);
      
      // Klik pertama dan kedua: Buka smartlink, tahan navigasi
      if (this.state.clickCount <= 2) {
        console.log(`🔗 Opening smartlink (${this.state.clickCount}/2)`);
        
        // Buka smartlink di tab baru
        const smartlinkWindow = window.open(this.config.adsterra.smartlink, '_blank');
        
        // Show notification
        this.showClickNotification(this.state.clickCount);
        
        // Klik kedua: Execute callback setelah delay
        if (this.state.clickCount === 2) {
          console.log('✅ Second click - will navigate after delay');
          
          setTimeout(() => {
            console.log('🚀 Executing navigation callback');
            callback();
            
            // Reset counter setelah 5 menit
            this.scheduleReset();
          }, 1500); // Delay 1.5 detik untuk UX yang lebih baik
        } else {
          // Klik pertama: Tidak navigate
          console.log('⏸️ First click - navigation blocked');
        }
        
        return false; // Return false = jangan navigate
      } 
      // Klik ketiga dan seterusnya: Navigate langsung
      else {
        console.log('✅ Click >= 3 - direct navigation allowed');
        callback();
        return true;
      }
    };
  },

  scheduleReset() {
    // Clear existing timer
    if (this.state.clickResetTimer) {
      clearTimeout(this.state.clickResetTimer);
    }
    
    // Set new timer untuk reset counter
    this.state.clickResetTimer = setTimeout(() => {
      console.log('🔄 Resetting click counter');
      this.state.clickCount = 0;
    }, 5 * 60 * 1000); // 5 menit
  },

  showClickNotification(clickCount) {
    const messages = {
      1: '📢 Please click one more time to continue',
      2: '✅ Loading match details...'
    };
    
    const message = messages[clickCount] || 'Loading...';
    
    if (typeof utils !== 'undefined' && utils.showToast) {
      utils.showToast(message, 'info', 2000);
    } else {
      // Fallback toast
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
  
  createAdsterraBanner2() {
    const container = document.createElement('div');
    container.id = 'adsterra-banner-container-2';
    container.className = 'ad-banner-container';
    container.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="adsterra-banner-2"></div>
    `;

    setTimeout(() => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : '${this.config.adsterra2.bannerId}',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      container.appendChild(script);

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = this.config.adsterra2.bannerSrc;
      container.appendChild(invokeScript);
    }, 100);

    return container;
  },

  createAdsterraBanner() {
    const container = document.createElement('div');
    container.id = 'adsterra-banner-container';
    container.className = 'ad-banner-container';
    container.innerHTML = `
      <div class="ad-label">Advertisement</div>
      <div id="adsterra-banner"></div>
    `;

    setTimeout(() => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.innerHTML = `
        atOptions = {
          'key' : '${this.config.adsterra.bannerId}',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      container.appendChild(script);

      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = this.config.adsterra.bannerSrc;
      container.appendChild(invokeScript);
    }, 100);

    return container;
  },

  // Insert banner ad at specific position
  insertBannerAd(targetSelector, position = 'before', adType = 'aads') {
    const target = document.querySelector(targetSelector);
    if (!target) {
      console.warn(`Target ${targetSelector} not found for ad insertion`);
      return;
    }

    const banner = adType === 'aads' ? 
                   this.createAdsterraBanner2() : 
                   this.createAdsterraBanner();

    if (position === 'before') {
      target.parentNode.insertBefore(banner, target);
    } else if (position === 'after') {
      target.parentNode.insertBefore(banner, target.nextSibling);
    } else if (position === 'inside-top') {
      target.insertBefore(banner, target.firstChild);
    } else if (position === 'inside-bottom') {
      target.appendChild(banner);
    }

    console.log(`✅ ${adType} banner inserted ${position} ${targetSelector}`);
  },

  // ===== INTERSTITIAL AD =====
  
  initInterstitialAd() {
    const script = document.createElement('script');
    script.innerHTML = `
      (function(s){
        s.dataset.zone='${this.config.monetag.interstitialZone}';
        s.src='${this.config.monetag.interstitialSrc}';
      })([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')));
    `;
    document.body.appendChild(script);

    console.log('✅ Monetag interstitial initialized');
    this.scheduleInterstitial();
  },

  scheduleInterstitial() {
    setInterval(() => {
      const now = Date.now();
      if (now - this.state.lastInterstitialTime >= this.config.monetag.interstitialInterval) {
        this.triggerInterstitial();
        this.state.lastInterstitialTime = now;
      }
    }, 60000); // Check every minute
  },

  triggerInterstitial() {
    console.log('🎯 Triggering interstitial ad');
  },

  // ===== PAGE-SPECIFIC AD INSERTION =====

  insertIndexPageAds(retryCount = 0) {
    const MAX_RETRIES = 5;
    
    if (retryCount >= MAX_RETRIES) {
      console.warn('⚠️ Max retries reached for ad insertion');
      return;
    }
    
    setTimeout(() => {
      const leagueSections = document.querySelectorAll('.league-section');
      
      if (leagueSections.length > 0) {
        console.log(`📊 Found ${leagueSections.length} league sections`);
        
        // Insert banner after every 3rd league section
        leagueSections.forEach((section, index) => {
          if ((index + 1) % 3 === 0) {
            // Alternating ad types for variety
            const adType = (index + 1) % 6 === 0 ? 'aads' : 'adsterra';
            this.insertBannerAd(`.league-section:nth-child(${index + 1})`, 'after', adType);
          }
        });

        console.log('✅ Index page ads inserted successfully');
      } else {
        console.log(`⏳ No league sections found, retry ${retryCount + 1}/${MAX_RETRIES}`);
        this.insertIndexPageAds(retryCount + 1);
      }
    }, 500);
  },

  insertMatchDetailAds() {
    setTimeout(() => {
      // Ad above video player
      const videoContainer = document.querySelector('.video-player-container');
      if (videoContainer) {
        this.insertBannerAd('.video-player-container', 'before', 'aads');
        console.log('✅ Ad inserted above video player');
      }

      // Ad below video player
      if (videoContainer) {
        this.insertBannerAd('.video-player-container', 'after', 'adsterra');
        console.log('✅ Ad inserted below video player');
      }

      // Ad before tabs
      const tabs = document.getElementById('tabs');
      if (tabs) {
        this.insertBannerAd('#tabs', 'before', 'aads');
        console.log('✅ Ad inserted before tabs');
      }
    }, 500);
  }
};

// ===== AUTO-INITIALIZATION =====

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AdsManager.init();
    
    const urlParams = new URLSearchParams(window.location.search);
    const isMatchDetailPage = urlParams.get('matchId') || 
                              window.location.pathname.includes('match-details');
    
    if (isMatchDetailPage) {
      AdsManager.insertMatchDetailAds();
    } else {
      AdsManager.insertIndexPageAds();
    }
  });
} else {
  AdsManager.init();
  
  const urlParams = new URLSearchParams(window.location.search);
  const isMatchDetailPage = urlParams.get('matchId') || 
                            window.location.pathname.includes('match-details');
  
  if (isMatchDetailPage) {
    AdsManager.insertMatchDetailAds();
  } else {
    AdsManager.insertIndexPageAds();
  }
}

console.log('🎯 Ads Manager loaded successfully (FIXED VERSION)');