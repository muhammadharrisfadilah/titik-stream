// ===== MAIN INDEX APPLICATION =====

const IndexApp = {
    state: {
        matchesData: null,
        leaguesData: null,
        standingsData: null,
        isRefreshing: false,
        isBackgroundRefreshing: false,
        lastRefreshTime: null,
        retryCount: 0,
        maxRetries: 3
    },
    
    // Initialize application
    async init() {
        IndexConfig.log.info('🚀 TITIK SPORTS v2.0 - Initializing...');
        
        // Initialize managers
        IndexDateManager.init();
        IndexViewManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show initial view
        IndexViewManager.showView('matches');
        
        // Load initial data
        await this.loadMatches();
        
        // Check online status
        if (!IndexHelpers.isOnline()) {
            IndexHelpers.showToast('You are offline. Using cached data.', 'warning');
        }
        
        IndexConfig.log.info('✅ Application initialized');
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Pull-to-refresh
        if (IndexConfig.features.PULL_TO_REFRESH) {
            this.setupPullToRefresh();
        }
        
        // Online/offline detection
        window.addEventListener('online', () => {
            IndexHelpers.showToast('Back online', 'success');
            if (IndexViewManager.getCurrentView() === 'matches') {
                this.backgroundRefreshMatches();
            }
        });
        
        window.addEventListener('offline', () => {
            IndexHelpers.showToast('You are offline', 'warning');
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                IndexDateManager.changeDate(-1);
            }
            if (e.key === 'ArrowRight') {
                IndexDateManager.changeDate(1);
            }
            if (e.key === 'Escape') {
                const popup = document.getElementById('calendarPopup');
                if (popup?.classList.contains('show')) {
                    IndexDateManager.toggleCalendar();
                }
            }
        });
        
        // Match click handler (with ads)
        document.addEventListener('click', (e) => {
            const matchItem = e.target.closest('.match-item');
            if (matchItem) {
                e.preventDefault();
                const matchId = matchItem.dataset.matchId;
                if (matchId && window.IndexAdsManager) {
                    // Use ads manager click interceptor
                    window.IndexAdsManager.checkAndHandleClick(() => {
                        this.navigateToMatchDetails(matchId);
                    });
                } else if (matchId) {
                    this.navigateToMatchDetails(matchId);
                }
            }
        });
        
        // Background refresh for live matches
        if (IndexConfig.features.BACKGROUND_REFRESH) {
            setInterval(() => {
                if (IndexViewManager.getCurrentView() === 'matches' && IndexHelpers.isOnline()) {
                    if (this.hasLiveMatches()) {
                        this.backgroundRefreshMatches();
                    }
                }
            }, 30000); // Every 30 seconds
        }
    },
    
    // Setup pull-to-refresh
    setupPullToRefresh() {
        let pullStartY = 0;
        let isPulling = false;
        let pullDistance = 0;
        
        const refreshControl = document.getElementById('refreshControl');
        
        document.addEventListener('touchstart', (e) => {
            if (IndexViewManager.getCurrentView() !== 'matches' || this.state.isRefreshing) return;
            if (window.scrollY > 10) return;
            
            pullStartY = e.touches[0].clientY;
            isPulling = true;
            pullDistance = 0;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isPulling || this.state.isRefreshing) return;
            
            const currentY = e.touches[0].clientY;
            pullDistance = currentY - pullStartY;
            
            if (pullDistance > 0 && window.scrollY <= 10) {
                e.preventDefault();
                if (pullDistance > 60) {
                    refreshControl?.classList.add('show');
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            if (!isPulling) return;
            
            if (pullDistance > 80) {
                this.triggerManualRefresh();
            } else {
                refreshControl?.classList.remove('show');
            }
            
            isPulling = false;
            pullDistance = 0;
        });
    },
    
    // Trigger manual refresh
    async triggerManualRefresh() {
        if (this.state.isRefreshing) return;
        
        this.state.isRefreshing = true;
        const refreshControl = document.getElementById('refreshControl');
        refreshControl?.classList.add('show');
        
        try {
            const dateStr = IndexHelpers.formatDate(IndexDateManager.getCurrentDate());
            const cacheKey = `matches_${dateStr}`;
            
            IndexCacheService.clear(cacheKey);
            
            const data = await IndexAPIService.fetchMatches(IndexDateManager.getCurrentDate());
            IndexCacheService.set(cacheKey, data, IndexConfig.cache.MATCHES_TTL);
            
            this.state.matchesData = data;
            IndexMatchesRenderer.render(data);
            
            IndexHelpers.showToast('Matches refreshed', 'success');
            this.state.lastRefreshTime = Date.now();
            this.state.retryCount = 0;
        } catch (error) {
            IndexConfig.log.error('❌ Refresh error:', error);
            IndexHelpers.showToast('Refresh failed', 'error');
            
            // Show cached data
            const dateStr = IndexHelpers.formatDate(IndexDateManager.getCurrentDate());
            const cacheKey = `matches_${dateStr}`;
            const cached = IndexCacheService.get(cacheKey);
            
            if (cached) {
                this.state.matchesData = cached;
                IndexMatchesRenderer.render(cached);
            }
        } finally {
            setTimeout(() => {
                refreshControl?.classList.remove('show');
                this.state.isRefreshing = false;
            }, 500);
        }
    },
    
    // Load matches
    async loadMatches(forceRefresh = false) {
        const dateStr = IndexHelpers.formatDate(IndexDateManager.getCurrentDate());
        const cacheKey = `matches_${dateStr}`;
        
        // Check cache first
        if (!forceRefresh) {
            const cachedData = IndexCacheService.get(cacheKey);
            if (cachedData) {
                this.state.matchesData = cachedData;
                IndexMatchesRenderer.render(cachedData);
                
                // Background refresh
                this.backgroundRefreshMatches();
                return;
            }
        }
        
        // Show loading
        IndexMatchesRenderer.renderLoading();
        
        try {
            const data = await IndexAPIService.fetchMatches(IndexDateManager.getCurrentDate());
            
            IndexCacheService.set(cacheKey, data, IndexConfig.cache.MATCHES_TTL);
            
            this.state.matchesData = data;
            IndexMatchesRenderer.render(data);
            
            this.state.lastRefreshTime = Date.now();
            this.state.retryCount = 0;
        } catch (error) {
            IndexConfig.log.error('❌ Error loading matches:', error);
            
            // Check cache again
            const cached = IndexCacheService.get(cacheKey);
            if (cached) {
                this.state.matchesData = cached;
                IndexMatchesRenderer.render(cached);
                IndexHelpers.showToast('Using cached data', 'warning');
            } else {
                IndexMatchesRenderer.renderError();
                IndexHelpers.showToast('Failed to load matches', 'error');
            }
            
            this.startBackgroundRetry('matches', dateStr, cacheKey);
        }
    },
    
    // Background refresh matches
    async backgroundRefreshMatches() {
        if (this.state.isBackgroundRefreshing) return;
        
        this.state.isBackgroundRefreshing = true;
        
        try {
            const dateStr = IndexHelpers.formatDate(IndexDateManager.getCurrentDate());
            const cacheKey = `matches_${dateStr}`;
            
            const data = await IndexAPIService.fetchMatches(IndexDateManager.getCurrentDate());
            
            IndexCacheService.set(cacheKey, data, IndexConfig.cache.MATCHES_TTL);
            
            if (IndexViewManager.getCurrentView() === 'matches') {
                this.state.matchesData = data;
                IndexMatchesRenderer.render(data);
            }
            
            this.state.retryCount = 0;
        } catch (error) {
            IndexConfig.log.info('⏳ Background refresh failed:', error);
        } finally {
            this.state.isBackgroundRefreshing = false;
        }
    },
    
    // Load leagues
    async loadLeagues(forceRefresh = false) {
        const cacheKey = 'all_leagues';
        
        if (!forceRefresh) {
            const cachedData = IndexCacheService.get(cacheKey);
            if (cachedData) {
                this.state.leaguesData = cachedData;
                IndexLeaguesRenderer.render(cachedData);
                return;
            }
        }
        
        IndexLeaguesRenderer.renderLoading();
        
        try {
            const data = await IndexAPIService.fetchLeagues();
            IndexCacheService.set(cacheKey, data, IndexConfig.cache.LEAGUES_TTL);
            
            this.state.leaguesData = data;
            IndexLeaguesRenderer.render(data);
        } catch (error) {
            IndexConfig.log.error('❌ Error loading leagues:', error);
            
            const cached = IndexCacheService.get(cacheKey);
            if (cached) {
                this.state.leaguesData = cached;
                IndexLeaguesRenderer.render(cached);
                IndexHelpers.showToast('Using cached data', 'warning');
            } else {
                IndexLeaguesRenderer.renderError();
                IndexHelpers.showToast('Failed to load leagues', 'error');
            }
        }
    },
    
    // Load standings
    async loadStandings(forceRefresh = false) {
        const cacheKey = 'standings_47';
        
        if (!forceRefresh) {
            const cachedData = IndexCacheService.get(cacheKey);
            if (cachedData) {
                this.state.standingsData = cachedData;
                IndexStandingsRenderer.render(cachedData);
                return;
            }
        }
        
        IndexStandingsRenderer.renderLoading();
        
        try {
            const data = await IndexAPIService.fetchStandings();
            IndexCacheService.set(cacheKey, data, IndexConfig.cache.STANDINGS_TTL);
            
            this.state.standingsData = data;
            IndexStandingsRenderer.render(data);
        } catch (error) {
            IndexConfig.log.error('❌ Error loading standings:', error);
            
            const cached = IndexCacheService.get(cacheKey);
            if (cached) {
                this.state.standingsData = cached;
                IndexStandingsRenderer.render(cached);
                IndexHelpers.showToast('Using cached data', 'warning');
            } else {
                IndexStandingsRenderer.renderError();
                IndexHelpers.showToast('Failed to load standings', 'error');
            }
        }
    },
    
    // Background retry system
    startBackgroundRetry(type, dateStr, cacheKey) {
        if (this.state.retryCount >= this.state.maxRetries) {
            IndexConfig.log.info(`⏹️ Max retries reached for ${type}`);
            return;
        }
        
        this.state.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.state.retryCount - 1), 10000);
        
        IndexConfig.log.info(`🔄 Scheduling retry for ${type} in ${delay}ms (attempt ${this.state.retryCount})`);
        
        setTimeout(async () => {
            try {
                if (type === 'matches') {
                    const data = await IndexAPIService.fetchMatches(IndexDateManager.getCurrentDate());
                    IndexCacheService.set(cacheKey, data, IndexConfig.cache.MATCHES_TTL);
                    
                    if (IndexViewManager.getCurrentView() === 'matches') {
                        this.state.matchesData = data;
                        IndexMatchesRenderer.render(data);
                        IndexHelpers.showToast('Data updated', 'success');
                        this.state.retryCount = 0;
                    }
                }
            } catch (error) {
                IndexConfig.log.info(`⏳ Retry ${this.state.retryCount} failed for ${type}`);
                
                if (this.state.retryCount < this.state.maxRetries) {
                    this.startBackgroundRetry(type, dateStr, cacheKey);
                }
            }
        }, delay);
    },
    
    // Check if has live matches
    hasLiveMatches() {
        if (!this.state.matchesData || !this.state.matchesData.leagues) return false;
        
        return this.state.matchesData.leagues.some(league => 
            league.matches && league.matches.some(match => 
                IndexHelpers.getMatchStatus(match) === 'live'
            )
        );
    },
    
    // Navigate to match details
    navigateToMatchDetails(matchId) {
        localStorage.setItem('previousView', IndexViewManager.getCurrentView());
        localStorage.setItem('previousDate', IndexHelpers.formatDate(IndexDateManager.getCurrentDate()));
        
        window.location.href = `match-details.html?matchId=${matchId}`;
    }
};

// Initialize app on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        IndexApp.init();
    });
} else {
    IndexApp.init();
}

// Make app globally available
window.IndexApp = IndexApp;