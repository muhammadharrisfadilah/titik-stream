// ===== SUPABASE CONFIGURATION =====
const SUPABASE_URL = 'https://oodzcqhmvixwiyyroplf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZHpjcWhtdml4d2l5eXJvcGxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTI1ODIsImV4cCI6MjA3NzAyODU4Mn0.dFI-z-6Ja_jV7DZs6cgNH1L2f_z04Yv-shRzHghST_4';

let supabase = null;

// Wait for Supabase library to load
function waitForSupabase() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkSupabase = setInterval(() => {
            attempts++;
            
            if (typeof window.supabase !== 'undefined') {
                clearInterval(checkSupabase);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkSupabase);
                reject(new Error('Supabase library failed to load'));
            }
        }, 100);
    });
}

// Initialize Supabase with better error handling
async function initSupabase() {
    try {
        await waitForSupabase();
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false },
            global: { headers: { 'Content-Type': 'application/json' } }
        });
        console.log('✅ Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error);
        
        // Try to load from CDN as fallback
        console.log('⏳ Trying to load Supabase from CDN...');
        return await loadSupabaseFromCDN();
    }
}

// Fallback function to load Supabase from CDN
async function loadSupabaseFromCDN() {
    return new Promise((resolve) => {
        // Check if already loaded
        if (typeof window.supabase !== 'undefined') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase loaded from CDN');
            resolve(true);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            console.log('✅ Supabase library loaded from CDN');
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            resolve(true);
        };
        script.onerror = () => {
            console.warn('⚠️ Failed to load Supabase from CDN');
            resolve(false);
        };
        
        document.head.appendChild(script);
    });
}

// Helper function to select the best streaming source
function selectBestSource(sources) {
    if (!sources || !Array.isArray(sources)) return null;
    
    // Sort by preference: HLS > FLV > others
    const sortedSources = [...sources].sort((a, b) => {
        const priority = { 'HLS': 1, 'FLV': 2, 'default': 3 };
        const aPriority = priority[a.type] || priority.default;
        const bPriority = priority[b.type] || priority.default;
        return aPriority - bPriority;
    });
    
    // Find the first valid source
    return sortedSources.find(source => 
        source && 
        source.source && 
        (source.source.includes('.m3u8') || source.source.includes('.flv') || source.source.includes('http'))
    ) || sortedSources[0];
}

// Get streaming link from Supabase - FIXED VERSION
async function getStreamingLink(matchId) {
    if (!supabase) {
        console.error('❌ Supabase not initialized');
        return null;
    }

    try {
        console.log(`🔍 Fetching streaming data for match ID: ${matchId}`);
        
        // First try: Query live_streams table
        const { data, error } = await supabase
            .from('live_streams')
            .select('sources, is_live, home_team, away_team, league')
            .eq('match_id', matchId)
            .single();

        if (error) {
            console.log('ℹ️ Supabase error:', error);
            
            // If not found, try alternative table name
            if (error.code === 'PGRST116') {
                console.log(`ℹ️ No streaming data found in live_streams for match ID: ${matchId}`);
                
                // Try matches table as fallback
                const { data: altData, error: altError } = await supabase
                    .from('matches')
                    .select('link_streaming')
                    .eq('match_id', matchId)
                    .maybeSingle();
                
                if (altError) {
                    console.log('ℹ️ No streaming available for this match');
                    return null;
                }
                
                if (altData && altData.link_streaming) {
                    console.log('✅ Streaming link found in matches table');
                    return altData.link_streaming;
                }
                
                return null;
            }
            
            throw error;
        }

        console.log('📦 Stream data from Supabase:', data);

        // Check if we have sources
        if (!data || !data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
            console.log('ℹ️ Match found but no streaming sources');
            return null;
        }

        // Select the best source
        const bestSource = selectBestSource(data.sources);
        
        if (bestSource && bestSource.source) {
            console.log(`✅ Streaming link found: ${bestSource.type} - ${bestSource.source.substring(0, 80)}...`);
            return bestSource.source;
        } else {
            console.log('⚠️ No valid streaming source found');
            return null;
        }

    } catch (error) {
        console.error('❌ Exception while fetching streaming link:', error);
        return null;
    }
}

// Debug function to check Supabase data
async function debugSupabaseData(matchId) {
    if (!supabase) {
        console.error('Supabase not initialized');
        return null;
    }
    
    try {
        console.log(`🔍 Debugging Supabase data for match: ${matchId}`);
        
        const { data, error } = await supabase
            .from('live_streams')
            .select('*')
            .eq('match_id', matchId)
            .single();
            
        if (error) {
            console.error('Supabase debug error:', error);
            
            // Try matches table
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select('*')
                .eq('match_id', matchId)
                .single();
                
            if (matchesError) {
                console.error('Matches table error:', matchesError);
                return null;
            }
            
            console.log('📦 Data from matches table:', matchesData);
            return matchesData;
        }
        
        console.log('📦 Full Supabase data:', data);
        return data;
    } catch (error) {
        console.error('Debug error:', error);
        return null;
    }
}

// ===== VIDEO PLAYER FUNCTIONS =====
function getStreamType(url) {
    if (!url) return 'unknown';
    
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('.m3u8')) return 'hls';
    if (urlLower.includes('.flv')) return 'flv';
    if (urlLower.includes('.mp4')) return 'mp4';
    
    // Check by pattern
    if (url.includes('hls') || url.includes('m3u8')) return 'hls';
    if (url.includes('flv')) return 'flv';
    
    return 'unknown';
}

function handlePlayerErrorDisplay(errorMessage, container) {
    container.innerHTML = `
        <div class="video-wrapper">
            <div class="video-empty">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Player Error</div>
                <div class="empty-text">${errorMessage}</div>
                <button onclick="location.reload()" class="action-btn" style="margin-top: 16px;">Retry</button>
            </div>
        </div>
    `;
}

// Initialize HLS Player
async function initializeHLSPlayer(streamingUrl, videoElement, container) {
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        try {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            
            hls.loadSource(streamingUrl);
            hls.attachMedia(videoElement);
            
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                videoElement.play().catch(err => {
                    console.log('Auto-play prevented (HLS):', err);
                });
            });

            hls.on(Hls.Events.ERROR, function (event, data) {
                console.error('HLS Player Error:', data.type, data.details);
                if (data.fatal) {
                    handlePlayerErrorDisplay('HLS Playback Error: Unable to load stream.', container);
                }
            });

            console.log('✅ HLS Player initialized successfully');
            return hls;
            
        } catch (error) {
            console.error('Error initializing HLS player:', error);
            throw error;
        }
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari, iOS)
        videoElement.src = streamingUrl;
        videoElement.addEventListener('loadedmetadata', function() {
            videoElement.play().catch(err => console.log('Auto-play prevented (Native HLS):', err));
        });
        console.log('✅ Native HLS Player initialized successfully');
        return null;
    } else {
        throw new Error('HLS not supported and hls.js not available');
    }
}

// Initialize FLV Player
async function initializeFLVPlayer(streamingUrl, videoElement, container) {
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
            videoElement.play().catch(err => {
                console.log('Auto-play prevented:', err);
            });
        });

        flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail) => {
            console.error('FLV Player Error:', errorType, errorDetail);
            handlePlayerErrorDisplay('FLV Playback Error: Unable to load stream.', container);
        });

        console.log('✅ FLV Player initialized successfully');
        return flvPlayer;
        
    } catch (error) {
        console.error('Error initializing FLV player:', error);
        throw error;
    }
}

// Main video player initialization
async function initializeVideoPlayer(matchId) {
    const videoContainer = document.querySelector('.video-player-container');
    
    if (!videoContainer) {
        console.error('Video container element not found (.video-player-container)');
        return;
    }

    // Show loading state
    videoContainer.innerHTML = `
        <div class="video-wrapper">
            <div class="video-loading">
                <div class="spinner"></div>
                <div class="loading-text">Checking for stream... (Match ID: ${matchId})</div>
                <div class="loading-subtext">Querying Supabase database...</div>
            </div>
        </div>
    `;

    console.log(`🎬 Initializing video player for match: ${matchId}`);
    
    // Get streaming link from Supabase
    const streamingUrl = await getStreamingLink(matchId);
    
    console.log(`🔗 Stream URL result: ${streamingUrl ? 'Found' : 'Not found'}`);
    if (streamingUrl) {
        console.log(`📹 URL preview: ${streamingUrl.substring(0, 100)}...`);
    }

    // If no stream found
    if (!streamingUrl) {
        videoContainer.innerHTML = `
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
                        <button onclick="checkStreamAgain(${matchId})" class="action-btn">
                            🔄 Check Again
                        </button>
                        <button onclick="debugStreamData(${matchId})" class="action-btn secondary">
                            🐛 Debug Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Detect stream type
    const streamType = getStreamType(streamingUrl);
    console.log(`📹 Stream type detected: ${streamType}`);
    
    // Render video player
    videoContainer.innerHTML = `
        <div class="video-wrapper">
            <video id="videoElement" controls playsinline autoplay muted style="width: 100%; height: 100%; background: #000;"></video>
            <div class="stream-info-overlay">
                <span class="stream-type-badge">${streamType.toUpperCase()}</span>
                <span class="live-badge">🔴 LIVE</span>
            </div>
        </div>
        <div class="video-controls-bar">
            <div class="controls-left">
                <button onclick="togglePlayPause()" class="control-btn" id="playPauseBtn">⏸️</button>
                <button onclick="toggleMute()" class="control-btn" id="muteBtn">🔇</button>
                <span class="time-display" id="timeDisplay">00:00</span>
            </div>
            <div class="controls-right">
                <button onclick="reloadStream()" class="control-btn">🔄 Reload</button>
                <button onclick="toggleFullscreen()" class="control-btn">⛶ Fullscreen</button>
            </div>
        </div>
    `;
    
    const videoElement = document.getElementById('videoElement');
    
    // Initialize player based on stream type
    try {
        if (streamType === 'hls') {
            await initializeHLSPlayer(streamingUrl, videoElement, videoContainer);
        } else if (streamType === 'flv') {
            await initializeFLVPlayer(streamingUrl, videoElement, videoContainer);
        } else if (streamType === 'mp4') {
            // Direct MP4 playback
            videoElement.src = streamingUrl;
            videoElement.load();
            videoElement.play().catch(err => console.log('Auto-play prevented (MP4):', err));
            console.log('✅ MP4 Player initialized successfully');
        } else {
            throw new Error(`Unsupported stream type: ${streamType}`);
        }
        
        // Set up time display
        videoElement.addEventListener('timeupdate', updateTimeDisplay);
        videoElement.addEventListener('play', () => {
            document.getElementById('playPauseBtn').textContent = '⏸️';
        });
        videoElement.addEventListener('pause', () => {
            document.getElementById('playPauseBtn').textContent = '▶️';
        });
        videoElement.addEventListener('volumechange', () => {
            document.getElementById('muteBtn').textContent = videoElement.muted ? '🔇' : '🔊';
        });
        
    } catch (error) {
        console.error(`❌ Failed to initialize ${streamType} player:`, error);
        handlePlayerErrorDisplay(`Failed to initialize ${streamType.toUpperCase()} player: ${error.message}`, videoContainer);
    }
}

// ===== VIDEO CONTROLS FUNCTIONS =====
function togglePlayPause() {
    const videoElement = document.getElementById('videoElement');
    if (!videoElement) return;
    
    if (videoElement.paused) {
        videoElement.play();
        document.getElementById('playPauseBtn').textContent = '⏸️';
    } else {
        videoElement.pause();
        document.getElementById('playPauseBtn').textContent = '▶️';
    }
}

function toggleMute() {
    const videoElement = document.getElementById('videoElement');
    if (!videoElement) return;
    
    videoElement.muted = !videoElement.muted;
    document.getElementById('muteBtn').textContent = videoElement.muted ? '🔇' : '🔊';
}

function updateTimeDisplay() {
    const videoElement = document.getElementById('videoElement');
    const timeDisplay = document.getElementById('timeDisplay');
    if (!videoElement || !timeDisplay) return;
    
    const currentTime = formatTime(videoElement.currentTime);
    const duration = formatTime(videoElement.duration);
    timeDisplay.textContent = `${currentTime} / ${duration}`;
}

function formatTime(seconds) {
    if (!isFinite(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

async function reloadStream() {
    const videoElement = document.getElementById('videoElement');
    if (videoElement) {
        videoElement.src = videoElement.src + '?t=' + Date.now();
        videoElement.load();
        videoElement.play().catch(e => console.log('Autoplay prevented:', e));
    }
}

function toggleFullscreen() {
    const videoElement = document.getElementById('videoElement');
    if (!videoElement) return;
    
    if (!document.fullscreenElement) {
        if (videoElement.requestFullscreen) {
            videoElement.requestFullscreen();
        } else if (videoElement.webkitRequestFullscreen) {
            videoElement.webkitRequestFullscreen();
        } else if (videoElement.mozRequestFullScreen) {
            videoElement.mozRequestFullScreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
    }
}

// ===== DEBUG AND UTILITY FUNCTIONS =====
async function checkStreamAgain(matchId) {
    console.log(`🔄 Checking stream again for match: ${matchId}`);
    
    const videoContainer = document.querySelector('.video-player-container');
    if (videoContainer) {
        videoContainer.innerHTML = `
            <div class="video-wrapper">
                <div class="video-loading">
                    <div class="spinner"></div>
                    <div class="loading-text">Rechecking stream...</div>
                </div>
            </div>
        `;
    }
    
    // Small delay before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    await initializeVideoPlayer(matchId);
}

async function debugStreamData(matchId) {
    console.log(`🐛 Debugging stream data for match: ${matchId}`);
    const data = await debugSupabaseData(matchId);
    
    // Show debug info in alert
    if (data) {
        alert(`Supabase Data for Match ${matchId}:\n\n` + 
              JSON.stringify(data, null, 2).substring(0, 1000) + '...');
    } else {
        alert(`No data found in Supabase for Match ${matchId}`);
    }
}

// ===== APP CONFIGURATION =====
const App = {
    version: '2.0.0',
    config: {
        API_BASE: 'https://www.fotmob.com/api',
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        CACHE_TTL: 5 * 60 * 1000,
        ENABLE_CACHE: true,
        ENABLE_MOCK_DATA: false
    },
    
    state: {
        matchId: null,
        data: {
            details: null,
            facts: null,
            lineups: null,
            stats: null,
            header: null,
            general: null,
            matchStats: null
        },
        activeTab: 'overview',
        cache: new Map(),
        retryCount: 0,
        isLoading: false,
        isLive: false
    },
    
    elements: {},
    
    init() {
        this.bindElements();
        this.bindEvents();
        
        const urlParams = new URLSearchParams(window.location.search);
        const matchId = urlParams.get('matchId');
        
        if (!matchId) {
            this.showError('Match ID not found. Please go back and select a match.');
            return;
        }
        
        this.state.matchId = matchId;
        this.initializeApp();
    },
    
    async initializeApp() {
        try {
            const supabaseReady = await initSupabase();
            
            if (!supabaseReady) {
                console.warn('⚠️ Supabase not available, video player will be disabled');
            }
            
            await initializeVideoPlayer(this.state.matchId);
            await this.loadMatch();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    },
    
    bindElements() {
        this.elements = {
            matchHeader: document.getElementById('matchHeader'),
            content: document.getElementById('content'),
            loading: document.getElementById('loading'),
            tabs: document.getElementById('tabs'),
            toastContainer: document.getElementById('toastContainer'),
            backBtn: document.querySelector('.back-btn')
        };
    },
    
    bindEvents() {
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }
        
        if (this.elements.tabs) {
            this.elements.tabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab');
                if (tab) {
                    this.switchTab(tab.dataset.tab);
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.goBack();
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.refreshData();
            }
        });
    },
    
    async loadMatch() {
        console.log(`📥 Loading match ${this.state.matchId}...`);
        this.setLoading(true);
        
        try {
            await this.fetchAllData(this.state.matchId);
            this.render();
        } catch (error) {
            console.error('❌ Failed to load match:', error);
            this.showError('Failed to load match details. Please check your connection.');
        } finally {
            this.setLoading(false);
        }
    },
    
    async fetchAllData(matchId) {
        console.log('🔄 [FETCH] Starting data fetch for matchId:', matchId);
        
        try {
            const url = `${this.config.API_BASE}/data/matchDetails?matchId=${matchId}`;
            console.log('🌐 [FETCH] Request URL:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            console.log('📡 [FETCH] Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                console.error('❌ [FETCH] HTTP Error:', response.status);
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ [FETCH] Raw JSON data received:', data);
            console.log('📊 [FETCH] Data structure keys:', Object.keys(data));
            
            console.log('🔍 [EXTRACT] Starting data extraction...');
            
            const extractedHeader = this.extractHeader(data);
            console.log('✓ [EXTRACT] Header:', extractedHeader);
            
            const extractedGeneral = this.extractGeneralInfo(data);
            console.log('✓ [EXTRACT] General info:', extractedGeneral);
            
            const extractedFacts = this.extractMatchFacts(data);
            console.log('✓ [EXTRACT] Match facts:', extractedFacts);
            
            const extractedLineups = this.extractLineups(data);
            console.log('✓ [EXTRACT] Lineups:', extractedLineups);
            
            const extractedStats = this.extractStats(data);
            console.log('✓ [EXTRACT] Stats:', extractedStats);
            
            const extractedMatchStats = this.extractMatchStats(data);
            console.log('✓ [EXTRACT] Match stats:', extractedMatchStats);
            
            this.state.data = {
                details: data,
                facts: extractedFacts,
                lineups: extractedLineups,
                stats: extractedStats,
                header: extractedHeader,
                general: extractedGeneral,
                matchStats: extractedMatchStats
            };
            
            console.log('✅ [FETCH] All data extracted successfully:', this.state.data);
            return this.state.data;
            
        } catch (error) {
            console.error('❌ [FETCH] Fatal error:', error);
            console.error('❌ [FETCH] Error stack:', error.stack);
            throw error;
        }
    },
    
    extractHeader(data) {
        console.log('🔍 [HEADER] Extracting header data...');
        console.log('📥 [HEADER] Input data.header:', data.header);
        console.log('📥 [HEADER] Input data.general:', data.general);
        
        if (data.header) {
            console.log('✅ [HEADER] Using data.header');
            return data.header;
        }
        
        console.log('⚠️ [HEADER] No data.header found, building from general');
        const header = {
            teams: [
                { 
                    name: data.general?.homeTeam?.name || 'Home Team',
                    score: data.header?.teams?.[0]?.score || 0,
                    imageUrl: `https://images.fotmob.com/image_resources/logo/teamlogo/${data.general?.homeTeam?.id}_small.png`
                },
                { 
                    name: data.general?.awayTeam?.name || 'Away Team',
                    score: data.header?.teams?.[1]?.score || 0,
                    imageUrl: `https://images.fotmob.com/image_resources/logo/teamlogo/${data.general?.awayTeam?.id}_small.png`
                }
            ],
            status: {
                reason: {
                    long: data.general?.status || 'Match Details'
                }
            }
        };
        
        console.log('✓ [HEADER] Built header:', header);
        return header;
    },
    
    extractGeneralInfo(data) {
        console.log('🔍 [GENERAL] Extracting general info...');
        console.log('📥 [GENERAL] Input data.general:', data.general);
        
        if (data.general) {
            console.log('✅ [GENERAL] Using data.general');
            return data.general;
        }
        
        console.log('⚠️ [GENERAL] No data.general found, building from available data');
        const general = {
            leagueName: data.league?.name || 'Unknown League',
            matchTimeUTCDate: data.matchTimeUTC || new Date().toISOString(),
            matchRound: data.round || 'N/A',
            venueName: data.venue?.name || 'Unknown Venue',
            referee: data.referee?.name || 'N/A'
        };
        
        console.log('✓ [GENERAL] Built general info:', general);
        return general;
    },
    
    extractMatchFacts(data) {
        console.log('🔍 [FACTS] Extracting match facts...');
        console.log('📥 [FACTS] Checking data.content?.matchFacts:', data.content?.matchFacts);
        console.log('📥 [FACTS] Checking data.matchFacts:', data.matchFacts);
        
        if (data.content?.matchFacts) {
            console.log('✅ [FACTS] Using data.content.matchFacts');
            return data.content.matchFacts;
        }
        if (data.matchFacts) {
            console.log('✅ [FACTS] Using data.matchFacts');
            return data.matchFacts;
        }
        
        console.log('⚠️ [FACTS] No match facts found, returning empty object');
        return { stats: {}, general: {} };
    },
    
    extractLineups(data) {
        if (data.content?.lineup) {
            return this.formatLineupData(data.content.lineup);
        }
        if (data.lineup) {
            return this.formatLineupData(data.lineup);
        }
        if (data.teams) {
            return this.formatLineupData(data.teams);
        }
        return null;
    },
    
    formatLineupData(lineupData) {
        const teams = [];
        
        const processTeam = (teamData, isHome) => {
            if (!teamData) return;
            
            let starting = [];
            let substitutes = [];
            
            if (teamData.players) {
                if (Array.isArray(teamData.players)) {
                    starting = teamData.players.filter(p => 
                        p.lineup === 'start' || p.isFirstEleven || p.starter
                    );
                    substitutes = teamData.players.filter(p => 
                        p.lineup !== 'start' && !p.isFirstEleven && !p.starter
                    );
                } else if (teamData.players.starting && teamData.players.substitutes) {
                    starting = teamData.players.starting;
                    substitutes = teamData.players.substitutes;
                }
            } else {
                starting = teamData.starters || [];
                substitutes = teamData.substitutes || [];
            }
            
            if (starting.length === 0 && teamData.lineup) {
                starting = teamData.lineup;
            }

            // Ensure player names are standardized for display
            starting = starting.map(p => ({
                ...p,
                name: p.name?.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()
            }));
            substitutes = substitutes.map(p => ({
                ...p,
                name: p.name?.fullName || p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()
            }));
            
            return {
                name: teamData.name || (isHome ? 'Home Team' : 'Away Team'),
                formation: teamData.formation || teamData.formationUsed || 'N/A',
                players: {
                    starting: starting,
                    substitutes: substitutes
                },
                manager: teamData.manager
            };
        };
        
        const homeTeamData = lineupData.homeTeam ? processTeam(lineupData.homeTeam, true) : null;
        const awayTeamData = lineupData.awayTeam ? processTeam(lineupData.awayTeam, false) : null;

        if (homeTeamData) teams.push(homeTeamData);
        if (awayTeamData) teams.push(awayTeamData);
        
        return { teams };
    },
    
    extractStats(data) {
        console.log('🔍 [STATS] Extracting stats...');
        console.log('📥 [STATS] Checking data.content?.stats?.stats:', data.content?.stats?.stats);
        console.log('📥 [STATS] Checking data.stats:', data.stats);
        
        if (data.content?.stats?.stats) {
            console.log('✅ [STATS] Using data.content.stats.stats');
            return data.content.stats.stats;
        }
        if (data.stats) {
            console.log('✅ [STATS] Using data.stats');
            return data.stats;
        }
        
        console.log('⚠️ [STATS] No stats found, returning empty object');
        return { home: {}, away: {} };
    },
    
    extractMatchStats(data) {
        const stats = {
            possession: { home: 50, away: 50 },
            shots: { home: 0, away: 0 },
            shotsOnTarget: { home: 0, away: 0 },
            corners: { home: 0, away: 0 },
            fouls: { home: 0, away: 0 }
        };
        
        return stats;
    },
    
    render() {
        console.log('🎨 [RENDER] Starting render...');
        console.log('📊 [RENDER] Current state.data:', this.state.data);
        console.log('📑 [RENDER] Active tab:', this.state.activeTab);
        
        try {
            this.renderHeader();
            console.log('✓ [RENDER] Header rendered');
            
            this.renderTabContent();
            console.log('✓ [RENDER] Tab content rendered');
            
            this.updateTabButtons();
            console.log('✓ [RENDER] Tab buttons updated');
            
            console.log('✅ [RENDER] Render complete');
        } catch (error) {
            console.error('❌ [RENDER] Render error:', error);
            console.error('❌ [RENDER] Error stack:', error.stack);
        }
    },
    
    renderHeader() {
        console.log('🎨 [RENDER-HEADER] Rendering header...');
        
        const { header, general } = this.state.data;
        console.log('📥 [RENDER-HEADER] Header data:', header);
        console.log('📥 [RENDER-HEADER] General data:', general);
        
        const homeTeam = header?.teams?.[0] || { name: 'Home', score: 0 };
        const awayTeam = header?.teams?.[1] || { name: 'Away', score: 0 };
        const leagueName = general?.leagueName || 'Football Match';
        const matchTime = general?.matchTimeUTCDate ? 
            this.formatDate(general.matchTimeUTCDate) : 'Time TBD';
        const status = header?.status?.reason?.long || 'Match Details';
        
        console.log('✓ [RENDER-HEADER] Home team:', homeTeam);
        console.log('✓ [RENDER-HEADER] Away team:', awayTeam);
        console.log('✓ [RENDER-HEADER] League:', leagueName);
        console.log('✓ [RENDER-HEADER] Match time:', matchTime);
        console.log('✓ [RENDER-HEADER] Status:', status);
        
        const html = `
            <div class="match-header">
                <div class="match-meta">
                    <div class="league">${leagueName}</div>
                    <div class="match-time">${matchTime}</div>
                </div>
                
                <div class="teams">
                    <div class="team home">
                        ${homeTeam.imageUrl ? 
                            `<img src="${homeTeam.imageUrl}" class="team-logo" alt="${homeTeam.name}">` 
                            : ''}
                        <div class="team-name">${homeTeam.name}</div>
                        <div class="team-score">${homeTeam.score ?? '-'}</div>
                    </div>
                    
                    <div class="vs">VS</div>
                    
                    <div class="team away">
                        ${awayTeam.imageUrl ? 
                            `<img src="${awayTeam.imageUrl}" class="team-logo" alt="${awayTeam.name}">` 
                            : ''}
                        <div class="team-name">${awayTeam.name}</div>
                        <div class="team-score">${awayTeam.score ?? '-'}</div>
                    </div>
                </div>
                
                <div class="text-center">
                    <div class="match-status">${status}</div>
                </div>
            </div>
        `;
        
        if (this.elements.matchHeader) {
            this.elements.matchHeader.innerHTML = html;
            console.log('✅ [RENDER-HEADER] Header HTML injected');
        } else {
            console.error('❌ [RENDER-HEADER] matchHeader element not found!');
        }
    },
    
    renderTabContent() {
        let html = '';
        
        switch(this.state.activeTab) {
            case 'overview':
                html = this.renderOverview();
                break;
            case 'stats':
                html = this.renderStats();
                break;
            case 'lineups':
                html = this.renderLineups();
                break;
            case 'facts':
                html = this.renderFacts();
                break;
        }
        
        if (this.elements.content) {
            this.elements.content.innerHTML = html;
        }
    },
    
    renderOverview() {
        const { details, facts } = this.state.data;
        
        // Extract key events
        const events = facts?.events?.events || [];
        const goals = events.filter(e => e.type === 'Goal');
        const cards = events.filter(e => e.type === 'Card');
        
        // Get quick stats from facts
        const stats = facts?.events?.stats || [];
        const possessionStat = stats.find(s => s.title?.toLowerCase().includes('possession'));
        const shotsStat = stats.find(s => s.title?.toLowerCase().includes('shots') && !s.title?.toLowerCase().includes('on target'));
        const shotsOnTargetStat = stats.find(s => s.title?.toLowerCase().includes('on target'));
        
        return `
            <div class="tab-content active">
                <!-- Match Status Banner -->
                <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                    <div style="padding: 20px; text-align: center;">
                        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">
                            ${details?.general?.started ? (details?.general?.finished ? '⏹️ FULL TIME' : '🔴 LIVE') : '⏰ UPCOMING'}
                        </div>
                        <div style="font-size: 32px; font-weight: bold; margin: 12px 0;">
                            ${details?.header?.teams?.[0]?.score || 0} - ${details?.header?.teams?.[1]?.score || 0}
                        </div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            ${details?.header?.status?.reason?.long || 'Match Details'}
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                ${possessionStat || shotsStat || shotsOnTargetStat ? `
                    <div class="card">
                        <div class="card-title">📊 Quick Stats</div>
                        <div class="card-content" style="padding: 16px;">
                            ${possessionStat ? `
                                <div class="stat-row" style="margin-bottom: 20px;">
                                    <div class="stat-team home" style="font-size: 18px; font-weight: bold; color: #4CAF50;">
                                        ${possessionStat.stats?.[0] || 0}%
                                    </div>
                                    <div class="stat-content" style="flex: 1; margin: 0 16px;">
                                        <div style="height: 32px; background: #f0f0f0; border-radius: 16px; overflow: hidden; position: relative;">
                                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${possessionStat.stats?.[0] || 50}%; background: linear-gradient(90deg, #4CAF50, #66BB6A);"></div>
                                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: ${possessionStat.stats?.[1] || 50}%; background: linear-gradient(90deg, #42A5F5, #2196F3);"></div>
                                        </div>
                                        <div class="stat-label" style="text-align: center; margin-top: 8px; font-weight: 600;">⚽ Possession</div>
                                    </div>
                                    <div class="stat-team away" style="font-size: 18px; font-weight: bold; color: #2196F3;">
                                        ${possessionStat.stats?.[1] || 0}%
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
                                ${shotsStat ? `
                                    <div style="text-align: center; padding: 16px; background: #f8f9fa; border-radius: 12px;">
                                        <div style="font-size: 24px; font-weight: bold; color: #333;">
                                            ${(shotsStat.stats?.[0] || 0) + (shotsStat.stats?.[1] || 0)}
                                        </div>
                                        <div style="font-size: 12px; color: #666; margin-top: 4px;">🎯 Total Shots</div>
                                        <div style="font-size: 14px; color: #999; margin-top: 4px;">
                                            ${shotsStat.stats?.[0] || 0} - ${shotsStat.stats?.[1] || 0}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${shotsOnTargetStat ? `
                                    <div style="text-align: center; padding: 16px; background: #f8f9fa; border-radius: 12px;">
                                        <div style="font-size: 24px; font-weight: bold; color: #333;">
                                            ${(shotsOnTargetStat.stats?.[0] || 0) + (shotsOnTargetStat.stats?.[1] || 0)}
                                        </div>
                                        <div style="font-size: 12px; color: #666; margin-top: 4px;">🎯 On Target</div>
                                        <div style="font-size: 14px; color: #999; margin-top: 4px;">
                                            ${shotsOnTargetStat.stats?.[0] || 0} - ${shotsOnTargetStat.stats?.[1] || 0}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Match Timeline -->
                ${goals.length > 0 || cards.length > 0 ? `
                    <div class="card">
                        <div class="card-title">⏱️ Match Timeline</div>
                        <div class="card-content" style="padding: 16px;">
                            <div style="position: relative; padding: 16px 0;">
                                ${events
                                    .filter(e => e.type === 'Goal' || e.type === 'Card')
                                    .sort((a, b) => (a.time || 0) - (b.time || 0))
                                    .map(event => {
                                        const isHome = event.isHome;
                                        let icon = '⚽';
                                        let color = '#4CAF50';
                                        
                                        if (event.type === 'Card') {
                                            icon = event.card === 'Yellow' ? '🟨' : '🟥';
                                            color = event.card === 'Yellow' ? '#FFC107' : '#F44336';
                                        }
                                        
                                        return `
                                            <div style="display: flex; align-items: center; margin-bottom: 16px; ${isHome ? '' : 'flex-direction: row-reverse;'}">
                                                <div style="flex: 1; text-align: ${isHome ? 'right' : 'left'}; padding: 0 12px;">
                                                    <div style="font-weight: 600; color: #333;">${event.nameStr || 'Player'}</div>
                                                    <div style="font-size: 12px; color: #666;">${event.type}</div>
                                                </div>
                                                <div style="min-width: 60px; text-align: center;">
                                                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: ${color}; color: white; border-radius: 50%; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                                                        ${icon}
                                                    </div>
                                                    <div style="font-size: 12px; font-weight: bold; color: #666; margin-top: 4px;">${event.time}'</div>
                                                </div>
                                                <div style="flex: 1;"></div>
                                            </div>
                                        `;
                                    }).join('')}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Match Information -->
                <div class="card">
                    <div class="card-title">ℹ️ Match Information</div>
                    <div class="card-content" style="padding: 16px;">
                        <div style="display: grid; gap: 12px;">
                            <div style="display: flex; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                <div style="width: 32px; height: 32px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">🏆</div>
                                <div style="margin-left: 12px; flex: 1;">
                                    <div style="font-size: 12px; color: #666;">Competition</div>
                                    <div style="font-weight: 600; color: #333;">${details?.general?.leagueName || 'Unknown League'}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                <div style="width: 32px; height: 32px; background: #f093fb; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">📅</div>
                                <div style="margin-left: 12px; flex: 1;">
                                    <div style="font-size: 12px; color: #666;">Round</div>
                                    <div style="font-weight: 600; color: #333;">${details?.general?.matchRound || details?.general?.leagueRoundName || 'N/A'}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                <div style="width: 32px; height: 32px; background: #4facfe; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">🏟️</div>
                                <div style="margin-left: 12px; flex: 1;">
                                    <div style="font-size: 12px; color: #666;">Venue</div>
                                    <div style="font-weight: 600; color: #333;">${facts?.infoBox?.Stadium?.name || facts?.infoBox?.['Match Date']?.venue || 'Unknown'}</div>
                                </div>
                            </div>
                            
                            <div style="display: flex; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                <div style="width: 32px; height: 32px; background: #43e97b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">👨‍⚖️</div>
                                <div style="margin-left: 12px; flex: 1;">
                                    <div style="font-size: 12px; color: #666;">Referee</div>
                                    <div style="font-weight: 600; color: #333;">${facts?.infoBox?.Referee?.text || 'N/A'}</div>
                                </div>
                            </div>
                            
                            ${facts?.infoBox?.Attendance ? `
                                <div style="display: flex; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                                    <div style="width: 32px; height: 32px; background: #fa709a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">👥</div>
                                    <div style="margin-left: 12px; flex: 1;">
                                        <div style="font-size: 12px; color: #666;">Attendance</div>
                                        <div style="font-weight: 600; color: #333;">${facts.infoBox.Attendance.name}</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Player of the Match -->
                ${facts?.playerOfTheMatch ? `
                    <div class="card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none;">
                        <div style="padding: 20px;">
                            <div style="text-align: center; margin-bottom: 16px;">
                                <div style="font-size: 40px; margin-bottom: 8px;">⭐</div>
                                <div style="font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Player of the Match</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 24px; font-weight: bold; margin-bottom: 4px;">${facts.playerOfTheMatch.name?.fullName || facts.playerOfTheMatch.name}</div>
                                <div style="font-size: 14px; opacity: 0.9; margin-bottom: 12px;">${facts.playerOfTheMatch.teamName}</div>
                                ${facts.playerOfTheMatch.rating?.num ? `
                                    <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 20px; font-size: 20px; font-weight: bold;">
                                        ⭐ ${facts.playerOfTheMatch.rating.num}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Top Players -->
                ${facts?.topPlayers ? `
                    <div class="card">
                        <div class="card-title">🌟 Top Performers</div>
                        <div class="card-content" style="padding: 16px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <!-- Home Top Players -->
                                <div>
                                    <h4 style="font-size: 14px; color: #4CAF50; margin-bottom: 12px; font-weight: 600;">
                                        ${details?.header?.teams?.[0]?.name || 'Home'}
                                    </h4>
                                    ${facts.topPlayers.homeTopPlayers?.slice(0, 3).map((player, i) => `
                                        <div style="display: flex; align-items: center; padding: 8px; background: ${i === 0 ? '#fff8e1' : '#f8f9fa'}; border-radius: 8px; margin-bottom: 8px; ${i === 0 ? 'border: 2px solid #FFD700;' : ''}">
                                            <div style="width: 28px; height: 28px; background: ${i === 0 ? '#FFD700' : '#4CAF50'}; color: ${i === 0 ? '#000' : 'white'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
                                                ${i + 1}
                                            </div>
                                            <div style="margin-left: 10px; flex: 1;">
                                                <div style="font-size: 13px; font-weight: 600;">${player.name?.fullName || player.name}</div>
                                                <div style="font-size: 11px; color: #666;">${player.positionStringShort || player.role || ''}</div>
                                            </div>
                                            ${player.rating?.num ? `
                                                <div style="background: #FFD700; color: #000; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 13px;">
                                                    ${player.rating.num}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('') || '<div style="color: #999; text-align: center; padding: 20px;">No data</div>'}
                                </div>
                                
                                <!-- Away Top Players -->
                                <div>
                                    <h4 style="font-size: 14px; color: #2196F3; margin-bottom: 12px; font-weight: 600;">
                                        ${details?.header?.teams?.[1]?.name || 'Away'}
                                    </h4>
                                    ${facts.topPlayers.awayTopPlayers?.slice(0, 3).map((player, i) => `
                                        <div style="display: flex; align-items: center; padding: 8px; background: ${i === 0 ? '#fff8e1' : '#f8f9fa'}; border-radius: 8px; margin-bottom: 8px; ${i === 0 ? 'border: 2px solid #FFD700;' : ''}">
                                            <div style="width: 28px; height: 28px; background: ${i === 0 ? '#FFD700' : '#2196F3'}; color: ${i === 0 ? '#000' : 'white'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
                                                ${i + 1}
                                            </div>
                                            <div style="margin-left: 10px; flex: 1;">
                                                <div style="font-size: 13px; font-weight: 600;">${player.name?.fullName || player.name}</div>
                                                <div style="font-size: 11px; color: #666;">${player.positionStringShort || player.role || ''}</div>
                                            </div>
                                            ${player.rating?.num ? `
                                                <div style="background: #FFD700; color: #000; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 13px;">
                                                    ${player.rating.num}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('') || '<div style="color: #999; text-align: center; padding: 20px;">No data</div>'}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    renderStats() {
        const { facts, details } = this.state.data;
        
        if (!facts?.events?.stats) {
            return `<div class="tab-content active"><div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Statistics not available</div></div></div>`;
        }
        
        const stats = facts.events.stats;
        
        return `
            <div class="tab-content active">
                <div class="card">
                    <div class="card-title">📊 Detailed Match Statistics</div>
                    <div class="card-content" style="padding: 20px;">
                        ${stats.map(stat => {
                            const homeValue = stat.stats?.[0] || 0;
                            const awayValue = stat.stats?.[1] || 0;
                            
                            // Calculate percentages
                            let homePercent = 50;
                            let awayPercent = 50;
                            
                            if (stat.title?.toLowerCase().includes('possession')) {
                                homePercent = homeValue;
                                awayPercent = awayValue;
                            } else {
                                const total = homeValue + awayValue;
                                if (total > 0) {
                                    homePercent = Math.round((homeValue / total) * 100);
                                    awayPercent = 100 - homePercent;
                                }
                            }
                            
                            // Get emoji for stat type
                            let emoji = '📊';
                            const title = stat.title?.toLowerCase() || '';
                            if (title.includes('possession')) emoji = '⚽';
                            else if (title.includes('shots')) emoji = '🎯';
                            else if (title.includes('passes')) emoji = '🔄';
                            else if (title.includes('corners')) emoji = '🚩';
                            else if (title.includes('fouls')) emoji = '⚠️';
                            else if (title.includes('yellow')) emoji = '🟨';
                            else if (title.includes('red')) emoji = '🟥';
                            else if (title.includes('offsides')) emoji = '🚫';
                            else if (title.includes('saves')) emoji = '🧤';
                            
                            return `
                                <div style="margin-bottom: 24px;">
                                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                                        <div style="font-size: 20px; font-weight: bold; color: #4CAF50; min-width: 60px; text-align: center;">
                                            ${homeValue}${stat.title?.includes('possession') ? '%' : ''}
                                        </div>
                                        <div style="flex: 1; text-align: center;">
                                            <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">
                                                ${emoji} ${stat.title}
                                            </div>
                                            <div style="height: 8px; background: #e0e0e0; border-radius: 10px; overflow: hidden; position: relative;">
                                                <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${homePercent}%; background: linear-gradient(90deg, #4CAF50, #66BB6A); transition: width 0.3s ease;"></div>
                                                <div style="position: absolute; right: 0; top: 0; bottom: 0; width: ${awayPercent}%; background: linear-gradient(90deg, #42A5F5, #2196F3); transition: width 0.3s ease;"></div>
                                            </div>
                                            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #999;">
                                                <span>${homePercent}%</span>
                                                <span>${awayPercent}%</span>
                                            </div>
                                        </div>
                                        <div style="font-size: 20px; font-weight: bold; color: #2196F3; min-width: 60px; text-align: center;">
                                            ${awayValue}${stat.title?.includes('possession') ? '%' : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Stats Comparison Cards -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                    ${stats.slice(0, 6).map(stat => {
                        const homeValue = stat.stats?.[0] || 0;
                        const awayValue = stat.stats?.[1] || 0;
                        const total = homeValue + awayValue;
                        
                        return `
                            <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                                <div style="padding: 16px; text-align: center;">
                                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">${stat.title}</div>
                                    <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">${total}</div>
                                    <div style="font-size: 14px; opacity: 0.8;">${homeValue} - ${awayValue}</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },
    
    renderLineups() {
        const { lineups, details } = this.state.data;
        if (!lineups?.teams?.length) {
            return `<div class="tab-content active" style="padding: 20px;"><div class="empty"><div class="empty-icon">👥</div><div class="empty-title">Lineup not available</div></div></div>`;
        }

        // Helper function for rendering player list (Starter/Sub) - Improved Styling
        const renderPlayerList = (players, type, teamIndex) => {
            const isStarting = type === 'starting';
            const teamColor = teamIndex === 0 ? '#4CAF50' : '#2196F3';
            const boxColor = isStarting ? teamColor : '#9E9E9E';

            return players.length ? `
                <div style="padding: 20px 0; ${!isStarting ? 'border-top: 1px dashed #e0e0e0; margin-top: 20px;' : ''}">
                    <div style="display: flex; align-items: center; margin-bottom: 20px;">
                        <h3 style="font-size: 20px; font-weight: 700; color: ${isStarting ? '#333' : '#666'}; margin: 0 10px 0 0;">
                            ${isStarting ? '⭐ Starting XI' : '🔄 Substitutes'}
                        </h3>
                        <span style="background: #f0f0f0; color: #333; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${players.length} Players 
                        </span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                        ${players.map(player => `
                            <div style="
                                display: flex; 
                                align-items: center; 
                                padding: 15px; 
                                background: #fff; 
                                border-radius: 12px; 
                                border: 1px solid #eee; 
                                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                                transition: all 0.2s;
                                cursor: pointer;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'"
                            >
                                <div style="position: relative; min-width: 45px; height: 45px; background: ${teamColor}; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; margin-right: 15px;">
                                    ${player.shirtNumber || '-'}
                                    ${player.captain || player.isCaptain ? `
                                        <div style="position: absolute; top: -8px; right: -8px; background: #FFD700; color: #333; border-radius: 50%; width: 16px; height: 16px; line-height: 16px; text-align: center; font-size: 10px; font-weight: 900;">C</div>
                                    ` : ''}
                                </div>
                                
                                <div style="flex: 1;">
                                    <div style="font-weight: 700; font-size: 16px; color: #1a1a1a;">
                                        ${player.name}
                                    </div>
                                    <div style="font-size: 13px; color: #666;">
                                        ${player.role?.name || player.position || 'N/A'} 
                                    </div>
                                </div>
                                
                                <div style="display: flex; gap: 8px; align-items: center; margin-left: 10px;">
                                    ${player.rating?.num ? `
                                        <div style="background: #FFC107; color: #333; padding: 5px 10px; border-radius: 20px; font-weight: 700; font-size: 13px;">
                                            ${player.rating.num}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : '';
        };

        return `
            <div class="tab-content active" style="padding: 20px;">
                ${lineups.teams.map((team, index) => {
                    const isHome = index === 0;
                    const primaryColor = isHome ? '#1e3c72' : '#2a5298';
                    const lightGradient = isHome ? 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';

                    return `
                        <div class="card" style="margin-bottom: 30px; overflow: hidden; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);">
                            
                            <div style="background: ${lightGradient}; color: ${primaryColor}; padding: 28px 24px; border-bottom: 3px solid ${primaryColor};">
                                <h2 style="font-size: 32px; font-weight: 900; margin: 0; color: #333;">${team.name}</h2>
                                <p style="font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">${team.formation}</p>
                            </div>

                            <div style="padding: 24px 24px 10px 24px; background: #f8f8f8;">
                                <!-- Pitch Visualization removed for simplicity -->
                                <div style="text-align: center; padding: 40px 20px; background: #E8F5E9; border-radius: 12px; margin-bottom: 20px;">
                                    <div style="font-size: 48px; margin-bottom: 16px;">⚽</div>
                                    <div style="font-size: 20px; font-weight: bold; color: #333;">Formation: ${team.formation}</div>
                                    <div style="font-size: 14px; color: #666; margin-top: 8px;">Click players for details</div>
                                </div>
                            </div>

                            ${team.manager?.name ? `
                                <div style="display: flex; align-items: center; padding: 20px 24px; border-bottom: 1px solid #eee; background: white;">
                                    <div style="min-width: 40px; height: 40px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">
                                        👔
                                    </div>
                                    <div style="margin-left: 16px; flex: 1;">
                                        <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Head Coach</div>
                                        <div style="font-weight: 700; font-size: 18px; color: #333;"> 
                                            ${team.manager.name}
                                        </div>
                                    </div>
                                </div>
                            ` : ''}

                            <div style="padding: 0 24px 20px 24px; background: white;">
                                ${renderPlayerList(team.players?.starting || [], 'starting', index)}
                                ${renderPlayerList(team.players?.substitutes || [], 'substitutes', index)}
                            </div>

                        </div> 
                    `;
                }).join('')}
            </div>
        `;
    },
    
    renderFacts() {
        const { details, facts } = this.state.data;
        
        if (!details && !facts) {
            return `<div class="tab-content active"><div class="empty"><div class="empty-icon">📋</div><div class="empty-title">No match facts available</div></div></div>`;
        }
        
        const events = facts?.events?.events || [];
        
        // Categorize events
        const goals = events.filter(e => e.type === 'Goal');
        const cards = events.filter(e => e.type === 'Card');
        const substitutions = events.filter(e => e.type === 'Substitution');
        const homeGoals = goals.filter(e => e.isHome);
        const awayGoals = goals.filter(e => !e.isHome);
        
        return `
            <div class="tab-content active">
                <!-- Match Summary Card -->
                <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                    <div style="padding: 24px;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Match Summary</div>
                            <div style="font-size: 48px; font-weight: bold; margin: 16px 0;">
                                ${details?.header?.teams?.[0]?.score || 0} : ${details?.header?.teams?.[1]?.score || 0}
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; max-width: 400px; margin: 0 auto;">
                                <div style="text-align: right; font-size: 16px; font-weight: 600;">
                                    ${details?.header?.teams?.[0]?.name || 'Home'}
                                </div>
                                <div style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                                    VS
                                </div>
                                <div style="text-align: left; font-size: 16px; font-weight: 600;">
                                    ${details?.header?.teams?.[1]?.name || 'Away'}
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 20px;">
                            <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
                                <div style="font-size: 24px; font-weight: bold;">⚽ ${goals.length}</div>
                                <div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">Goals</div>
                            </div>
                            <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
                                <div style="font-size: 24px; font-weight: bold;">🟨 ${cards.filter(c => c.card === 'Yellow').length}</div>
                                <div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">Yellow Cards</div>
                            </div>
                            <div style="text-align: center; background: rgba(255,255,255,0.1); padding: 12px; border-radius: 10px;">
                                <div style="font-size: 24px; font-weight: bold;">🔄 ${substitutions.length}</div>
                                <div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">Substitutions</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Goals Timeline -->
                ${goals.length > 0 ? `
                    <div class="card">
                        <div class="card-title">⚽ Goals</div>
                        <div class="card-content" style="padding: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px;">
                                <!-- Home Goals -->
                                <div>
                                    <h4 style="font-size: 14px; color: #4CAF50; margin-bottom: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 4px; height: 20px; background: #4CAF50; border-radius: 2px;"></div>
                                        ${details?.header?.teams?.[0]?.name || 'Home'}
                                    </h4>
                                    ${homeGoals.length > 0 ? homeGoals.map(goal => `
                                        <div style="display: flex; align-items: start; margin-bottom: 16px; padding: 12px; background: #E8F5E9; border-radius: 10px; border-left: 3px solid #4CAF50;">
                                            <div style="min-width: 48px; height: 48px; background: #4CAF50; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);">
                                                ⚽
                                            </div>
                                            <div style="margin-left: 12px; flex: 1;">
                                                <div style="font-weight: 600; font-size: 15px; color: #333; margin-bottom: 4px;">
                                                    ${goal.nameStr || 'Player'}
                                                </div>
                                                <div style="font-size: 13px; color: #666;">
                                                    ${goal.time}' ${goal.eventString ? `• ${goal.eventString}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : '<div style="color: #999; text-align: center; padding: 20px; font-size: 14px;">No goals</div>'}
                                </div>
                                
                                <!-- Divider -->
                                <div style="width: 2px; background: linear-gradient(to bottom, #4CAF50, #2196F3); border-radius: 2px;"></div>
                                
                                <!-- Away Goals -->
                                <div>
                                    <h4 style="font-size: 14px; color: #2196F3; margin-bottom: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
                                        ${details?.header?.teams?.[1]?.name || 'Away'}
                                        <div style="width: 4px; height: 20px; background: #2196F3; border-radius: 2px;"></div>
                                    </h4>
                                    ${awayGoals.length > 0 ? awayGoals.map(goal => `
                                        <div style="display: flex; align-items: start; margin-bottom: 16px; padding: 12px; background: #E3F2FD; border-radius: 10px; border-right: 3px solid #2196F3; flex-direction: row-reverse;">
                                            <div style="min-width: 48px; height: 48px; background: #2196F3; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);">
                                                ⚽
                                            </div>
                                            <div style="margin-right: 12px; flex: 1; text-align: right;">
                                                <div style="font-weight: 600; font-size: 15px; color: #333; margin-bottom: 4px;">
                                                    ${goal.nameStr || 'Player'}
                                                </div>
                                                <div style="font-size: 13px; color: #666;">
                                                    ${goal.time}' ${goal.eventString ? `• ${goal.eventString}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('') : '<div style="color: #999; text-align: center; padding: 20px; font-size: 14px;">No goals</div>'}
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Cards & Substitutions -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <!-- Cards -->
                    ${cards.length > 0 ? `
                        <div class="card">
                            <div class="card-title">🟨 Cards</div>
                            <div class="card-content" style="padding: 16px;">
                                ${cards.map(card => `
                                    <div style="display: flex; align-items: center; padding: 10px; margin-bottom: 8px; background: ${card.card === 'Yellow' ? '#FFF8E1' : '#FFEBEE'}; border-radius: 8px; border-left: 3px solid ${card.card === 'Yellow' ? '#FFC107' : '#F44336'};">
                                        <div style="font-size: 24px; margin-right: 12px;">
                                            ${card.card === 'Yellow' ? '🟨' : '🟥'}
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; font-size: 14px; color: #333;">${card.nameStr || 'Player'}</div>
                                            <div style="font-size: 12px; color: #666;">${card.time}'</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Substitutions -->
                    ${substitutions.length > 0 ? `
                        <div class="card">
                            <div class="card-title">🔄 Substitutions</div>
                            <div class="card-content" style="padding: 16px;">
                                ${substitutions.slice(0, 6).map(sub => `
                                    <div style="padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #757575;">
                                        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">${sub.time}'</div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="color: #F44336; font-size: 14px;">⬇️</span>
                                            <span style="font-size: 13px; color: #666;">${sub.swap?.[0]?.name || 'Player'}</span>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                            <span style="color: #4CAF50; font-size: 14px;">⬆️</span>
                                            <span style="font-size: 13px; font-weight: 600; color: #333;">${sub.swap?.[1]?.name || 'Player'}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Match Information -->
                <div class="card">
                    <div class="card-title">ℹ️ Match Details</div>
                    <div class="card-content" style="padding: 16px;">
                        <div style="display: grid; gap: 12px;">
                            ${Object.entries(facts?.infoBox || {}).map(([key, value]) => {
                                if (key === 'Tournament' || key === 'Match Date' || key === 'Stadium' || key === 'Referee' || key === 'Attendance') {
                                    let icon = 'ℹ️';
                                    if (key === 'Tournament') icon = '🏆';
                                    if (key === 'Match Date') icon = '📅';
                                    if (key === 'Stadium') icon = '🏟️';
                                    if (key === 'Referee') icon = '👨‍⚖️';
                                    if (key === 'Attendance') icon = '👥';
                                    
                                    return `
                                        <div style="display: flex; padding: 12px; background: #f8f9fa; border-radius: 10px;">
                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                                ${icon}
                                            </div>
                                            <div style="margin-left: 14px; flex: 1;">
                                                <div style="font-size: 12px; color: #666; margin-bottom: 2px;">${key}</div>
                                                <div style="font-weight: 600; color: #333; font-size: 14px;">
                                                    ${value.name || value.text || value.venue || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }
                                return '';
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.renderTabContent();
        this.updateTabButtons();
    },
    
    updateTabButtons() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.state.activeTab);
        });
    },
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const options = {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('en-US', options);
        } catch (error) {
            return dateString;
        }
    },
    
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        if (this.elements.loading) {
            this.elements.loading.classList.toggle('hidden', !isLoading);
        }
    },
    
    showError(message) {
        const html = `
            <div class="empty">
                <div class="empty-icon">⚠️</div>
                <div class="empty-title">Error</div>
                <div class="empty-text">${message}</div>
                <button onclick="App.goBack()" class="action-btn">Go Back</button>
            </div>
        `;
        
        if (this.elements.content) {
            this.elements.content.innerHTML = html;
        }
    },
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    },
    
    refreshData() {
        this.loadMatch();
    },
    
    goBack() {
        window.history.back();
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Expose functions to window for button onclick handlers
window.App = App;
window.checkStreamAgain = checkStreamAgain;
window.debugStreamData = debugSupabaseData;
window.reloadStream = reloadStream;
window.toggleFullscreen = toggleFullscreen;
window.togglePlayPause = togglePlayPause;
window.toggleMute = toggleMute;