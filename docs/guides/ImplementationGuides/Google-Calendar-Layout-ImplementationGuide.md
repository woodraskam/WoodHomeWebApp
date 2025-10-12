# Google Calendar Layout Implementation Guide

## Overview
This guide outlines the implementation of a Google Calendar-style layout for the WoodHome calendar component. The goal is to create a pixel-perfect recreation of Google Calendar's modern, clean interface with proper Material Design 3 principles.

## Design Analysis

### Key Visual Elements from Google Calendar:

1. **Header Bar:**
   - "Today" button (blue, rounded rectangular)
   - Navigation arrows (< >) for month navigation
   - Month/Year display in center
   - Right-side icons (search, help, settings, view selector, calendar management, profile)

2. **Calendar Grid:**
   - 7 columns (days of week)
   - 6 rows (weeks)
   - Clean borders with subtle gray lines
   - Day numbers in top-left of cells
   - Events as colored blocks with rounded corners

3. **Event Styling:**
   - Color-coded events (pink, green, blue, orange, brown, purple, dark gray)
   - Time display for timed events
   - "All Day" events as full-width blocks
   - Multi-day events spanning across cells
   - "+X more" indicators for overflow

## Implementation Strategy

### Phase 1: Header Redesign
**Goal:** Create Google Calendar-style header with navigation and controls

#### 1.1 Header Layout Structure
```html
<div class="m3-calendar-header">
    <div class="m3-calendar-header__left">
        <button class="m3-button m3-button--today">Today</button>
        <div class="m3-calendar-header__navigation">
            <button class="m3-icon-button m3-icon-button--nav" id="prev-month">
                <span class="material-symbols-rounded">chevron_left</span>
            </button>
            <button class="m3-icon-button m3-icon-button--nav" id="next-month">
                <span class="material-symbols-rounded">chevron_right</span>
            </button>
        </div>
        <h1 class="m3-calendar-header__title">October 2025</h1>
    </div>
    <div class="m3-calendar-header__right">
        <button class="m3-icon-button" id="search-btn">
            <span class="material-symbols-rounded">search</span>
        </button>
        <button class="m3-icon-button" id="help-btn">
            <span class="material-symbols-rounded">help</span>
        </button>
        <button class="m3-icon-button" id="settings-btn">
            <span class="material-symbols-rounded">settings</span>
        </button>
        <div class="m3-calendar-header__view-selector">
            <button class="m3-button m3-button--view-selector">
                Month <span class="material-symbols-rounded">keyboard_arrow_down</span>
            </button>
        </div>
        <button class="m3-icon-button" id="calendar-manager">
            <span class="material-symbols-rounded">calendar_month</span>
        </button>
        <button class="m3-icon-button" id="tasks-btn">
            <span class="material-symbols-rounded">checklist</span>
        </button>
        <button class="m3-icon-button" id="apps-btn">
            <span class="material-symbols-rounded">apps</span>
        </button>
        <div class="m3-calendar-header__profile">
            <button class="m3-profile-button">
                <div class="m3-profile-avatar">M</div>
            </button>
        </div>
    </div>
</div>
```

#### 1.2 Header CSS Styling
```css
.m3-calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface);
    position: sticky;
    top: 0;
    z-index: 100;
}

.m3-calendar-header__left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.m3-calendar-header__right {
    display: flex;
    align-items: center;
    gap: 8px;
}

.m3-button--today {
    background-color: #1a73e8;
    color: white;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.m3-button--today:hover {
    background-color: #1557b0;
}

.m3-calendar-header__navigation {
    display: flex;
    gap: 4px;
}

.m3-icon-button--nav {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: none;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.m3-icon-button--nav:hover {
    background-color: var(--md-sys-color-surface-variant);
}

.m3-calendar-header__title {
    font-size: 22px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface);
    margin: 0;
    min-width: 140px;
    text-align: center;
}

.m3-icon-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: none;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;
}

.m3-icon-button:hover {
    background-color: var(--md-sys-color-surface-variant);
}

.m3-button--view-selector {
    background: none;
    border: 1px solid var(--md-sys-color-outline);
    border-radius: 4px;
    padding: 8px 12px;
    color: var(--md-sys-color-on-surface);
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
}

.m3-button--view-selector:hover {
    background-color: var(--md-sys-color-surface-variant);
}

.m3-profile-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: none;
    cursor: pointer;
    padding: 0;
}

.m3-profile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #1a73e8;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
}
```

### Phase 2: Calendar Grid Redesign
**Goal:** Create Google Calendar-style grid with proper spacing and borders

#### 2.1 Grid Structure
```html
<div class="m3-calendar-grid">
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
```

#### 2.2 Grid CSS Styling
```css
.m3-calendar-grid {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: var(--md-sys-color-surface);
}

.m3-calendar-weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface);
}

.m3-calendar-weekday {
    padding: 12px 8px;
    text-align: center;
    font-size: 11px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-right: 1px solid var(--md-sys-color-outline-variant);
}

.m3-calendar-weekday:last-child {
    border-right: none;
}

.m3-calendar-month {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    flex: 1;
    min-height: 0;
}

.m3-calendar-day {
    border-right: 1px solid var(--md-sys-color-outline-variant);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding: 8px;
    position: relative;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    background-color: var(--md-sys-color-surface);
}

.m3-calendar-day:last-child {
    border-right: none;
}

.m3-calendar-day--other-month {
    background-color: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
}

.m3-calendar-day--today {
    background-color: var(--md-sys-color-primary-container);
}

.m3-calendar-day--today .m3-calendar-day__number {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
}

.m3-calendar-day__number {
    font-size: 13px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 4px;
    align-self: flex-start;
}

.m3-calendar-day__events {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
}

.m3-calendar-day__event {
    background-color: #4285f4;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 400;
    cursor: pointer;
    transition: opacity 0.2s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-height: 16px;
    display: flex;
    align-items: center;
}

.m3-calendar-day__event:hover {
    opacity: 0.8;
}

.m3-calendar-day__event--all-day {
    background-color: #5f6368;
    font-weight: 500;
}

.m3-calendar-day__event--timed {
    background-color: #4285f4;
}

.m3-calendar-day__event--multi-day {
    background-color: #ea4335;
}

.m3-calendar-day__more {
    font-size: 11px;
    color: var(--md-sys-color-on-surface-variant);
    padding: 2px 6px;
    cursor: pointer;
    margin-top: 2px;
}

.m3-calendar-day__more:hover {
    background-color: var(--md-sys-color-surface-variant);
    border-radius: 3px;
}
```

### Phase 3: Event Color System
**Goal:** Implement Google Calendar's color coding system using API data

#### 3.1 Google Calendar API Color Integration
The Google Calendar API provides color information in two ways:
1. **Calendar Colors**: Each calendar has a `backgroundColor` and `foregroundColor`
2. **Event Colors**: Individual events can have `colorId` that maps to Google's color palette

#### 3.2 API Color Data Structure
```javascript
// Google Calendar API Response Structure
{
  "items": [
    {
      "id": "event_id",
      "summary": "Event Title",
      "start": { "dateTime": "2025-10-06T10:00:00Z" },
      "end": { "dateTime": "2025-10-06T11:00:00Z" },
      "colorId": "1", // Google's color ID (1-11)
      "calendarId": "primary"
    }
  ],
  "calendarList": [
    {
      "id": "primary",
      "summary": "Primary Calendar",
      "backgroundColor": "#4285f4",
      "foregroundColor": "#ffffff"
    }
  ]
}
```

#### 3.3 Backend API Endpoint for Calendar Colors
```go
// Go Backend: Calendar Colors Handler
func (h *CalendarHandler) GetCalendarColorsHandler(w http.ResponseWriter, r *http.Request) {
    // Check authentication
    session, _ := GetSessionStore().Get(r, "auth-session")
    authenticated, ok := session.Values["oauth_authenticated"].(bool)
    if !ok || !authenticated {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Get user ID from session
    userID, ok := session.Values["user_id"].(int)
    if !ok {
        http.Error(w, "Invalid user session", http.StatusUnauthorized)
        return
    }

    // Get OAuth token
    token, err := getOAuthTokenFromSQLite(userID)
    if err != nil {
        http.Error(w, "Token not found", http.StatusUnauthorized)
        return
    }

    // Fetch calendar list from Google Calendar API
    client := oauth2.NewClient(r.Context(), oauth2.StaticTokenSource(token))
    service, err := calendar.New(client)
    if err != nil {
        http.Error(w, "Failed to create calendar service", http.StatusInternalServerError)
        return
    }

    calendarList, err := service.CalendarList.List().Do()
    if err != nil {
        http.Error(w, "Failed to fetch calendar list", http.StatusInternalServerError)
        return
    }

    // Extract color information
    colors := make(map[string]map[string]string)
    for _, calendar := range calendarList.Items {
        colors[calendar.Id] = map[string]string{
            "backgroundColor": calendar.BackgroundColor,
            "foregroundColor": calendar.ForegroundColor,
            "summary": calendar.Summary,
        }
    }

    // Return JSON response
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(colors)
}
```

#### 3.4 Frontend Calendar Color Manager
```javascript
// Frontend: Calendar Color Manager
class CalendarColorManager {
    constructor() {
        this.calendarColors = {};
    }

    async loadCalendarColors() {
        try {
            const response = await fetch('/api/calendar/colors');
            if (response.ok) {
                this.calendarColors = await response.json();
                console.log('Loaded calendar colors:', this.calendarColors);
            }
        } catch (error) {
            console.error('Error loading calendar colors:', error);
        }
    }

    getCalendarColor(calendarId) {
        return this.calendarColors[calendarId] || {
            backgroundColor: '#4285f4',
            foregroundColor: '#ffffff'
        };
    }
}

```

#### 3.3 Dynamic Color CSS Classes
```css
/* Dynamic color classes based on Google Calendar API */
.m3-calendar-event {
    /* Base event styling */
    border-radius: 3px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 400;
    cursor: pointer;
    transition: opacity 0.2s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-height: 16px;
    display: flex;
    align-items: center;
}

/* Color will be applied via inline styles from API data */
.m3-calendar-event--all-day {
    font-weight: 500;
}

.m3-calendar-event--timed {
    font-weight: 400;
}

.m3-calendar-event--multi-day {
    font-weight: 400;
}
```

#### 3.2 Event Type Styling
```css
/* All Day Events */
.m3-calendar-event--all-day {
    background-color: #5f6368;
    font-weight: 500;
    border-radius: 3px;
}

/* Timed Events */
.m3-calendar-event--timed {
    border-radius: 3px;
    font-weight: 400;
}

/* Multi-day Events */
.m3-calendar-event--multi-day {
    border-radius: 3px;
    font-weight: 400;
}

/* Event with Time Display */
.m3-calendar-event__time {
    font-weight: 500;
    margin-right: 4px;
}

.m3-calendar-event__title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

### Phase 4: JavaScript Implementation
**Goal:** Update calendar logic to match Google Calendar behavior

#### 4.1 Header Navigation
```javascript
class GoogleCalendarHeader {
    constructor(calendarInstance) {
        this.calendar = calendarInstance;
        this.currentDate = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTitle();
    }

    setupEventListeners() {
        // Today button
        document.getElementById('today-btn').addEventListener('click', () => {
            this.goToToday();
        });

        // Navigation arrows
        document.getElementById('prev-month').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.nextMonth();
        });

        // View selector
        document.getElementById('view-selector').addEventListener('click', () => {
            this.toggleViewSelector();
        });
    }

    goToToday() {
        this.currentDate = new Date();
        this.calendar.setCurrentDate(this.currentDate);
        this.updateTitle();
        this.calendar.renderMonthView();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.calendar.setCurrentDate(this.currentDate);
        this.updateTitle();
        this.calendar.renderMonthView();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.calendar.setCurrentDate(this.currentDate);
        this.updateTitle();
        this.calendar.renderMonthView();
    }

    updateTitle() {
        const title = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });
        document.querySelector('.m3-calendar-header__title').textContent = title;
    }
}
```

#### 4.2 Enhanced Event Rendering with Google Calendar API Colors
```javascript
renderEventInDay(event, dayElement) {
    const eventElement = document.createElement('div');
    eventElement.className = 'm3-calendar-day__event';
    
    // Determine event type and styling
    if (event.allDay) {
        eventElement.classList.add('m3-calendar-day__event--all-day');
        eventElement.textContent = event.title;
    } else {
        eventElement.classList.add('m3-calendar-day__event--timed');
        const timeStr = this.formatEventTime(event);
        eventElement.innerHTML = `
            <span class="m3-calendar-event__time">${timeStr}</span>
            <span class="m3-calendar-event__title">${event.title}</span>
        `;
    }

    // Apply color from Google Calendar API
    this.applyEventColor(event, eventElement);

    // Add click handler
    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openEventModal('view', event, this.currentDate);
    });

    dayElement.querySelector('.m3-calendar-day__events').appendChild(eventElement);
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

getGoogleCalendarColor(colorId) {
    // Google Calendar's official color palette
    const googleColors = {
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
    
    return googleColors[colorId] || googleColors['3']; // Default to blue
}

formatEventTime(event) {
    if (event.allDay) return '';
    
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
```

### Phase 5: Responsive Design
**Goal:** Ensure Google Calendar layout works on all devices

#### 5.1 Mobile Adaptations
```css
@media (max-width: 768px) {
    .m3-calendar-header {
        padding: 12px 16px;
        flex-wrap: wrap;
        gap: 12px;
    }

    .m3-calendar-header__left {
        order: 1;
        width: 100%;
        justify-content: space-between;
    }

    .m3-calendar-header__right {
        order: 2;
        width: 100%;
        justify-content: space-between;
        flex-wrap: wrap;
    }

    .m3-calendar-header__title {
        font-size: 18px;
        min-width: auto;
    }

    .m3-calendar-day {
        min-height: 80px;
        padding: 4px;
    }

    .m3-calendar-day__event {
        font-size: 10px;
        padding: 1px 4px;
    }

    .m3-calendar-weekday {
        padding: 8px 4px;
        font-size: 10px;
    }
}

@media (max-width: 480px) {
    .m3-calendar-header__right {
        display: none; /* Hide non-essential buttons on very small screens */
    }

    .m3-calendar-day {
        min-height: 60px;
    }

    .m3-calendar-day__event {
        font-size: 9px;
        min-height: 12px;
    }
}
```

### Phase 6: Advanced Features
**Goal:** Implement Google Calendar's advanced functionality

#### 6.1 Event Overflow Handling
```javascript
handleEventOverflow(dayElement, events) {
    const maxVisibleEvents = 3;
    const visibleEvents = events.slice(0, maxVisibleEvents);
    const hiddenCount = events.length - maxVisibleEvents;

    // Render visible events
    visibleEvents.forEach(event => {
        this.renderEventInDay(event, dayElement);
    });

    // Add "more" indicator if needed
    if (hiddenCount > 0) {
        const moreElement = document.createElement('div');
        moreElement.className = 'm3-calendar-day__more';
        moreElement.textContent = `+${hiddenCount} more`;
        moreElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showAllEventsForDay(events, dayElement);
        });
        dayElement.querySelector('.m3-calendar-day__events').appendChild(moreElement);
    }
}
```

#### 6.2 Multi-day Event Rendering
```javascript
renderMultiDayEvent(event, startDate, endDate) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    // Calculate which days this event spans
    const eventDays = this.getEventDays(start, end);
    
    eventDays.forEach((day, index) => {
        const dayElement = this.getDayElement(day);
        if (dayElement) {
            const eventElement = this.createMultiDayEventElement(event, index, eventDays.length);
            dayElement.querySelector('.m3-calendar-day__events').appendChild(eventElement);
        }
    });
}

createMultiDayEventElement(event, dayIndex, totalDays) {
    const eventElement = document.createElement('div');
    eventElement.className = 'm3-calendar-day__event m3-calendar-day__event--multi-day';
    
    if (dayIndex === 0) {
        // First day - show start time and title
        const timeStr = this.formatEventTime(event);
        eventElement.innerHTML = `
            <span class="m3-calendar-event__time">${timeStr}</span>
            <span class="m3-calendar-event__title">${event.title}</span>
        `;
    } else if (dayIndex === totalDays - 1) {
        // Last day - show end time
        const endTime = new Date(event.end).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        eventElement.innerHTML = `
            <span class="m3-calendar-event__time">Until ${endTime}</span>
            <span class="m3-calendar-event__title">${event.title}</span>
        `;
    } else {
        // Middle days - show continuation indicator
        eventElement.innerHTML = `
            <span class="m3-calendar-event__title">${event.title}</span>
        `;
    }

    return eventElement;
}
```

## Implementation Checklist

### Phase 1: Header Redesign
- [ ] Create Google Calendar-style header HTML structure
- [ ] Implement "Today" button with proper styling
- [ ] Add navigation arrows for month switching
- [ ] Create month/year title display
- [ ] Add right-side control buttons (search, help, settings, etc.)
- [ ] Implement view selector dropdown
- [ ] Add profile button with avatar

### Phase 2: Calendar Grid Redesign
- [ ] Update grid structure to match Google Calendar
- [ ] Implement proper weekday headers
- [ ] Create clean border system
- [ ] Add proper day cell styling
- [ ] Implement today highlighting
- [ ] Add other-month day styling

### Phase 3: Event Color System
- [ ] Implement Google Calendar color palette
- [ ] Create color mapping system
- [ ] Add event type styling (all-day, timed, multi-day)
- [ ] Implement time display for timed events
- [ ] Add proper event text formatting

### Phase 4: JavaScript Implementation
- [ ] Update header navigation logic
- [ ] Implement enhanced event rendering
- [ ] Add color class mapping
- [ ] Update event time formatting
- [ ] Implement multi-day event handling

### Phase 5: Responsive Design
- [ ] Add mobile breakpoints
- [ ] Implement responsive header
- [ ] Optimize grid for small screens
- [ ] Add touch-friendly interactions
- [ ] Test on various devices

### Phase 6: Advanced Features
- [ ] Implement event overflow handling
- [ ] Add multi-day event rendering
- [ ] Create "more" indicators
- [ ] Add event interaction improvements
- [ ] Implement keyboard navigation

## Success Criteria

### Visual Fidelity
- [ ] Header matches Google Calendar exactly
- [ ] Grid layout is pixel-perfect
- [ ] Event colors match Google Calendar palette
- [ ] Typography and spacing are accurate
- [ ] Responsive behavior matches Google Calendar

### Functionality
- [ ] Navigation works smoothly
- [ ] Events display correctly
- [ ] Multi-day events span properly
- [ ] Overflow handling works
- [ ] Mobile experience is optimized

### Performance
- [ ] Smooth animations and transitions
- [ ] Fast rendering of large event sets
- [ ] Efficient color mapping
- [ ] Optimized responsive behavior
- [ ] Clean, maintainable code

This implementation will create a calendar component that closely matches Google Calendar's design and functionality while maintaining the Material Design 3 principles and integrating seamlessly with the existing WoodHome application.
