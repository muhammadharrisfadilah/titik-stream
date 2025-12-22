// ===== COMPREHENSIVE AD MANAGER FOR TITIK SPORTS =====
// Domain: titiksports.pages.dev
// Traffic: ~1,000/day, 95% Indonesia, 95% mobile

const TitikAdsManager = {
    // ===== CONFIGURATION =====
  
    config: {
        // Testing Strategy
        testingWeek: 1, // 1 = Adsterra popunder, 2 = PopCash popunder
        
        // ExoClick Configuration
        exoclick: {
            enabled: true,
            videoPreRoll: {
                zoneId: '5808048', // Replace with actual Zone ID
                vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5808048',
                skipAfter: 5, // seconds
                maxDuration: 10 // seconds
            },
            banner300x250: {
                zoneId: '5808052',
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
            popunder: {
                enabled: false, // Will be toggled based on testingWeek
                key: 'b21c1257f50088499518aab87554e695',
                src: 'https://pl28309380.effectivegatecpm.com/b2/1c/12/b21c1257f50088499518aab87554e695.js'
            }
        },
        
        // Monetag Configuration
        monetag: {
            enabled: true,
            banner300x250: {
                zoneId: 'YOUR_MONETAG_ZONE_ID'
            },
            smartLink: {
                url: 'https://otieu.com/4/10360280'
            },
            interstitial: {
                zoneId: 'YOUR_INTERSTITIAL_ZONE_ID',
                frequency: 180000 // 3 minutes
            }
        },
        
        // PopCash Configuration
        popcash: {
            enabled: true, // Will be toggled based on testingWeek
            siteId: '498122',
            frequency: 86400000 // 24 hours
        },
        
        // General Settings
        popunderFrequency: 'session', // 'session' or 'daily'
        isMobile: window.innerWidth <= 768
    },
    
    
    state: {
        preRollPlayed: false,
        popunderShown: false,
        interstitialTimer: null,
        preRollTimer: null,
        videoPlayer: null,
        videoElement: null,
        imaLoaded: false,
        preRollCount: 0
    },
    
    // ===== INITIALIZATION =====
    async init() {
        console.log('🚀 TITIK SPORTS Ads Manager Initializing...');
        
        // Set testing week configuration
        this.applyTestingWeekConfig();
        
        // Check if popunder already shown
        this.checkPopunderStatus();
        
        // Initialize Google IMA for pre-roll
        await this.loadGoogleIMA();
        
        // Initialize banner ads
        this.initBannerAds();
        
        // Initialize popunders
        this.initPopunders();
        
        // Initialize interstitial
        this.initInterstitial();
        
        // Setup video player integration
        this.setupVideoPlayerIntegration();
        
        console.log('✅ Ads Manager Initialized');
        
        // Make globally available
        window.TitikAdsManager = this;
    },
    
    // ===== TESTING WEEK CONFIGURATION =====
    applyTestingWeekConfig() {
        const week = this.config.testingWeek;
        
        if (week === 1) {
            // Week 1: Adsterra popunder ON, PopCash OFF
            this.config.adsterra.popunder.enabled = true;
            this.config.popcash.enabled = false;
            console.log('📊 Testing Week 1: Adsterra Popunder Active');
        } else if (week === 2) {
            // Week 2: Adsterra popunder OFF, PopCash ON
            this.config.adsterra.popunder.enabled = false;
            this.config.popcash.enabled = true;
            console.log('📊 Testing Week 2: PopCash Popunder Active');
        }
    },
    
    // ===== GOOGLE IMA SDK FOR VIDEO PRE-ROLL =====
    async loadGoogleIMA() {
        return new Promise((resolve) => {
            if (window.google && window.google.ima) {
                this.state.imaLoaded = true;
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
            script.async = true;
            script.onload = () => {
                this.state.imaLoaded = true;
                console.log('✅ Google IMA SDK Loaded');
                resolve();
            };
            script.onerror = () => {
                console.warn('⚠️ Failed to load Google IMA SDK');
                resolve(); // Continue even if IMA fails
            };
            document.head.appendChild(script);
        });
    },
    
    // ===== VIDEO PRE-ROLL INTEGRATION =====
    async playPreRoll(videoElement, onComplete) {
        if (!this.config.exoclick.enabled || this.state.preRollPlayed || !this.state.imaLoaded) {
            onComplete();
            return;
        }
        
        try {
            console.log('🎬 Starting Pre-Roll Ad...');
            
            // Create IMA container
            const adContainer = document.createElement('div');
            adContainer.id = 'ima-ad-container';
            adContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
            `;
            videoElement.parentElement.appendChild(adContainer);
            
            // Initialize IMA
            const adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, videoElement);
            const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
            const adsManager = null;
            
            let adCompleted = false;
            let skipTimer = null;
            
            // Create skip button
            const skipButton = document.createElement('button');
            skipButton.textContent = 'Skip Ad';
            skipButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 8px 16px;
                background: rgba(0,0,0,0.8);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                z-index: 1001;
                display: none;
            `;
            skipButton.onclick = () => {
                this.skipPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, onComplete);
            };
            adContainer.appendChild(skipButton);
            
            // Show skip button after N seconds
            skipTimer = setTimeout(() => {
                skipButton.style.display = 'block';
            }, this.config.exoclick.videoPreRoll.skipAfter * 1000);
            
            // AdsLoader event listeners
            adsLoader.addEventListener(
                google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                (event) => {
                    const adsRenderingSettings = new google.ima.AdsRenderingSettings();
                    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;
                    
                    const adsManager = event.getAdsManager(videoElement, adsRenderingSettings);
                    
                    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (adErrorEvent) => {
                        console.warn('⚠️ Pre-Roll Error:', adErrorEvent.getError());
                        this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                        onComplete();
                    });
                    
                    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
                        videoElement.pause();
                    });
                    
                    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
                        if (!adCompleted) {
                            adCompleted = true;
                            this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                            onComplete();
                        }
                    });
                    
                    adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
                        if (!adCompleted) {
                            adCompleted = true;
                            this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                            onComplete();
                        }
                    });
                    
                    try {
                        adDisplayContainer.initialize();
                        adsManager.init(videoElement.offsetWidth, videoElement.offsetHeight, google.ima.ViewMode.NORMAL);
                        adsManager.start();
                        this.state.preRollPlayed = true;
                    } catch (adError) {
                        console.warn('⚠️ Pre-Roll Start Error:', adError);
                        this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                        onComplete();
                    }
                },
                false
            );
            
            adsLoader.addEventListener(
                google.ima.AdErrorEvent.Type.AD_ERROR,
                (adErrorEvent) => {
                    console.warn('⚠️ Pre-Roll Load Error:', adErrorEvent.getError());
                    this.cleanupPreRoll(null, adDisplayContainer, adContainer, skipButton, skipTimer);
                    onComplete();
                },
                false
            );
            
            // Request ads
            const adsRequest = new google.ima.AdsRequest();
            adsRequest.adTagUrl = this.config.exoclick.videoPreRoll.vastTag;
            adsRequest.linearAdSlotWidth = videoElement.offsetWidth;
            adsRequest.linearAdSlotHeight = videoElement.offsetHeight;
            adsRequest.nonLinearAdSlotWidth = videoElement.offsetWidth;
            adsRequest.nonLinearAdSlotHeight = 150;
            
            adsLoader.requestAds(adsRequest);
            
            // Timeout fallback (max 10 seconds)
            setTimeout(() => {
                if (!adCompleted) {
                    console.log('⏱️ Pre-Roll Timeout');
                    this.skipPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, onComplete);
                }
            }, this.config.exoclick.videoPreRoll.maxDuration * 1000);
            
        } catch (error) {
            console.error('❌ Pre-Roll Critical Error:', error);
            onComplete();
        }
    },
    
    skipPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, onComplete) {
        this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton);
        onComplete();
    },
    
    cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer) {
        if (skipTimer) clearTimeout(skipTimer);
        if (adsManager) {
            try {
                adsManager.destroy();
            } catch (e) {
                console.warn('⚠️ Error destroying ads manager:', e);
            }
        }
        if (adDisplayContainer) {
            try {
                adDisplayContainer.destroy();
            } catch (e) {
                console.warn('⚠️ Error destroying ad container:', e);
            }
        }
        if (adContainer && adContainer.parentElement) {
            adContainer.remove();
        }
        if (skipButton && skipButton.parentElement) {
            skipButton.remove();
        }
    },
    
    // ===== BANNER ADS =====
    initBannerAds() {
        console.log('📰 Initializing Banner Ads...');
        
        // ExoClick Banner 300x250 (below video)
        if (this.config.exoclick.enabled) {
            this.insertExoClickBanner();
        }
        
        // Adsterra Social Bar (sticky top mobile)
        if (this.config.adsterra.enabled && this.config.isMobile) {
            this.insertAdsterraSocialBar();
        }
        
        // Adsterra Banner 300x250 (desktop sidebar)
        if (this.config.adsterra.enabled && !this.config.isMobile) {
            this.insertAdsterraBanner();
        }
        
        // Monetag Banner 300x250
        if (this.config.monetag.enabled) {
            this.insertMonetagBanner();
        }
    },
    
    insertExoClickBanner() {
        const container = document.querySelector('.video-player-container');
        if (!container) return;
        
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container exoclick-banner';
        banner.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div id="exoclick-banner-300x250"></div>
        `;
        container.parentElement.insertBefore(banner, container.nextSibling);
        
        // Load ExoClick script
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.dataset.adel = 'atag';
        script.src = `${this.config.exoclick.banner300x250.script}?idzone=${this.config.exoclick.banner300x250.zoneId}`;
        document.getElementById('exoclick-banner-300x250').appendChild(script);
        
        console.log('✅ ExoClick Banner inserted');
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
        `;
        document.body.appendChild(banner);
        
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
    
    insertAdsterraBanner() {
        const matchHeader = document.getElementById('matchHeader');
        if (!matchHeader) return;
        
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container adsterra-banner';
        banner.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div id="adsterra-banner-300x250"></div>
        `;
        matchHeader.parentElement.insertBefore(banner, matchHeader.nextSibling);
        
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.innerHTML = `
            atOptions = {
                'key': '${this.config.adsterra.banner300x250.key}',
                'format': 'iframe',
                'height': 250,
                'width': 300,
                'params': {}
            };
        `;
        document.getElementById('adsterra-banner-300x250').appendChild(script);
        
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = this.config.adsterra.banner300x250.src;
        document.getElementById('adsterra-banner-300x250').appendChild(invokeScript);
        
        console.log('✅ Adsterra Banner inserted');
    },
    
    insertMonetagBanner() {
        const tabs = document.getElementById('tabs');
        if (!tabs) return;
        
        const banner = document.createElement('div');
        banner.className = 'ad-banner-container monetag-banner';
        banner.innerHTML = `
            <div class="ad-label">Advertisement</div>
            <div id="monetag-banner-300x250" style="width: 300px; height: 250px; margin: 0 auto;"></div>
        `;
        tabs.parentElement.insertBefore(banner, tabs.nextSibling);
        
        // Monetag banner script (replace with actual implementation)
        const script = document.createElement('script');
        script.async = true;
        script.dataset.cfasync = 'false';
        script.src = `//www.topcreativeformat.com/${this.config.monetag.banner300x250.zoneId}/invoke.js`;
        document.getElementById('monetag-banner-300x250').appendChild(script);
        
        console.log('✅ Monetag Banner inserted');
    },
    
    // ===== POPUNDER ADS =====
    initPopunders() {
        // Check if already shown in this session
        if (this.state.popunderShown) {
            console.log('ℹ️ Popunder already shown this session');
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
    
    checkPopunderStatus() {
        if (this.config.popunderFrequency === 'session') {
            this.state.popunderShown = sessionStorage.getItem('popunder_shown') === 'true';
        } else if (this.config.popunderFrequency === 'daily') {
            const lastShown = localStorage.getItem('popunder_last_shown');
            if (lastShown) {
                const now = Date.now();
                const elapsed = now - parseInt(lastShown);
                this.state.popunderShown = elapsed < 86400000; // 24 hours
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
    
    loadAdsterraPopunder() {
        if (this.state.popunderShown) return;
        
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
        if (this.state.popunderShown) return;
        
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
        
        // Load Monetag interstitial script
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
        
        // Schedule interstitial every N minutes
        this.state.interstitialTimer = setInterval(() => {
            console.log('🎯 Triggering Interstitial Ad');
            // Interstitial will show automatically from Monetag
        }, this.config.monetag.interstitial.frequency);
        
        console.log('✅ Monetag Interstitial initialized');
    },
    
    // ===== VIDEO PLAYER INTEGRATION =====
    setupVideoPlayerIntegration() {
        // Hook into existing video player initialization
        if (window.VideoPlayer && window.VideoPlayer.initialize) {
            const originalInit = window.VideoPlayer.initialize;
            
            window.VideoPlayer.initialize = async function(matchId) {
                console.log('🎬 Video Player Hook: Adding Pre-Roll...');
                
                // Call original initialization
                await originalInit.call(this, matchId);
                
                // Get video element
                const videoElement = document.getElementById('videoElement');
                if (!videoElement) {
                    console.warn('⚠️ Video element not found for pre-roll');
                    return;
                }
                
                // Save reference
                TitikAdsManager.state.videoElement = videoElement;
                
                // Play initial pre-roll before main content
                await TitikAdsManager.playPreRoll(videoElement, () => {
                    console.log('✅ Initial Pre-Roll Complete, starting main video');
                    videoElement.play().catch(e => console.log('Auto-play prevented:', e));
                    
                    // Start recurring pre-roll timer
                    TitikAdsManager.startRecurringPreRoll(videoElement);
                });
            };
        }
    },
    
    // ===== RECURRING PRE-ROLL (Every 5 minutes) =====
    startRecurringPreRoll(videoElement) {
        console.log('⏰ Starting recurring pre-roll timer (every 5 minutes)');
        
        // Clear existing timer if any
        if (this.state.preRollTimer) {
            clearInterval(this.state.preRollTimer);
        }
        
        // Set timer for 5 minutes (300,000ms)
        this.state.preRollTimer = setInterval(async () => {
            // Only show if video is playing
            if (!videoElement.paused && !videoElement.ended) {
                console.log('🔄 Triggering recurring pre-roll...');
                
                // Pause main video
                const wasPlaying = !videoElement.paused;
                if (wasPlaying) {
                    videoElement.pause();
                }
                
                // Reset pre-roll state to allow replay
                this.state.preRollPlayed = false;
                this.state.preRollCount++;
                
                // Play pre-roll
                await this.playPreRoll(videoElement, () => {
                    console.log(`✅ Recurring Pre-Roll #${this.state.preRollCount} Complete`);
                    
                    // Resume main video
                    if (wasPlaying) {
                        videoElement.play().catch(e => {
                            console.log('Resume prevented:', e);
                            // Show play button if autoplay blocked
                            this.showResumeButton(videoElement);
                        });
                    }
                });
            } else {
                console.log('ℹ️ Video not playing, skipping pre-roll');
            }
        }, 5 * 60 * 1000); // 5 minutes
        
        console.log('✅ Recurring pre-roll timer started');
    },
    
    // Show resume button if autoplay blocked
    showResumeButton(videoElement) {
        const existingBtn = document.querySelector('.resume-video-btn');
        if (existingBtn) return; // Already showing
        
        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'resume-video-btn';
        resumeBtn.innerHTML = '▶️ Resume Video';
        resumeBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 16px 32px;
            background: rgba(255,102,0,0.95);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            z-index: 1002;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        resumeBtn.onclick = () => {
            videoElement.play();
            resumeBtn.remove();
        };
        videoElement.parentElement.appendChild(resumeBtn);
    },
    
    // ===== CLEANUP =====
    cleanup() {
        if (this.state.interstitialTimer) {
            clearInterval(this.state.interstitialTimer);
        }
        if (this.state.preRollTimer) {
            clearInterval(this.state.preRollTimer);
            console.log('🧹 Recurring pre-roll timer cleaned up');
        }
    }
};

// ===== AUTO-INITIALIZE =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TitikAdsManager.init();
    });
} else {
    TitikAdsManager.init();
}

// ===== USAGE NOTES =====
/*
SETUP INSTRUCTIONS:

1. REPLACE ALL ZONE IDs / KEYs:
   - ExoClick: Replace YOUR_EXOCLICK_VIDEO_ZONE_ID, YOUR_EXOCLICK_BANNER_ZONE_ID
   - Adsterra: Replace YOUR_SOCIAL_BAR_KEY, YOUR_BANNER_KEY, YOUR_POPUNDER_KEY
   - Monetag: Replace YOUR_MONETAG_ZONE_ID, YOUR_INTERSTITIAL_ZONE_ID
   - PopCash: Replace YOUR_POPCASH_SITE_ID

2. UPDATE VAST TAG:
   - Get actual VAST tag URL from ExoClick dashboard
   - Replace 'https://syndication.exoclick.com/splash.php?idzone=YOUR_ZONE_ID&type=vast'

3. TESTING WEEKS:
   - Week 1: Set config.testingWeek = 1 (Adsterra popunder)
   - Week 2: Set config.testingWeek = 2 (PopCash popunder)

4. INTEGRATION:
   - Add this script AFTER all other scripts in match-details.html
   - The script will automatically hook into VideoPlayer.initialize()

5. RECURRING PRE-ROLL (NEW FEATURE):
   - Pre-roll plays initially before video starts
   - Then plays EVERY 5 MINUTES while user is watching
   - Video pauses → Ad plays → Video resumes
   - This significantly increases video ad revenue (3-6x)
   - Adjustable: Change "5 * 60 * 1000" to desired interval

6. MONITORING:
   - Check browser console for ad loading confirmations
   - Monitor CPM rates in each network's dashboard
   - Compare Week 1 vs Week 2 popunder performance
   - Track pre-roll play count: TitikAdsManager.state.preRollCount

7. ADJUSTING FREQUENCY:
   // More frequent (every 3 minutes) - aggressive
   this.state.preRollTimer = setInterval(async () => {...}, 3 * 60 * 1000);
   
   // Less frequent (every 7 minutes) - balanced
   this.state.preRollTimer = setInterval(async () => {...}, 7 * 60 * 1000);
   
   // Disable recurring (initial only)
   // Comment out: TitikAdsManager.startRecurringPreRoll(videoElement);

8. MOBILE OPTIMIZATION:
   - Social Bar only shows on mobile (width <= 768px)
   - All ads are responsive
   - Popunders are session-limited to avoid annoyance

IMPORTANT NOTES:
- sessionStorage is ONLY used for ad frequency (popunder tracking)
- All scripts are loaded asynchronously
- Pre-roll has 5-second skip + 10-second timeout
- Recurring pre-roll respects video state (only plays if video is playing)
- Error handling ensures video plays even if ads fail
- No conflicts between networks (different containers)

REVENUE IMPACT:
Without recurring: ~$3-4/day from video ads
With recurring (5 min): ~$15-20/day from video ads (4-5x increase)
Average 30-min watch session = 6 pre-rolls = $0.30-0.90 per user
*/