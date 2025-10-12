/**
 * Calendar Event Modal Component
 * Handles the modal for viewing, creating, and editing calendar events
 */
class CalendarEventModal {
    constructor() {
        this.modal = null;
        this.currentDate = null;
        this.currentEvent = null;
        this.events = [];
        this.calendars = [];
        this.isEditing = false;
        this.isCreating = false;

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
                        <!-- Modal Header -->
                        <div class="m3-calendar-event-modal__header">
                            <h2 class="m3-calendar-event-modal__title" id="modal-title">Event Details</h2>
                            <button class="m3-calendar-event-modal__close-btn" id="modal-close-btn">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <!-- Modal Body -->
                        <div class="m3-calendar-event-modal__body">
                            <div class="m3-calendar-event-modal__split-container">
                                <!-- Left Pane - Event List -->
                                <div class="m3-calendar-event-modal__left-pane">
                                    <div class="m3-calendar-event-modal__event-list-header">
                                        <h3 class="m3-modal__section-title">Events for <span id="modal-date-display"></span></h3>
                                        <button class="m3-button m3-button--filled m3-calendar-event-modal__button--small" id="add-event-btn">
                                            <span class="material-symbols-rounded">add</span>
                                            Add Event
                                        </button>
                                    </div>
                                    <div class="m3-calendar-event-modal__event-list" id="event-list">
                                        <!-- Event list items will be populated here -->
                                    </div>
                                </div>

                                <!-- Right Pane - Selected Event Details -->
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

        // Insert modal into the page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('calendar-event-modal');
    }

    setupEventListeners() {
        // Close modal events
        this.modal.querySelector('#modal-close-btn').addEventListener('click', () => this.hide());
        this.modal.querySelector('.m3-calendar-event-modal__backdrop').addEventListener('click', () => this.hide());

        // Add event button
        this.modal.querySelector('#add-event-btn').addEventListener('click', () => this.createNewEvent());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hide();
            }
        });
    }

    show(date, event = null) {
        // If date is not provided but event is, extract date from event
        if (!date && event) {
            date = new Date(event.start);
        }

        // If still no date, use today
        if (!date) {
            date = new Date();
        }

        this.currentDate = date;
        this.currentEvent = event;
        this.isEditing = false;
        this.isCreating = false;

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
            this.resetForm();
        }, 300);
    }

    isVisible() {
        return this.modal.classList.contains('m3-calendar-event-modal--visible');
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
                return;
            }

            // Fallback to API call
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
        eventList.innerHTML = '';

        if (this.events.length === 0) {
            eventList.innerHTML = '<div class="m3-calendar-event-modal__event-item">No events for this date</div>';
            return;
        }

        this.events.forEach(event => {
            const eventItem = this.createEventListItem(event);
            eventList.appendChild(eventItem);
        });
    }

    createEventListItem(event) {
        const item = document.createElement('div');
        item.className = 'm3-calendar-event-modal__event-item';
        item.dataset.eventId = event.id;

        const time = this.formatEventTime(event);
        const allDayBadge = event.allDay ? '<span class="m3-calendar-event-modal__event-all-day">All Day</span>' : '';

        item.innerHTML = `
            <div class="m3-calendar-event-modal__event-time">${time}</div>
            <div class="m3-calendar-event-modal__event-title">${event.title}${allDayBadge}</div>
        `;

        item.addEventListener('click', () => this.selectEvent(event));
        return item;
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

    selectEvent(event) {
        // Remove previous selection
        this.modal.querySelectorAll('.m3-calendar-event-modal__event-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        const eventItem = this.modal.querySelector(`[data-event-id="${event.id}"]`);
        if (eventItem) {
            eventItem.classList.add('selected');
        }

        this.currentEvent = event;
        this.renderEventDetails(event);
    }

    renderEventDetails(event) {
        const detailsContainer = this.modal.querySelector('#event-details');

        detailsContainer.innerHTML = `
            <div class="m3-calendar-event-modal__event-details-header">
                <h3 class="m3-calendar-event-modal__event-details-title">${event.title}</h3>
                <div class="m3-calendar-event-modal__event-details-actions">
                    <button class="m3-button m3-button--filled" id="edit-event-btn">
                        <span class="material-symbols-rounded">edit</span>
                        Edit
                    </button>
                    <button class="m3-button m3-button--outlined" id="delete-event-btn">
                        <span class="material-symbols-rounded">delete</span>
                        Delete
                    </button>
                </div>
            </div>
            
            <div class="m3-calendar-event-modal__event-details-form">
                <div class="m3-text-field">
                    <label class="m3-text-field__label">Title</label>
                    <input type="text" id="event-title" class="m3-text-field__input" value="${event.title}" readonly>
                </div>
                
                <div class="m3-text-field">
                    <label class="m3-text-field__label">Description</label>
                    <textarea id="event-description" class="m3-text-field__input m3-text-field__input--textarea" readonly>${event.description || ''}</textarea>
                </div>
                
                <div class="m3-text-field">
                    <label class="m3-text-field__label">Location</label>
                    <input type="text" id="event-location" class="m3-text-field__input" value="${event.location || ''}" readonly>
                </div>
                
                <div class="m3-switch">
                    <input type="checkbox" id="event-all-day" class="m3-switch__input" ${event.allDay ? 'checked' : ''} disabled>
                    <label for="event-all-day" class="m3-switch__label">All Day Event</label>
                </div>
                
                <div class="m3-calendar-event-modal__datetime-container">
                    <div class="m3-text-field">
                        <label class="m3-text-field__label">Start Date</label>
                        <input type="date" id="event-start-date" class="m3-text-field__input" readonly>
                    </div>
                    <div class="m3-text-field" id="event-start-time-field">
                        <label class="m3-text-field__label">Start Time</label>
                        <input type="time" id="event-start-time" class="m3-text-field__input" readonly>
                    </div>
                </div>
                
                <div class="m3-calendar-event-modal__datetime-container">
                    <div class="m3-text-field">
                        <label class="m3-text-field__label">End Date</label>
                        <input type="date" id="event-end-date" class="m3-text-field__input" readonly>
                    </div>
                    <div class="m3-text-field" id="event-end-time-field">
                        <label class="m3-text-field__label">End Time</label>
                        <input type="time" id="event-end-time" class="m3-text-field__input" readonly>
                    </div>
                </div>
            </div>
            
            <div class="m3-calendar-event-modal__event-details-info">
                <div class="m3-calendar-event-modal__info-item">
                    <span class="m3-calendar-event-modal__info-label">Created:</span>
                    <span class="m3-calendar-event-modal__info-value">${new Date(event.created).toLocaleString()}</span>
                </div>
                <div class="m3-calendar-event-modal__info-item">
                    <span class="m3-calendar-event-modal__info-label">Last Modified:</span>
                    <span class="m3-calendar-event-modal__info-value">${new Date(event.updated).toLocaleString()}</span>
                </div>
                <div class="m3-calendar-event-modal__info-item">
                    <span class="m3-calendar-event-modal__info-label">Event ID:</span>
                    <span class="m3-calendar-event-modal__info-value">${event.id}</span>
                </div>
            </div>
        `;

        // Populate form fields
        this.populateEventForm(event);

        // Setup event listeners for edit/delete buttons
        this.setupEventDetailListeners();
    }

    populateEventForm(event) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        document.getElementById('event-start-date').value = startDate.toISOString().split('T')[0];
        document.getElementById('event-end-date').value = endDate.toISOString().split('T')[0];

        if (!event.allDay) {
            document.getElementById('event-start-time').value = startDate.toTimeString().slice(0, 5);
            document.getElementById('event-end-time').value = endDate.toTimeString().slice(0, 5);
        }

        // Toggle time fields based on all-day status
        this.toggleTimeFields(!event.allDay);
    }

    setupEventDetailListeners() {
        // Edit button
        document.getElementById('edit-event-btn').addEventListener('click', () => this.startEditing());

        // Delete button
        document.getElementById('delete-event-btn').addEventListener('click', () => this.deleteEvent());
    }

    startEditing() {
        this.isEditing = true;

        // Make form fields editable
        const inputs = this.modal.querySelectorAll('#event-details input, #event-details textarea');
        inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
        });

        // Add save button
        const actionsContainer = document.querySelector('.m3-calendar-event-modal__event-details-actions');
        actionsContainer.innerHTML = `
            <button class="m3-button m3-button--filled" id="save-event-btn">
                <span class="material-symbols-rounded">save</span>
                Save
            </button>
            <button class="m3-button m3-button--outlined" id="cancel-edit-btn">
                <span class="material-symbols-rounded">cancel</span>
                Cancel
            </button>
        `;

        // Setup save/cancel listeners
        document.getElementById('save-event-btn').addEventListener('click', () => this.saveEvent());
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelEditing());

        // Setup all-day toggle listener
        document.getElementById('event-all-day').addEventListener('change', (e) => {
            this.toggleTimeFields(!e.target.checked);
        });
    }

    cancelEditing() {
        this.isEditing = false;
        this.renderEventDetails(this.currentEvent);
    }

    async saveEvent() {
        try {
            const formData = this.getFormData();
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
                this.isEditing = false;

                // Refresh the event list
                await this.loadEventsForDate(this.currentDate);

                // Dispatch event for calendar refresh
                window.dispatchEvent(new CustomEvent('eventUpdated', { detail: updatedEvent }));
            } else {
                console.error('Failed to save event:', response.statusText);
            }
        } catch (error) {
            console.error('Error saving event:', error);
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
                // Dispatch event for calendar refresh
                window.dispatchEvent(new CustomEvent('eventDeleted', { detail: this.currentEvent }));

                // Refresh the event list
                await this.loadEventsForDate(this.currentDate);

                // If no events left, show empty state
                if (this.events.length === 0) {
                    this.showEmptyState();
                }
            } else {
                console.error('Failed to delete event:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    }

    createNewEvent() {
        this.isCreating = true;
        this.currentEvent = null;

        const detailsContainer = this.modal.querySelector('#event-details');
        detailsContainer.innerHTML = `
            <div class="m3-calendar-event-modal__event-details-header">
                <h3 class="m3-calendar-event-modal__event-details-title">Create New Event</h3>
                <div class="m3-calendar-event-modal__event-details-actions">
                    <button class="m3-button m3-button--filled" id="create-event-btn">
                        <span class="material-symbols-rounded">add</span>
                        Create
                    </button>
                    <button class="m3-button m3-button--outlined" id="cancel-create-btn">
                        <span class="material-symbols-rounded">cancel</span>
                        Cancel
                    </button>
                </div>
            </div>
            
            <div class="m3-calendar-event-modal__event-details-form">
                <div class="m3-text-field">
                    <label class="m3-text-field__label">Title</label>
                    <input type="text" id="event-title" class="m3-text-field__input" placeholder="Event title">
                </div>
                
                <div class="m3-text-field">
                    <label class="m3-text-field__label">Description</label>
                    <textarea id="event-description" class="m3-text-field__input m3-text-field__input--textarea" placeholder="Event description"></textarea>
                </div>
                
                <div class="m3-text-field">
                    <label class="m3-text-field__label">Location</label>
                    <input type="text" id="event-location" class="m3-text-field__input" placeholder="Event location">
                </div>
                
                <div class="m3-switch">
                    <input type="checkbox" id="event-all-day" class="m3-switch__input">
                    <label for="event-all-day" class="m3-switch__label">All Day Event</label>
                </div>
                
                <div class="m3-calendar-event-modal__datetime-container">
                    <div class="m3-text-field">
                        <label class="m3-text-field__label">Start Date</label>
                        <input type="date" id="event-start-date" class="m3-text-field__input">
                    </div>
                    <div class="m3-text-field" id="event-start-time-field">
                        <label class="m3-text-field__label">Start Time</label>
                        <input type="time" id="event-start-time" class="m3-text-field__input">
                    </div>
                </div>
                
                <div class="m3-calendar-event-modal__datetime-container">
                    <div class="m3-text-field">
                        <label class="m3-text-field__label">End Date</label>
                        <input type="date" id="event-end-date" class="m3-text-field__input">
                    </div>
                    <div class="m3-text-field" id="event-end-time-field">
                        <label class="m3-text-field__label">End Time</label>
                        <input type="time" id="event-end-time" class="m3-text-field__input">
                    </div>
                </div>
            </div>
        `;

        // Set default date to current date
        const today = this.currentDate.toISOString().split('T')[0];
        document.getElementById('event-start-date').value = today;
        document.getElementById('event-end-date').value = today;

        // Setup event listeners
        document.getElementById('create-event-btn').addEventListener('click', () => this.createEvent());
        document.getElementById('cancel-create-btn').addEventListener('click', () => this.cancelCreating());
        document.getElementById('event-all-day').addEventListener('change', (e) => {
            this.toggleTimeFields(!e.target.checked);
        });
    }

    cancelCreating() {
        this.isCreating = false;
        if (this.events.length > 0) {
            this.selectEvent(this.events[0]);
        } else {
            this.showEmptyState();
        }
    }

    async createEvent() {
        try {
            const formData = this.getFormData();
            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newEvent = await response.json();
                this.isCreating = false;

                // Refresh the event list
                await this.loadEventsForDate(this.currentDate);

                // Select the new event
                this.selectEvent(newEvent);

                // Dispatch event for calendar refresh
                window.dispatchEvent(new CustomEvent('eventCreated', { detail: newEvent }));
            } else {
                console.error('Failed to create event:', response.statusText);
            }
        } catch (error) {
            console.error('Error creating event:', error);
        }
    }

    getFormData() {
        const title = document.getElementById('event-title').value;
        const description = document.getElementById('event-description').value;
        const location = document.getElementById('event-location').value;
        const allDay = document.getElementById('event-all-day').checked;
        const startDate = document.getElementById('event-start-date').value;
        const endDate = document.getElementById('event-end-date').value;
        const startTime = document.getElementById('event-start-time').value;
        const endTime = document.getElementById('event-end-time').value;

        const formData = {
            calendarId: 'primary', // Default to primary calendar
            title: title,
            description: description,
            location: location,
            allDay: allDay,
            start: {
                date: allDay ? startDate : null,
                dateTime: allDay ? null : new Date(`${startDate}T${startTime}`).toISOString(),
                timeZone: 'America/Chicago'
            },
            end: {
                date: allDay ? endDate : null,
                dateTime: allDay ? null : new Date(`${endDate}T${endTime}`).toISOString(),
                timeZone: 'America/Chicago'
            }
        };

        return formData;
    }

    toggleTimeFields(show) {
        const startTimeField = document.getElementById('event-start-time-field');
        const endTimeField = document.getElementById('event-end-time-field');

        if (startTimeField && endTimeField) {
            startTimeField.style.display = show ? 'block' : 'none';
            endTimeField.style.display = show ? 'block' : 'none';
        }
    }

    showEmptyState() {
        const detailsContainer = this.modal.querySelector('#event-details');
        detailsContainer.innerHTML = `
            <div class="m3-calendar-event-modal__event-details">
                <div style="text-align: center; padding: 40px; color: var(--md-sys-color-on-surface-variant);">
                    <span class="material-symbols-rounded" style="font-size: 48px; margin-bottom: 16px; display: block;">event</span>
                    <h3>No events selected</h3>
                    <p>Click on an event in the list or create a new event to get started.</p>
                </div>
            </div>
        `;
    }

    resetForm() {
        this.currentDate = null;
        this.currentEvent = null;
        this.isEditing = false;
        this.isCreating = false;
    }
}

// Initialize the modal when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.calendarEventModal = new CalendarEventModal();
});
