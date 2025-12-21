// ===== API SERVICE =====

const IndexAPIService = {
    // Fetch matches for a specific date
    async fetchMatches(date, retryCount = 0) {
        const dateStr = this.formatDate(date);
        const url = `${IndexConfig.api.BASE_URL}${IndexConfig.api.ENDPOINTS.matches}?date=${dateStr}&timezone=${IndexConfig.api.TIMEZONE}&ccode3=${IndexConfig.api.COUNTRY_CODE}`;
        
        try {
            IndexConfig.log.info(`📡 Fetching matches for ${dateStr}`);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // Process matches data
            if (data.leagues) {
                data.leagues.forEach(league => {
                    if (league.matches) {
                        league.matches.forEach(match => {
                            // Don't show scores for scheduled matches
                            if (!match.status?.started && !match.status?.finished) {
                                match.homeScore = '';
                                match.awayScore = '';
                            } else {
                                match.homeScore = match.home?.score ?? '';
                                match.awayScore = match.away?.score ?? '';
                            }
                        });
                    }
                });
            }
            
            IndexConfig.log.info(`✅ Fetched ${data.leagues?.length || 0} leagues`);
            return data;
            
        } catch (error) {
            IndexConfig.log.error('❌ Fetch matches error:', error);
            
            // Retry logic
            if (retryCount < IndexConfig.api.MAX_RETRIES) {
                IndexConfig.log.info(`🔄 Retrying... Attempt ${retryCount + 1}`);
                await new Promise(resolve => 
                    setTimeout(resolve, IndexConfig.api.RETRY_DELAY * (retryCount + 1))
                );
                return this.fetchMatches(date, retryCount + 1);
            }
            
            throw error;
        }
    },
    
    // Fetch all leagues
    async fetchLeagues(retryCount = 0) {
        const url = `${IndexConfig.api.BASE_URL}${IndexConfig.api.ENDPOINTS.leagues}?locale=en&ccode3=${IndexConfig.api.COUNTRY_CODE}`;
        
        try {
            IndexConfig.log.info('📡 Fetching leagues');
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            IndexConfig.log.info(`✅ Fetched ${data.popular?.length || 0} leagues`);
            
            return data;
            
        } catch (error) {
            IndexConfig.log.error('❌ Fetch leagues error:', error);
            
            if (retryCount < IndexConfig.api.MAX_RETRIES) {
                await new Promise(resolve => 
                    setTimeout(resolve, IndexConfig.api.RETRY_DELAY * (retryCount + 1))
                );
                return this.fetchLeagues(retryCount + 1);
            }
            
            throw error;
        }
    },
    
    // Fetch standings for a league
    async fetchStandings(leagueId = 47, retryCount = 0) {
        const url = `${IndexConfig.api.BASE_URL}${IndexConfig.api.ENDPOINTS.standings}?id=${leagueId}&ccode3=${IndexConfig.api.COUNTRY_CODE}`;
        
        try {
            IndexConfig.log.info(`📡 Fetching standings for league ${leagueId}`);
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            IndexConfig.log.info('✅ Standings fetched');
            
            return data;
            
        } catch (error) {
            IndexConfig.log.error('❌ Fetch standings error:', error);
            
            if (retryCount < IndexConfig.api.MAX_RETRIES) {
                await new Promise(resolve => 
                    setTimeout(resolve, IndexConfig.api.RETRY_DELAY * (retryCount + 1))
                );
                return this.fetchStandings(leagueId, retryCount + 1);
            }
            
            throw error;
        }
    },
    
    // Helper: Format date to YYYYMMDD
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }
};

// Make service globally available
window.IndexAPIService = IndexAPIService;