// ===== DATE MANAGER =====

const IndexDateManager = {
    currentDate: new Date(),
    calendarDate: new Date(),
    
    elements: {
        currentDateText: null,
        calendarPopup: null,
        calendarMonth: null,
        calendarGrid: null,
        todayButton: null
    },
    
    // Initialize elements
    init() {
        this.elements = {
            currentDateText: document.getElementById('currentDateText'),
            calendarPopup: document.getElementById('calendarPopup'),
            calendarMonth: document.getElementById('calendarMonth'),
            calendarGrid: document.getElementById('calendarGrid'),
            todayButton: document.getElementById('todayButton')
        };
        
        this.updateDateText();
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Previous day
        document.getElementById('prevDay')?.addEventListener('click', () => {
            this.changeDate(-1);
        });
        
        // Next day
        document.getElementById('nextDay')?.addEventListener('click', () => {
            this.changeDate(1);
        });
        
        // Toggle calendar
        this.elements.todayButton?.addEventListener('click', () => {
            this.toggleCalendar();
        });
        
        // Calendar month navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.changeMonth(-1);
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.changeMonth(1);
        });
        
        // Calendar date selection
        this.elements.calendarGrid?.addEventListener('click', (e) => {
            const dateEl = e.target.closest('.calendar-day.date');
            if (dateEl && !dateEl.classList.contains('other-month')) {
                const dateStr = dateEl.dataset.date;
                if (dateStr) {
                    this.selectDate(dateStr);
                }
            }
        });
        
        // Close calendar when clicking outside
        document.addEventListener('click', (e) => {
            const dateNav = document.querySelector('.date-nav');
            if (!dateNav?.contains(e.target) && this.elements.calendarPopup?.classList.contains('show')) {
                this.toggleCalendar();
            }
        });
    },
    
    // Update date text
    updateDateText() {
        if (this.elements.currentDateText) {
            this.elements.currentDateText.textContent = IndexHelpers.formatDateText(this.currentDate);
        }
    },
    
    // Toggle calendar visibility
    toggleCalendar() {
        const popup = this.elements.calendarPopup;
        const todayBtn = this.elements.todayButton;
        
        if (!popup || !todayBtn) return;
        
        if (popup.classList.contains('show')) {
            popup.classList.remove('show');
            todayBtn.classList.remove('expanded');
        } else {
            this.calendarDate = new Date(this.currentDate);
            this.renderCalendar();
            popup.classList.add('show');
            todayBtn.classList.add('expanded');
        }
    },
    
    // Render calendar
    renderCalendar() {
        const year = this.calendarDate.getFullYear();
        const month = this.calendarDate.getMonth();
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.elements.calendarMonth.textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const prevLastDay = new Date(year, month, 0);
        
        const firstDayWeek = firstDay.getDay();
        const lastDate = lastDay.getDate();
        const prevLastDate = prevLastDay.getDate();
        
        let html = '';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            html += `<div class="calendar-day header">${day}</div>`;
        });
        
        // Previous month days
        for (let i = firstDayWeek - 1; i >= 0; i--) {
            html += `<div class="calendar-day date other-month">${prevLastDate - i}</div>`;
        }
        
        // Current month days
        const today = new Date();
        const selectedDate = new Date(this.currentDate);
        
        for (let i = 1; i <= lastDate; i++) {
            const date = new Date(year, month, i);
            let className = 'calendar-day date';
            
            if (date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()) {
                className += ' today';
            } else if (date.getFullYear() === selectedDate.getFullYear() &&
                       date.getMonth() === selectedDate.getMonth() &&
                       date.getDate() === selectedDate.getDate()) {
                className += ' selected';
            }
            
            html += `<div class="${className}" data-date="${year}-${month + 1}-${i}">${i}</div>`;
        }
        
        // Next month days
        const totalCells = 42;
        const daysSoFar = firstDayWeek + lastDate;
        const nextMonthDays = totalCells - daysSoFar;
        
        for (let i = 1; i <= nextMonthDays; i++) {
            html += `<div class="calendar-day date other-month">${i}</div>`;
        }
        
        this.elements.calendarGrid.innerHTML = html;
    },
    
    // Change month
    changeMonth(delta) {
        this.calendarDate.setMonth(this.calendarDate.getMonth() + delta);
        this.renderCalendar();
    },
    
    // Select date from calendar
    selectDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        this.currentDate = new Date(year, month - 1, day);
        this.currentDate.setHours(0, 0, 0, 0);
        this.updateDateText();
        this.toggleCalendar();
        
        // Reload matches for new date
        if (window.IndexApp && window.IndexApp.loadMatches) {
            window.IndexApp.loadMatches();
        }
    },
    
    // Change date by days
    changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.currentDate = new Date(this.currentDate);
        this.updateDateText();
        
        // Reload matches for new date
        if (window.IndexApp && window.IndexApp.loadMatches) {
            window.IndexApp.loadMatches();
        }
    },
    
    // Get current date
    getCurrentDate() {
        return this.currentDate;
    },
    
    // Set current date
    setCurrentDate(date) {
        this.currentDate = new Date(date);
        this.currentDate.setHours(0, 0, 0, 0);
        this.updateDateText();
    }
};

// Make manager globally available
window.IndexDateManager = IndexDateManager;