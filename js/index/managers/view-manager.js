// ===== VIEW MANAGER =====

const IndexViewManager = {
    currentView: 'matches',
    activeFilter: 'all',
    
    elements: {
        dateNav: null,
        filterTabs: null
    },
    
    // Initialize
    init() {
        this.elements = {
            dateNav: document.getElementById('dateNav'),
            filterTabs: document.getElementById('filterTabs')
        };
        
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.showView(view, e);
            });
        });
        
        // Filter tabs
        document.querySelectorAll('#filterTabs button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.applyFilter(filter);
            });
        });
    },
    
    // Show view
    showView(view, event) {
        this.currentView = view;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
        });
        
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        } else {
            document.querySelector(`.nav-item[data-view="${view}"]`)?.classList.add('active');
        }
        
        // Show/hide date nav and filters
        if (view === 'matches') {
            this.elements.dateNav?.classList.add('show');
            this.elements.filterTabs?.classList.add('show');
        } else {
            this.elements.dateNav?.classList.remove('show');
            this.elements.filterTabs?.classList.remove('show');
        }
        
        // Load data for view
        if (window.IndexApp) {
            if (view === 'matches') {
                window.IndexApp.loadMatches();
            } else if (view === 'leagues') {
                window.IndexApp.loadLeagues();
            } else if (view === 'standings') {
                window.IndexApp.loadStandings();
            }
        }
    },
    
    // Apply filter
    applyFilter(filter) {
        this.activeFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('#filterTabs button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        // Re-render matches with filter
        if (window.IndexApp && window.IndexApp.state.matchesData) {
            window.IndexMatchesRenderer.render(window.IndexApp.state.matchesData);
        }
    },
    
    // Toggle league section
    toggleLeague(leagueId) {
        const matches = document.getElementById(`league-${leagueId}`);
        const header = document.getElementById(`league-header-${leagueId}`);
        
        if (matches && header) {
            matches.classList.toggle('expanded');
            header.classList.toggle('expanded');
        }
    },
    
    // Get current view
    getCurrentView() {
        return this.currentView;
    },
    
    // Get active filter
    getActiveFilter() {
        return this.activeFilter;
    }
};

// Make manager globally available
window.IndexViewManager = IndexViewManager;