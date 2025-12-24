// ===== VIDEO PLAYER COMPONENT - WITH MULTI-STREAM SELECTOR =====

const VideoPlayer = {
    container: null,
    videoElement: null,
    currentStreamIndex: 0,
    streamSources: [], // Array of all available streams
    isPlaying: false,
    currentTime: 0,
    
    // Initialize video player
    async initialize(matchId) {
        this.container = document.querySelector('.video-player-container');
        
        if (!this.container) {
            console.error('❌ Video container not found (.video-player-container)');
            return;
        }

        // Show loading state
        this.showLoading(matchId);
        console.log(`🎬 Initializing video player for match: ${matchId}`);
        
        // Get streaming link from Supabase
        const streamingData = await SupabaseService.getStreamingData(matchId);
        console.log(`🔗 Stream data result:`, streamingData);

        // If no stream found
        if (!streamingData || !streamingData.sources || streamingData.sources.length === 0) {
            this.showNoStream(matchId);
            return;
        }

        // Store all stream sources
        this.streamSources = streamingData.sources;
        console.log(`📡 Found ${this.streamSources.length} stream source(s)`);
        
        // Render player with stream selector
        this.renderPlayer();
        this.videoElement = document.getElementById('videoElement');
        
        // Load first stream
        await this.loadStream(0);
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ Video player ready');
    },
    
    // Load specific stream by index
    async loadStream(index) {
        if (!this.streamSources[index]) {
            console.error('❌ Invalid stream index:', index);
            return;
        }
        
        this.currentStreamIndex = index;
        const stream = this.streamSources[index];
        
        console.log(`🔄 Loading stream ${index + 1}/${this.streamSources.length}:`, stream.type);
        
        // Save current playback position if switching streams
        if (this.videoElement && !this.videoElement.paused) {
            this.currentTime = this.videoElement.currentTime;
            this.isPlaying = true;
        }
        
        // Update UI to show loading
        this.updateStreamIndicator('Loading...');
        
        try {
            // Cleanup previous player
            if (window.VideoService && window.VideoService.currentPlayer) {
                VideoService.destroy();
            }
            
            // Detect stream type
            const streamType = VideoService.getStreamType(stream.source);
            console.log(`🔹 Stream type: ${streamType}`);
            
            // Initialize player for this stream
            await VideoService.initialize(stream.source, streamType, this.videoElement, this.container);
            
            // Try to resume playback position
            if (this.currentTime > 0 && this.videoElement) {
                this.videoElement.currentTime = this.currentTime;
            }
            
            // Resume playing if was playing before
            if (this.isPlaying && this.videoElement) {
                setTimeout(() => {
                    this.videoElement.play().catch(e => {
                        console.log('Autoplay prevented after stream switch');
                    });
                }, 500);
            }
            
            // Update stream indicator
            this.updateStreamIndicator(`Stream ${index + 1} - ${streamType.toUpperCase()}`);
            this.updateStreamButtons();
            
            console.log('✅ Stream loaded successfully');
            
        } catch (error) {
            console.error(`❌ Failed to load stream ${index + 1}:`, error);
            Helpers.handlePlayerError(
                `Failed to load stream ${index + 1}. Try another stream or refresh.`,
                this.container
            );
        }
    },
    
    // Switch to next available stream
    switchToNextStream() {
        const nextIndex = (this.currentStreamIndex + 1) % this.streamSources.length;
        console.log(`🔄 Switching to stream ${nextIndex + 1}`);
        this.loadStream(nextIndex);
    },
    
    // Switch to previous stream
    switchToPreviousStream() {
        const prevIndex = this.currentStreamIndex === 0 
            ? this.streamSources.length - 1 
            : this.currentStreamIndex - 1;
        console.log(`🔄 Switching to stream ${prevIndex + 1}`);
        this.loadStream(prevIndex);
    },
    
    // Update stream indicator badge
    updateStreamIndicator(text) {
        const indicator = document.getElementById('streamIndicator');
        if (indicator) {
            indicator.textContent = text;
        }
    },
    
    // Update stream selector buttons state
    updateStreamButtons() {
        document.querySelectorAll('.stream-option').forEach((btn, idx) => {
            btn.classList.toggle('active', idx === this.currentStreamIndex);
        });
    },
    
    // Show loading state
    showLoading(matchId) {
        this.container.innerHTML = `
            <div class="video-wrapper">
                <div class="video-loading">
                    <div class="spinner"></div>
                    <div class="loading-text">Checking for stream...</div>
                    <div class="loading-subtext">Match ID: ${matchId}</div>
                </div>
            </div>
        `;
    },
    
    // Show no stream available
    showNoStream(matchId) {
        this.container.innerHTML = `
            <div class="video-wrapper">
                <div class="video-empty">
                    <div class="empty-icon">📺</div>
                    <div class="empty-title">Stream Not Available</div>
                    <div class="empty-text">
                        <p>No streaming link available for this match.</p>
                        <p><small>Match ID: ${matchId}</small></p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: center;">
                        <button onclick="VideoPlayer.checkStreamAgain(${matchId})" class="action-btn">
                            🔄 Check Again
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render player UI with stream selector
    renderPlayer() {
        const hasMultipleStreams = this.streamSources.length > 1;
        
        this.container.innerHTML = `
            <div class="video-wrapper">
                <video 
                    id="videoElement" 
                    controls 
                    playsinline 
                    style="width: 100%; height: 100%; background: #000;"
                ></video>
                
                <!-- Stream Info Overlay -->
                <div class="stream-info-overlay">
                    <span class="live-badge">🔴 LIVE</span>
                    <span class="stream-type-badge" id="streamIndicator">Loading...</span>
                </div>
                
                <!-- Multi-Stream Selector (only if multiple streams) -->
                ${hasMultipleStreams ? `
                    <div class="stream-selector">
                        <button class="stream-nav-btn" onclick="VideoPlayer.switchToPreviousStream()" title="Previous Stream">
                            ◀
                        </button>
                        <div class="stream-options">
                            ${this.streamSources.map((stream, idx) => `
                                <button 
                                    class="stream-option ${idx === 0 ? 'active' : ''}" 
                                    onclick="VideoPlayer.loadStream(${idx})"
                                    title="Stream ${idx + 1} - ${stream.type}"
                                >
                                    ${idx + 1}
                                </button>
                            `).join('')}
                        </div>
                        <button class="stream-nav-btn" onclick="VideoPlayer.switchToNextStream()" title="Next Stream">
                            ▶
                        </button>
                    </div>
                ` : ''}
            </div>
            
            <!-- Enhanced Video Controls -->
            <div class="video-controls-bar">
                <div class="controls-left">
                    <button onclick="VideoControls.togglePlayPause()" class="control-btn" id="playPauseBtn" title="Play/Pause">
                        ▶️
                    </button>
                    <button onclick="VideoControls.toggleMute()" class="control-btn" id="muteBtn" title="Mute/Unmute">
                        🔇
                    </button>
                    <span class="time-display" id="timeDisplay">00:00</span>
                </div>
                <div class="controls-right">
                    <button onclick="VideoPlayer.reloadCurrentStream()" class="control-btn" title="Reload Stream">
                        🔄 Reload
                    </button>
                    ${hasMultipleStreams ? `
                        <button onclick="VideoPlayer.switchToNextStream()" class="control-btn" title="Switch Stream">
                            🔀 Switch
                        </button>
                    ` : ''}
                    <button onclick="VideoControls.toggleFullscreen()" class="control-btn" title="Fullscreen">
                        ⛶
                    </button>
                </div>
            </div>
        `;
    },
    
    // Reload current stream
    reloadCurrentStream() {
        console.log('🔄 Reloading current stream');
        this.loadStream(this.currentStreamIndex);
    },
    
    // Setup event listeners
    setupEventListeners() {
        if (!this.videoElement) return;
        
        // Playback events
        this.videoElement.addEventListener('timeupdate', VideoControls.updateTimeDisplay);
        
        this.videoElement.addEventListener('play', () => {
            const btn = document.getElementById('playPauseBtn');
            if (btn) btn.textContent = '⏸️';
            this.isPlaying = true;
        });
        
        this.videoElement.addEventListener('pause', () => {
            const btn = document.getElementById('playPauseBtn');
            if (btn) btn.textContent = '▶️';
            this.isPlaying = false;
        });
        
        this.videoElement.addEventListener('volumechange', () => {
            const btn = document.getElementById('muteBtn');
            if (btn) btn.textContent = this.videoElement.muted ? '🔇' : '🔊';
        });
        
        // Error handling
        this.videoElement.addEventListener('error', (e) => {
            console.error('❌ Video playback error:', e);
            
            // Auto-switch to next stream if available
            if (this.streamSources.length > 1) {
                Helpers.showToast('Stream error, switching to next...', 'warning');
                setTimeout(() => {
                    this.switchToNextStream();
                }, 2000);
            } else {
                Helpers.handlePlayerError('Video playback failed. Please reload.', this.container);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.videoElement) return;
            
            // Space = play/pause
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                VideoControls.togglePlayPause();
            }
            
            // M = mute/unmute
            if (e.code === 'KeyM') {
                VideoControls.toggleMute();
            }
            
            // F = fullscreen
            if (e.code === 'KeyF') {
                VideoControls.toggleFullscreen();
            }
            
            // N = next stream (if multiple)
            if (e.code === 'KeyN' && this.streamSources.length > 1) {
                this.switchToNextStream();
            }
            
            // P = previous stream (if multiple)
            if (e.code === 'KeyP' && this.streamSources.length > 1) {
                this.switchToPreviousStream();
            }
        });
    },
    
    // Check stream again
    async checkStreamAgain(matchId) {
        console.log(`🔄 Checking stream again for match: ${matchId}`);
        this.showLoading(matchId);
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.initialize(matchId);
    },
    
    // Cleanup on page unload
    cleanup() {
        console.log('🧹 Cleaning up video player');
        
        // Stop video
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement.load();
        }
        
        // Destroy current player
        if (window.VideoService && window.VideoService.currentPlayer) {
            VideoService.destroy();
        }
        
        // Reset state
        this.currentStreamIndex = 0;
        this.streamSources = [];
        this.isPlaying = false;
        this.currentTime = 0;
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    VideoPlayer.cleanup();
});

// Make component globally available
window.VideoPlayer = VideoPlayer;