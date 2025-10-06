/**
 * Calendar Event Modal Management
 * Handles creating, editing, viewing, and deleting calendar events
 */

class CalendarEventModal {
    constructor() {
        this.modal = document.getElementById('event-modal');
        this.currentEvent = null;
        this.currentMode = 'view'; // 'view', 'edit', 'create'
        this.calendars = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadCalendars();
    }

    initializeElements() {
        // Modal elements
        this.titleElement = document.getElementById('event-modal-title');
        this.closeButton = document.getElementById('event-modal-close');
        
        // Form elements
        this.titleInput = document.getElementById('event-title');
        this.descriptionInput = document.getElementById('event-description');
        this.locationInput = document.getElementById('event-location');
        this.allDayCheckbox = document.getElementById('event-all-day');
        this.startDateInput = document.getElementById('event-start-date');
        this.startTimeInput = document.getElementById('event-start-time');
        this.endDateInput = document.getElementById('event-end-date');
        this.endTimeInput = document.getElementById('event-end-time');
        this.calendarSelect = document.getElementById('event-calendar');
        
        // Time field containers
        this.startTimeField = document.getElementById('event-start-time-field');
        this.endTimeField = document.getElementById('event-end-time-field');
        
        // Action groups
        this.viewActions = document.getElementById('event-view-actions');
        this.editActions = document.getElementById('event-edit-actions');
        this.createActions = document.getElementById('event-create-actions');
        
        // Action buttons
        this.editButton = document.getElementById('event-edit-btn');
        this.deleteButton = document.getElementById('event-delete-btn');
        this.saveButton = document.getElementById('event-save-btn');
        this.cancelButton = document.getElementById('event-cancel-btn');
        this.createButton = document.getElementById('event-create-btn');
        this.createCancelButton = document.getElementById('event-create-cancel-btn');
        
        // Info elements
        this.createdElement = document.getElementById('event-created');
        this.modifiedElement = document.getElementById('event-modified');
        this.idElement = document.getElementById('event-id');
    }

    setupEventListeners() {
        // Modal close events
        this.closeButton.addEventListener('click', () => this.close());
        this.modal.querySelector('.m3-modal__backdrop').addEventListener('click', () => this.close());
        
        // All day toggle
        this.allDayCheckbox.addEventListener('change', () => this.toggleAllDay());
        
        // Action button events
        this.editButton.addEventListener('click', () => this.setMode('edit'));
        this.deleteButton.addEventListener('click', () => this.deleteEvent());
        this.saveButton.addEventListener('click', () => this.saveEvent());
        this.cancelButton.addEventListener('click', () => this.setMode('view'));
        this.createButton.addEventListener('click', () => this.createEvent());
        this.createCancelButton.addEventListener('click', () => this.close());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.close();
            }
        });
    }

    async loadCalendars() {
        try {
            const response = await fetch('/api/calendar/calendars');
            if (response.ok) {
                this.calendars = await response.json();
                this.populateCalendarSelect();
            } else {
                console.error('Failed to load calendars:', response.statusText);
            }
        } catch (error) {
            console.error('Error loading calendars:', error);
        }
    }

    populateCalendarSelect() {
        this.calendarSelect.innerHTML = '<option value="">Select Calendar</option>';
        this.calendars.forEach(calendar => {
            const option = document.createElement('option');
            option.value = calendar.id;
            option.textContent = calendar.summary;
            this.calendarSelect.appendChild(option);
        });
    }

    show(mode = 'view', event = null, date = null) {
        this.currentEvent = event;
        this.currentMode = mode;
        
        this.setMode(mode);
        this.populateForm(event, date);
        this.modal.style.display = 'flex';
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.modal.classList.add('m3-modal--visible');
        });
    }

    close() {
        this.modal.classList.remove('m3-modal--visible');
        setTimeout(() => {
            this.modal.style.display = 'none';
            this.clearForm();
        }, 300);
    }

    isVisible() {
        return this.modal.classList.contains('m3-modal--visible');
    }

    setMode(mode) {
        this.currentMode = mode;
        
        // Hide all action groups
        this.viewActions.style.display = 'none';
        this.editActions.style.display = 'none';
        this.createActions.style.display = 'none';
        
        // Show appropriate action group
        switch (mode) {
            case 'view':
                this.viewActions.style.display = 'flex';
                this.setFormReadonly(true);
                this.titleElement.textContent = 'Event Details';
                break;
            case 'edit':
                this.editActions.style.display = 'flex';
                this.setFormReadonly(false);
                this.titleElement.textContent = 'Edit Event';
                break;
            case 'create':
                this.createActions.style.display = 'flex';
                this.setFormReadonly(false);
                this.titleElement.textContent = 'Create Event';
                break;
        }
    }

    setFormReadonly(readonly) {
        const inputs = [
            this.titleInput,
            this.descriptionInput,
            this.locationInput,
            this.startDateInput,
            this.startTimeInput,
            this.endDateInput,
            this.endTimeInput,
            this.calendarSelect
        ];
        
        inputs.forEach(input => {
            input.disabled = readonly;
        });
        
        this.allDayCheckbox.disabled = readonly;
    }

    populateForm(event, date) {
        if (event) {
            // Populate with existing event data
            this.titleInput.value = event.title || '';
            this.descriptionInput.value = event.description || '';
            this.locationInput.value = event.location || '';
            this.allDayCheckbox.checked = event.allDay || false;
            
            // Set dates and times
            if (event.start) {
                if (event.allDay) {
                    this.startDateInput.value = event.start.split('T')[0];
                    this.endDateInput.value = event.end ? event.end.split('T')[0] : event.start.split('T')[0];
                } else {
                    const startDate = new Date(event.start);
                    this.startDateInput.value = startDate.toISOString().split('T')[0];
                    this.startTimeInput.value = startDate.toTimeString().slice(0, 5);
                    
                    if (event.end) {
                        const endDate = new Date(event.end);
                        this.endDateInput.value = endDate.toISOString().split('T')[0];
                        this.endTimeInput.value = endDate.toTimeString().slice(0, 5);
                    }
                }
            }
            
            this.calendarSelect.value = event.calendarId || '';
            
            // Set info
            this.createdElement.textContent = event.created ? new Date(event.created).toLocaleString() : '-';
            this.modifiedElement.textContent = event.updated ? new Date(event.updated).toLocaleString() : '-';
            this.idElement.textContent = event.id || '-';
        } else if (date) {
            // Populate with date for new event
            this.startDateInput.value = date.toISOString().split('T')[0];
            this.endDateInput.value = date.toISOString().split('T')[0];
            this.startTimeInput.value = '09:00';
            this.endTimeInput.value = '10:00';
            
            // Clear other fields
            this.titleInput.value = '';
            this.descriptionInput.value = '';
            this.locationInput.value = '';
            this.allDayCheckbox.checked = false;
            this.calendarSelect.value = '';
            
            // Clear info
            this.createdElement.textContent = '-';
            this.modifiedElement.textContent = '-';
            this.idElement.textContent = '-';
        }
        
        this.toggleAllDay();
    }

    clearForm() {
        this.titleInput.value = '';
        this.descriptionInput.value = '';
        this.locationInput.value = '';
        this.allDayCheckbox.checked = false;
        this.startDateInput.value = '';
        this.startTimeInput.value = '';
        this.endDateInput.value = '';
        this.endTimeInput.value = '';
        this.calendarSelect.value = '';
        
        this.createdElement.textContent = '-';
        this.modifiedElement.textContent = '-';
        this.idElement.textContent = '-';
    }

    toggleAllDay() {
        const isAllDay = this.allDayCheckbox.checked;
        this.startTimeField.style.display = isAllDay ? 'none' : 'block';
        this.endTimeField.style.display = isAllDay ? 'none' : 'block';
    }

    async createEvent() {
        const eventData = this.getFormData();
        if (!this.validateForm(eventData)) return;
        
        try {
            const response = await fetch('/api/calendar/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                const newEvent = await response.json();
                this.close();
                this.dispatchEvent('eventCreated', newEvent);
            } else {
                const error = await response.json();
                alert('Failed to create event: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event: ' + error.message);
        }
    }

    async saveEvent() {
        if (!this.currentEvent) return;
        
        const eventData = this.getFormData();
        if (!this.validateForm(eventData)) return;
        
        try {
            const response = await fetch(`/api/calendar/events/${this.currentEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });
            
            if (response.ok) {
                const updatedEvent = await response.json();
                this.close();
                this.dispatchEvent('eventUpdated', updatedEvent);
            } else {
                const error = await response.json();
                alert('Failed to update event: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('Failed to update event: ' + error.message);
        }
    }

    async deleteEvent() {
        if (!this.currentEvent) return;
        
        if (!confirm('Are you sure you want to delete this event?')) return;
        
        try {
            const response = await fetch(`/api/calendar/events/${this.currentEvent.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.close();
                this.dispatchEvent('eventDeleted', this.currentEvent);
            } else {
                const error = await response.json();
                alert('Failed to delete event: ' + (error.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event: ' + error.message);
        }
    }

    getFormData() {
        const isAllDay = this.allDayCheckbox.checked;
        
        const eventData = {
            calendarId: this.calendarSelect.value,
            title: this.titleInput.value,
            description: this.descriptionInput.value,
            location: this.locationInput.value,
            allDay: isAllDay
        };
        
        if (isAllDay) {
            eventData.start = {
                date: this.startDateInput.value
            };
            eventData.end = {
                date: this.endDateInput.value
            };
        } else {
            const startDateTime = new Date(`${this.startDateInput.value}T${this.startTimeInput.value}`);
            const endDateTime = new Date(`${this.endDateInput.value}T${this.endTimeInput.value}`);
            
            eventData.start = {
                dateTime: startDateTime.toISOString()
            };
            eventData.end = {
                dateTime: endDateTime.toISOString()
            };
        }
        
        return eventData;
    }

    validateForm(eventData) {
        if (!eventData.title.trim()) {
            alert('Please enter an event title');
            this.titleInput.focus();
            return false;
        }
        
        if (!eventData.calendarId) {
            alert('Please select a calendar');
            this.calendarSelect.focus();
            return false;
        }
        
        if (!eventData.start.date && !eventData.start.dateTime) {
            alert('Please enter a start date');
            this.startDateInput.focus();
            return false;
        }
        
        if (!eventData.end.date && !eventData.end.dateTime) {
            alert('Please enter an end date');
            this.endDateInput.focus();
            return false;
        }
        
        return true;
    }

    dispatchEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }
}

// Initialize the modal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendarEventModal = new CalendarEventModal();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarEventModal;
}
