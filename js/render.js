// ===== RENDER FUNCTIONS =====
const render = {
  matches(data) {
    if (!data.leagues || data.leagues.length === 0) {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚽</div>
          <div class="empty-state-title">No matches scheduled</div>
          <div class="empty-state-text">There are no matches scheduled for this date.</div>
          <button class="empty-state-action" onclick="dateManager.changeDate(1)">Check tomorrow</button>
        </div>`;
      return;
    }

    let html = "";
    let hasLiveMatches = false;
    let hasMatches = false;

    data.leagues.forEach((league, idx) => {
      let matches = league.matches || [];

      if (state.activeFilter !== "all") {
        matches = matches.filter((match) => {
          const status = utils.getMatchStatus(match);
          return status === state.activeFilter;
        });
      }

      if (matches.length === 0) return;

      hasMatches = true;

      const hasLive = matches.some(
        (m) => utils.getMatchStatus(m) === "live"
      );
      if (hasLive) hasLiveMatches = true;

      html += `
        <div class="league-section">
          <div class="league-header" id="league-header-${idx}" onclick="viewManager.toggleLeague(${idx})">
            <span class="league-icon">⚽</span>
            <span class="league-name">${league.name || "League"}</span>
            <span class="count">${matches.length}</span>
            <span class="arrow">▼</span>
          </div>
          <div class="league-matches" id="league-${idx}">`;

      matches.forEach((match) => {
        const status = utils.getMatchStatus(match);
        const isLive = status === "live";
        const isFinished = status === "finished";
        const isScheduled = status === "scheduled";

        let timeDisplay = "";
        let statusBadge = "";

        if (isFinished) {
          timeDisplay = '<span class="match-time finished">FT</span>';
        } else if (isLive) {
          const liveTime =
            match.status?.liveTime?.short ||
            match.status?.reason?.short ||
            "LIVE";
          timeDisplay = `<span class="match-time live">${liveTime}'</span>`;
          statusBadge =
            '<span class="match-status-badge live">LIVE</span>';
        } else if (isScheduled) {
          timeDisplay = `<span class="match-time">${utils.formatTime(
            match.status?.utcTime
          )}</span>`;
          statusBadge =
            '<span class="match-status-badge scheduled">Scheduled</span>';
        }

        const homeScore = isScheduled ? "" : match.home?.score ?? "";
        const awayScore = isScheduled ? "" : match.away?.score ?? "";

        const homeLogo = match.home?.id
          ? `https://images.fotmob.com/image_resources/logo/teamlogo/${match.home.id}_small.png`
          : "";
        const awayLogo = match.away?.id
          ? `https://images.fotmob.com/image_resources/logo/teamlogo/${match.away.id}_small.png`
          : "";

        html += `
          <div class="match-item" data-match-id="${match.id}">
            ${timeDisplay}
            <div class="match-teams">
              <div class="team-row">
                ${
                  homeLogo
                    ? `<img src="${homeLogo}" class="team-logo" alt="${
                        match.home?.name || "Home team"
                      }" loading="lazy" onerror="this.style.display='none'">`
                    : ""
                }
                <span class="team-name">${match.home?.name || "TBD"}</span>
              </div>
              <div class="team-row">
                ${
                  awayLogo
                    ? `<img src="${awayLogo}" class="team-logo" alt="${
                        match.away?.name || "Away team"
                      }" loading="lazy" onerror="this.style.display='none'">`
                    : ""
                }
                <span class="team-name">${match.away?.name || "TBD"}</span>
              </div>
            </div>
            <div class="match-score">
              <span class="score ${homeScore === "" ? "empty" : ""}">${
          homeScore === "" ? "-" : homeScore
        }</span>
              <span class="score ${awayScore === "" ? "empty" : ""}">${
          awayScore === "" ? "-" : awayScore
        }</span>
            </div>
            ${
              statusBadge
                ? `<div class="match-status">${statusBadge}</div>`
                : ""
            }
          </div>`;
      });

      html += `</div></div>`;
    });

    if (!hasMatches) {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">No ${state.activeFilter} matches</div>
          <div class="empty-state-text">Try selecting a different filter or date.</div>
          <button class="empty-state-action" onclick="viewManager.applyFilter('all')">Show all matches</button>
        </div>`;
    } else {
      elements.content.innerHTML = html;
      elements.content.classList.add("fade-in");

      if (hasLiveMatches) {
        setTimeout(() => {
          document
            .querySelectorAll(".league-header")
            .forEach((header, idx) => {
              const leagueMatches = document.getElementById(
                `league-${idx}`
              );
              if (
                leagueMatches &&
                header.querySelector(".count").textContent > "0"
              ) {
                viewManager.toggleLeague(idx);
              }
            });
        }, 100);
      }
    }
  },

  leagues(data) {
    if (!data.popular || data.popular.length === 0) {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <div class="empty-state-title">No leagues available</div>
          <div class="empty-state-text">Unable to load league information at this time.</div>
          <button class="empty-state-action" onclick="loadLeagues(true)">Try again</button>
        </div>`;
      return;
    }

    let html =
      '<div class="leagues-container"><h2 class="standings-header">🏆 Popular Leagues</h2>';

    data.popular.slice(0, 20).forEach((league, idx) => {
      html += `
        <div class="league-card" onclick="selectLeague(${league.id})">
          <div class="league-card-icon">${league.name.charAt(0)}</div>
          <div class="league-card-info">
            <div class="league-card-name">${league.name}</div>
            <div class="league-card-country">${
              league.ccode || "International"
            }</div>
          </div>
        </div>`;
    });

    html += "</div>";
    elements.content.innerHTML = html;
    elements.content.classList.add("fade-in");
  },

  standings(data) {
    if (!data.table || data.table.length === 0) {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title">No standings available</div>
          <div class="empty-state-text">Unable to load standings at this time.</div>
          <button class="empty-state-action" onclick="loadStandings(true)">Try again</button>
        </div>`;
      return;
    }

    let html = '<div class="standings-container">';
    html += `<h2 class="standings-header">${
      data.details?.name || "Premier League"
    } Standings</h2>`;

    if (data.table[0]?.data?.table?.all) {
      html += '<div class="standings-table">';

      data.table[0].data.table.all.forEach((team, index) => {
        const rankClass =
          index < 4 ? "top-4" : index >= 17 ? "relegation" : "";

        html += `
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
          </div>`;
      });

      html += "</div>";
    }

    html += "</div>";
    elements.content.innerHTML = html;
    elements.content.classList.add("fade-in");
  },
};