// ===== MAIN APPLICATION =====

const App = {
    state: {
        matchId: null,
        data: null,
        activeTab: 'overview',
        isLoading: false,
        isLive: false
    },
    
    elements: {},
    
    // Initialize application
    async init() {
        console.log('🚀 Initializing application...');
        
        this.bindElements();
        this.bindEvents();
        
        const matchId = Helpers.getURLParameter('matchId');
        
        if (!matchId) {
            this.showError('Match ID not found. Please go back and select a match.');
            return;
        }
        
        this.state.matchId = matchId;
        await this.initializeApp();
    },
    
    // Initialize all services and load data
    async initializeApp() {
        try {
            // Initialize Supabase
            const supabaseReady = await SupabaseService.initialize();
            
            if (!supabaseReady) {
                console.warn('⚠️ Supabase not available, video player will be disabled');
            }
            
            // Initialize video player
            await VideoPlayer.initialize(this.state.matchId);
            
            // Load match data
            await this.loadMatch();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application');
        }
    },
    
    // Bind DOM elements
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
    
    // Bind event listeners
    bindEvents() {
        // Back button
        if (this.elements.backBtn) {
            this.elements.backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        }
        
        // Tab switching
        if (this.elements.tabs) {
            this.elements.tabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab');
                if (tab) {
                    this.switchTab(tab.dataset.tab);
                }
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.goBack();
            if (e.key === 'r' && e.ctrlKey) {
                e.preventDefault();
                this.refreshData();
            }
        });
    },
    
    // Load match data
    async loadMatch() {
        console.log(`📥 Loading match ${this.state.matchId}...`);
        this.setLoading(true);
        
        try {
            // Fetch raw data from API
            const rawData = await APIService.fetchMatchData(this.state.matchId);
            
            // Extract and format data
            this.state.data = await APIService.extractAllData(rawData);
            
            console.log('✅ Match data loaded successfully');
            this.render();
            
        } catch (error) {
            console.error('❌ Failed to load match:', error);
            this.showError('Failed to load match details. Please check your connection.');
        } finally {
            this.setLoading(false);
        }
    },
    
    // Render all components
    render() {
        console.log('🎨 [RENDER] Starting render...');
        console.log('📊 [RENDER] Current state.data:', this.state.data);
        
        try {
            this.renderHeader();
            this.renderTabContent();
            this.updateTabButtons();
            
            console.log('✅ [RENDER] Render complete');
        } catch (error) {
            console.error('❌ [RENDER] Render error:', error);
        }
    },
    
    // Render header
    renderHeader() {
        if (this.elements.matchHeader && this.state.data) {
            this.elements.matchHeader.innerHTML = Renderer.renderHeader(this.state.data);
        }
    },
    
    // Render tab content
    renderTabContent() {
        if (!this.elements.content || !this.state.data) return;
        
        let html = '';
        
        switch(this.state.activeTab) {
            case 'overview':
                html = this.renderOverviewTab();
                break;
            case 'stats':
                html = Renderer.renderStats(this.state.data);
                break;
            case 'lineups':
                html = Renderer.renderLineups(this.state.data);
                break;
            case 'facts':
                html = Renderer.renderFacts(this.state.data);
                break;
        }
        
        this.elements.content.innerHTML = html;
    },
    
    // Render overview tab (keeping the full complex implementation)
    renderOverviewTab() {
        const { details, facts } = this.state.data;
        
        const events = facts?.events?.events || [];
        const goals = events.filter(e => e.type === 'Goal');
        const cards = events.filter(e => e.type === 'Card');
        
        const stats = facts?.events?.stats || [];
        const possessionStat = stats.find(s => s.title?.toLowerCase().includes('possession'));
        const shotsStat = stats.find(s => s.title?.toLowerCase().includes('shots') && !s.title?.toLowerCase().includes('on target'));
        const shotsOnTargetStat = stats.find(s => s.title?.toLowerCase().includes('on target'));
        
        return `
            <div class="tab-content active">
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
                                <div style="width: 32px; height: 32px; background: #4facfe; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">🏟️</div>
                                <div style="margin-left: 12px; flex: 1;">
                                    <div style="font-size: 12px; color: #666;">Venue</div>
                                    <div style="font-weight: 600; color: #333;">${facts?.infoBox?.Stadium?.name || 'Unknown'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Switch tab
    switchTab(tabName) {
        this.state.activeTab = tabName;
        this.renderTabContent();
        this.updateTabButtons();
    },
    
    // Update tab button states
    updateTabButtons() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === this.state.activeTab);
        });
    },
    
    // Set loading state
    setLoading(isLoading) {
        this.state.isLoading = isLoading;
        if (this.elements.loading) {
            this.elements.loading.classList.toggle('hidden', !isLoading);
        }
    },
    
    // Show error message
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
    
    // Show toast notification
    showToast(message, type = 'info') {
        Helpers.showToast(message, type);
    },
    
    // Refresh data
    refreshData() {
        this.loadMatch();
    },
    
    // Go back
    goBack() {
        window.history.back();
    }
};

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make app globally available
window.App = App;