// ===== SEARCH MANAGER =====

const IndexSearchManager = {
    searchData: null,
    searchTimeout: null,
    
    // Initialize
    init() {
        this.setupEventListeners();
        this.loadSearchData();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Search button
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.openSearch();
        });
        
        // Search close button
        document.getElementById('searchClose')?.addEventListener('click', () => {
            this.closeSearch();
        });
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
                if (e.key === 'Escape') {
                    this.closeSearch();
                }
            });
        }
        
        // Search clear button
        document.getElementById('searchClear')?.addEventListener('click', () => {
            this.clearSearch();
        });
        
        // Close search when clicking outside
        document.getElementById('searchOverlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'searchOverlay') {
                this.closeSearch();
            }
        });
    },
    
    // Open search overlay
    openSearch() {
        const overlay = document.getElementById('searchOverlay');
        const input = document.getElementById('searchInput');
        
        if (overlay && input) {
            overlay.classList.add('show');
            input.focus();
            
            // Load search data if not loaded
            if (!this.searchData) {
                this.loadSearchData();
            }
        }
    },
    
    // Close search overlay
    closeSearch() {
        const overlay = document.getElementById('searchOverlay');
        const input = document.getElementById('searchInput');
        
        if (overlay && input) {
            overlay.classList.remove('show');
            input.value = '';
            this.clearSearch();
            
            // Hide keyboard on mobile
            input.blur();
        }
    },
    
    // Handle search input
    handleSearchInput(query) {
        const clearBtn = document.getElementById('searchClear');
        
        // Show/hide clear button
        if (clearBtn) {
            if (query.trim().length > 0) {
                clearBtn.classList.add('show');
            } else {
                clearBtn.classList.remove('show');
            }
        }
        
        // Debounce search
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        if (query.trim().length >= 2) {
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        } else {
            this.showEmptyState();
        }
    },
    
    // Perform search
    async performSearch(query) {
        if (!query || query.trim().length < 2) {
            this.showEmptyState();
            return;
        }
        
        const searchTerm = query.toLowerCase().trim();
        
        // Show loading
        this.showLoading();
        
        try {
            // Search in current matches data
            let results = [];
            
            if (window.IndexApp?.state?.matchesData?.leagues) {
                results = this.searchInMatches(searchTerm);
            }
            
            // If no results, try searching leagues
            if (results.length === 0 && window.IndexApp?.state?.leaguesData?.popular) {
                results = this.searchInLeagues(searchTerm);
            }
            
            // Display results
            this.displayResults(results, searchTerm);
            
        } catch (error) {
            IndexConfig.log.error('❌ Search error:', error);
            this.showError();
        }
    },
    
    // Search in matches data
    searchInMatches(searchTerm) {
        const results = [];
        const matchesData = window.IndexApp.state.matchesData;
        
        matchesData.leagues.forEach(league => {
            league.matches?.forEach(match => {
                const homeName = match.home?.name?.toLowerCase() || '';
                const awayName = match.away?.name?.toLowerCase() || '';
                const leagueName = league.name?.toLowerCase() || '';
                
                if (homeName.includes(searchTerm) || 
                    awayName.includes(searchTerm) || 
                    leagueName.includes(searchTerm)) {
                    
                    results.push({
                        type: 'match',
                        league: league.name,
                        match: match,
                        relevance: this.calculateRelevance(searchTerm, homeName, awayName, leagueName)
                    });
                }
            });
        });
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results.slice(0, 20); // Limit results
    },
    
    // Search in leagues data
    searchInLeagues(searchTerm) {
        const results = [];
        const leaguesData = window.IndexApp.state.leaguesData;
        
        leaguesData.popular?.forEach(league => {
            const leagueName = league.name?.toLowerCase() || '';
            const country = league.ccode?.toLowerCase() || '';
            
            if (leagueName.includes(searchTerm) || country.includes(searchTerm)) {
                results.push({
                    type: 'league',
                    league: league,
                    relevance: this.calculateRelevance(searchTerm, leagueName, country)
                });
            }
        });
        
        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);
        
        return results.slice(0, 15); // Limit results
    },
    
    // Calculate relevance score
    calculateRelevance(searchTerm, ...fields) {
        let score = 0;
        
        fields.forEach((field, index) => {
            if (field.includes(searchTerm)) {
                // Exact match at start gets highest score
                if (field.startsWith(searchTerm)) {
                    score += 100 - index * 10;
                }
                // Exact match anywhere
                else if (field === searchTerm) {
                    score += 80 - index * 10;
                }
                // Partial match
                else {
                    const position = field.indexOf(searchTerm);
                    score += (50 - position * 0.1) - index * 10;
                }
            }
        });
        
        return score;
    },
    
    // Display search results
    displayResults(results, searchTerm) {
        const resultsContainer = document.getElementById('searchResults');
        
        if (!resultsContainer) return;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-empty">
                    <div class="search-empty-icon">🔍</div>
                    <div class="search-empty-title">No results found</div>
                    <div class="search-empty-text">No matches or leagues found for "${searchTerm}"</div>
                </div>
            `;
            return;
        }
        
        let html = '<div class="search-results-list">';
        
        // Group by type
        const matchResults = results.filter(r => r.type === 'match');
        const leagueResults = results.filter(r => r.type === 'league');
        
        // Matches section
        if (matchResults.length > 0) {
            html += '<div class="search-section">';
            html += '<div class="search-section-title">Matches</div>';
            
            matchResults.forEach(result => {
                const match = result.match;
                const status = IndexHelpers.getMatchStatus(match);
                const isLive = status === 'live';
                const isFinished = status === 'finished';
                
                let timeDisplay = '';
                if (isFinished) {
                    timeDisplay = 'FT';
                } else if (isLive) {
                    const liveTime = match.status?.liveTime?.short || 'LIVE';
                    timeDisplay = `${liveTime}'`;
                } else {
                    timeDisplay = IndexHelpers.formatTime(match.status?.utcTime);
                }
                
                html += `
                    <div class="search-result-item match" data-match-id="${match.id}">
                        <div class="search-result-time">${timeDisplay}</div>
                        <div class="search-result-content">
                            <div class="search-result-league">${result.league}</div>
                            <div class="search-result-teams">
                                <span class="search-result-team">${match.home?.name || 'TBD'}</span>
                                <span class="search-result-vs">vs</span>
                                <span class="search-result-team">${match.away?.name || 'TBD'}</span>
                            </div>
                        </div>
                        ${isLive ? '<div class="search-result-live">LIVE</div>' : ''}
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        // Leagues section
        if (leagueResults.length > 0) {
            html += '<div class="search-section">';
            html += '<div class="search-section-title">Leagues</div>';
            
            leagueResults.forEach(result => {
                const league = result.league;
                
                html += `
                    <div class="search-result-item league" data-league-id="${league.id}">
                        <div class="search-result-icon">🏆</div>
                        <div class="search-result-content">
                            <div class="search-result-league">${league.name}</div>
                            <div class="search-result-country">${league.ccode || 'International'}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
        }
        
        html += '</div>';
        
        resultsContainer.innerHTML = html;
        
        // Add click handlers
        this.setupResultClickHandlers();
    },
    
    // Setup result click handlers
    setupResultClickHandlers() {
        // Match results
        document.querySelectorAll('.search-result-item.match').forEach(item => {
            item.addEventListener('click', (e) => {
                const matchId = item.dataset.matchId;
                if (matchId) {
                    this.closeSearch();
                    
                    // Handle click with ads
                    if (window.IndexAdsManager) {
                        window.IndexAdsManager.handleSmartlinkClick(() => {
                            window.location.href = `match-details.html?matchId=${matchId}`;
                        });
                    } else {
                        window.location.href = `match-details.html?matchId=${matchId}`;
                    }
                }
            });
        });
        
        // League results
        document.querySelectorAll('.search-result-item.league').forEach(item => {
            item.addEventListener('click', (e) => {
                const leagueId = item.dataset.leagueId;
                if (leagueId) {
                    this.closeSearch();
                    IndexHelpers.showToast('League details coming soon', 'info');
                    // TODO: Implement league details page
                }
            });
        });
    },
    
    // Show empty state
    showEmptyState() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="search-empty">
                <div class="search-empty-icon">🔍</div>
                <div class="search-empty-title">Search for matches</div>
                <div class="search-empty-text">Enter team name, league, or match to search</div>
            </div>
        `;
    },
    
    // Show loading
    showLoading() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="search-loading-spinner"></div>
                <div class="search-loading-text">Searching...</div>
            </div>
        `;
    },
    
    // Show error
    showError() {
        const resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="search-error">
                <div class="search-error-icon">⚠️</div>
                <div class="search-error-title">Search Error</div>
                <div class="search-error-text">Unable to perform search at this time</div>
            </div>
        `;
    },
    
    // Clear search
    clearSearch() {
        const input = document.getElementById('searchInput');
        const clearBtn = document.getElementById('searchClear');
        
        if (input) input.value = '';
        if (clearBtn) clearBtn.classList.remove('show');
        
        this.showEmptyState();
    },
    
    // Load search data
    async loadSearchData() {
        // Use existing matches data if available
        if (window.IndexApp?.state?.matchesData) {
            this.searchData = window.IndexApp.state.matchesData;
        }
    }
};

// Initialize search manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        IndexSearchManager.init();
    });
} else {
    IndexSearchManager.init();
}

// Make manager globally available
window.IndexSearchManager = IndexSearchManager;