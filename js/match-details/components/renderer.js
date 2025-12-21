// ===== RENDERER COMPONENT =====
// This file contains all rendering functions for the UI
// Split into sections: Header, Overview, Stats, Lineups, Facts

const Renderer = {
    // Render match header
    renderHeader(data) {
        console.log('🎨 [RENDER-HEADER] Rendering header...');
        
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
                    <div class="match-status">${status}</div>
                </div>
            </div>
        `;
    },
    
    // Render overview tab (complex, requires separate file - keeping import here)
    renderOverview(data) {
        // This is large, so keeping it in main app or creating sub-module
        return window.OverviewRenderer ? window.OverviewRenderer.render(data) : 
            `<div class="empty">Overview renderer not loaded</div>`;
    },
    
    // Render stats tab
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
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;">
                    ${stats.slice(0, 6).map(stat => this.renderStatCard(stat)).join('')}
                </div>
            </div>
        `;
    },
    
    // Render individual stat bar
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
                            <div style="position: absolute; left: 0; top: 0; bottom: 0; width: ${homePercent}%; background: linear-gradient(90deg, #4CAF50, #66BB6A); transition: width 0.3s ease;"></div>
                            <div style="position: absolute; right: 0; top: 0; bottom: 0; width: ${awayPercent}%; background: linear-gradient(90deg, #42A5F5, #2196F3); transition: width 0.3s ease;"></div>
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
    
    // Render stat card
    renderStatCard(stat) {
        const homeValue = stat.stats?.[0] || 0;
        const awayValue = stat.stats?.[1] || 0;
        const total = homeValue + awayValue;
        
        return `
            <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none;">
                <div style="padding: 16px; text-align: center;">
                    <div style="font-size: 12px; opacity: 0.9; margin-bottom: 8px;">${stat.title}</div>
                    <div style="font-size: 28px; font-weight: bold; margin-bottom: 4px;">${total}</div>
                    <div style="font-size: 14px; opacity: 0.8;">${homeValue} - ${awayValue}</div>
                </div>
            </div>
        `;
    },
    
    // Render lineups - simplified version
    renderLineups(data) {
        const { lineups } = data;
        if (!lineups?.teams?.length) {
            return `<div class="tab-content active"><div class="empty"><div class="empty-icon">👥</div><div class="empty-title">Lineup not available</div></div></div>`;
        }
        
        return `
            <div class="tab-content active" style="padding: 20px;">
                ${lineups.teams.map((team, index) => this.renderTeamLineup(team, index)).join('')}
            </div>
        `;
    },
    
    // Render team lineup
    renderTeamLineup(team, index) {
        const isHome = index === 0;
        const primaryColor = isHome ? '#1e3c72' : '#2a5298';
        const lightGradient = isHome ? 
            'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)' : 
            'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
        
        return `
            <div class="card" style="margin-bottom: 30px; overflow: hidden; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.15);">
                <div style="background: ${lightGradient}; color: ${primaryColor}; padding: 28px 24px; border-bottom: 3px solid ${primaryColor};">
                    <h2 style="font-size: 32px; font-weight: 900; margin: 0; color: #333;">${team.name}</h2>
                    <p style="font-size: 16px; font-weight: 600; margin: 4px 0 0 0;">${team.formation}</p>
                </div>
                
                ${team.manager?.name ? `
                    <div style="display: flex; align-items: center; padding: 20px 24px; border-bottom: 1px solid #eee; background: white;">
                        <div style="min-width: 40px; height: 40px; background: #333; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                            👔
                        </div>
                        <div style="margin-left: 16px;">
                            <div style="font-size: 11px; color: #999; text-transform: uppercase;">Head Coach</div>
                            <div style="font-weight: 700; font-size: 18px; color: #333;">${team.manager.name}</div>
                        </div>
                    </div>
                ` : ''}
                
                <div style="padding: 20px 24px; background: white;">
                    ${this.renderPlayerList(team.players?.starting || [], 'starting', index)}
                    ${this.renderPlayerList(team.players?.substitutes || [], 'substitutes', index)}
                </div>
            </div>
        `;
    },
    
    // Render player list
    renderPlayerList(players, type, teamIndex) {
        if (!players.length) return '';
        
        const isStarting = type === 'starting';
        const teamColor = teamIndex === 0 ? '#4CAF50' : '#2196F3';
        
        return `
            <div style="padding: 20px 0; ${!isStarting ? 'border-top: 1px dashed #e0e0e0; margin-top: 20px;' : ''}">
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                    <h3 style="font-size: 20px; font-weight: 700; color: ${isStarting ? '#333' : '#666'}; margin: 0 10px 0 0;">
                        ${isStarting ? '⭐ Starting XI' : '🔄 Substitutes'}
                    </h3>
                    <span style="background: #f0f0f0; color: #333; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                        ${players.length} Players
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">
                    ${players.map(player => this.renderPlayer(player, teamColor)).join('')}
                </div>
            </div>
        `;
    },
    
    // Render individual player
    renderPlayer(player, teamColor) {
        return `
            <div style="display: flex; align-items: center; padding: 15px; background: #fff; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="position: relative; min-width: 45px; height: 45px; background: ${teamColor}; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; margin-right: 15px;">
                    ${player.shirtNumber || '-'}
                    ${player.captain || player.isCaptain ? `
                        <div style="position: absolute; top: -8px; right: -8px; background: #FFD700; color: #333; border-radius: 50%; width: 16px; height: 16px; line-height: 16px; text-align: center; font-size: 10px;">C</div>
                    ` : ''}
                </div>
                
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 16px; color: #1a1a1a;">
                        ${player.name}
                    </div>
                    <div style="font-size: 13px; color: #666;">
                        ${player.role?.name || player.position || 'N/A'}
                    </div>
                </div>
                
                ${player.rating?.num ? `
                    <div style="background: #FFC107; color: #333; padding: 5px 10px; border-radius: 20px; font-weight: 700; font-size: 13px;">
                        ${player.rating.num}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    // Render facts tab - simplified
    renderFacts(data) {
        return `<div class="tab-content active"><div class="card"><div class="card-title">📋 Match Facts</div><div class="card-content" style="padding: 20px;">Match facts will be displayed here.</div></div></div>`;
    }
};

// Make renderer globally available
window.Renderer = Renderer;