// ===== VIEW MANAGER - UPDATED FOR NEW DESIGN =====

const IndexViewManager = {
    currentView: 'matches',
    activeFilter: 'all',
    
    elements: {
        dateDisplay: null,
        calendarPopup: null,
        filterTabs: null
    },
    
    // Initialize
    init() {
        this.elements = {
            dateDisplay: document.getElementById('dateDisplay'),
            calendarPopup: document.getElementById('calendarPopup'),
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
        
        // Date display click
        this.elements.dateDisplay?.addEventListener('click', () => {
            IndexDateManager.toggleCalendar();
        });
        
        // Filter tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.applyFilter(filter);
            });
        });
        
        // Calendar navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            IndexDateManager.changeMonth(-1);
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            IndexDateManager.changeMonth(1);
        });
        
        // Calendar date selection
        document.getElementById('calendarGrid')?.addEventListener('click', (e) => {
            const dateEl = e.target.closest('.calendar-day.date');
            if (dateEl && !dateEl.classList.contains('other-month')) {
                const dateStr = dateEl.dataset.date;
                if (dateStr) {
                    IndexDateManager.selectDate(dateStr);
                }
            }
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
        document.querySelectorAll('.tab-btn').forEach(btn => {
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
        const matches = document.getElementById(`matches-${leagueId}`);
        const header = document.getElementById(`league-${leagueId}`)?.querySelector('.league-header');
        const arrow = header?.querySelector('.count-arrow');
        
        if (matches && header && arrow) {
            matches.classList.toggle('expanded');
            header.classList.toggle('expanded');
            arrow.textContent = arrow.textContent === '▼' ? '▲' : '▼';
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