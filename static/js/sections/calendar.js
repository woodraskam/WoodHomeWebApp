/**
 * Calendar Section
 * Google Calendar integration with Material Design 3
 */
class CalendarSection extends AuthenticatedSection {
    constructor() {
        super();
        this.events = [];
        this.calendars = [];
        this.selectedCalendars = new Set();
        this.currentView = 'month';
        this.currentDate = new Date();
        this.colorPalette = [];
        this.calendarColors = {}; // Store calendar colors from API
        this.colorManager = new CalendarColorManager();
        this.init();
        this.setupModalEventListeners();
    }

    init() {
        this.setupEventListeners();
        this.createCalendarSection();
        // Don't check authentication on init - wait for user to navigate to section
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            if (e.detail.section === 'calendar') {
                this.load();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            if (e.detail.section === 'calendar') {
                this.show();
            } else {
                this.hide();
            }
        });

        // Listen for authentication events
        document.addEventListener('calendar-authenticated', () => {
            this.isAuthenticated = true;
            this.loadEvents();
        });

        // Google Calendar header navigation
        this.setupHeaderNavigation();
        
        // Keyboard navigation
        this.setupKeyboardNavigation();

        // Listen for OAuth callback completion
        window.addEventListener('load', () => {
            // Check if we're returning from OAuth callback
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('code') && window.location.pathname.includes('/auth/google/callback')) {
                // OAuth callback completed, refresh the calendar
                setTimeout(() => {
                    this.checkAuthentication();
                }, 1000);
            }
        });
    }

    /**
     * Override base class initialize method
     */
    initialize() {
        console.log('CalendarSection: Initialize called (authentication required)');
        // Only initialize if authenticated
        if (this.isAuthenticated()) {
            this.setupCalendarEventListeners();
            this.checkAuthentication();
        } else {
            this.showAuthenticationRequired();
        }
    }

    /**
     * Override base class show method
     */
    show() {
        console.log('CalendarSection: Show called');
        const section = document.getElementById('calendar-section');
        if (section) {
            section.style.display = 'block';
            section.classList.add('m3-section--transitioning');

            // Trigger dissolve in animation
            requestAnimationFrame(() => {
                section.classList.remove('m3-section--transitioning');
                section.classList.add('m3-section--active');
                console.log('CalendarSection: Section shown with dissolve transition');
            });
        }
    }

    /**
     * Override base class hide method
     */
    hide() {
        console.log('CalendarSection: Hide called');
        const section = document.getElementById('calendar-section');
        if (section) {
            section.classList.remove('m3-section--active');
            section.classList.add('m3-section--transitioning');

            // Wait for transition to complete before hiding
            setTimeout(() => {
                section.style.display = 'none';
                section.classList.remove('m3-section--transitioning');
                console.log('CalendarSection: Section hidden with dissolve transition');
            }, 300); // Match the CSS transition duration
        }
    }

    /**
     * Override base class cleanup method
     */
    cleanup() {
        console.log('CalendarSection: Cleanup called');
        // Clear data
        this.events = [];
    }

    /**
     * Override base class showAuthenticationRequired method
     */
    showAuthenticationRequired() {
        console.log('CalendarSection: Authentication required');
        // Show authentication prompt or redirect to login
        const section = document.getElementById('calendar-section');
        if (section) {
            section.innerHTML = `
                <div class="m3-card">
                    <div class="m3-card__content">
                        <div class="m3-calendar-auth">
                            <div class="m3-calendar-auth__icon">
                                <span class="material-symbols-outlined">event</span>
                            </div>
                            <div class="m3-calendar-auth__content">
                                <h3 class="m3-calendar-auth__title">Connect to Google Calendar</h3>
                                <p class="m3-calendar-auth__description">
                                    Please authenticate to access your Google Calendar events.
                                </p>
                                <button class="m3-button m3-button--primary" onclick="window.location.href='/auth/google/login'">
                                    <span class="material-symbols-outlined">login</span>
                                    Sign in with Google
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    createCalendarSection() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        const calendarSection = document.createElement('div');
        calendarSection.id = 'calendar-section';
        calendarSection.className = 'm3-section';
        calendarSection.innerHTML = this.getCalendarSectionHTML();

        contentArea.appendChild(calendarSection);
    }

    getCalendarSectionHTML() {
        return `

            <!-- Authentication Section -->
            <div class="m3-card" id="calendar-auth-card">
                <div class="m3-card__content">
                    <div class="m3-calendar-auth">
                        <div class="m3-calendar-auth__icon">
                            <span class="material-symbols-outlined">event</span>
                        </div>
                        <div class="m3-calendar-auth__content">
                            <h3 class="m3-calendar-auth__title">Connect to Google Calendar</h3>
                            <p class="m3-calendar-auth__description">
                                Sign in to view your calendar events and manage your schedule.
                            </p>
                            <button class="m3-button m3-button--primary" id="calendar-login-btn">
                                <span class="material-symbols-outlined">login</span>
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Split-Pane Layout -->
            <div class="m3-calendar-split-container" id="calendar-split-container" style="display: none;">
                <!-- Left Pane: Calendar and Filter -->
                <div class="m3-calendar-left-pane">
                    <!-- Calendar View -->
                    <div class="m3-card" id="calendar-view-card">
                        <div class="m3-card__header m3-calendar-header-container">
                            <!-- Google Calendar Style Header -->
                            <div class="m3-calendar-header">
                                <div class="m3-calendar-header__left">
                                    <button class="m3-button m3-button--today" id="calendar-today-btn">Today</button>
                                    <div class="m3-calendar-header__navigation">
                                        <button class="m3-icon-button m3-icon-button--nav" id="calendar-prev-btn">
                                            <span class="material-symbols-rounded">chevron_left</span>
                                        </button>
                                        <button class="m3-icon-button m3-icon-button--nav" id="calendar-next-btn">
                                            <span class="material-symbols-rounded">chevron_right</span>
                                        </button>
                                    </div>
                                    <h1 class="m3-calendar-header__title" id="calendar-title">October 2025</h1>
                                </div>
                                <div class="m3-calendar-header__right">
                                    <button class="m3-icon-button" id="calendar-search-btn">
                                        <span class="material-symbols-rounded">search</span>
                                    </button>
                                    <button class="m3-icon-button" id="calendar-help-btn">
                                        <span class="material-symbols-rounded">help</span>
                                    </button>
                                    <button class="m3-icon-button" id="calendar-settings-btn">
                                        <span class="material-symbols-rounded">settings</span>
                                    </button>
                                    <div class="m3-calendar-header__view-selector">
                                        <button class="m3-button m3-button--view-selector" id="calendar-view-selector">
                                            Month <span class="material-symbols-rounded">keyboard_arrow_down</span>
                                        </button>
                                    </div>
                                    <button class="m3-icon-button" id="calendar-manager-btn">
                                        <span class="material-symbols-rounded">calendar_month</span>
                                    </button>
                                    <button class="m3-icon-button" id="calendar-tasks-btn">
                                        <span class="material-symbols-rounded">checklist</span>
                                    </button>
                                    <button class="m3-icon-button" id="calendar-apps-btn">
                                        <span class="material-symbols-rounded">apps</span>
                                    </button>
                                    <div class="m3-calendar-header__profile">
                                        <button class="m3-profile-button" id="calendar-profile-btn">
                                            <div class="m3-profile-avatar">M</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="m3-card__content">
                            <div class="m3-calendar-grid" id="calendar-grid">
                                <div class="m3-calendar-weekdays">
                                    <div class="m3-calendar-weekday">SUN</div>
                                    <div class="m3-calendar-weekday">MON</div>
                                    <div class="m3-calendar-weekday">TUE</div>
                                    <div class="m3-calendar-weekday">WED</div>
                                    <div class="m3-calendar-weekday">THU</div>
                                    <div class="m3-calendar-weekday">FRI</div>
                                    <div class="m3-calendar-weekday">SAT</div>
                                </div>
                                <div class="m3-calendar-month" id="calendar-month">
                                    <!-- Days will be populated by JavaScript -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Calendar Filter -->
                    <div class="m3-card" id="calendar-filter-card">
                        <div class="m3-card__header">
                            <h3 class="m3-card__title">Calendar Filter</h3>
                        </div>
                        <div class="m3-card__content">
                            <div id="calendar-filter">
                                <!-- Calendar filter will be populated here -->
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Resizable Splitter -->
                <div class="m3-calendar-splitter" id="calendar-splitter"></div>

                <!-- Right Pane: Events List -->
                <div class="m3-calendar-right-pane">
                    <div class="m3-card" id="calendar-events-card">
                        <div class="m3-card__header">
                            <h3 class="m3-card__title">Upcoming Events</h3>
                        </div>
                        <div class="m3-card__content">
                            <div class="m3-events-list" id="calendar-events-list">
                                <!-- Events will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async checkAuthentication() {
        try {
            // Use RFC3339 format for date parameters
            const startDate = '2025-01-01T00:00:00Z';
            const endDate = '2025-01-02T00:00:00Z';

            const response = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`);
            if (response.ok) {
                this.isAuthenticated = true;
                this.showCalendarView();
                this.loadEvents();
            } else if (response.status === 401) {
                console.log('Calendar authentication required - showing login view');
                this.showAuthenticationView();
            } else {
                console.log('Calendar authentication failed:', response.status, response.statusText);
                this.showAuthenticationView();
            }
        } catch (error) {
            console.log('Calendar authentication check failed:', error);
            this.showAuthenticationView();
        }
    }

    showAuthenticationView() {
        const authCard = document.getElementById('calendar-auth-card');
        const viewCard = document.getElementById('calendar-view-card');
        const filterCard = document.getElementById('calendar-filter-card');
        const eventsCard = document.getElementById('calendar-events-card');

        if (authCard) authCard.style.display = 'block';
        if (viewCard) viewCard.style.display = 'none';
        if (filterCard) filterCard.style.display = 'none';
        if (eventsCard) eventsCard.style.display = 'none';
    }

    showCalendarView() {
        const authCard = document.getElementById('calendar-auth-card');
        const splitContainer = document.getElementById('calendar-split-container');

        if (authCard) authCard.style.display = 'none';
        if (splitContainer) splitContainer.style.display = 'grid';
    }

    setupCalendarEventListeners() {
        // Login button
        const loginBtn = document.getElementById('calendar-login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = '/auth/google/login';
            });
        }

        // Navigation buttons
        const prevBtn = document.getElementById('calendar-prev-btn');
        const nextBtn = document.getElementById('calendar-next-btn');
        const todayBtn = document.getElementById('calendar-today-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateCalendar(-1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateCalendar(1));
        }
        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }

        // View buttons
        const viewButtons = document.querySelectorAll('[data-view]');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeView(e.target.dataset.view);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('calendar-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadEvents());
        }


        // Splitter functionality
        this.setupSplitter();
    }

    setupSplitter() {
        const splitter = document.getElementById('calendar-splitter');
        const container = document.getElementById('calendar-split-container');

        if (!splitter || !container) return;

        let isResizing = false;

        splitter.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const containerRect = container.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // Constrain between 20% and 80%
            const constrainedWidth = Math.max(20, Math.min(80, newLeftWidth));

            container.style.gridTemplateColumns = `${constrainedWidth}% 4px ${100 - constrainedWidth}%`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    setupHeaderNavigation() {
        // Today button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'calendar-today-btn') {
                this.goToToday();
            }
        });

        // Navigation arrows
        document.addEventListener('click', (e) => {
            if (e.target.id === 'calendar-prev-btn' || e.target.closest('#calendar-prev-btn')) {
                this.previousMonth();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'calendar-next-btn' || e.target.closest('#calendar-next-btn')) {
                this.nextMonth();
            }
        });

        // View selector
        document.addEventListener('click', (e) => {
            if (e.target.id === 'calendar-view-selector' || e.target.closest('#calendar-view-selector')) {
                this.toggleViewSelector();
            }
        });
    }

    goToToday() {
        this.currentDate = new Date();
        this.updateHeaderTitle();
        this.renderMonthView();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateHeaderTitle();
        this.renderMonthView();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateHeaderTitle();
        this.renderMonthView();
    }

    updateHeaderTitle() {
        const title = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        const titleElement = document.getElementById('calendar-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    toggleViewSelector() {
        // TODO: Implement view selector dropdown
        console.log('View selector clicked - implement dropdown');
    }

    showAllEventsForDay(events, dayElement) {
        // Remove existing events and more indicator
        const eventsContainer = dayElement.querySelector('.m3-calendar-day__events');
        eventsContainer.innerHTML = '';

        // Show all events
        events.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'm3-calendar-day__event';
            eventElement.textContent = event.title;
            
            // Apply Google Calendar API colors using the color manager
            this.colorManager.applyEventColor(event, eventElement);

            // Add click handler for viewing/editing events
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEventModal('view', event, this.currentDate);
            });

            eventsContainer.appendChild(eventElement);
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard navigation when calendar is active
            if (!this.isActive) return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousMonth();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextMonth();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToToday();
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Close any open modals
                    if (window.calendarEventModalMD3) {
                        window.calendarEventModalMD3.hide();
                    }
                    break;
            }
        });
    }

    async loadEvents() {
        if (!this.isAuthenticated) return;

        try {
            // Load calendars and colors first (only once)
            if (this.calendars.length === 0) {
                await this.loadCalendars();
                await this.loadColorPalette();
            }

            // Update header title
            this.updateHeaderTitle();

            const start = this.getStartOfPeriod();
            const end = this.getEndOfPeriod();

            console.log(`Loading calendar events from ${start} to ${end}`);
            const response = await fetch(`/api/calendar/events?start=${start}&end=${end}`);

            if (response.ok) {
                this.events = await response.json();
                console.log(`Loaded ${this.events.length} calendar events:`, this.events);
                this.renderCalendar();
                this.renderEventsList();
                this.renderCalendarFilter();
                this.updateEventCounts();
            } else {
                console.error('Failed to load calendar events:', response.status, response.statusText);
                // If we get a 401 or 403, we might need to re-authenticate
                if (response.status === 401 || response.status === 403) {
                    console.log('Authentication expired, showing login view');
                    this.showAuthenticationView();
                }
            }
        } catch (error) {
            console.error('Error loading calendar events:', error);
        }
    }

    async loadCalendars() {
        try {
            const response = await fetch('/api/calendar/calendars');
            if (response.ok) {
                this.calendars = await response.json();
                console.log('CalendarSection: Loaded calendars:', this.calendars);

                // Select all calendars by default
                this.calendars.forEach(cal => this.selectedCalendars.add(cal.id));
            } else {
                console.error('Failed to load calendars:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('CalendarSection: Error loading calendars:', error);
        }
    }

    async loadColorPalette() {
        try {
            // Load calendar colors using the color manager
            this.calendarColors = await this.colorManager.loadCalendarColors();
            this.colorPalette = this.calendarColors; // Keep for backward compatibility
            console.log('CalendarSection: Loaded calendar colors:', this.calendarColors);
        } catch (error) {
            console.error('CalendarSection: Error loading calendar colors:', error);
        }
    }

    getStartOfPeriod() {
        const date = new Date(this.currentDate);
        if (this.currentView === 'month') {
            date.setDate(1);
            date.setDate(date.getDate() - date.getDay());
        } else if (this.currentView === 'week') {
            date.setDate(date.getDate() - date.getDay());
        }
        // Set to start of day and return RFC3339 format
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }

    getEndOfPeriod() {
        const date = new Date(this.currentDate);
        if (this.currentView === 'month') {
            date.setMonth(date.getMonth() + 1, 0);
            date.setDate(date.getDate() + (6 - date.getDay()));
        } else if (this.currentView === 'week') {
            date.setDate(date.getDate() + 6);
        } else {
            date.setDate(date.getDate() + 1);
        }
        // Set to end of day and return RFC3339 format
        date.setHours(23, 59, 59, 999);
        return date.toISOString();
    }

    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;

        if (this.currentView === 'month') {
            this.renderMonthView(grid);
        } else if (this.currentView === 'week') {
            this.renderWeekView(grid);
        } else {
            this.renderDayView(grid);
        }
    }

    renderMonthView(container) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update title
        const title = document.getElementById('calendar-title');
        if (title) {
            title.textContent = this.currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            });
        }

        // Create month grid
        container.innerHTML = `
            <div class="m3-calendar-month">
                <div class="m3-calendar-month__header">
                    <div class="m3-calendar-month__day">Sun</div>
                    <div class="m3-calendar-month__day">Mon</div>
                    <div class="m3-calendar-month__day">Tue</div>
                    <div class="m3-calendar-month__day">Wed</div>
                    <div class="m3-calendar-month__day">Thu</div>
                    <div class="m3-calendar-month__day">Fri</div>
                    <div class="m3-calendar-month__day">Sat</div>
                </div>
                <div class="m3-calendar-month__grid" id="calendar-month-grid">
                    <!-- Days will be populated here -->
                </div>
            </div>
        `;

        const monthGrid = document.getElementById('calendar-month-grid');
        if (!monthGrid) return;

        // Get first day of month and calculate starting date
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Calculate the number of weeks needed for this month
        const lastDay = new Date(year, month + 1, 0);

        // Calculate the end date (last Saturday of the month)
        const endDate = new Date(lastDay);
        const daysToAdd = (6 - lastDay.getDay()) % 7;
        endDate.setDate(endDate.getDate() + daysToAdd);

        // Ensure we don't extend beyond the current month
        const nextMonth = new Date(year, month + 1, 1);
        if (endDate >= nextMonth) {
            endDate.setTime(nextMonth.getTime() - 1);
        }

        // Calculate total days from start to end (inclusive)
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const weeksNeeded = Math.ceil(totalDays / 7);

        console.log(`Month ${month + 1}/${year}: Start=${startDate.toDateString()}, End=${endDate.toDateString()}, TotalDays=${totalDays}, WeeksNeeded=${weeksNeeded}`);

        // Set grid rows dynamically
        monthGrid.style.gridTemplateRows = `repeat(${weeksNeeded}, minmax(0, 1fr))`;

        // Generate days for the calculated weeks
        for (let i = 0; i < totalDays; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayElement = this.createDayElement(date, month);
            monthGrid.appendChild(dayElement);
        }
    }

    createDayElement(date, currentMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'm3-calendar-day';

        if (date.getMonth() !== currentMonth) {
            dayElement.classList.add('m3-calendar-day--other-month');
        }

        if (this.isToday(date)) {
            dayElement.classList.add('m3-calendar-day--today');
        }

        // Add click handler for creating new events
        dayElement.addEventListener('click', (e) => {
            // Only trigger if clicking on the day itself, not on events
            if (e.target === dayElement || e.target.classList.contains('m3-calendar-day__number')) {
                this.openEventModal('create', null, date);
            }
        });

        const dayNumber = document.createElement('div');
        dayNumber.className = 'm3-calendar-day__number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);

        // Add events for this day
        const events = this.getEventsForDate(date);
        if (events.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'm3-calendar-day__events';

            events.slice(0, 3).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = 'm3-calendar-day__event';
                eventElement.textContent = event.title;
                
                // Apply Google Calendar API colors using the color manager
                this.colorManager.applyEventColor(event, eventElement);

                // Add click handler for viewing/editing events
                eventElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent day click handler
                    this.openEventModal('view', event, date);
                });

                eventsContainer.appendChild(eventElement);
            });

            if (events.length > 3) {
                const moreElement = document.createElement('div');
                moreElement.className = 'm3-calendar-day__more';
                moreElement.textContent = `+${events.length - 3} more`;
                eventsContainer.appendChild(moreElement);
            }

            dayElement.appendChild(eventsContainer);
        }

        return dayElement;
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            // Handle all-day events (they often have end date as next day at midnight)
            if (event.allDay) {
                // For all-day events, compare the date strings directly from the original event data
                // This avoids timezone conversion issues
                const eventStartDateStr = event.start.split('T')[0];
                const targetDateStr = dateStr;

                return eventStartDateStr === targetDateStr;
            }

            // For timed events, use the existing logic
            const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
            const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
            const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

            // For single-day timed events, only show on the start date
            if (eventStartDate.getTime() === eventEndDate.getTime()) {
                return eventStartDate.getTime() === targetDate.getTime();
            }

            // For multi-day events, show on all days they span
            return eventStartDate <= targetDate && eventEndDate >= targetDate;
        });
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    renderWeekView(container) {
        // Week view implementation
        container.innerHTML = '<div class="m3-calendar-week">Week view coming soon</div>';
    }

    renderDayView(container) {
        // Day view implementation
        container.innerHTML = '<div class="m3-calendar-day-view">Day view coming soon</div>';
    }

    renderEventsList() {
        const eventsList = document.getElementById('calendar-events-list');
        if (!eventsList) return;

        // Filter events to show only upcoming events (today and later)
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const upcomingEvents = this.events.filter(event => {
            const eventStart = new Date(event.start);
            // For all-day events, compare dates only
            if (event.allDay) {
                const eventDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
                const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return eventDate >= todayDate;
            } else {
                // For timed events, compare with current time
                return eventStart >= new Date();
            }
        });

        // Sort by start time and limit to 10 events
        const sortedEvents = upcomingEvents
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 10);

        if (sortedEvents.length === 0) {
            eventsList.innerHTML = '<p class="m3-text--secondary">No upcoming events</p>';
            return;
        }

        eventsList.innerHTML = sortedEvents.map(event => {
            // Use calendar color if available, otherwise use event color, otherwise default
            const eventColor = event.calendarColor || event.color || '#3788d8';
            const calendarName = this.getCalendarName(event.calendarId);
            const eventType = this.getEventType(event);
            const eventIcon = this.getEventIcon(event);
            const timeInfo = this.formatEventTime(event);

            return `
                <div class="m3-event-item" style="border-left: 4px solid ${eventColor}">
                    <div class="m3-event-item__time">
                        <div class="m3-event-item__date">${timeInfo.date}</div>
                        <div class="m3-event-item__time-range">${timeInfo.time}</div>
                    </div>
                    <div class="m3-event-item__content">
                        <div class="m3-event-item__header">
                            <h4 class="m3-event-item__title">${event.title}</h4>
                            <div class="m3-event-item__badges">
                                ${eventType ? `<span class="m3-event-item__badge m3-event-item__badge--${eventType}">${eventType}</span>` : ''}
                                ${event.allDay ? '<span class="m3-event-item__badge m3-event-item__badge--all-day">All Day</span>' : ''}
                            </div>
                        </div>
                        ${event.description ? `<p class="m3-event-item__description">${event.description}</p>` : ''}
                        <div class="m3-event-item__meta">
                            ${calendarName ? `<span class="m3-event-item__calendar">${eventIcon} ${calendarName}</span>` : ''}
                        </div>
                    </div>
                    <div class="m3-event-item__color" style="background-color: ${eventColor}"></div>
                </div>
            `;
        }).join('');
    }

    formatEventTime(event) {
        const start = new Date(event.start);
        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);

        // For all-day events, use the date string directly to avoid timezone issues
        if (event.allDay) {
            const eventDateStr = event.start.split('T')[0];
            const eventDate = new Date(eventDateStr + 'T00:00:00');
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const daysDifference = Math.ceil((eventDate - todayDate) / (1000 * 60 * 60 * 24));

            let dateInfo = '';
            if (daysDifference < 7) {
                // Less than a week away - show day of the week
                dateInfo = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
            } else {
                // More than a week away - show full date
                dateInfo = eventDate.toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                });
            }

            return { date: dateInfo, time: 'All day' };
        }

        // For timed events, use the existing logic
        const eventDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const daysDifference = Math.ceil((eventDate - todayDate) / (1000 * 60 * 60 * 24));

        let dateInfo = '';

        if (daysDifference < 7) {
            // Less than a week away - show day of the week
            dateInfo = start.toLocaleDateString('en-US', { weekday: 'long' });
        } else {
            // More than a week away - show full date
            dateInfo = start.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            });
        }

        const startTime = start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const endTime = new Date(event.end).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return { date: dateInfo, time: `${startTime} - ${endTime}` };
    }

    navigateCalendar(direction) {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        } else {
            this.currentDate.setDate(this.currentDate.getDate() + direction);
        }
        this.loadEvents();
    }

    goToToday() {
        this.currentDate = new Date();
        this.loadEvents();
    }

    changeView(view) {
        this.currentView = view;

        // Update button states
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.classList.remove('m3-button--primary');
            btn.classList.add('m3-button--outlined');
        });

        const activeBtn = document.querySelector(`[data-view="${view}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('m3-button--outlined');
            activeBtn.classList.add('m3-button--primary');
        }

        this.loadEvents();
    }

    load() {
        if (!this.isLoaded) {
            this.isLoaded = true;
            this.setupCalendarEventListeners();
        }
        this.show();
    }

    show() {
        const section = document.getElementById('calendar-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    hide() {
        const section = document.getElementById('calendar-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }

    renderCalendarFilter() {
        const filterContainer = document.getElementById('calendar-filter');
        if (!filterContainer || this.calendars.length === 0) return;

        filterContainer.innerHTML = `
            <div class="calendar-filter-header">
                <h3>Calendar Management</h3>
                <div class="calendar-filter-actions">
                    <button class="m3-button m3-button--text" id="select-all-calendars">Select All</button>
                    <button class="m3-button m3-button--text" id="deselect-all-calendars">Deselect All</button>
                    <button class="m3-button m3-button--text" id="toggle-color-legend">Color Legend</button>
                </div>
            </div>
            
            <!-- Color Legend -->
            <div class="calendar-color-legend" id="calendar-color-legend" style="display: none;">
                <h4>Color Legend</h4>
                <div class="color-legend-grid">
                    ${this.colorPalette.slice(0, 12).map(color => `
                        <div class="color-legend-item">
                            <span class="color-legend-swatch" style="background-color: ${color.color}"></span>
                            <span class="color-legend-name">${color.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="calendar-filter-list">
                ${this.calendars.map(cal => `
                    <div class="calendar-filter-item">
                        <label class="calendar-filter-label">
                            <input type="checkbox" 
                                   class="calendar-filter-checkbox" 
                                   value="${cal.id}" 
                                   ${this.selectedCalendars.has(cal.id) ? 'checked' : ''}>
                            <span class="calendar-filter-color" style="background-color: ${cal.color}"></span>
                            <span class="calendar-filter-name">${cal.name}</span>
                            <span class="calendar-filter-count" id="count-${cal.id}">0 events</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;

        // Add event listeners for calendar filtering
        this.setupCalendarFilterListeners();
    }

    setupCalendarFilterListeners() {
        // Select all calendars
        const selectAllBtn = document.getElementById('select-all-calendars');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                this.calendars.forEach(cal => this.selectedCalendars.add(cal.id));
                this.updateCalendarFilterCheckboxes();
                this.loadEvents(); // Reload events with new filter
            });
        }

        // Deselect all calendars
        const deselectAllBtn = document.getElementById('deselect-all-calendars');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', () => {
                this.selectedCalendars.clear();
                this.updateCalendarFilterCheckboxes();
                this.loadEvents(); // Reload events with new filter
            });
        }

        // Toggle color legend
        const toggleLegendBtn = document.getElementById('toggle-color-legend');
        if (toggleLegendBtn) {
            toggleLegendBtn.addEventListener('click', () => {
                const legend = document.getElementById('calendar-color-legend');
                if (legend) {
                    const isVisible = legend.style.display !== 'none';
                    legend.style.display = isVisible ? 'none' : 'block';
                    toggleLegendBtn.textContent = isVisible ? 'Color Legend' : 'Hide Legend';
                }
            });
        }

        // Individual calendar checkboxes
        const checkboxes = document.querySelectorAll('.calendar-filter-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const calendarId = e.target.value;
                if (e.target.checked) {
                    this.selectedCalendars.add(calendarId);
                } else {
                    this.selectedCalendars.delete(calendarId);
                }
                this.loadEvents(); // Reload events with new filter
            });
        });
    }

    updateCalendarFilterCheckboxes() {
        const checkboxes = document.querySelectorAll('.calendar-filter-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.selectedCalendars.has(checkbox.value);
        });
    }

    getCalendarName(calendarId) {
        if (!calendarId || !this.calendars) return null;
        const calendar = this.calendars.find(cal => cal.id === calendarId);
        return calendar ? calendar.name : null;
    }

    updateEventCounts() {
        if (!this.calendars || !this.events) return;

        // Count events per calendar
        const eventCounts = {};
        this.calendars.forEach(cal => {
            eventCounts[cal.id] = this.events.filter(event => event.calendarId === cal.id).length;
        });

        // Update the count displays
        this.calendars.forEach(cal => {
            const countElement = document.getElementById(`count-${cal.id}`);
            if (countElement) {
                const count = eventCounts[cal.id] || 0;
                countElement.textContent = `${count} event${count !== 1 ? 's' : ''}`;
            }
        });
    }

    getEventType(event) {
        const title = event.title.toLowerCase();
        const description = (event.description || '').toLowerCase();

        // Meeting indicators
        if (title.includes('meeting') || title.includes('call') || title.includes('zoom') || title.includes('teams')) {
            return 'meeting';
        }

        // Reminder indicators
        if (title.includes('reminder') || title.includes('remind') || title.includes('alert')) {
            return 'reminder';
        }

        // Appointment indicators
        if (title.includes('appointment') || title.includes('appt') || title.includes('visit')) {
            return 'appointment';
        }

        // Birthday indicators
        if (title.includes('birthday') || title.includes('bday') || title.includes('anniversary')) {
            return 'celebration';
        }

        // Work indicators
        if (title.includes('work') || title.includes('office') || title.includes('deadline')) {
            return 'work';
        }

        return null;
    }

    getEventIcon(event) {
        const eventType = this.getEventType(event);

        switch (eventType) {
            case 'meeting':
                return '<span class="material-symbols-outlined">groups</span>';
            case 'reminder':
                return '<span class="material-symbols-outlined">notifications</span>';
            case 'appointment':
                return '<span class="material-symbols-outlined">event_available</span>';
            case 'celebration':
                return '<span class="material-symbols-outlined">cake</span>';
            case 'work':
                return '<span class="material-symbols-outlined">work</span>';
            default:
                return '<span class="material-symbols-outlined">event</span>';
        }
    }

    openEventModal(mode, event, date) {
        if (window.calendarEventModalMD3) {
            window.calendarEventModalMD3.show(date, event);
        } else {
            console.error('Calendar event modal not available');
        }
    }

    // Listen for modal events to refresh calendar
    setupModalEventListeners() {
        document.addEventListener('eventCreated', () => {
            this.loadEvents();
        });

        document.addEventListener('eventUpdated', () => {
            this.loadEvents();
        });

        document.addEventListener('eventDeleted', () => {
            this.loadEvents();
        });
    }
}

/**
 * Calendar Color Manager
 * Handles fetching and managing calendar colors from Google Calendar API
 */
class CalendarColorManager {
    constructor() {
        this.calendarColors = {};
        this.googleColors = {
            '1': { background: '#ea4335', foreground: '#ffffff' }, // Red
            '2': { background: '#34a853', foreground: '#ffffff' }, // Green
            '3': { background: '#4285f4', foreground: '#ffffff' }, // Blue
            '4': { background: '#fbbc04', foreground: '#000000' }, // Yellow
            '5': { background: '#ff6d01', foreground: '#ffffff' }, // Orange
            '6': { background: '#9c27b0', foreground: '#ffffff' }, // Purple
            '7': { background: '#5f6368', foreground: '#ffffff' }, // Gray
            '8': { background: '#ff5722', foreground: '#ffffff' }, // Deep Orange
            '9': { background: '#795548', foreground: '#ffffff' }, // Brown
            '10': { background: '#607d8b', foreground: '#ffffff' }, // Blue Grey
            '11': { background: '#e91e63', foreground: '#ffffff' }  // Pink
        };
    }

    async loadCalendarColors() {
        try {
            const response = await fetch('/api/calendar/colors');
            if (response.ok) {
                this.calendarColors = await response.json();
                console.log('Loaded calendar colors:', this.calendarColors);
                return this.calendarColors;
            } else {
                console.error('Failed to load calendar colors:', response.status, response.statusText);
                return {};
            }
        } catch (error) {
            console.error('Error loading calendar colors:', error);
            return {};
        }
    }

    getCalendarColor(calendarId) {
        return this.calendarColors[calendarId] || {
            backgroundColor: '#4285f4',
            foregroundColor: '#ffffff'
        };
    }

    getGoogleCalendarColor(colorId) {
        return this.googleColors[colorId] || this.googleColors['3']; // Default to blue
    }

    applyEventColor(event, eventElement) {
        // Priority: event.colorId -> calendar.backgroundColor -> default
        let backgroundColor = '#4285f4'; // Default blue
        let foregroundColor = '#ffffff'; // Default white text

        if (event.colorId) {
            // Use Google Calendar's colorId mapping
            const colorData = this.getGoogleCalendarColor(event.colorId);
            backgroundColor = colorData.background;
            foregroundColor = colorData.foreground;
        } else if (event.calendarId && this.calendarColors[event.calendarId]) {
            // Use calendar's background color
            const calendarColor = this.calendarColors[event.calendarId];
            backgroundColor = calendarColor.backgroundColor;
            foregroundColor = calendarColor.foregroundColor;
        }

        // Apply colors via inline styles
        eventElement.style.backgroundColor = backgroundColor;
        eventElement.style.color = foregroundColor;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Create instance only if it doesn't exist
    if (!window.calendarSection) {
        window.calendarSection = new CalendarSection();
    }
});

