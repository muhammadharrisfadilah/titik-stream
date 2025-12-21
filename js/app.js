// ===== GLOBAL STATE =====
const state = {
  currentView: "matches",
  currentDate: new Date(),
  calendarDate: new Date(),
  matchesData: null,
  leaguesData: null,
  standingsData: null,
  cache: new Map(),
  activeFilter: "all",
  isRefreshing: false,
  isBackgroundRefreshing: false,
  lastRefreshTime: null,
  retryCount: 0,
  maxRetries: 3,
};

// ===== CACHE MANAGER =====
const cacheManager = {
  set(key, data, ttl = 5 * 60 * 1000) {
    const item = {
      data,
      expires: Date.now() + ttl,
      timestamp: Date.now(),
    };
    state.cache.set(key, item);
    try {
      localStorage.setItem(`ts_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn("LocalStorage error:", e);
      this.clearOldItems();
    }
  },

  get(key) {
    const memoryItem = state.cache.get(key);
    if (memoryItem && memoryItem.expires > Date.now()) {
      return memoryItem.data;
    }

    try {
      const stored = localStorage.getItem(`ts_${key}`);
      if (stored) {
        const item = JSON.parse(stored);
        if (item.expires > Date.now()) {
          state.cache.set(key, item);
          return item.data;
        } else {
          localStorage.removeItem(`ts_${key}`);
        }
      }
    } catch (e) {
      console.warn("Cache read error:", e);
    }

    return null;
  },

  clear(key) {
    state.cache.delete(key);
    try {
      localStorage.removeItem(`ts_${key}`);
    } catch (e) {
      console.warn("LocalStorage clear error:", e);
    }
  },

  clearOldItems() {
    try {
      const keys = Object.keys(localStorage).filter((key) =>
        key.startsWith("ts_")
      );
      keys.forEach((key) => {
        const item = JSON.parse(localStorage.getItem(key));
        if (item && item.expires < Date.now()) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn("Clear old items error:", e);
    }
  },

  getAllKeys() {
    try {
      return Object.keys(localStorage).filter((key) =>
        key.startsWith("ts_")
      );
    } catch (e) {
      return [];
    }
  },
};

// ===== DOM ELEMENTS =====
const elements = {
  content: document.getElementById("content"),
  currentDateText: document.getElementById("currentDateText"),
  calendarPopup: document.getElementById("calendarPopup"),
  calendarMonth: document.getElementById("calendarMonth"),
  calendarGrid: document.getElementById("calendarGrid"),
  filterTabs: document.getElementById("filterTabs"),
  dateNav: document.getElementById("dateNav"),
  toast: document.getElementById("toast"),
  refreshControl: document.getElementById("refreshControl"),
};

// ===== UTILITY FUNCTIONS =====
const utils = {
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  },

  formatDateText(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return "Today";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (compareDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (compareDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    }

    const options = { weekday: "short", day: "numeric", month: "short" };
    return date.toLocaleDateString("en-US", options);
  },

  formatTime(utcTime) {
    if (!utcTime) return "TBD";
    try {
      const date = new Date(utcTime);
      if (isNaN(date.getTime())) return "TBD";

      const hours = date.getHours();
      const minutes = date.getMinutes();
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
    } catch (e) {
      console.error("Error formatting time:", e);
      return "TBD";
    }
  },

  showToast(message, type = "info", duration = 3000) {
    const toast = elements.toast;
    toast.textContent = message;
    toast.className = "toast";

    if (type === "error") {
      toast.classList.add("error");
    } else if (type === "success") {
      toast.classList.add("success");
    } else if (type === "warning") {
      toast.classList.add("warning");
    }

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  isToday(date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  },

  getMatchStatus(match) {
    if (match.status?.finished) return "finished";
    if (match.status?.started && !match.status?.finished) return "live";
    return "scheduled";
  },
};

// ===== DATE FUNCTIONS =====
const dateManager = {
  updateDateText() {
    elements.currentDateText.textContent = utils.formatDateText(
      state.currentDate
    );
  },

  toggleCalendar() {
    const popup = elements.calendarPopup;
    const todayBtn = document.getElementById("todayButton");

    if (popup.classList.contains("show")) {
      popup.classList.remove("show");
      todayBtn.classList.remove("expanded");
    } else {
      state.calendarDate = new Date(state.currentDate);
      this.renderCalendar();
      popup.classList.add("show");
      todayBtn.classList.add("expanded");
    }
  },

  renderCalendar() {
    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    elements.calendarMonth.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    let html = "";
    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayHeaders.forEach((day) => {
      html += `<div class="calendar-day header">${day}</div>`;
    });

    for (let i = firstDayWeek - 1; i >= 0; i--) {
      html += `<div class="calendar-day date other-month">${
        prevLastDate - i
      }</div>`;
    }

    const today = new Date();
    const selectedDate = new Date(state.currentDate);

    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month, i);
      let className = "calendar-day date";

      if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      ) {
        className += " today";
      } else if (
        date.getFullYear() === selectedDate.getFullYear() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getDate() === selectedDate.getDate()
      ) {
        className += " selected";
      }

      html += `<div class="${className}" data-date="${year}-${
        month + 1
      }-${i}">${i}</div>`;
    }

    const totalCells = 42;
    const daysSoFar = firstDayWeek + lastDate;
    const nextMonthDays = totalCells - daysSoFar;

    for (let i = 1; i <= nextMonthDays; i++) {
      html += `<div class="calendar-day date other-month">${i}</div>`;
    }

    elements.calendarGrid.innerHTML = html;
  },

  changeMonth(delta) {
    state.calendarDate.setMonth(state.calendarDate.getMonth() + delta);
    this.renderCalendar();
  },

  selectDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    state.currentDate = new Date(year, month - 1, day);
    state.currentDate.setHours(0, 0, 0, 0);
    this.updateDateText();
    this.toggleCalendar();

    loadMatches();
  },

  changeDate(days) {
    state.currentDate.setDate(state.currentDate.getDate() + days);
    state.currentDate = new Date(state.currentDate);
    this.updateDateText();
    loadMatches();
  },
};

// ===== VIEW MANAGER =====
const viewManager = {
  showView(view, event) {
    state.currentView = view;

    document.querySelectorAll(".nav-item").forEach((el) => {
      el.classList.remove("active");
    });
    if (event && event.currentTarget) {
      event.currentTarget.classList.add("active");
    } else {
      document
        .querySelector(`.nav-item[data-view="${view}"]`)
        .classList.add("active");
    }

    if (view === "matches") {
      elements.dateNav.classList.add("show");
      elements.filterTabs.classList.add("show");
    } else {
      elements.dateNav.classList.remove("show");
      elements.filterTabs.classList.remove("show");
    }

    if (view === "matches") {
      loadMatches();
    } else if (view === "leagues") {
      loadLeagues();
    } else if (view === "standings") {
      loadStandings();
    }
  },

  toggleLeague(leagueId) {
    const matches = document.getElementById(`league-${leagueId}`);
    const header = document.getElementById(`league-header-${leagueId}`);

    if (matches && header) {
      matches.classList.toggle("expanded");
      header.classList.toggle("expanded");
    }
  },

  applyFilter(filter) {
    state.activeFilter = filter;

    document.querySelectorAll("#filterTabs button").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.filter === filter) {
        btn.classList.add("active");
      }
    });

    if (state.matchesData) {
      render.matches(state.matchesData);
    }
  },
};

// ===== API FUNCTIONS =====
const api = {
  async fetchMatches(date, retryCount = 0) {
    const dateStr = utils.formatDate(date);

    try {
      const response = await fetch(
        `https://www.fotmob.com/api/data/matches?date=${dateStr}&timezone=Asia%2FBangkok&ccode3=IDN`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.leagues) {
        data.leagues.forEach((league) => {
          if (league.matches) {
            league.matches.forEach((match) => {
              if (!match.status?.started && !match.status?.finished) {
                match.homeScore = "";
                match.awayScore = "";
              } else {
                match.homeScore = match.home?.score ?? "";
                match.awayScore = match.away?.score ?? "";
              }
            });
          }
        });
      }

      return data;
    } catch (error) {
      console.error("Fetch matches error:", error);

      if (retryCount < 3) {
        console.log(`Retrying fetch... Attempt ${retryCount + 1}`);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return this.fetchMatches(date, retryCount + 1);
      }

      throw error;
    }
  },

  async fetchLeagues(retryCount = 0) {
    try {
      const response = await fetch(
        "https://www.fotmob.com/api/allLeagues?locale=en&ccode3=IDN",
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch leagues error:", error);

      if (retryCount < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return this.fetchLeagues(retryCount + 1);
      }

      throw error;
    }
  },

  async fetchStandings(leagueId = 47, retryCount = 0) {
    try {
      const response = await fetch(
        `https://www.fotmob.com/api/leagues?id=${leagueId}&ccode3=IDN`,
        {
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Fetch standings error:", error);

      if (retryCount < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return this.fetchStandings(leagueId, retryCount + 1);
      }

      throw error;
    }
  },
};

// HAPUS EKSPOR DUPLIKAT - DIPINDAH KE loader.js
// window.dateManager = dateManager;
// window.viewManager = viewManager;
// window.loadMatches = loadMatches;
// window.loadLeagues = loadLeagues;
// window.loadStandings = loadStandings;

// TETAP EXPORT UNTUK FUNGSI GLOBAL LAINNYA
window.dateManager = dateManager;
window.viewManager = viewManager;
window.utils = utils;
window.selectLeague = (id) => {
  utils.showToast(
    `League ${id} selected - Feature in development`,
    "info"
  );
};