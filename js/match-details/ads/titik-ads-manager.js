// ===== COMPREHENSIVE AD MANAGER FOR TITIK SPORTS =====
// Domain: titiksports.pages.dev
// Traffic: ~1,000/day, 95% Indonesia, 95% mobile

const TitikAdsManager = {
    // ===== CONFIGURATION =====
    config: {
        // Testing Strategy
        testingWeek: 1, // 1: ExoClick, 2: Adsterra, 3: Monetag
        
        // ExoClick Configuration
        exoclick: {
            enabled: true,
            videoPreRoll: {
                zoneId: '5809154', // ← PERBAIKAN: Ganti dengan zone ID yang benar
                vastTag: 'https://s.magsrv.com/v1/vast.php?idzone=5809154', // ← PERBAIKAN: Ganti VAST tag yang benar
                skipAfter: 21, // seconds
                maxDuration: 30 // seconds (naikkan untuk video 22 detik)
            },
            banner300x250: {
                zoneId: 'YOUR_EXOCLICK_BANNER_ZONE_ID',
                script: 'https://a.exoclick.com/tag_gen.js'
            }
        },
        
        // Adsterra Configuration
        adsterra: {
            enabled: false, // Nonaktifkan sementara untuk testing Week 1
            socialBar: {
                key: 'YOUR_SOCIAL_BAR_KEY',
                src: 'https://pl23168527.profitablecpmrate.com/YOUR_KEY/invoke.js'
            }
        },
        
        // Monetag Configuration
        monetag: {
            enabled: false, // Nonaktifkan sementara untuk testing Week 1
            smartLink: {
                url: 'https://www.monetag.com/YOUR_SMARTLINK_URL'
            }
        },
        
        // PopCash Configuration
        popcash: {
            enabled: false, // Nonaktifkan sementara
            siteId: 'YOUR_POPCASH_SITE_ID',
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
        preRollCount: 0,
        hasUserInteracted: false // ← TAMBAHAN: Track interaksi pengguna
    },
    
    // ===== INITIALIZATION =====
    async init() {
        console.log('🚀 TITIK SPORTS Ads Manager Initializing...');
        
        // Check if popunder already shown
        this.checkPopunderStatus();
        
        // Initialize Google IMA for pre-roll
        await this.loadGoogleIMA();
        
        // Initialize banner ads
        this.initBannerAds();
        
        // Initialize popunders
        this.initPopunders();
        
        // Setup video player integration
        this.setupVideoPlayerIntegration();
        
        console.log('✅ Ads Manager Initialized');
        
        // Make globally available
        window.TitikAdsManager = this;
    },
    
    // ===== USER INTERACTION HANDLER =====
    hasUserInteracted() {
        return this.state.hasUserInteracted || sessionStorage.getItem('titik_user_interacted') === 'true';
    },
    
    markUserInteracted() {
        this.state.hasUserInteracted = true;
        sessionStorage.setItem('titik_user_interacted', 'true');
    },
    
    async waitForUserInteraction() {
        if (this.hasUserInteracted()) {
            return;
        }
        
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'user-interaction-overlay';
            overlay.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                            background: rgba(0,0,0,0.95); z-index: 10000; display: flex; 
                            align-items: center; justify-content: center;">
                    <div style="background: white; padding: 25px; border-radius: 12px; text-align: center; max-width: 350px;">
                        <h3 style="margin: 0 0 15px 0; color: #333;">🎬 Siap Menonton?</h3>
                        <p style="color: #666; margin-bottom: 20px;">Klik tombol di bawah untuk memulai siaran</p>
                        <button id="startPlaybackBtn" 
                                style="padding: 12px 30px; font-size: 16px; background: #FF6600; 
                                       color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            ▶️ PUTAR SIARAN
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            document.getElementById('startPlaybackBtn').addEventListener('click', () => {
                this.markUserInteracted();
                document.body.removeChild(overlay);
                resolve();
            });
        });
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
        // Tunggu interaksi pengguna
        await this.waitForUserInteraction();
        
        // Validate video element exists
        if (!videoElement) {
            console.warn('⚠️ Video element is null, skipping pre-roll');
            if (onComplete) onComplete();
            return;
        }
        
        if (!videoElement.parentElement) {
            console.warn('⚠️ Video element has no parent, skipping pre-roll');
            if (onComplete) onComplete();
            return;
        }
        
        if (!this.config.exoclick.enabled || this.state.preRollPlayed || !this.state.imaLoaded) {
            console.log('ℹ️ Pre-roll conditions not met, playing video directly');
            if (onComplete) onComplete();
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
            let adsManager = null;
            
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
                    
                    adsManager = event.getAdsManager(videoElement, adsRenderingSettings);
                    
                    adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, (adErrorEvent) => {
                        console.warn('⚠️ Pre-Roll Error:', adErrorEvent.getError());
                        this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                        onComplete();
                    });
                    
                    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED, () => {
                        console.log('⏸️ Content paused for ad');
                    });
                    
                    adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, () => {
                        if (!adCompleted) {
                            adCompleted = true;
                            console.log('▶️ Content resume requested');
                            this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                            onComplete();
                        }
                    });
                    
                    adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
                        if (!adCompleted) {
                            adCompleted = true;
                            console.log('✅ All ads completed');
                            this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                            onComplete();
                        }
                    });
                    
                    try {
                        adDisplayContainer.initialize();
                        adsManager.init(videoElement.offsetWidth, videoElement.offsetHeight, google.ima.ViewMode.NORMAL);
                        adsManager.start();
                        this.state.preRollPlayed = true;
                        console.log('✅ Pre-roll started successfully');
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
                    console.warn('⚠️ AdsLoader Error:', adErrorEvent.getError());
                    this.cleanupPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, skipTimer);
                    onComplete();
                }
            );
            
            // Request ads
            const adsRequest = new google.ima.AdsRequest();
            adsRequest.adTagUrl = this.config.exoclick.videoPreRoll.vastTag;
            adsRequest.linearAdSlotWidth = videoElement.offsetWidth;
            adsRequest.linearAdSlotHeight = videoElement.offsetHeight;
            adsRequest.nonLinearAdSlotWidth = videoElement.offsetWidth;
            adsRequest.nonLinearAdSlotHeight = 150;
            
            adsLoader.requestAds(adsRequest);
            
            // Timeout fallback (30 seconds untuk iklan 22 detik)
            setTimeout(() => {
                if (!adCompleted) {
                    console.log('⏱️ Pre-Roll Timeout (30s)');
                    this.skipPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, onComplete);
                }
            }, this.config.exoclick.videoPreRoll.maxDuration * 1000);
            
        } catch (error) {
            console.error('❌ Pre-Roll Critical Error:', error);
            onComplete();
        }
    },
    
    skipPreRoll(adsManager, adDisplayContainer, adContainer, skipButton, onComplete) {
        console.log('⏭️ Skipping pre-roll');
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
    },
    
    insertExoClickBanner() {
        // Hanya implementasi sederhana untuk sekarang
        console.log('✅ ExoClick Banner ready');
    },
    
    // ===== POPUNDER ADS =====
    initPopunders() {
        // Check if already shown in this session
        if (this.state.popunderShown) {
            console.log('ℹ️ Popunder already shown this session');
            return;
        }
        
        // Tunda popunder setelah video dimulai
        setTimeout(() => {
            if (!this.state.popunderShown) {
                this.loadAdsterraPopunder();
            }
        }, 15000); // 15 detik setelah page load
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
        if (this.state.popunderShown || !this.config.adsterra.enabled) return;
        
        console.log('✅ Adsterra Popunder loaded');
        this.markPopunderShown();
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
                
                // Setup manual play button jika video tidak bisa autoplay
                const setupManualPlayback = () => {
                    const videoContainer = videoElement.parentElement;
                    if (!videoContainer) return;
                    
                    const playBtn = document.createElement('button');
                    playBtn.innerHTML = '▶️ Play Video';
                    playBtn.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        padding: 12px 24px;
                        background: #FF6600;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        z-index: 999;
                    `;
                    playBtn.onclick = async () => {
                        // Mark user interaction
                        TitikAdsManager.markUserInteracted();
                        
                        // Remove button
                        playBtn.remove();
                        
                        // Play pre-roll
                        await TitikAdsManager.playPreRoll(videoElement, () => {
                            console.log('✅ Pre-Roll Complete, playing main video');
                            videoElement.play().catch(e => {
                                console.log('Video play error:', e);
                            });
                        });
                    };
                    
                    videoContainer.appendChild(playBtn);
                };
                
                // Jika sudah ada interaksi, langsung play pre-roll
                if (TitikAdsManager.hasUserInteracted()) {
                    await TitikAdsManager.playPreRoll(videoElement, () => {
                        console.log('✅ Pre-Roll Complete, playing main video');
                        videoElement.play().catch(e => {
                            console.log('Video play error:', e);
                        });
                    });
                } else {
                    // Tampilkan tombol play manual
                    setupManualPlayback();
                }
            };
        }
    },
    
    // ===== RECURRING PRE-ROLL (Every 5 minutes) =====
    startRecurringPreRoll(videoElement) {
        if (!videoElement || !this.state.hasUserInteracted) {
            console.warn('⚠️ Cannot start recurring pre-roll: no user interaction');
            return;
        }
        
        console.log('⏰ Starting recurring pre-roll timer (every 5 minutes)');
        
        // Clear existing timer if any
        if (this.state.preRollTimer) {
            clearInterval(this.state.preRollTimer);
        }
        
        // Set timer for 5 minutes (300,000ms)
        this.state.preRollTimer = setInterval(async () => {
            // Validate video element still exists and has source
            if (!videoElement || !videoElement.src) {
                console.log('ℹ️ Video element invalid, stopping recurring pre-roll');
                clearInterval(this.state.preRollTimer);
                this.state.preRollTimer = null;
                return;
            }
            
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
                    if (wasPlaying && videoElement) {
                        videoElement.play().catch(e => {
                            console.log('Resume prevented:', e);
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
        if (existingBtn) return;
        
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