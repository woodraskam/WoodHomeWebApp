# Calendar Event Modal - Material Design 3 Implementation Guide

## Overview
This guide outlines the implementation of a Material Design 3 styled calendar event modal with immediate editing capabilities. The modal will provide a modern, intuitive interface for viewing and editing calendar events with real-time editing and a single save action.

## Design Principles

### 1. Material Design 3 Compliance
- **Elevation**: Use proper elevation levels (level 3 for modal backdrop, level 5 for modal surface)
- **Typography**: Implement Material Design 3 typography scale
- **Color**: Use Material Design 3 color tokens (surface, on-surface, primary, etc.)
- **Shape**: Use Material Design 3 shape tokens (corner radius, etc.)
- **Motion**: Implement Material Design 3 motion principles

### 2. Immediate Editing UX
- **No separate edit mode**: All fields are immediately editable
- **Visual feedback**: Clear indication of changes and save state
- **Single action**: One save button to confirm all changes
- **Auto-save indicators**: Show when changes are pending

## Modal Structure

### Layout Architecture
```
┌─────────────────────────────────────────────────────────┐
│ Modal Container (Elevation 5)                           │
├─────────────────────────────────────────────────────────┤
│ Header: Title + Close Button                            │
├─────────────────────────────────────────────────────────┤
│ Body: Split Layout (40% | 60%)                         │
│ ┌─────────────────┬─────────────────────────────────┐   │
│ │ Event List      │ Event Details (Editable)        │   │
│ │ (Left Pane)     │ (Right Pane)                    │   │
│ │                 │                                 │   │
│ │ • Event 1       │ ┌─ Event Form ─────────────────┐ │   │
│ │ • Event 2       │ │ Title: [_____________]      │ │   │
│ │ • Event 3       │ │ Date:  [_____________]      │ │   │
│ │                 │ │ Time:  [_____________]      │ │   │
│ │                 │ │ Desc:  [_____________]      │ │   │
│ │                 │ └─────────────────────────────┘ │   │
│ │                 │                                 │   │
│ │                 │ ┌─ Actions ────────────────────┐ │   │
│ │                 │ │ [Save] [Delete] [Cancel]     │ │   │
│ │                 │ └─────────────────────────────┘ │   │
│ └─────────────────┴─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Component Specifications

### 1. Modal Container
```css
.m3-calendar-event-modal {
    /* Material Design 3 Modal */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    
    /* Backdrop */
    backdrop-filter: blur(8px);
    background-color: rgba(0, 0, 0, 0.32);
    
    /* Animation */
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s cubic-bezier(0.2, 0, 0, 1),
                visibility 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.m3-calendar-event-modal--visible {
    opacity: 1;
    visibility: visible;
}

.m3-calendar-event-modal__container {
    /* Material Design 3 Surface */
    background-color: var(--md-sys-color-surface);
    border-radius: var(--md-sys-shape-corner-extra-large);
    box-shadow: var(--md-sys-elevation-level5);
    
    /* Positioning */
    position: relative;
    width: 90%;
    max-width: 1200px;
    max-height: 90vh;
    margin: 5vh auto;
    
    /* Animation */
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

.m3-calendar-event-modal--visible .m3-calendar-event-modal__container {
    transform: scale(1);
}
```

### 2. Header Component
```html
<div class="m3-calendar-event-modal__header">
    <h2 class="m3-calendar-event-modal__title">
        <span class="material-symbols-rounded">event</span>
        Event Details
    </h2>
    <button class="m3-icon-button m3-icon-button--close" id="modal-close-btn">
        <span class="material-symbols-rounded">close</span>
    </button>
</div>
```

```css
.m3-calendar-event-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 24px 0 24px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.m3-calendar-event-modal__title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 400;
    color: var(--md-sys-color-on-surface);
    margin: 0;
}

.m3-icon-button--close {
    background: none;
    border: none;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
    padding: 8px;
    border-radius: 20px;
    transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-icon-button--close:hover {
    background-color: var(--md-sys-color-surface-variant);
}
```

### 3. Event List (Left Pane)
```html
<div class="m3-calendar-event-modal__left-pane">
    <div class="m3-calendar-event-modal__event-list-header">
        <h3 class="m3-calendar-event-modal__event-list-title">
            Events for <span id="modal-date-display">October 11, 2025</span>
        </h3>
        <button class="m3-fab m3-fab--small" id="add-event-btn">
            <span class="material-symbols-rounded">add</span>
        </button>
    </div>
    <div class="m3-calendar-event-modal__event-list">
        <!-- Event items will be populated here -->
    </div>
</div>
```

```css
.m3-calendar-event-modal__left-pane {
    width: 40%;
    border-right: 1px solid var(--md-sys-color-outline-variant);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.m3-calendar-event-modal__event-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    flex-shrink: 0;
}

.m3-calendar-event-modal__event-list-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    margin: 0;
}

.m3-calendar-event-modal__event-list {
    flex: 1;
    overflow-y: auto;
    padding: 0;
}

.m3-calendar-event-modal__event-item {
    display: flex;
    align-items: center;
    padding: 16px 24px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    cursor: pointer;
    transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-calendar-event-modal__event-item:hover {
    background-color: var(--md-sys-color-surface-variant);
}

.m3-calendar-event-modal__event-item.selected {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
}

.m3-calendar-event-modal__event-time {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
    margin-right: 12px;
    min-width: 60px;
}

.m3-calendar-event-modal__event-item.selected .m3-calendar-event-modal__event-time {
    color: var(--md-sys-color-on-primary-container);
}

.m3-calendar-event-modal__event-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    margin: 0;
    flex: 1;
}

.m3-calendar-event-modal__event-item.selected .m3-calendar-event-modal__event-title {
    color: var(--md-sys-color-on-primary-container);
}
```

### 4. Event Details Form (Right Pane)
```html
<div class="m3-calendar-event-modal__right-pane">
    <div class="m3-calendar-event-modal__event-details">
        <div class="m3-calendar-event-modal__event-details-header">
            <h3 class="m3-calendar-event-modal__event-details-title">Event Details</h3>
            <div class="m3-calendar-event-modal__event-details-actions">
                <button class="m3-button m3-button--filled" id="save-event-btn">
                    <span class="material-symbols-rounded">save</span>
                    Save
                </button>
                <button class="m3-button m3-button--outlined" id="delete-event-btn">
                    <span class="material-symbols-rounded">delete</span>
                    Delete
                </button>
            </div>
        </div>
        
        <div class="m3-calendar-event-modal__event-details-form">
            <!-- Form fields will be populated here -->
        </div>
    </div>
</div>
```

### 5. Material Design 3 Form Components

#### Text Field Component
```html
<div class="m3-text-field">
    <label class="m3-text-field__label" for="event-title">Title</label>
    <input type="text" id="event-title" class="m3-text-field__input" placeholder="Event title">
    <div class="m3-text-field__supporting-text">Enter a descriptive title for your event</div>
</div>
```

```css
.m3-text-field {
    position: relative;
    margin-bottom: 24px;
}

.m3-text-field__label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 8px;
}

.m3-text-field__input {
    width: 100%;
    padding: 16px;
    border: 1px solid var(--md-sys-color-outline);
    border-radius: var(--md-sys-shape-corner-small);
    font-size: 16px;
    background-color: var(--md-sys-color-surface);
    color: var(--md-sys-color-on-surface);
    transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1),
                box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-text-field__input:focus {
    outline: none;
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
}

.m3-text-field__supporting-text {
    font-size: 12px;
    color: var(--md-sys-color-on-surface-variant);
    margin-top: 4px;
}
```

#### Switch Component
```html
<div class="m3-switch">
    <input type="checkbox" id="event-all-day" class="m3-switch__input">
    <label for="event-all-day" class="m3-switch__label">
        <span class="m3-switch__track"></span>
        <span class="m3-switch__thumb"></span>
        All Day Event
    </label>
</div>
```

```css
.m3-switch {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
}

.m3-switch__input {
    display: none;
}

.m3-switch__label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 14px;
    color: var(--md-sys-color-on-surface);
}

.m3-switch__track {
    width: 40px;
    height: 30px;
    background-color: var(--md-sys-color-surface-variant);
    border-radius: 10px;
    position: relative;
    transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-switch__thumb {
    width: 16px;
    height: 16px;
    background-color: var(--md-sys-color-outline);
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: 2px;
    transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1),
                background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-switch__input:checked + .m3-switch__label .m3-switch__track {
    background-color: var(--md-sys-color-primary);
}

.m3-switch__input:checked + .m3-switch__label .m3-switch__thumb {
    transform: translateX(20px);
    background-color: var(--md-sys-color-on-primary);
}
```

#### Button Components
```css
.m3-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: var(--md-sys-shape-corner-small);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    text-decoration: none;
}

.m3-button--filled {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow: var(--md-sys-elevation-level1);
}

.m3-button--filled:hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    box-shadow: var(--md-sys-elevation-level2);
}

.m3-button--outlined {
    background-color: transparent;
    color: var(--md-sys-color-primary);
    border: 1px solid var(--md-sys-color-outline);
}

.m3-button--outlined:hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
}

.m3-fab {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    cursor: pointer;
    box-shadow: var(--md-sys-elevation-level3);
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.m3-fab:hover {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    box-shadow: var(--md-sys-elevation-level4);
}

.m3-fab--small {
    width: 32px;
    height: 32px;
}
```

## JavaScript Implementation

### 1. Modal Class Structure
```javascript
class CalendarEventModal {
    constructor() {
        this.modal = null;
        this.currentDate = null;
        this.currentEvent = null;
        this.events = [];
        this.hasChanges = false;
        this.originalEventData = null;
        
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Create modal HTML structure
        const modalHTML = `
            <div id="calendar-event-modal" class="m3-calendar-event-modal">
                <div class="m3-calendar-event-modal__backdrop"></div>
                <div class="m3-calendar-event-modal__container">
                    <div class="m3-calendar-event-modal__content">
                        <!-- Header -->
                        <div class="m3-calendar-event-modal__header">
                            <h2 class="m3-calendar-event-modal__title">
                                <span class="material-symbols-rounded">event</span>
                                Event Details
                            </h2>
                            <button class="m3-icon-button m3-icon-button--close" id="modal-close-btn">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="m3-calendar-event-modal__body">
                            <div class="m3-calendar-event-modal__split-container">
                                <!-- Left Pane - Event List -->
                                <div class="m3-calendar-event-modal__left-pane">
                                    <div class="m3-calendar-event-modal__event-list-header">
                                        <h3 class="m3-calendar-event-modal__event-list-title">
                                            Events for <span id="modal-date-display"></span>
                                        </h3>
                                        <button class="m3-fab m3-fab--small" id="add-event-btn">
                                            <span class="material-symbols-rounded">add</span>
                                        </button>
                                    </div>
                                    <div class="m3-calendar-event-modal__event-list" id="event-list">
                                        <!-- Event list items will be populated here -->
                                    </div>
                                </div>

                                <!-- Right Pane - Event Details -->
                                <div class="m3-calendar-event-modal__right-pane">
                                    <div class="m3-calendar-event-modal__event-details" id="event-details">
                                        <!-- Event details will be populated here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('calendar-event-modal');
    }
}
```

### 2. Immediate Editing Implementation
```javascript
show(date, event = null) {
    this.currentDate = date;
    this.currentEvent = event;
    this.hasChanges = false;
    
    // Update modal title and date display
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    this.modal.querySelector('#modal-date-display').textContent = dateStr;

    // Load events for the date
    this.loadEventsForDate(date);

    // Show modal
    this.modal.style.display = 'block';
    requestAnimationFrame(() => {
        this.modal.classList.add('m3-calendar-event-modal--visible');
    });
}

renderEventDetails(event) {
    const detailsContainer = this.modal.querySelector('#event-details');
    
    // Store original data for change detection
    this.originalEventData = JSON.parse(JSON.stringify(event));
    
    detailsContainer.innerHTML = `
        <div class="m3-calendar-event-modal__event-details-header">
            <h3 class="m3-calendar-event-modal__event-details-title">Event Details</h3>
            <div class="m3-calendar-event-modal__event-details-actions">
                <button class="m3-button m3-button--filled" id="save-event-btn" disabled>
                    <span class="material-symbols-rounded">save</span>
                    Save
                </button>
                <button class="m3-button m3-button--outlined" id="delete-event-btn">
                    <span class="material-symbols-rounded">delete</span>
                    Delete
                </button>
            </div>
        </div>
        
        <div class="m3-calendar-event-modal__event-details-form">
            <div class="m3-text-field">
                <label class="m3-text-field__label" for="event-title">Title</label>
                <input type="text" id="event-title" class="m3-text-field__input" 
                       value="${event.title}" placeholder="Event title">
                <div class="m3-text-field__supporting-text">Enter a descriptive title for your event</div>
            </div>
            
            <div class="m3-text-field">
                <label class="m3-text-field__label" for="event-description">Description</label>
                <textarea id="event-description" class="m3-text-field__input m3-text-field__input--textarea" 
                          placeholder="Event description" rows="3">${event.description || ''}</textarea>
                <div class="m3-text-field__supporting-text">Add details about your event</div>
            </div>
            
            <div class="m3-text-field">
                <label class="m3-text-field__label" for="event-location">Location</label>
                <input type="text" id="event-location" class="m3-text-field__input" 
                       value="${event.location || ''}" placeholder="Event location">
                <div class="m3-text-field__supporting-text">Where will this event take place?</div>
            </div>
            
            <div class="m3-switch">
                <input type="checkbox" id="event-all-day" class="m3-switch__input" ${event.allDay ? 'checked' : ''}>
                <label for="event-all-day" class="m3-switch__label">
                    <span class="m3-switch__track"></span>
                    <span class="m3-switch__thumb"></span>
                    All Day Event
                </label>
            </div>
            
            <div class="m3-calendar-event-modal__datetime-container">
                <div class="m3-text-field">
                    <label class="m3-text-field__label" for="event-start-date">Start Date</label>
                    <input type="date" id="event-start-date" class="m3-text-field__input">
                </div>
                <div class="m3-text-field" id="event-start-time-field">
                    <label class="m3-text-field__label" for="event-start-time">Start Time</label>
                    <input type="time" id="event-start-time" class="m3-text-field__input">
                </div>
            </div>
            
            <div class="m3-calendar-event-modal__datetime-container">
                <div class="m3-text-field">
                    <label class="m3-text-field__label" for="event-end-date">End Date</label>
                    <input type="date" id="event-end-date" class="m3-text-field__input">
                </div>
                <div class="m3-text-field" id="event-end-time-field">
                    <label class="m3-text-field__label" for="event-end-time">End Time</label>
                    <input type="time" id="event-end-time" class="m3-text-field__input">
                </div>
            </div>
        </div>
    `;

    // Populate form fields
    this.populateEventForm(event);
    
    // Setup change detection
    this.setupChangeDetection();
    
    // Setup event listeners
    this.setupEventDetailListeners();
}

setupChangeDetection() {
    const form = this.modal.querySelector('.m3-calendar-event-modal__event-details-form');
    const saveBtn = document.getElementById('save-event-btn');
    
    // Listen for changes on all form inputs
    form.addEventListener('input', () => {
        this.detectChanges();
    });
    
    form.addEventListener('change', () => {
        this.detectChanges();
    });
}

detectChanges() {
    if (!this.originalEventData) return;
    
    const currentData = this.getFormData();
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(this.originalEventData);
    
    this.hasChanges = hasChanges;
    
    const saveBtn = document.getElementById('save-event-btn');
    if (saveBtn) {
        saveBtn.disabled = !hasChanges;
        saveBtn.textContent = hasChanges ? 'Save Changes' : 'Save';
    }
}

getFormData() {
    return {
        title: document.getElementById('event-title').value,
        description: document.getElementById('event-description').value,
        location: document.getElementById('event-location').value,
        allDay: document.getElementById('event-all-day').checked,
        startDate: document.getElementById('event-start-date').value,
        startTime: document.getElementById('event-start-time').value,
        endDate: document.getElementById('event-end-date').value,
        endTime: document.getElementById('event-end-time').value
    };
}
```

### 3. Save Functionality
```javascript
async saveEvent() {
    if (!this.hasChanges) return;
    
    try {
        const formData = this.getFormData();
        const saveBtn = document.getElementById('save-event-btn');
        
        // Show loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_empty</span> Saving...';
        
        const response = await fetch(`/api/calendar/events/${this.currentEvent.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const updatedEvent = await response.json();
            this.currentEvent = updatedEvent;
            this.originalEventData = JSON.parse(JSON.stringify(updatedEvent));
            this.hasChanges = false;
            
            // Update save button
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="material-symbols-rounded">save</span> Save';
            
            // Show success feedback
            this.showSuccessMessage('Event saved successfully');
            
            // Dispatch event for calendar refresh
            window.dispatchEvent(new CustomEvent('eventUpdated', { detail: updatedEvent }));
        } else {
            throw new Error('Failed to save event');
        }
    } catch (error) {
        console.error('Error saving event:', error);
        this.showErrorMessage('Failed to save event. Please try again.');
        
        // Reset save button
        const saveBtn = document.getElementById('save-event-btn');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span class="material-symbols-rounded">save</span> Save';
    }
}

showSuccessMessage(message) {
    // Create and show success toast
    const toast = document.createElement('div');
    toast.className = 'm3-toast m3-toast--success';
    toast.innerHTML = `
        <span class="material-symbols-rounded">check_circle</span>
        ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

showErrorMessage(message) {
    // Create and show error toast
    const toast = document.createElement('div');
    toast.className = 'm3-toast m3-toast--error';
    toast.innerHTML = `
        <span class="material-symbols-rounded">error</span>
        ${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}
```

## Responsive Design

### Mobile Breakpoints
```css
@media (max-width: 768px) {
    .m3-calendar-event-modal__container {
        width: 95%;
        max-height: 95vh;
    }

    .m3-calendar-event-modal__split-container {
        grid-template-columns: 1fr;
        gap: 24px;
    }

    .m3-calendar-event-modal__datetime-container {
        grid-template-columns: 1fr;
    }

    .m3-calendar-event-modal__header {
        padding: 16px 16px 0 16px;
    }

    .m3-calendar-event-modal__body {
        padding: 16px;
    }
}

@media (max-width: 480px) {
    .m3-calendar-event-modal__container {
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border-radius: 0;
    }

    .m3-calendar-event-modal__content {
        max-height: 100vh;
    }
}
```

## Implementation Checklist

### Phase 1: Core Modal Structure
- [ ] Create modal HTML structure
- [ ] Implement Material Design 3 styling
- [ ] Add backdrop and container styling
- [ ] Implement show/hide animations

### Phase 2: Event List (Left Pane)
- [ ] Create event list header with date display
- [ ] Implement event list items with time and title
- [ ] Add selection highlighting
- [ ] Implement add event FAB button

### Phase 3: Event Details Form (Right Pane)
- [ ] Create form with Material Design 3 components
- [ ] Implement text fields with labels and supporting text
- [ ] Add switch component for all-day events
- [ ] Create date/time input fields
- [ ] Implement action buttons (Save, Delete)

### Phase 4: Immediate Editing
- [ ] Implement change detection
- [ ] Add real-time save button state
- [ ] Create form data collection
- [ ] Implement save functionality
- [ ] Add success/error feedback

### Phase 5: Integration
- [ ] Connect to calendar section
- [ ] Implement event loading
- [ ] Add event creation
- [ ] Implement event deletion
- [ ] Add calendar refresh on changes

### Phase 6: Polish
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add keyboard navigation
- [ ] Test responsive design
- [ ] Add accessibility features

## Benefits

### User Experience
- **Immediate editing**: No separate edit mode required
- **Visual feedback**: Clear indication of changes and save state
- **Single action**: One save button to confirm all changes
- **Material Design 3**: Modern, consistent interface

### Developer Experience
- **Componentized**: Modular, reusable components
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features
- **Responsive**: Works on all device sizes

### Performance
- **Efficient**: Uses existing calendar data when available
- **Fast**: No unnecessary API calls
- **Smooth**: Material Design 3 animations and transitions
- **Accessible**: Proper ARIA labels and keyboard navigation

This implementation provides a modern, intuitive interface for calendar event management that follows Material Design 3 principles and provides an excellent user experience.
