// ===== SUPABASE SERVICE - UPDATED FOR MULTI-STREAM =====

const SupabaseService = {
    client: null,
    
    // Wait for Supabase library to load
    async waitForSupabase() {
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
    },
    
    // Load Supabase from CDN as fallback
    async loadFromCDN() {
        return new Promise((resolve) => {
            if (typeof window.supabase !== 'undefined') {
                this.client = window.supabase.createClient(
                    AppConfig.supabase.URL,
                    AppConfig.supabase.ANON_KEY
                );
                console.log('✅ Supabase loaded from CDN');
                resolve(true);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                console.log('✅ Supabase library loaded from CDN');
                this.client = window.supabase.createClient(
                    AppConfig.supabase.URL,
                    AppConfig.supabase.ANON_KEY
                );
                resolve(true);
            };
            script.onerror = () => {
                console.warn('⚠️ Failed to load Supabase from CDN');
                resolve(false);
            };
            
            document.head.appendChild(script);
        });
    },
    
    // Initialize Supabase client
    async initialize() {
        try {
            await this.waitForSupabase();
            this.client = window.supabase.createClient(
                AppConfig.supabase.URL,
                AppConfig.supabase.ANON_KEY,
                {
                    auth: { persistSession: false },
                    global: { headers: { 'Content-Type': 'application/json' } }
                }
            );
            console.log('✅ Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Supabase:', error);
            console.log('⏳ Trying to load Supabase from CDN...');
            return await this.loadFromCDN();
        }
    },
    
    // Get streaming data (RETURNS FULL DATA WITH ALL SOURCES)
    async getStreamingData(matchId) {
        if (!this.client) {
            console.error('❌ Supabase not initialized');
            return null;
        }

        try {
            console.log(`🔍 Fetching streaming data for match ID: ${matchId}`);
            
            // Query live_streams table
            const { data, error } = await this.client
                .from('live_streams')
                .select('sources, is_live, home_team, away_team, league, match_id')
                .eq('match_id', matchId)
                .maybeSingle();

            if (error) {
                console.log('ℹ️ Supabase error:', error);
                
                // Try matches table as fallback
                if (error.code === 'PGRST116') {
                    console.log(`ℹ️ No data in live_streams, trying matches table...`);
                    
                    const { data: altData, error: altError } = await this.client
                        .from('matches')
                        .select('link_streaming, match_id')
                        .eq('match_id', matchId)
                        .maybeSingle();
                    
                    if (altError || !altData || !altData.link_streaming) {
                        console.log('ℹ️ No streaming available for this match');
                        return null;
                    }
                    
                    // Convert single URL to sources array format
                    console.log('✅ Streaming link found in matches table');
                    return {
                        match_id: matchId,
                        sources: [{
                            type: this.detectStreamType(altData.link_streaming),
                            source: altData.link_streaming
                        }],
                        is_live: true
                    };
                }
                
                throw error;
            }

            console.log('📦 Stream data from Supabase:', data);

            // Validate data
            if (!data) {
                console.log('ℹ️ Match not found in database');
                return null;
            }

            // Check if we have sources
            if (!data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
                console.log('ℹ️ Match found but no streaming sources');
                return null;
            }

            // Filter out invalid sources
            const validSources = data.sources.filter(source => 
                source && 
                source.source && 
                typeof source.source === 'string' &&
                source.source.length > 10 && // Min URL length
                (source.source.startsWith('http://') || source.source.startsWith('https://'))
            );

            if (validSources.length === 0) {
                console.log('⚠️ No valid streaming sources found');
                return null;
            }

            console.log(`✅ Found ${validSources.length} valid stream source(s)`);
            
            return {
                match_id: data.match_id,
                sources: validSources,
                is_live: data.is_live !== false, // Default to true if not specified
                home_team: data.home_team,
                away_team: data.away_team,
                league: data.league
            };

        } catch (error) {
            console.error('❌ Exception while fetching streaming data:', error);
            return null;
        }
    },
    
    // Detect stream type from URL
    detectStreamType(url) {
        if (!url) return 'UNKNOWN';
        
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('.m3u8')) return 'HLS';
        if (urlLower.includes('.flv')) return 'FLV';
        if (urlLower.includes('.mp4')) return 'MP4';
        
        // Fallback
        return 'HLS';
    },
    
    // Legacy method - keep for backward compatibility
    async getStreamingLink(matchId) {
        const data = await this.getStreamingData(matchId);
        
        if (!data || !data.sources || data.sources.length === 0) {
            return null;
        }
        
        // Return first source URL
        return data.sources[0].source;
    },
    
    // Debug function to check Supabase data
    async debugData(matchId) {
        if (!this.client) {
            console.error('Supabase not initialized');
            return null;
        }
        
        try {
            console.log(`🔍 Debugging Supabase data for match: ${matchId}`);
            
            const { data, error } = await this.client
                .from('live_streams')
                .select('*')
                .eq('match_id', matchId)
                .maybeSingle();
                
            if (error) {
                console.error('Supabase debug error:', error);
                
                const { data: matchesData, error: matchesError } = await this.client
                    .from('matches')
                    .select('*')
                    .eq('match_id', matchId)
                    .maybeSingle();
                    
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
};

// Make service globally available
window.SupabaseService = SupabaseService;