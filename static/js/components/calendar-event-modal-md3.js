/**
 * Calendar Event Modal - Material Design 3
 * A modern, intuitive modal for viewing and editing calendar events
 */
class CalendarEventModalMD3 {
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
            <div id="calendar-event-modal-md3" class="m3-calendar-event-modal">
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
        this.modal = document.getElementById('calendar-event-modal-md3');
    }

    setupEventListeners() {
        // Close button
        this.modal.querySelector('#modal-close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('m3-calendar-event-modal--visible')) {
                this.hide();
            }
        });

        // Add event button
        this.modal.querySelector('#add-event-btn').addEventListener('click', () => {
            this.createNewEvent();
        });
    }

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

    hide() {
        this.modal.classList.remove('m3-calendar-event-modal--visible');
        setTimeout(() => {
            this.modal.style.display = 'none';
        }, 300);
    }

    async loadEventsForDate(date) {
        try {
            // First try to get events from the main calendar section if available
            if (window.calendarSection && window.calendarSection.events) {
                console.log('Using events from main calendar section');
                this.events = window.calendarSection.events.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.toDateString() === date.toDateString();
                });

                console.log('Filtered events for date:', this.events);
                this.renderEventList();

                // Select first event or show empty state
                if (this.events.length > 0) {
                    this.selectEvent(this.events[0]);
                } else {
                    this.showEmptyState();
                }
                return; // Exit if events loaded from main section
            }

            // Fallback to API call if main calendar events are not available
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            const startStr = start.toISOString();
            const endStr = end.toISOString();

            console.log('Loading events for date:', date);
            console.log('Start:', startStr, 'End:', endStr);

            const response = await fetch(`/api/calendar/events?start=${startStr}&end=${endStr}`);

            console.log('Response status:', response.status);

            if (response.ok) {
                this.events = await response.json();
                console.log('Loaded events:', this.events);
                this.renderEventList();

                // Select first event or show empty state
                if (this.events.length > 0) {
                    this.selectEvent(this.events[0]);
                } else {
                    this.showEmptyState();
                }
            } else {
                console.error('Failed to load events:', response.status, response.statusText);
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.showEmptyState();
        }
    }

    renderEventList() {
        const eventList = this.modal.querySelector('#event-list');

        if (this.events.length === 0) {
            eventList.innerHTML = `
                <div class="m3-calendar-event-modal__empty-state">
                    <div class="m3-calendar-event-modal__empty-state-icon">
                        <span class="material-symbols-rounded">event_available</span>
                    </div>
                    <div class="m3-calendar-event-modal__empty-state-text">No events</div>
                    <div class="m3-calendar-event-modal__empty-state-subtext">Click the + button to add an event</div>
                </div>
            `;
            return;
        }

        eventList.innerHTML = this.events.map(event => `
            <div class="m3-calendar-event-modal__event-item" data-event-id="${event.id}">
                <div class="m3-calendar-event-modal__event-time">
                    ${this.formatEventTime(event)}
                </div>
                <div class="m3-calendar-event-modal__event-title">
                    ${event.title}
                </div>
            </div>
        `).join('');

        // Add click listeners to event items
        eventList.querySelectorAll('.m3-calendar-event-modal__event-item').forEach(item => {
            item.addEventListener('click', () => {
                const eventId = item.dataset.eventId;
                const event = this.events.find(e => e.id === eventId);
                if (event) {
                    this.selectEvent(event);
                }
            });
        });
    }

    selectEvent(event) {
        // Remove previous selection
        this.modal.querySelectorAll('.m3-calendar-event-modal__event-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to current event
        const eventItem = this.modal.querySelector(`[data-event-id="${event.id}"]`);
        if (eventItem) {
            eventItem.classList.add('selected');
        }

        // Show event details
        this.renderEventDetails(event);
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

    populateEventForm(event) {
        // Parse start and end dates
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        // Set date fields
        document.getElementById('event-start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('event-end-date').value = endDate.toISOString().split('T')[0];

        // Set time fields (only if not all-day)
        if (!event.allDay) {
            document.getElementById('event-start-time').value = startDate.toTimeString().slice(0, 5);
            document.getElementById('event-end-time').value = endDate.toTimeString().slice(0, 5);
        }

        // Toggle time fields based on all-day status
        this.toggleTimeFields(event.allDay);
    }

    toggleTimeFields(isAllDay) {
        const startTimeField = document.getElementById('event-start-time-field');
        const endTimeField = document.getElementById('event-end-time-field');

        if (isAllDay) {
            startTimeField.style.display = 'none';
            endTimeField.style.display = 'none';
        } else {
            startTimeField.style.display = 'block';
            endTimeField.style.display = 'block';
        }
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

        // Listen for all-day switch changes
        const allDaySwitch = document.getElementById('event-all-day');
        if (allDaySwitch) {
            allDaySwitch.addEventListener('change', (e) => {
                this.toggleTimeFields(e.target.checked);
                this.detectChanges();
            });
        }
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

    setupEventDetailListeners() {
        // Save button
        const saveBtn = document.getElementById('save-event-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveEvent();
            });
        }

        // Delete button
        const deleteBtn = document.getElementById('delete-event-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteEvent();
            });
        }
    }

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

    async deleteEvent() {
        if (!confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            const response = await fetch(`/api/calendar/events/${this.currentEvent.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showSuccessMessage('Event deleted successfully');

                // Dispatch event for calendar refresh
                window.dispatchEvent(new CustomEvent('eventDeleted', { detail: this.currentEvent }));

                // Close modal
                this.hide();
            } else {
                throw new Error('Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showErrorMessage('Failed to delete event. Please try again.');
        }
    }

    createNewEvent() {
        // TODO: Implement new event creation
        console.log('Create new event for date:', this.currentDate);
    }

    showEmptyState() {
        const detailsContainer = this.modal.querySelector('#event-details');
        detailsContainer.innerHTML = `
            <div class="m3-calendar-event-modal__empty-state">
                <div class="m3-calendar-event-modal__empty-state-icon">
                    <span class="material-symbols-rounded">event_available</span>
                </div>
                <div class="m3-calendar-event-modal__empty-state-text">No events for this date</div>
                <div class="m3-calendar-event-modal__empty-state-subtext">Click the + button to add an event</div>
            </div>
        `;
    }

    formatEventTime(event) {
        if (event.allDay) {
            return 'All Day';
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
}

// Initialize the modal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.calendarEventModalMD3 = new CalendarEventModalMD3();
});
