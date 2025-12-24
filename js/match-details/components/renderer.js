// ===== RENDERER COMPONENT =====
const Renderer = {
    renderHeader(data) {
        const { header, general } = data;
        const homeTeam = header?.teams?.[0] || { name: 'Home', score: 0 };
        const awayTeam = header?.teams?.[1] || { name: 'Away', score: 0 };
        const leagueName = general?.leagueName || 'Football Match';
        const matchTime = general?.matchTimeUTCDate ? 
            Helpers.formatDate(general.matchTimeUTCDate) : 'Time TBD';
        const status = header?.status?.reason?.long || 'Match Details';
        
        return `
            <div class="match-header">
                <div class="match-meta">
                    <div class="league">${leagueName}</div>
                    <div class="match-time">${matchTime}</div>
                </div>
                
                <div class="teams">
                    <div class="team home">
                        ${homeTeam.imageUrl ? 
                            `<img src="${homeTeam.imageUrl}" class="team-logo" alt="${homeTeam.name}">` 
                            : ''}
                        <div class="team-name">${homeTeam.name}</div>
                        <div class="team-score">${homeTeam.score ?? '-'}</div>
                    </div>
                    
                    <div class="vs">VS</div>
                    
                    <div class="team away">
                        ${awayTeam.imageUrl ? 
                            `<img src="${awayTeam.imageUrl}" class="team-logo" alt="${awayTeam.name}">` 
                            : ''}
                        <div class="team-name">${awayTeam.name}</div>
                        <div class="team-score">${awayTeam.score ?? '-'}</div>
                    </div>
                </div>
                
                <div class="text-center">
                    <div class="match-status ${data.general?.started && !data.general?.finished ? 'live' : ''}">
                        ${status}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderStats(data) {
        const { facts } = data;
        if (!facts?.events?.stats) {
            return `<div class="tab-content active"><div class="empty"><div class="empty-icon">📊</div><div class="empty-title">Statistics not available</div></div></div>`;
        }
        
        const stats = facts.events.stats;
        return `
            <div class="tab-content active">
                <div class="card">
                    <div class="card-title">📊 Detailed Match Statistics</div>
                    <div class="card-content" style="padding: 20px;">
                        ${stats.map(stat => this.renderStatBar(stat)).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderStatBar(stat) {
        const homeValue = stat.stats?.[0] || 0;
        const awayValue = stat.stats?.[1] || 0;
        
        let homePercent = 50;
        let awayPercent = 50;
        
        if (stat.title?.toLowerCase().includes('possession')) {
            homePercent = homeValue;
            awayPercent = awayValue;
        } else {
            const total = homeValue + awayValue;
            if (total > 0) {
                homePercent = Math.round((homeValue / total) * 100);
                awayPercent = 100 - homePercent;
            }
        }
        
        let emoji = '📊';
        const title = stat.title?.toLowerCase() || '';
        if (title.includes('possession')) emoji = '⚽';
        else if (title.includes('shots')) emoji = '🎯';
        else if (title.includes('passes')) emoji = '🔄';
        else if (title.includes('corners')) emoji = '🚩';
        else if (title.includes('fouls')) emoji = '⚠️';
        
        return `
            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <div style="font-size: 20px; font-weight: bold; color: #4CAF50; min-width: 60px; text-align: center;">
                        ${homeValue}${stat.title?.includes('possession') ? '%' : ''}
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">
                            ${emoji} ${stat.title}
                        </div>
                        <div style="height: 8px; background: #e0e0e0; border-radius: 10px; overflow: hidden; position: relative;">
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${homePercent}%; background: linear-gradient(90deg, #4CAF50, #66BB6A);"></div>
                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: ${awayPercent}%; background: linear-gradient(90deg, #42A5F5, #2196F3);"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: #999;">
                            <span>${homePercent}%</span>
                            <span>${awayPercent}%</span>
                        </div>
                    </div>
                    <div style="font-size: 20px; font-weight: bold; color: #2196F3; min-width: 60px; text-align: center;">
                        ${awayValue}${stat.title?.includes('possession') ? '%' : ''}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderLineups(data) {
        const { lineups } = data;
        if (!lineups?.teams?.length) {
            return `<div class="tab-content active"><div class="empty"><div class="empty-icon">👥</div><div class="empty-title">Lineup not available</div></div></div>`;
        }
        
        return `
            <div class="tab-content active">
                ${lineups.teams.map((team, index) => this.renderTeamLineup(team, index)).join('')}
            </div>
        `;
    },
    
    renderTeamLineup(team, index) {
        const isHome = index === 0;
        
        return `
            <div class="lineup-team">
                <div class="lineup-header">
                    <div class="lineup-team-name">${team.name}</div>
                    <div class="formation">${team.formation}</div>
                </div>
                
                <div class="lineup-section">
                    <div class="section-title">Starting XI</div>
                    <div class="player-list">
                        ${(team.players?.starting || []).map(player => this.renderPlayer(player, isHome ? 'home' : 'away')).join('')}
                    </div>
                </div>
                
                <div class="lineup-section">
                    <div class="section-title">Substitutes</div>
                    <div class="player-list">
                        ${(team.players?.substitutes || []).map(player => this.renderPlayer(player, isHome ? 'home' : 'away', true)).join('')}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderPlayer(player, teamType, isSubstitute = false) {
        return `
            <div class="player ${teamType} ${isSubstitute ? 'substitute' : ''}">
                <div class="player-number">${player.shirtNumber || '-'}</div>
                <div class="player-info">
                    <div class="player-name">${player.name || 'Unknown Player'}</div>
                    <div class="player-pos">${player.position || player.role?.name || 'N/A'}</div>
                </div>
            </div>
        `;
    },
    
    renderFacts(data) {
        const { facts } = data;
        if (!facts) {
            return `<div class="tab-content active"><div class="empty"><div class="empty-icon">📋</div><div class="empty-title">Match facts not available</div></div></div>`;
        }
        
        let factsHTML = '';
        
        if (facts.events?.events?.length > 0) {
            factsHTML += '<h3 style="margin-bottom: 16px;">Match Events</h3>';
            facts.events.events.forEach(event => {
                factsHTML += `
                    <div style="display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                        <div style="font-weight: bold; min-width: 40px;">${event.minute || 'N/A'}'</div>
                        <div style="flex: 1;">${event.teamName || event.team || 'N/A'}</div>
                        <div style="padding: 4px 8px; border-radius: 4px; background: #f0f0f0;">
                            ${event.type || 'Event'}
                        </div>
                    </div>
                `;
            });
        }
        
        return `
            <div class="tab-content active">
                <div class="card">
                    <div class="card-title">📋 Match Facts</div>
                    <div class="card-content" style="padding: 20px;">
                        ${factsHTML || 'No match facts available.'}
                    </div>
                </div>
            </div>
        `;
    }
};

window.Renderer = Renderer;