// ===== PROFESSIONAL VIDEO PLAYER - FIXED VERSION =====
const VideoPlayer = {
    container: null,
    videoElement: null,
    currentStreamIndex: 0,
    streamSources: [],
    isPlaying: false,
    currentTime: 0,
    countdownInterval: null,
    preRollInterval: null,
    lastPreRollTime: 0,
    matchId: null,
    matchData: null,
    
    config: {
        preRollIntervalMinutes: 5,
        preRollSkipAfter: 5,
        checkMatchStatusInterval: 30000
    },
    
    async initialize(matchId) {
        this.matchId = matchId;
        this.container = document.querySelector('.video-player-container');
        
        if (!this.container) {
            console.error('❌ Video container not found');
            return;
        }

        console.log(`🎬 Initializing Video Player for match: ${matchId}`);
        
        // Check match status
        this.matchData = await this.checkMatchStatus(matchId);
        
        if (!this.matchData) {
            this.showNoStream(matchId);
            return;
        }
        
        // CASE 1: Match belum mulai
        if (!this.matchData.started && this.matchData.matchTime) {
            await this.handleUpcomingMatch();
            return;
        }
        
        // CASE 2: Match sudah mulai
        await this.handleLiveMatch();
    },
    
    hidePlayer() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    },
    
    // ===== UPCOMING MATCH =====
    async handleUpcomingMatch() {
        console.log('⏰ Match upcoming - showing countdown');
        this.showCountdown(this.matchData.matchTime, this.matchData.homeTeam, this.matchData.awayTeam);
        this.startMatchStatusChecker();
    },
    
    // ===== LIVE MATCH =====
    async handleLiveMatch() {
        console.log('🔴 Match live - checking stream availability');
        
        // Show loading immediately
        this.showLoading(this.matchId);
        
        // Fetch stream data
        const streamingData = await SupabaseService.getStreamingData(this.matchId);
        
        if (!streamingData || !streamingData.sources || streamingData.sources.length === 0) {
            this.showNoStream(this.matchId);
            return;
        }
        
        // Stream available - render player
        this.streamSources = streamingData.sources;
        console.log(`📡 Found ${this.streamSources.length} stream(s)`);
        
        // Play pre-roll first
        await this.playPreRollOverlay();
        
        // Render player after pre-roll
        this.renderPlayer();
        this.videoElement = document.getElementById('videoElement');
        await this.loadStream(0);
        this.setupEventListeners();
        
        // Start recurring pre-roll
        this.startRecurringPreRoll();
    },
    
    // ===== PRE-ROLL OVERLAY =====
    async playPreRollOverlay() {
        return new Promise((resolve) => {
            if (!window.google || !window.google.ima) {
                console.warn('⚠️ Google IMA not loaded, skipping pre-roll');
                resolve();
                return;
            }
            
            console.log('🎬 Playing Pre-Roll Overlay...');
            
            const overlay = document.createElement('div');
            overlay.id = 'pre-roll-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.95);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            overlay.innerHTML = `
                <div style="position: relative; width: 100%; max-width: 640px; aspect-ratio: 16/9;">
                    <video id="preRollVideo" style="width: 100%; height: 100%; object-fit: contain; background: #000;"></video>
                    <div id="preRollAdContainer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>
                    <button id="skipPreRollBtn" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; border: 2px solid white; padding: 8px 16px; border-radius: 4px; font-weight: 700; cursor: pointer; z-index: 10001; display: none; transition: all 0.3s;">
                        Skip Ad ⏩
                    </button>
                    <div style="position: absolute; bottom: 10px; left: 10px; color: white; background: rgba(0,0,0,0.8); padding: 6px 12px; border-radius: 4px; font-size: 12px; z-index: 10001;">
                        Advertisement
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            const preRollVideo = document.getElementById('preRollVideo');
            const skipBtn = document.getElementById('skipPreRollBtn');
            const adContainer = document.getElementById('preRollAdContainer');
            
            const cleanup = () => {
                if (overlay.parentElement) overlay.remove();
                resolve();
            };
            
            skipBtn.onclick = cleanup;
            
            setTimeout(() => {
                skipBtn.style.display = 'block';
            }, this.config.preRollSkipAfter * 1000);
            
            try {
                const adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, preRollVideo);
                const adsLoader = new google.ima.AdsLoader(adDisplayContainer);
                let adsManager = null;
                
                adsLoader.addEventListener(
                    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                    (event) => {
                        adsManager = event.getAdsManager(preRollVideo);
                        
                        adsManager.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, cleanup);
                        adsManager.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, cleanup);
                        adsManager.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, cleanup);
                        
                        try {
                            adDisplayContainer.initialize();
                            adsManager.init(640, 360, google.ima.ViewMode.NORMAL);
                            adsManager.start();
                            this.lastPreRollTime = Date.now();
                        } catch (adError) {
                            console.warn('⚠️ Ad start error:', adError);
                            cleanup();
                        }
                    }
                );
                
                adsLoader.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, cleanup);
                
                const adsRequest = new google.ima.AdsRequest();
                adsRequest.adTagUrl = 'https://s.magsrv.com/v1/vast.php?idzone=5809154';
                adsRequest.linearAdSlotWidth = 640;
                adsRequest.linearAdSlotHeight = 360;
                
                adsLoader.requestAds(adsRequest);
                
                setTimeout(() => {
                    if (overlay.parentElement) cleanup();
                }, 35000);
                
            } catch (error) {
                console.error('❌ Pre-roll error:', error);
                cleanup();
            }
        });
    },
    
    // ===== RECURRING PRE-ROLL =====
    startRecurringPreRoll() {
        const intervalMs = this.config.preRollIntervalMinutes * 60 * 1000;
        console.log(`⏰ Recurring pre-roll every ${this.config.preRollIntervalMinutes} min`);
        
        this.preRollInterval = setInterval(() => {
            if (!this.videoElement || this.videoElement.paused) return;
            
            console.log('🔄 Triggering recurring pre-roll...');
            const wasPlaying = !this.videoElement.paused;
            const currentTime = this.videoElement.currentTime;
            
            if (wasPlaying) this.videoElement.pause();
            
            this.playPreRollOverlay().then(() => {
                if (this.videoElement && wasPlaying) {
                    this.videoElement.currentTime = currentTime;
                    this.videoElement.play().catch(e => {
                        console.log('Resume prevented:', e);
                        this.showResumeButton();
                    });
                }
            });
        }, intervalMs);
    },
    
    showResumeButton() {
        if (document.querySelector('.resume-video-btn')) return;
        
        const resumeBtn = document.createElement('button');
        resumeBtn.className = 'resume-video-btn';
        resumeBtn.innerHTML = '▶️ Continue Watching';
        resumeBtn.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 16px 32px;
            background: #FF6600;
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
            this.videoElement.play();
            resumeBtn.remove();
        };
        this.container.appendChild(resumeBtn);
    },
    
    // ===== COUNTDOWN =====
    showCountdown(matchTimeUTC, homeTeam, awayTeam) {
        const matchDate = new Date(matchTimeUTC);
        
        this.container.innerHTML = `
            <div class="countdown-wrapper">
                <div class="countdown-content">
                    <div class="countdown-header">
                        <div style="font-size: 16px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9; font-weight: 600;">⚽ Match Starts In</div>
                    </div>
                    
                    <div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin: 30px 0; flex-wrap: wrap;">
                        <div style="font-size: 20px; font-weight: 800; min-width: 120px;">${homeTeam}</div>
                        <div style="font-size: 28px; font-weight: 900; color: #FFD700;">VS</div>
                        <div style="font-size: 20px; font-weight: 800; min-width: 120px;">${awayTeam}</div>
                    </div>
                    
                    <div id="countdown" class="countdown-grid">
                        <div class="countdown-item">
                            <div class="countdown-value" id="days">00</div>
                            <div class="countdown-label">Days</div>
                        </div>
                        <div class="countdown-item">
                            <div class="countdown-value" id="hours">00</div>
                            <div class="countdown-label">Hours</div>
                        </div>
                        <div class="countdown-item">
                            <div class="countdown-value" id="minutes">00</div>
                            <div class="countdown-label">Minutes</div>
                        </div>
                        <div class="countdown-item">
                            <div class="countdown-value" id="seconds">00</div>
                            <div class="countdown-label">Seconds</div>
                        </div>
                    </div>
                    
                    <div style="font-size: 14px; opacity: 0.9; line-height: 1.6; margin-top: 20px;">
                        📅 ${matchDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric'
                        })}<br>
                        🕐 ${matchDate.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            </div>
        `;
        
        this.startCountdown(matchDate);
    },
    
    startCountdown(targetDate) {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;
            
            if (distance < 0) {
                clearInterval(this.countdownInterval);
                const countdownEl = document.getElementById('countdown');
                if (countdownEl) {
                    countdownEl.innerHTML = `
                        <div style="grid-column: 1 / -1; font-size: 24px; font-weight: 800; color: #4CAF50; animation: pulse 1s infinite;">
                            🔴 MATCH STARTED!
                        </div>
                    `;
                }
                setTimeout(() => window.location.reload(), 3000);
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = String(value).padStart(2, '0');
            };
            
            setText('days', days);
            setText('hours', hours);
            setText('minutes', minutes);
            setText('seconds', seconds);
        };
        
        updateCountdown();
        this.countdownInterval = setInterval(updateCountdown, 1000);
    },
    
    // ===== NO STREAM =====
    showNoStream(matchId) {
        this.container.innerHTML = `
            <div class="no-stream-wrapper">
                <div class="no-stream-content">
                    <div class="no-stream-icon">📺</div>
                    <h2 class="no-stream-title">Stream Not Available</h2>
                    <p class="no-stream-text">Sorry, this match is not currently being streamed on our platform.</p>
                    <div style="font-size: 13px; opacity: 0.7; margin-bottom: 24px;">Match ID: ${matchId}</div>
                    <button onclick="VideoPlayer.checkStreamAgain('${matchId}')" class="check-again-btn">
                        🔄 Check Again
                    </button>
                </div>
            </div>
        `;
    },
    
    // ===== LOADING =====
    showLoading(matchId) {
        this.container.innerHTML = `
            <div class="loading-wrapper">
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Finding stream...</div>
                    <div style="font-size: 12px; opacity: 0.5; margin-top: 8px;">Match ID: ${matchId}</div>
                </div>
            </div>
        `;
    },
    
    // ===== PLAYER =====
    renderPlayer() {
        const hasMultipleStreams = this.streamSources.length > 1;
        
        this.container.innerHTML = `
            <div class="player-wrapper">
                <video id="videoElement" controls playsinline class="video-element"></video>
                
                <div class="stream-info-overlay">
                    <span class="live-badge">🔴 LIVE</span>
                    <span class="stream-type-badge" id="streamIndicator">Loading...</span>
                </div>
                
                ${hasMultipleStreams ? `
                    <div class="stream-selector">
                        <button class="stream-nav-btn" onclick="VideoPlayer.switchToPreviousStream()">◀</button>
                        <div class="stream-options">
                            ${this.streamSources.map((stream, idx) => `
                                <button class="stream-option ${idx === 0 ? 'active' : ''}" 
                                        onclick="VideoPlayer.loadStream(${idx})"
                                        title="Stream ${idx + 1}">
                                    ${idx + 1}
                                </button>
                            `).join('')}
                        </div>
                        <button class="stream-nav-btn" onclick="VideoPlayer.switchToNextStream()">▶</button>
                    </div>
                ` : ''}
            </div>
            
            <div class="video-controls-bar">
                <div class="controls-left">
                    <button onclick="VideoControls.togglePlayPause()" class="control-btn" id="playPauseBtn">▶️</button>
                    <button onclick="VideoControls.toggleMute()" class="control-btn" id="muteBtn">🔊</button>
                    <span class="time-display" id="timeDisplay">00:00 / 00:00</span>
                </div>
                <div class="controls-right">
                    <button onclick="VideoPlayer.reloadCurrentStream()" class="control-btn">🔄</button>
                    ${hasMultipleStreams ? `<button onclick="VideoPlayer.switchToNextStream()" class="control-btn">🔀</button>` : ''}
                    <button onclick="VideoControls.toggleFullscreen()" class="control-btn">⛶</button>
                </div>
            </div>
        `;
    },
    
    async loadStream(index) {
        if (!this.streamSources[index]) return;
        
        this.currentStreamIndex = index;
        const stream = this.streamSources[index];
        
        console.log(`🔄 Loading stream ${index + 1}`);
        this.updateStreamIndicator('Loading...');
        
        try {
            if (window.VideoService && VideoService.currentPlayer) {
                VideoService.destroy();
            }
            
            const streamType = VideoService.getStreamType(stream.source);
            await VideoService.initialize(stream.source, streamType, this.videoElement, this.container);
            
            this.updateStreamIndicator(`Stream ${index + 1} - ${streamType.toUpperCase()}`);
            this.updateStreamButtons();
            this.setupVideoListeners();
            
            console.log('✅ Stream loaded');
        } catch (error) {
            console.error('❌ Stream error:', error);
            this.updateStreamIndicator('Error loading stream');
        }
    },
    
    switchToNextStream() {
        const nextIndex = (this.currentStreamIndex + 1) % this.streamSources.length;
        this.loadStream(nextIndex);
    },
    
    switchToPreviousStream() {
        const prevIndex = this.currentStreamIndex === 0 ? this.streamSources.length - 1 : this.currentStreamIndex - 1;
        this.loadStream(prevIndex);
    },
    
    reloadCurrentStream() {
        this.loadStream(this.currentStreamIndex);
    },
    
    updateStreamIndicator(text) {
        const indicator = document.getElementById('streamIndicator');
        if (indicator) indicator.textContent = text;
    },
    
    updateStreamButtons() {
        document.querySelectorAll('.stream-option').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === this.currentStreamIndex);
        });
    },
    
    setupEventListeners() {
        this.setupVideoListeners();
    },
    
    setupVideoListeners() {
        if (!this.videoElement) return;
        
        this.videoElement.addEventListener('timeupdate', VideoControls.updateTimeDisplay);
        this.videoElement.addEventListener('play', () => {
            const btn = document.getElementById('playPauseBtn');
            if (btn) btn.textContent = '⏸️';
        });
        this.videoElement.addEventListener('pause', () => {
            const btn = document.getElementById('playPauseBtn');
            if (btn) btn.textContent = '▶️';
        });
        this.videoElement.addEventListener('volumechange', () => {
            const btn = document.getElementById('muteBtn');
            if (btn) btn.textContent = this.videoElement.muted ? '🔇' : '🔊';
        });
        this.videoElement.addEventListener('loadedmetadata', VideoControls.updateTimeDisplay);
    },
    
    async checkMatchStatus(matchId) {
        try {
            const response = await fetch(`https://www.fotmob.com/api/data/matchDetails?matchId=${matchId}`);
            if (!response.ok) return null;
            
            const data = await response.json();
            return {
                started: data.general?.started || false,
                finished: data.general?.finished || false,
                matchTime: data.general?.matchTimeUTCDate,
                homeTeam: data.header?.teams?.[0]?.name || 'Home',
                awayTeam: data.header?.teams?.[1]?.name || 'Away'
            };
        } catch (error) {
            console.error('Failed to check match status:', error);
            return null;
        }
    },
    
    startMatchStatusChecker() {
        console.log('⏰ Status checker started');
        
        const checkInterval = setInterval(async () => {
            const status = await this.checkMatchStatus(this.matchId);
            if (status && status.started) {
                console.log('✅ Match started! Reloading...');
                clearInterval(checkInterval);
                window.location.reload();
            }
        }, this.config.checkMatchStatusInterval);
    },
    
    async checkStreamAgain(matchId) {
        console.log('🔄 Checking stream again...');
        await this.initialize(matchId);
    },
    
    cleanup() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        if (this.preRollInterval) clearInterval(this.preRollInterval);
        
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement.load();
        }
        
        if (window.VideoService && VideoService.currentPlayer) {
            VideoService.destroy();
        }
    }
};

window.addEventListener('beforeunload', () => VideoPlayer.cleanup());
window.VideoPlayer = VideoPlayer;