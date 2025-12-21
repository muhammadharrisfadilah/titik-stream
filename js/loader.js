// ===== LOAD FUNCTIONS =====
async function loadMatches(forceRefresh = false) {
  const dateStr = utils.formatDate(state.currentDate);
  const cacheKey = `matches_${dateStr}`;

  const cachedData = cacheManager.get(cacheKey);

  if (!forceRefresh && cachedData) {
    state.matchesData = cachedData;
    render.matches(cachedData);

    backgroundRefreshMatches(dateStr, cacheKey);
    return;
  }

  elements.content.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading matches...</div>
    </div>`;

  try {
    const data = await api.fetchMatches(state.currentDate);

    cacheManager.set(cacheKey, data, 2 * 60 * 1000);

    state.matchesData = data;
    render.matches(data);

    state.lastRefreshTime = Date.now();
    state.retryCount = 0;
  } catch (error) {
    console.error("Error loading matches:", error);

    const cached = cacheManager.get(cacheKey);
    if (cached) {
      state.matchesData = cached;
      render.matches(cached);
      utils.showToast("Using cached data", "warning");
    } else {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Unable to load matches</div>
          <div class="empty-state-text">Please check your internet connection and try again.</div>
          <button class="empty-state-action" onclick="loadMatches(true)">Retry</button>
        </div>`;
      utils.showToast("Failed to load matches", "error");
    }

    startBackgroundRetry("matches", dateStr, cacheKey);
  }
}

async function backgroundRefreshMatches(dateStr, cacheKey) {
  if (state.isBackgroundRefreshing) return;

  state.isBackgroundRefreshing = true;

  try {
    const data = await api.fetchMatches(state.currentDate);

    cacheManager.set(cacheKey, data, 2 * 60 * 1000);

    if (
      state.currentView === "matches" &&
      dateStr === utils.formatDate(state.currentDate)
    ) {
      state.matchesData = data;
      render.matches(data);
    }

    state.retryCount = 0;
  } catch (error) {
    console.log("Background refresh failed:", error);
  } finally {
    state.isBackgroundRefreshing = false;
  }
}

async function loadLeagues(forceRefresh = false) {
  const cacheKey = "all_leagues";
  const cachedData = cacheManager.get(cacheKey);

  if (!forceRefresh && cachedData) {
    state.leaguesData = cachedData;
    render.leagues(cachedData);
    return;
  }

  elements.content.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading leagues...</div>
    </div>`;

  try {
    const data = await api.fetchLeagues();
    cacheManager.set(cacheKey, data, 30 * 60 * 1000);
    state.leaguesData = data;
    render.leagues(data);
  } catch (error) {
    console.error("Error loading leagues:", error);

    const cached = cacheManager.get(cacheKey);
    if (cached) {
      state.leaguesData = cached;
      render.leagues(cached);
      utils.showToast("Using cached data", "warning");
    } else {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Unable to load leagues</div>
          <div class="empty-state-text">Please check your internet connection and try again.</div>
          <button class="empty-state-action" onclick="loadLeagues(true)">Retry</button>
        </div>`;
      utils.showToast("Failed to load leagues", "error");
    }
  }
}

async function loadStandings(forceRefresh = false) {
  const cacheKey = "standings_47";
  const cachedData = cacheManager.get(cacheKey);

  if (!forceRefresh && cachedData) {
    state.standingsData = cachedData;
    render.standings(cachedData);
    return;
  }

  elements.content.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading standings...</div>
    </div>`;

  try {
    const data = await api.fetchStandings();
    cacheManager.set(cacheKey, data, 10 * 60 * 1000);
    state.standingsData = data;
    render.standings(data);
  } catch (error) {
    console.error("Error loading standings:", error);

    const cached = cacheManager.get(cacheKey);
    if (cached) {
      state.standingsData = cached;
      render.standings(cached);
      utils.showToast("Using cached data", "warning");
    } else {
      elements.content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Unable to load standings</div>
          <div class="empty-state-text">Please check your internet connection and try again.</div>
          <button class="empty-state-action" onclick="loadStandings(true)">Retry</button>
        </div>`;
      utils.showToast("Failed to load standings", "error");
    }
  }
}

// ===== BACKGROUND RETRY SYSTEM =====
function startBackgroundRetry(type, dateStr, cacheKey) {
  if (state.retryCount >= state.maxRetries) {
    console.log(`Max retries reached for ${type}`);
    return;
  }

  state.retryCount++;

  const delay = Math.min(1000 * Math.pow(2, state.retryCount - 1), 10000);

  console.log(
    `Scheduling background retry for ${type} in ${delay}ms (attempt ${state.retryCount})`
  );

  setTimeout(async () => {
    try {
      let data;

      if (type === "matches") {
        data = await api.fetchMatches(state.currentDate);
        cacheManager.set(cacheKey, data, 2 * 60 * 1000);

        if (
          state.currentView === "matches" &&
          dateStr === utils.formatDate(state.currentDate)
        ) {
          state.matchesData = data;
          render.matches(data);
          utils.showToast("Data updated", "success");
          state.retryCount = 0;
        }
      }
    } catch (error) {
      console.log(
        `Background retry ${state.retryCount} failed for ${type}`
      );

      if (state.retryCount < state.maxRetries) {
        startBackgroundRetry(type, dateStr, cacheKey);
      }
    }
  }, delay);
}

// ===== EKSPOR FUNGSI KE WINDOW =====
window.loadMatches = loadMatches;
window.loadLeagues = loadLeagues;
window.loadStandings = loadStandings;