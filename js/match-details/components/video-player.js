// ===== VIDEO PLAYER COMPONENT =====

const VideoPlayer = {
    container: null,
    videoElement: null,
    
    // Initialize video player
    async initialize(matchId) {
        this.container = document.querySelector('.video-player-container');
        
        if (!this.container) {
            console.error('Video container element not found (.video-player-container)');
            return;
        }

        // Show loading state
        this.showLoading(matchId);

        console.log(`🎬 Initializing video player for match: ${matchId}`);
        
        // Get streaming link from Supabase
        const streamingUrl = await SupabaseService.getStreamingLink(matchId);
        
        console.log(`🔗 Stream URL result: ${streamingUrl ? 'Found' : 'Not found'}`);
        if (streamingUrl) {
            console.log(`🔹 URL preview: ${streamingUrl.substring(0, 100)}...`);
        }

        // If no stream found
        if (!streamingUrl) {
            this.showNoStream(matchId);
            return;
        }

        // Detect stream type
        const streamType = VideoService.getStreamType(streamingUrl);
        console.log(`🔹 Stream type detected: ${streamType}`);
        
        // Render video player
        this.renderPlayer(streamType);
        
        this.videoElement = document.getElementById('videoElement');
        
        // Initialize player based on stream type
        try {
            await VideoService.initialize(streamingUrl, streamType, this.videoElement, this.container);
            this.setupEventListeners();
        } catch (error) {
            console.error(`❌ Failed to initialize ${streamType} player:`, error);
            Helpers.handlePlayerError(
                `Failed to initialize ${streamType.toUpperCase()} player: ${error.message}`,
                this.container
            );
        }
    },
    
    // Show loading state
    showLoading(matchId) {
        this.container.innerHTML = `
            <div class="video-wrapper">
                <div class="video-loading">
                    <div class="spinner"></div>
                    <div class="loading-text">Checking for stream... (Match ID: ${matchId})</div>
                    <div class="loading-subtext">Querying Supabase database...</div>
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
                        <p>No streaming link has been set for this match.</p>
                        <p><small>Match ID: ${matchId}</small></p>
                        <p><small>The match may not be streaming yet, or stream data hasn't been synced.</small></p>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                        <button onclick="VideoPlayer.checkStreamAgain(${matchId})" class="action-btn">
                            🔄 Check Again
                        </button>
                        <button onclick="VideoPlayer.debugStreamData(${matchId})" class="action-btn secondary">
                            🛠 Debug Data
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render player UI
    renderPlayer(streamType) {
        this.container.innerHTML = `
            <div class="video-wrapper">
                <video id="videoElement" controls playsinline autoplay muted style="width: 100%; height: 100%; background: #000;"></video>
                <div class="stream-info-overlay">
                    <span class="stream-type-badge">${streamType.toUpperCase()}</span>
                    <span class="live-badge">🔴 LIVE</span>
                </div>
            </div>
            <div class="video-controls-bar">
                <div class="controls-left">
                    <button onclick="VideoControls.togglePlayPause()" class="control-btn" id="playPauseBtn">⏸️</button>
                    <button onclick="VideoControls.toggleMute()" class="control-btn" id="muteBtn">🔇</button>
                    <span class="time-display" id="timeDisplay">00:00</span>
                </div>
                <div class="controls-right">
                    <button onclick="VideoControls.reloadStream()" class="control-btn">🔄 Reload</button>
                    <button onclick="VideoControls.toggleFullscreen()" class="control-btn">⛶ Fullscreen</button>
                </div>
            </div>
        `;
    },
    
    // Setup event listeners
    setupEventListeners() {
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
    },
    
    // Check stream again
    async checkStreamAgain(matchId) {
        console.log(`🔄 Checking stream again for match: ${matchId}`);
        
        if (this.container) {
            this.container.innerHTML = `
                <div class="video-wrapper">
                    <div class="video-loading">
                        <div class="spinner"></div>
                        <div class="loading-text">Rechecking stream...</div>
                    </div>
                </div>
            `;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.initialize(matchId);
    },
    
    // Debug stream data
    async debugStreamData(matchId) {
        console.log(`🛠 Debugging stream data for match: ${matchId}`);
        const data = await SupabaseService.debugData(matchId);
        
        if (data) {
            alert(`Supabase Data for Match ${matchId}:\n\n` + 
                  JSON.stringify(data, null, 2).substring(0, 1000) + '...');
        } else {
            alert(`No data found in Supabase for Match ${matchId}`);
        }
    }
};

// Make component globally available
window.VideoPlayer = VideoPlayer;