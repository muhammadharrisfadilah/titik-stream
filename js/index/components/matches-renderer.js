// ===== MATCHES RENDERER =====

const IndexMatchesRenderer = {
    // Render matches
    render(data) {
        const content = document.getElementById('content');
        if (!content) return;
        
        if (!data.leagues || data.leagues.length === 0) {
            this.renderEmpty();
            return;
        }
        
        let html = '';
        let hasLiveMatches = false;
        let hasMatches = false;
        let leagueIndex = 0;
        
        data.leagues.forEach((league) => {
            let matches = league.matches || [];
            
            // Apply filter
            const activeFilter = IndexViewManager.getActiveFilter();
            if (activeFilter !== 'all') {
                matches = matches.filter(match => {
                    const status = IndexHelpers.getMatchStatus(match);
                    return status === activeFilter;
                });
            }
            
            if (matches.length === 0) return;
            
            hasMatches = true;
            
            // Check for live matches
            const hasLive = matches.some(m => IndexHelpers.getMatchStatus(m) === 'live');
            if (hasLive) hasLiveMatches = true;
            
            html += this.renderLeagueSection(league, matches, leagueIndex);
            leagueIndex++;
        });
        
        if (!hasMatches) {
            this.renderNoMatchesForFilter();
            return;
        }
        
        content.innerHTML = html;
        content.classList.add('fade-in');
        
        // Insert native ads after rendering
        if (window.IndexAdsManager) {
            setTimeout(() => {
                window.IndexAdsManager.insertNativeAds();
            }, 300);
        }
        
        // Auto-expand leagues with live matches
        if (hasLiveMatches) {
            setTimeout(() => {
                this.autoExpandLiveLeagues();
            }, 100);
        }
    },
    
    // Render league section
    renderLeagueSection(league, matches, index) {
        let html = `
            <div class="league-section">
                <div class="league-header" id="league-header-${index}" onclick="IndexViewManager.toggleLeague(${index})">
                    <span class="league-icon">⚽</span>
                    <span class="league-name">${league.name || 'League'}</span>
                    <span class="count">${matches.length}</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="league-matches" id="league-${index}">
        `;
        
        matches.forEach(match => {
            html += this.renderMatchItem(match);
        });
        
        html += `</div></div>`;
        
        return html;
    },
    
    // Render match item
    renderMatchItem(match) {
        const status = IndexHelpers.getMatchStatus(match);
        const isLive = status === 'live';
        const isFinished = status === 'finished';
        const isScheduled = status === 'scheduled';
        
        let timeDisplay = '';
        let statusBadge = '';
        
        if (isFinished) {
            timeDisplay = '<span class="match-time finished">FT</span>';
        } else if (isLive) {
            const liveTime = match.status?.liveTime?.short || 
                           match.status?.reason?.short || 
                           'LIVE';
            timeDisplay = `<span class="match-time live">${liveTime}'</span>`;
            statusBadge = '<span class="match-status-badge live">LIVE</span>';
        } else if (isScheduled) {
            timeDisplay = `<span class="match-time">${IndexHelpers.formatTime(match.status?.utcTime)}</span>`;
            statusBadge = '<span class="match-status-badge scheduled">Scheduled</span>';
        }
        
        const homeScore = isScheduled ? '' : (match.home?.score ?? '');
        const awayScore = isScheduled ? '' : (match.away?.score ?? '');
        
        const homeLogo = match.home?.id ? 
            `https://images.fotmob.com/image_resources/logo/teamlogo/${match.home.id}_small.png` : '';
        const awayLogo = match.away?.id ? 
            `https://images.fotmob.com/image_resources/logo/teamlogo/${match.away.id}_small.png` : '';
        
        return `
            <div class="match-item" data-match-id="${match.id}">
                ${timeDisplay}
                <div class="match-teams">
                    <div class="team-row">
                        ${homeLogo ? `<img src="${homeLogo}" class="team-logo" alt="${match.home?.name || 'Home'}" loading="lazy" onerror="this.style.display='none'">` : ''}
                        <span class="team-name">${match.home?.name || 'TBD'}</span>
                    </div>
                    <div class="team-row">
                        ${awayLogo ? `<img src="${awayLogo}" class="team-logo" alt="${match.away?.name || 'Away'}" loading="lazy" onerror="this.style.display='none'">` : ''}
                        <span class="team-name">${match.away?.name || 'TBD'}</span>
                    </div>
                </div>
                <div class="match-score">
                    <span class="score ${homeScore === '' ? 'empty' : ''}">${homeScore === '' ? '-' : homeScore}</span>
                    <span class="score ${awayScore === '' ? 'empty' : ''}">${awayScore === '' ? '-' : awayScore}</span>
                </div>
                ${statusBadge ? `<div class="match-status">${statusBadge}</div>` : ''}
            </div>
        `;
    },
    
    // Render empty state
    renderEmpty() {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚽</div>
                <div class="empty-state-title">No matches scheduled</div>
                <div class="empty-state-text">There are no matches scheduled for this date.</div>
                <button class="empty-state-action" onclick="IndexDateManager.changeDate(1)">Check tomorrow</button>
            </div>
        `;
    },
    
    // Render no matches for filter
    renderNoMatchesForFilter() {
        const content = document.getElementById('content');
        if (!content) return;
        
        const activeFilter = IndexViewManager.getActiveFilter();
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No ${activeFilter} matches</div>
                <div class="empty-state-text">Try selecting a different filter or date.</div>
                <button class="empty-state-action" onclick="IndexViewManager.applyFilter('all')">Show all matches</button>
            </div>
        `;
    },
    
    // Auto-expand leagues with live matches
    autoExpandLiveLeagues() {
        document.querySelectorAll('.league-header').forEach((header, idx) => {
            const leagueMatches = document.getElementById(`league-${idx}`);
            if (leagueMatches) {
                const hasLive = leagueMatches.querySelector('.match-status-badge.live');
                if (hasLive) {
                    IndexViewManager.toggleLeague(idx);
                }
            }
        });
    },
    
    // Render loading state
    renderLoading() {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading matches...</div>
            </div>
        `;
    },
    
    // Render error state
    renderError(message = 'Unable to load matches') {
        const content = document.getElementById('content');
        if (!content) return;
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">${message}</div>
                <div class="empty-state-text">Please check your internet connection and try again.</div>
                <button class="empty-state-action" onclick="IndexApp.loadMatches(true)">Retry</button>
            </div>
        `;
    }
};

// Make renderer globally available
window.IndexMatchesRenderer = IndexMatchesRenderer;