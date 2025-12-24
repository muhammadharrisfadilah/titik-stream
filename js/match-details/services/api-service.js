// ===== API SERVICE =====
const APIService = {
    async fetchMatchData(matchId) {
        console.log('📡 [FETCH] Starting data fetch for matchId:', matchId);
        try {
            const url = `${AppConfig.api.BASE_URL}/data/matchDetails?matchId=${matchId}`;
            console.log('🌐 [FETCH] Request URL:', url);
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('❌ [FETCH] Fatal error:', error);
            throw error;
        }
    },
    
    extractHeader(data) {
        if (data.header) return data.header;
        
        return {
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
    },
    
    extractGeneralInfo(data) {
        if (data.general) return data.general;
        
        return {
            leagueName: data.league?.name || 'Unknown League',
            matchTimeUTCDate: data.matchTimeUTC || new Date().toISOString(),
            matchRound: data.round || 'N/A',
            venueName: data.venue?.name || 'Unknown Venue',
            referee: data.referee?.name || 'N/A'
        };
    },
    
    extractMatchFacts(data) {
        if (data.content?.matchFacts) return data.content.matchFacts;
        if (data.matchFacts) return data.matchFacts;
        return { stats: {}, general: {} };
    },
    
    extractLineups(data) {
        if (data.content?.lineup) return this.formatLineupData(data.content.lineup);
        if (data.lineup) return this.formatLineupData(data.lineup);
        if (data.teams) return this.formatLineupData(data.teams);
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
                players: { starting, substitutes },
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
        if (data.content?.stats?.stats) return data.content.stats.stats;
        if (data.stats) return data.stats;
        return { home: {}, away: {} };
    },
    
    async extractAllData(rawData) {
        return {
            details: rawData,
            header: this.extractHeader(rawData),
            general: this.extractGeneralInfo(rawData),
            facts: this.extractMatchFacts(rawData),
            lineups: this.extractLineups(rawData),
            stats: this.extractStats(rawData),
            matchStats: { 
                possession: { home: 50, away: 50 },
                shots: { home: 0, away: 0 },
                shotsOnTarget: { home: 0, away: 0 },
                corners: { home: 0, away: 0 },
                fouls: { home: 0, away: 0 }
            }
        };
    }
};

window.APIService = APIService;