// ===== DATE MANAGER - DENGAN TOMBOL DALAM CARD =====

const IndexDateManager = {
    currentDate: new Date(),
    calendarDate: new Date(),
    
    elements: {
        dateDisplay: null,
        dateText: null,
        calendarPopup: null,
        calendarMonth: null,
        calendarGrid: null,
        prevDayBtn: null,
        nextDayBtn: null
    },
    
    // Initialize elements
    init() {
        this.elements = {
            dateDisplay: document.getElementById('dateDisplay'),
            dateText: document.getElementById('currentDateText'),
            calendarPopup: document.getElementById('calendarPopup'),
            calendarMonth: document.getElementById('calendarMonth'),
            calendarGrid: document.getElementById('calendarGrid'),
            prevDayBtn: document.getElementById('prevDay'),
            nextDayBtn: document.getElementById('nextDay')
        };
        
        this.updateDateText();
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Date display click
        this.elements.dateDisplay?.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.toggleCalendar();
        });
        
        // Previous day button
        this.elements.prevDayBtn?.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.changeDate(-1);
        });
        
        // Next day button
        this.elements.nextDayBtn?.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            this.changeDate(1);
        });
        
        // Calendar month navigation
        document.getElementById('prevMonth')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.changeMonth(-1);
        });
        
        document.getElementById('nextMonth')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.changeMonth(1);
        });
        
        // Calendar date selection
        document.getElementById('calendarGrid')?.addEventListener('click', (e) => {
            e.stopPropagation();
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
            const dateCard = document.querySelector('.date-card');
            const calendarPopup = document.getElementById('calendarPopup');
            
            if (calendarPopup?.classList.contains('show') && 
                !dateCard?.contains(e.target)) {
                this.toggleCalendar();
            }
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.changeDate(-1);
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.changeDate(1);
            }
            if (e.key === 'Escape') {
                const popup = document.getElementById('calendarPopup');
                if (popup?.classList.contains('show')) {
                    this.toggleCalendar();
                }
            }
        });
        
        // Swipe gestures
        this.setupSwipeGestures();
    },
    
    // Setup swipe gestures
    setupSwipeGestures() {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;
        
        const dateCard = document.querySelector('.date-card');
        
        if (!dateCard) return;
        
        dateCard.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });
        
        dateCard.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchEndX - touchStartX;
            
            if (Math.abs(swipeDistance) > minSwipeDistance) {
                if (swipeDistance > 0) {
                    // Swipe right - previous day
                    this.changeDate(-1);
                } else {
                    // Swipe left - next day
                    this.changeDate(1);
                }
            }
        }, { passive: true });
    },
    
    // Update date text
    updateDateText() {
        if (this.elements.dateText) {
            const formattedDate = IndexHelpers.formatDateText(this.currentDate);
            this.elements.dateText.textContent = formattedDate;
        }
    },
    
    // Toggle calendar visibility
    toggleCalendar() {
        const popup = this.elements.calendarPopup;
        const dateDisplay = this.elements.dateDisplay;
        
        if (!popup || !dateDisplay) return;
        
        if (popup.classList.contains('show')) {
            popup.classList.remove('show');
            dateDisplay.classList.remove('active');
        } else {
            this.calendarDate = new Date(this.currentDate);
            this.renderCalendar();
            popup.classList.add('show');
            dateDisplay.classList.add('active');
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
        
        if (this.elements.calendarMonth) {
            this.elements.calendarMonth.textContent = `${monthNames[month]} ${year}`;
        }
        
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
            
            // Check if today
            if (date.getFullYear() === today.getFullYear() &&
                date.getMonth() === today.getMonth() &&
                date.getDate() === today.getDate()) {
                className += ' today';
            }
            
            // Check if selected
            if (date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate()) {
                className += ' selected';
            }
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            html += `<div class="${className}" data-date="${dateStr}">${i}</div>`;
        }
        
        // Next month days
        const totalCells = 42;
        const daysSoFar = firstDayWeek + lastDate;
        const nextMonthDays = totalCells - daysSoFar;
        
        for (let i = 1; i <= nextMonthDays; i++) {
            html += `<div class="calendar-day date other-month">${i}</div>`;
        }
        
        if (this.elements.calendarGrid) {
            this.elements.calendarGrid.innerHTML = html;
        }
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