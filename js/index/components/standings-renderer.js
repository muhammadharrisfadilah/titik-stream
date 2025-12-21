// ===== STANDINGS RENDERER =====

const IndexStandingsRenderer = {
    // Render standings
    render(data) {
        const content = document.getElementById('content');
        if (!content) return;
        
        if (!data.table || data.table.length === 0) {
            this.renderEmpty();
            return;
        }
        
        let html = '<div class="standings-container">';
        html += `<h2 class="standings-header">${data.details?.name || 'Premier League'} Standings</h2>`;
        
        if (data.table[0]?.data?.table?.all) {
            html += '<div class="standings-table">';
            
            data.table[0].data.table.all.forEach((team, index) => {
                html += this.renderTeamRow(team, index);
            });
            
            html += '</div>';
        }
        
        html += '</div>';
        
        content.innerHTML = html;
        content.classList.add('fade-in');
    },
    
    // Render team row
    renderTeamRow(team, index) {
        // Determine rank class for coloring
        const rankClass = index < 4 ? 'top-4' : 
                         index >= 17 ? 'relegation' : '';
        
        return `
            <div class="standings-row">
                <span class="standings-rank ${rankClass}">${team.idx}</span>
                <div class="standings-team">
                    <img src="https://images.fotmob.com/image_resources/logo/teamlogo/${team.id}_small.png" 
                         class="standings-team-logo" 
                         alt="${team.name}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                    <span class="standings-team-name">${team.name}</span>
                </div>
                <div class="standings-stats">
                    <span class="standings-stat">${team.played}</span>
                    <span class="standings-stat">${team.wins}</span>
                    <span class="standings-stat">${team.draws}</span>
                    <span class="standings-stat">${team.losses}</span>
                </div>
                <span class="standings-pts">${team.pts}</span>
            </div>
        `;
    },
    
    // Render empty state
    renderEmpty() {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-title">No standings available</div>
                <div class="empty-state-text">Unable to load standings at this time.</div>
                <button class="empty-state-action" onclick="IndexApp.loadStandings(true)">Try again</button>
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
                <div class="loading-text">Loading standings...</div>
            </div>
        `;
    },
    
    // Render error state
    renderError(message = 'Unable to load standings') {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">${message}</div>
                <div class="empty-state-text">Please check your internet connection and try again.</div>
                <button class="empty-state-action" onclick="IndexApp.loadStandings(true)">Retry</button>
            </div>
        `;
    }
};

// Make renderer globally available
window.IndexStandingsRenderer = IndexStandingsRenderer;