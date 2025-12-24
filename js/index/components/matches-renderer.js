// ===== MATCHES RENDERER - DESAIN BARU TOTAL =====

const IndexMatchesRenderer = {
    // Define top leagues
    topLeagueIds: [
        2, 8, 10, 11, 13, 17, 19, 20, 23, 24, 32, 40, 42, 47, 53, 54, 55, 61, 64, 65, 66, 68, 69, 70, 72, 73, 75, 80, 81, 87, 88, 91, 95, 102, 103, 104, 105, 106, 107, 108, 110, 111, 113, 114, 115, 116, 117, 118, 119, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170
    ],
    
    topLeagueNames: [
        'UEFA Champions League',
        'Premier League',
        'La Liga',
        'Serie A',
        'Bundesliga',
        'Ligue 1',
        'Liga 1',
        'Champions League',
        'Europa League',
        'Conference League',
        'World Cup',
        'Euro',
        'Copa America',
        'Nations League',
        'AFC Champions League',
        'CAF Champions League',
        'CONCACAF Champions League',
        'Copa Libertadores',
        'Copa Sudamericana',
        'Eredivisie',
        'Primeira Liga',
        'Pro League',
        'Süper Lig',
        'Saudi Pro League',
        'J1 League',
        'K League 1',
        'Chinese Super League',
        'MLS',
        'Liga MX',
        'Brasileiro Série A'
    ],
    
    // Check if league is top league
    isTopLeague(league) {
        if (!league) return false;
        
        if (league.id && this.topLeagueIds.includes(league.id)) {
            return true;
        }
        
        const leagueName = (league.name || '').toLowerCase();
        return this.topLeagueNames.some(topName => 
            leagueName.includes(topName.toLowerCase()) ||
            leagueName.includes('indonesia') ||
            leagueName.includes('liga 1')
        );
    },
    
    // Get league icon
    getLeagueIcon(league) {
        const name = (league.name || '').toLowerCase();
        
        if (name.includes('champions league')) return '🏆';
        if (name.includes('premier league')) return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
        if (name.includes('liga 1') || name.includes('indonesia')) return '🇮🇩';
        if (name.includes('la liga')) return '🇪🇸';
        if (name.includes('serie a')) return '🇮🇹';
        if (name.includes('bundesliga')) return '🇩🇪';
        if (name.includes('ligue 1')) return '🇫🇷';
        if (name.includes('eredivisie')) return '🇳🇱';
        if (name.includes('primeira liga')) return '🇵🇹';
        if (name.includes('world cup')) return '🌍';
        if (name.includes('euro')) return '🇪🇺';
        if (name.includes('copa america')) return '🇺🇸';
        if (name.includes('afc')) return '🇦🇸';
        if (name.includes('caf')) return '🇦🇫';
        
        return '⚽';
    },
    
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
        
        // Separate leagues into top and other
        const topLeagues = [];
        const otherLeagues = [];
        
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
            
            // Categorize league
            if (this.isTopLeague(league)) {
                topLeagues.push({ league, matches });
            } else {
                otherLeagues.push({ league, matches });
            }
        });
        
        if (!hasMatches) {
            this.renderNoMatchesForFilter();
            return;
        }
        
        let leagueIndex = 0;
        
        // Render TOP LEAGUES
        if (topLeagues.length > 0) {
            topLeagues.forEach(({ league, matches }) => {
                html += this.renderLeagueCard(league, matches, leagueIndex, false);
                leagueIndex++;
            });
        }
        
        // Render HIDE ALL BUTTON (only if there are other leagues)
        if (otherLeagues.length > 0) {
            html += `
                <div class="hide-all-section">
                    <button class="hide-all-btn" id="hideAllBtn" onclick="IndexMatchesRenderer.toggleOtherLeagues()">
                        <span class="hide-all-text">Hide all</span>
                        <span class="hide-all-icon">▲</span>
                    </button>
                </div>
            `;
            
            // Render OTHER LEAGUES
            html += '<div class="other-leagues-container" id="otherLeaguesContainer">';
            otherLeagues.forEach(({ league, matches }) => {
                html += this.renderLeagueCard(league, matches, leagueIndex, true);
                leagueIndex++;
            });
            html += '</div>';
        }
        
        content.innerHTML = html;
        content.classList.add('fade-in');
        
        // Auto-expand leagues with live matches
        if (hasLiveMatches) {
            setTimeout(() => {
                this.autoExpandLiveLeagues();
            }, 100);
        }
    },
    
    // Render league card
    renderLeagueCard(league, matches, index, isOtherLeague = false) {
        const hasLiveMatches = matches.some(m => IndexHelpers.getMatchStatus(m) === 'live');
        const arrow = '▼';
        const leagueIcon = this.getLeagueIcon(league);
        
        return `
            <div class="league-card" id="league-${index}">
                <div class="league-header" onclick="IndexViewManager.toggleLeague(${index})">
                    <div class="league-title">
                        <div class="league-icon">${leagueIcon}</div>
                        <div class="league-name">${league.name || 'League'}</div>
                    </div>
                    <div class="league-count">
                        <span class="count-number">${matches.length}</span>
                        <span class="count-arrow">${arrow}</span>
                    </div>
                </div>
                <div class="matches-container" id="matches-${index}">
                    ${matches.map(match => this.renderMatchCard(match)).join('')}
                </div>
            </div>
        `;
    },
    
    // Render match card
    renderMatchCard(match) {
        const status = IndexHelpers.getMatchStatus(match);
        const isLive = status === 'live';
        const isFinished = status === 'finished';
        const isScheduled = status === 'scheduled';
        
        // Time display
        let timeDisplay = '';
        let timeClass = 'time-text';
        let timeStatus = '';
        
        if (isFinished) {
            timeDisplay = 'FT';
            timeClass += ' finished';
            timeStatus = 'Finished';
        } else if (isLive) {
            const liveTime = match.status?.liveTime?.short || 
                           match.status?.reason?.short || 
                           'LIVE';
            timeDisplay = `${liveTime}"`;
            timeClass += ' live';
            timeStatus = 'Live';
        } else if (isScheduled) {
            timeDisplay = IndexHelpers.formatTime(match.status?.utcTime);
            timeStatus = 'Scheduled';
        }
        
        // Scores
        const homeScore = isScheduled ? '' : (match.home?.score ?? '0');
        const awayScore = isScheduled ? '' : (match.away?.score ?? '0');
        
        // Team logos
        const homeLogo = match.home?.id ? 
            `https://images.fotmob.com/image_resources/logo/teamlogo/${match.home.id}_small.png` : '';
        const awayLogo = match.away?.id ? 
            `https://images.fotmob.com/image_resources/logo/teamlogo/${match.away.id}_small.png` : '';
        
        // Team names
        const homeName = match.home?.name || 'TBD';
        const awayName = match.away?.name || 'TBD';
        
        // Live indicator
        const liveIndicator = isLive ? `
            <div class="live-indicator">
                <div class="live-dot"></div>
                LIVE
            </div>
        ` : '';
        
        return `
            <div class="match-card ${isLive ? 'live' : ''}" data-match-id="${match.id}">
                <div class="match-time">
                    <div class="${timeClass}">${timeDisplay}</div>
                    <div class="time-status">${timeStatus}</div>
                </div>
                <div class="match-teams">
                    <div class="team-row">
                        <div class="team-info">
                            ${homeLogo ? `<img src="${homeLogo}" class="team-logo" alt="${homeName}" loading="lazy">` : ''}
                            <span class="team-name">${homeName}</span>
                        </div>
                        <div class="team-score ${isScheduled ? 'scheduled' : ''}">${homeScore}</div>
                    </div>
                    <div class="team-row">
                        <div class="team-info">
                            ${awayLogo ? `<img src="${awayLogo}" class="team-logo" alt="${awayName}" loading="lazy">` : ''}
                            <span class="team-name">${awayName}</span>
                        </div>
                        <div class="team-score ${isScheduled ? 'scheduled' : ''}">${awayScore}</div>
                    </div>
                </div>
                ${liveIndicator}
            </div>
        `;
    },
    
    // Toggle other leagues visibility
    toggleOtherLeagues() {
        const container = document.getElementById('otherLeaguesContainer');
        const btn = document.getElementById('hideAllBtn');
        const text = btn?.querySelector('.hide-all-text');
        const icon = btn?.querySelector('.hide-all-icon');
        
        if (!container || !btn) return;
        
        const isHidden = container.classList.contains('hidden');
        
        if (isHidden) {
            container.classList.remove('hidden');
            if (text) text.textContent = 'Hide all';
            if (icon) icon.textContent = '▲';
            btn.classList.remove('collapsed');
        } else {
            container.classList.add('hidden');
            if (text) text.textContent = 'Show all';
            if (icon) icon.textContent = '▼';
            btn.classList.add('collapsed');
        }
    },
    
    // Auto-expand leagues with live matches
    autoExpandLiveLeagues() {
        document.querySelectorAll('.league-header').forEach((header, idx) => {
            const matchesContainer = document.getElementById(`matches-${idx}`);
            if (matchesContainer) {
                const hasLive = matchesContainer.querySelector('.match-card.live');
                if (hasLive) {
                    IndexViewManager.toggleLeague(idx);
                }
            }
        });
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
        let filterText = activeFilter;
        
        if (activeFilter === 'live') filterText = 'live';
        if (activeFilter === 'finished') filterText = 'finished';
        if (activeFilter === 'scheduled') filterText = 'upcoming';
        
        content.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No ${filterText} matches</div>
                <div class="empty-state-text">Try selecting a different filter or date.</div>
                <button class="empty-state-action" onclick="IndexViewManager.applyFilter('all')">Show all matches</button>
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