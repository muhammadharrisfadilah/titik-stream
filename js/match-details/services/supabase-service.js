// ===== SUPABASE SERVICE =====

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
    
    // Get streaming link from Supabase
    async getStreamingLink(matchId) {
        if (!this.client) {
            console.error('❌ Supabase not initialized');
            return null;
        }

        try {
            console.log(`🔍 Fetching streaming data for match ID: ${matchId}`);
            
            // Query live_streams table
            const { data, error } = await this.client
                .from('live_streams')
                .select('sources, is_live, home_team, away_team, league')
                .eq('match_id', matchId)
                .single();

            if (error) {
                console.log('ℹ️ Supabase error:', error);
                
                // Try matches table as fallback
                if (error.code === 'PGRST116') {
                    console.log(`ℹ️ No streaming data found in live_streams for match ID: ${matchId}`);
                    
                    const { data: altData, error: altError } = await this.client
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
            const bestSource = this.selectBestSource(data.sources);
            
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
    },
    
    // Select best streaming source
    selectBestSource(sources) {
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
                .single();
                
            if (error) {
                console.error('Supabase debug error:', error);
                
                const { data: matchesData, error: matchesError } = await this.client
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
};

// Make service globally available
window.SupabaseService = SupabaseService;