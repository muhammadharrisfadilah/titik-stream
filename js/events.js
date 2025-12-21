// ===== REFRESH CONTROL =====
let pullStartY = 0;
let isPulling = false;
let pullDistance = 0;

function handleTouchStart(e) {
  if (state.currentView !== "matches" || state.isRefreshing) return;

  if (window.scrollY > 10) return;

  pullStartY = e.touches[0].clientY;
  isPulling = true;
  pullDistance = 0;
}

function handleTouchMove(e) {
  if (!isPulling || state.isRefreshing) return;

  const currentY = e.touches[0].clientY;
  pullDistance = currentY - pullStartY;

  if (pullDistance > 0 && window.scrollY <= 10) {
    e.preventDefault();

    const progress = Math.min(pullDistance / 100, 1);

    if (pullDistance > 60) {
      elements.refreshControl.classList.add("show");
    }
  }
}

function handleTouchEnd(e) {
  if (!isPulling) return;

  if (pullDistance > 80) {
    triggerManualRefresh();
  } else {
    elements.refreshControl.classList.remove("show");
  }

  isPulling = false;
  pullDistance = 0;
}

async function triggerManualRefresh() {
  if (state.isRefreshing) return;

  state.isRefreshing = true;
  elements.refreshControl.classList.add("show");

  try {
    const dateStr = utils.formatDate(state.currentDate);
    const cacheKey = `matches_${dateStr}`;

    cacheManager.clear(cacheKey);

    const data = await api.fetchMatches(state.currentDate);

    cacheManager.set(cacheKey, data, 2 * 60 * 1000);

    state.matchesData = data;
    render.matches(data);

    utils.showToast("Matches refreshed", "success");
    state.lastRefreshTime = Date.now();
    state.retryCount = 0;
  } catch (error) {
    console.error("Refresh error:", error);
    utils.showToast("Refresh failed", "error");

    const dateStr = utils.formatDate(state.currentDate);
    const cacheKey = `matches_${dateStr}`;
    const cached = cacheManager.get(cacheKey);

    if (cached) {
      state.matchesData = cached;
      render.matches(cached);
    }
  } finally {
    setTimeout(() => {
      elements.refreshControl.classList.remove("show");
      state.isRefreshing = false;
    }, 500);
  }
}

// ===== MATCH DETAILS NAVIGATION =====
function showMatchDetails(matchId) {
  localStorage.setItem("previousView", state.currentView);
  localStorage.setItem(
    "previousDate",
    utils.formatDate(state.currentDate)
  );

  window.location.href = `match-details.html?matchId=${matchId}`;
}

// ===== EVENT LISTENER FOR MATCH CLICKS =====
document.addEventListener("click", function (e) {
  const matchItem = e.target.closest(".match-item");
  if (matchItem) {
    const matchId = matchItem.dataset.matchId;
    if (matchId) {
      showMatchDetails(matchId);
    }
  }
});

// ===== EVENT LISTENERS =====
function initEventListeners() {
  // Date navigation
  document
    .getElementById("prevDay")
    .addEventListener("click", () => dateManager.changeDate(-1));
  document
    .getElementById("nextDay")
    .addEventListener("click", () => dateManager.changeDate(1));
  document
    .getElementById("todayButton")
    .addEventListener("click", () => dateManager.toggleCalendar());

  // Calendar controls
  document
    .getElementById("prevMonth")
    .addEventListener("click", () => dateManager.changeMonth(-1));
  document
    .getElementById("nextMonth")
    .addEventListener("click", () => dateManager.changeMonth(1));

  // Bottom navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const view = e.currentTarget.dataset.view;
      viewManager.showView(view, e);
    });
  });

  // Filter tabs
  document.querySelectorAll("#filterTabs button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const filter = e.currentTarget.dataset.filter;
      viewManager.applyFilter(filter);
    });
  });

  // Calendar date selection (delegated)
  elements.calendarGrid.addEventListener("click", (e) => {
    const dateEl = e.target.closest(".calendar-day.date");
    if (dateEl && !dateEl.classList.contains("other-month")) {
      const dateStr = dateEl.dataset.date;
      if (dateStr) {
        dateManager.selectDate(dateStr);
      }
    }
  });

  // Close calendar when clicking outside
  document.addEventListener("click", (e) => {
    const dateNav = document.querySelector(".date-nav");
    const popup = elements.calendarPopup;

    if (!dateNav.contains(e.target) && popup.classList.contains("show")) {
      popup.classList.remove("show");
      document.getElementById("todayButton").classList.remove("expanded");
    }
  });

  // Touch events for pull-to-refresh
  document.addEventListener("touchstart", handleTouchStart, {
    passive: true,
  });
  document.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  document.addEventListener("touchend", handleTouchEnd);

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") dateManager.changeDate(-1);
    if (e.key === "ArrowRight") dateManager.changeDate(1);
    if (e.key === "Escape") {
      elements.calendarPopup.classList.remove("show");
      document.getElementById("todayButton").classList.remove("expanded");
    }
  });

  // Online/offline detection
  window.addEventListener("online", () => {
    utils.showToast("Back online", "success");

    if (state.currentView === "matches") {
      const dateStr = utils.formatDate(state.currentDate);
      const cacheKey = `matches_${dateStr}`;
      backgroundRefreshMatches(dateStr, cacheKey);
    }
  });

  window.addEventListener("offline", () => {
    utils.showToast("You are offline", "warning");
  });

  // Periodic background refresh for live matches
  setInterval(() => {
    if (state.currentView === "matches" && navigator.onLine) {
      const dateStr = utils.formatDate(state.currentDate);
      const cacheKey = `matches_${dateStr}`;

      if (state.matchesData && state.matchesData.leagues) {
        const hasLiveMatches = state.matchesData.leagues.some(
          (league) =>
            league.matches &&
            league.matches.some(
              (match) => utils.getMatchStatus(match) === "live"
            )
        );

        if (hasLiveMatches) {
          backgroundRefreshMatches(dateStr, cacheKey);
        }
      }
    }
  }, 30000); // Every 30 seconds
}

// ===== INITIALIZATION =====
function init() {
  dateManager.updateDateText();
  initEventListeners();
  loadMatches();

  elements.dateNav.classList.add("show");
  elements.filterTabs.classList.add("show");

  if (!navigator.onLine) {
    utils.showToast("You are offline. Using cached data.", "warning");
  }

  console.log("TITIK SPORTS v2.0 - Improved Logic");
}

// ===== START APP =====
document.addEventListener("DOMContentLoaded", init);