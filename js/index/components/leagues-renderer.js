// ===== LEAGUES RENDERER =====

const IndexLeaguesRenderer = {
    // Render leagues
    render(data) {
        const content = document.getElementById('content');
        if (!content) return;
        
        if (!data.popular || data.popular.length === 0) {
            this.renderEmpty();
            return;
        }
        
        let html = '<div class="leagues-container"><h2 class="standings-header">🏆 Popular Leagues</h2>';
        
        data.popular.slice(0, 20).forEach(league => {
            html += this.renderLeagueCard(league);
        });
        
        html += '</div>';
        
        content.innerHTML = html;
        content.classList.add('fade-in');
    },
    
    // Render league card
    renderLeagueCard(league) {
        return `
            <div class="league-card" onclick="IndexLeaguesRenderer.selectLeague(${league.id}, '${IndexHelpers.sanitize(league.name)}')">
                <div class="league-card-icon">${league.name.charAt(0)}</div>
                <div class="league-card-info">
                    <div class="league-card-name">${league.name}</div>
                    <div class="league-card-country">${league.ccode || 'International'}</div>
                </div>
            </div>
        `;
    },
    
    // Select league (placeholder)
    selectLeague(id, name) {
        IndexHelpers.showToast(`League ${name} selected - Feature in development`, 'info');
        IndexConfig.log.info(`League selected: ${id} - ${name}`);
        
        // TODO: Navigate to league page or load league details
    },
    
    // Render empty state
    renderEmpty() {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <div class="empty-state-title">No leagues available</div>
                <div class="empty-state-text">Unable to load league information at this time.</div>
                <button class="empty-state-action" onclick="IndexApp.loadLeagues(true)">Try again</button>
            </div>
        `;
    },
    
    // Render loading state
    renderLoading() {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading leagues...</div>
            </div>
        `;
    },
    
    // Render error state
    renderError(message = 'Unable to load leagues') {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">${message}</div>
                <div class="empty-state-text">Please check your internet connection and try again.</div>
                <button class="empty-state-action" onclick="IndexApp.loadLeagues(true)">Retry</button>
            </div>
        `;
    }
};

// Make renderer globally available
window.IndexLeaguesRenderer = IndexLeaguesRenderer;