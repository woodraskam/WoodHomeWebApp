/**
 * Calendar Section
 * Google Calendar integration with Material Design 3
 */
class CalendarSection extends AuthenticatedSection {
    constructor() {
        super();
        this.events = [];
        this.currentView = 'month';
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createCalendarSection();
        this.checkAuthentication();
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
            section.classList.add('m3-section--active');
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
            <div class="m3-section-header">
                <div>
                    <h1 class="m3-section-title">Calendar</h1>
                    <p class="m3-section-subtitle">View your Google Calendar events</p>
                </div>
                <div class="m3-section-actions">
                    <button class="m3-button m3-button--icon" id="calendar-refresh-btn" title="Refresh Calendar">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                    <button class="m3-button m3-button--icon" id="calendar-view-btn" title="Change View">
                        <span class="material-symbols-outlined">view_module</span>
                    </button>
                </div>
            </div>

            <div class="m3-calendar-container">
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

                <!-- Calendar View -->
                <div class="m3-card" id="calendar-view-card" style="display: none;">
                    <div class="m3-card__header">
                        <div class="m3-calendar-header">
                            <button class="m3-button m3-button--icon" id="calendar-prev-btn">
                                <span class="material-symbols-outlined">chevron_left</span>
                            </button>
                            <h2 class="m3-calendar-title" id="calendar-title">Calendar</h2>
                            <button class="m3-button m3-button--icon" id="calendar-next-btn">
                                <span class="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                        <div class="m3-calendar-view-controls">
                            <button class="m3-button m3-button--outlined" id="calendar-today-btn">Today</button>
                            <div class="m3-button-group">
                                <button class="m3-button m3-button--outlined m3-button--small" data-view="month">Month</button>
                                <button class="m3-button m3-button--outlined m3-button--small" data-view="week">Week</button>
                                <button class="m3-button m3-button--outlined m3-button--small" data-view="day">Day</button>
                            </div>
                        </div>
                    </div>
                    <div class="m3-card__content">
                        <div class="m3-calendar-grid" id="calendar-grid">
                            <!-- Calendar content will be generated here -->
                        </div>
                    </div>
                </div>

                <!-- Events List -->
                <div class="m3-card" id="calendar-events-card" style="display: none;">
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
        const eventsCard = document.getElementById('calendar-events-card');

        if (authCard) authCard.style.display = 'block';
        if (viewCard) viewCard.style.display = 'none';
        if (eventsCard) eventsCard.style.display = 'none';
    }

    showCalendarView() {
        const authCard = document.getElementById('calendar-auth-card');
        const viewCard = document.getElementById('calendar-view-card');
        const eventsCard = document.getElementById('calendar-events-card');

        if (authCard) authCard.style.display = 'none';
        if (viewCard) viewCard.style.display = 'block';
        if (eventsCard) eventsCard.style.display = 'block';
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
    }

    async loadEvents() {
        if (!this.isAuthenticated) return;

        try {
            const start = this.getStartOfPeriod();
            const end = this.getEndOfPeriod();

            console.log(`Loading calendar events from ${start} to ${end}`);
            const response = await fetch(`/api/calendar/events?start=${start}&end=${end}`);

            if (response.ok) {
                this.events = await response.json();
                console.log(`Loaded ${this.events.length} calendar events:`, this.events);
                this.renderCalendar();
                this.renderEventsList();
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

        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
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
                eventElement.style.backgroundColor = event.color || '#3788d8';
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

            // Check if the event overlaps with the given date
            const eventStartDate = eventStart.toISOString().split('T')[0];
            const eventEndDate = eventEnd.toISOString().split('T')[0];

            return eventStartDate <= dateStr && eventEndDate >= dateStr;
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

        // Show all events in the current period, sorted by start time
        const sortedEvents = this.events
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 10);

        if (sortedEvents.length === 0) {
            eventsList.innerHTML = '<p class="m3-text--secondary">No events in this period</p>';
            return;
        }

        eventsList.innerHTML = sortedEvents.map(event => `
            <div class="m3-event-item">
                <div class="m3-event-item__time">
                    ${this.formatEventTime(event)}
                </div>
                <div class="m3-event-item__content">
                    <h4 class="m3-event-item__title">${event.title}</h4>
                    ${event.description ? `<p class="m3-event-item__description">${event.description}</p>` : ''}
                </div>
                <div class="m3-event-item__color" style="background-color: ${event.color || '#3788d8'}"></div>
            </div>
        `).join('');
    }

    formatEventTime(event) {
        if (event.allDay) {
            return 'All day';
        }

        const start = new Date(event.start);
        const end = new Date(event.end);

        const startTime = start.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const endTime = end.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `${startTime} - ${endTime}`;
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.calendarSection = new CalendarSection();
});
