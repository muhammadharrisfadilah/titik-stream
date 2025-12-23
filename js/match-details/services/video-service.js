// ===== VIDEO SERVICE =====

const VideoService = {
    currentPlayer: null,
    
    // Get stream type from URL
    getStreamType(url) {
        if (!url) return 'unknown';
        
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('.m3u8')) return 'hls';
        if (urlLower.includes('.flv')) return 'flv';
        if (urlLower.includes('.mp4')) return 'mp4';
        
        if (url.includes('hls') || url.includes('m3u8')) return 'hls';
        if (url.includes('flv')) return 'flv';
        
        return 'unknown';
    },
    
    // Initialize HLS Player
    async initializeHLS(streamingUrl, videoElement, container) {
        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            try {
                const hls = new Hls(AppConfig.video.HLS_CONFIG);
                
                hls.loadSource(streamingUrl);
                hls.attachMedia(videoElement);
                
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    // JANGAN auto-play di sini
                    console.log('✅ HLS Manifest parsed, ready for playback');
                });

                hls.on(Hls.Events.ERROR, function (event, data) {
                    console.error('HLS Player Error:', data.type, data.details);
                    if (data.fatal) {
                        Helpers.handlePlayerError('HLS Playback Error: Unable to load stream.', container);
                    }
                });

                console.log('✅ HLS Player initialized successfully');
                this.currentPlayer = hls;
                return hls;
                
            } catch (error) {
                console.error('Error initializing HLS player:', error);
                throw error;
            }
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari, iOS)
            videoElement.src = streamingUrl;
            videoElement.addEventListener('loadedmetadata', function() {
                console.log('✅ Native HLS loaded, ready for playback');
            });
            console.log('✅ Native HLS Player initialized successfully');
            return null;
        } else {
            throw new Error('HLS not supported and hls.js not available');
        }
    },
    
    // Initialize FLV Player
    async initializeFLV(streamingUrl, videoElement, container) {
        if (typeof flvjs === 'undefined') {
            throw new Error('flv.js not loaded');
        }

        if (!flvjs.isSupported()) {
            throw new Error('FLV format is not supported by your browser');
        }

        try {
            const flvPlayer = flvjs.createPlayer({
                type: 'flv',
                url: streamingUrl,
                isLive: true,
                hasAudio: true,
                hasVideo: true
            });
            
            flvPlayer.attachMediaElement(videoElement);
            flvPlayer.load();
            
            flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
                // JANGAN auto-play di sini
                console.log('✅ FLV stream loaded, ready for playback');
            });

            flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail) => {
                console.error('FLV Player Error:', errorType, errorDetail);
                Helpers.handlePlayerError('FLV Playback Error: Unable to load stream.', container);
            });

            console.log('✅ FLV Player initialized successfully');
            this.currentPlayer = flvPlayer;
            return flvPlayer;
            
        } catch (error) {
            console.error('Error initializing FLV player:', error);
            throw error;
        }
    },
    
    // Initialize MP4 Player
    async initializeMP4(streamingUrl, videoElement) {
        videoElement.src = streamingUrl;
        videoElement.load();
        console.log('✅ MP4 Player initialized (paused)');
        return null;
    },
    
    // Main initialization method
    async initialize(streamingUrl, streamType, videoElement, container) {
        try {
            if (streamType === 'hls') {
                return await this.initializeHLS(streamingUrl, videoElement, container);
            } else if (streamType === 'flv') {
                return await this.initializeFLV(streamingUrl, videoElement, container);
            } else if (streamType === 'mp4') {
                return await this.initializeMP4(streamingUrl, videoElement);
            } else {
                throw new Error(`Unsupported stream type: ${streamType}`);
            }
        } catch (error) {
            console.error(`❌ Failed to initialize ${streamType} player:`, error);
            throw error;
        }
    },
    
    // Cleanup player
    destroy() {
        if (this.currentPlayer) {
            if (this.currentPlayer.destroy) {
                this.currentPlayer.destroy();
            }
            this.currentPlayer = null;
        }
    }
};

// Make service globally available
window.VideoService = VideoService;