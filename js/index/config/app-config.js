// ===== INDEX APP CONFIGURATION =====

const IndexConfig = {
    version: '2.0.0',
    
    api: {
        BASE_URL: 'https://www.fotmob.com/api',
        ENDPOINTS: {
            matches: '/data/matches',
            leagues: '/allLeagues',
            standings: '/leagues'
        },
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        TIMEZONE: 'Asia/Bangkok',
        COUNTRY_CODE: 'IDN'
    },
    
    cache: {
        MATCHES_TTL: 2 * 60 * 1000,      // 2 minutes
        LEAGUES_TTL: 30 * 60 * 1000,     // 30 minutes
        STANDINGS_TTL: 10 * 60 * 1000    // 10 minutes
    },
    
    ads: {
        // 💰 UPGRADED AD CONFIGURATION
        enabled: true,
        
        // Adsterra Banner 1 (320x50)
        adsterra1: {
            key: 'b563d06cb842eb05b6d065d74b35ee3c',
            src: 'https://www.highperformanceformat.com/b563d06cb842eb05b6d065d74b35ee3c/invoke.js',
            format: 'iframe',
            width: 320,
            height: 50
        },
        
        // Adsterra Banner 2 (468x60)
        adsterra2: {
            key: 'a907418138c18b5a129a4c98633e548e',
            src: 'https://www.highperformanceformat.com/a907418138c18b5a129a4c98633e548e/invoke.js',
            format: 'iframe',
            width: 468,
            height: 60
        },
        
        // Smartlink (untuk 2-3 click system)
        smartlink: {
            url: 'https://www.effectivegatecpm.com/nhm8dyzrtv?key=fab4819a7604d581a7d86b22ca149d42',
            clicksRequired: 2,  // Bisa diubah jadi 3 untuk lebih aggresif
            resetTimeout: 5 * 60 * 1000 // Reset after 5 minutes
        },
        
        // Monetag Interstitial
        interstitial: {
            zone: '10319821',
            src: 'https://groleegni.net/vignette.min.js',
            interval: 3 * 60 * 1000 // Show every 3 minutes
        },
        
        // Native Ads (in-feed ads between matches)
        nativeAds: {
            enabled: true,
            frequency: 4, // Insert ad every 4 league sections
            alternateTypes: true
        },
        
        // Sticky Banner (bottom of screen)
        stickyBanner: {
            enabled: true,
            showAfter: 3000, // Show after 3 seconds
            hideOnScroll: false
        },
        
        // Ad Refresh (refresh banner ads periodically)
        autoRefresh: {
            enabled: true,
            interval: 60 * 1000 // Refresh every 60 seconds
        }
    },
    
    features: {
        ENABLE_CACHE: true,
        PULL_TO_REFRESH: true,
        BACKGROUND_REFRESH: true,
        DEBUG_MODE: window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1',
        VERBOSE_LOGGING: false
    },
    
    // Helper untuk conditional logging
    log: {
        info: (...args) => {
            if (IndexConfig.features.DEBUG_MODE || IndexConfig.features.VERBOSE_LOGGING) {
                console.log(...args);
            }
        },
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args)
    }
};

// Make config globally available
window.IndexConfig = IndexConfig;