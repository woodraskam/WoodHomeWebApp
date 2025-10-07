/**
 * Calendar Filter Dropdown Menu Component
 * Material Design 3 implementation for calendar filtering
 */

class CalendarFilterDropdown {
    constructor() {
        this.isOpen = false;
        this.calendars = [];
        this.selectedCalendars = new Set();
        this.dropdown = null;
        this.trigger = null;
        this.onFilterChange = null;
        
        this.init();
    }

    /**
     * Initialize the dropdown component
     */
    init() {
        this.createDropdown();
        this.bindEvents();
        this.loadCalendars();
    }

    /**
     * Create the dropdown HTML structure
     */
    createDropdown() {
        // Find the calendar icon in the header
        const calendarIcon = document.querySelector('#calendar-manager-btn');
        if (!calendarIcon) {
            console.error('Calendar icon not found');
            return;
        }

        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'm3-calendar-filter-dropdown';
        dropdownContainer.innerHTML = `
            <button class="m3-calendar-filter-trigger" id="calendar-filter-trigger" aria-label="Filter calendars" aria-expanded="false">
                <span class="material-symbols-rounded">filter_list</span>
            </button>
            <div class="m3-calendar-filter-menu" id="calendar-filter-menu" role="menu" aria-hidden="true">
                <div class="m3-calendar-filter-menu__header">
                    <h3 class="m3-calendar-filter-menu__title">Filter Calendars</h3>
                    <p class="m3-calendar-filter-menu__subtitle">Select calendars to display events</p>
                </div>
                <div class="m3-calendar-filter-menu__content" id="calendar-filter-content">
                    <div class="m3-calendar-filter-menu__loading">
                        <div class="m3-calendar-filter-menu__loading-spinner"></div>
                        <p>Loading calendars...</p>
                    </div>
                </div>
                <div class="m3-calendar-filter-menu__actions">
                    <button class="m3-calendar-filter-menu__action" id="select-all-calendars">Select All</button>
                    <button class="m3-calendar-filter-menu__action" id="clear-all-calendars">Clear All</button>
                </div>
            </div>
        `;

        // Insert after the calendar icon
        calendarIcon.parentNode.insertBefore(dropdownContainer, calendarIcon.nextSibling);

        this.trigger = document.getElementById('calendar-filter-trigger');
        this.dropdown = document.getElementById('calendar-filter-menu');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Toggle dropdown
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.dropdown.contains(e.target) && !this.trigger.contains(e.target)) {
                this.close();
            }
        });

        // Keyboard navigation
        this.trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        // Action buttons
        document.getElementById('select-all-calendars').addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('clear-all-calendars').addEventListener('click', () => {
            this.clearAll();
        });
    }

    /**
     * Load calendars from the API
     */
    async loadCalendars() {
        try {
            const response = await fetch('/api/calendar/calendars');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.calendars = await response.json();
            this.renderCalendars();
        } catch (error) {
            console.error('Failed to load calendars:', error);
            this.showError('Failed to load calendars');
        }
    }

    /**
     * Render calendar list in the dropdown
     */
    renderCalendars() {
        const content = document.getElementById('calendar-filter-content');
        
        if (this.calendars.length === 0) {
            content.innerHTML = `
                <div class="m3-calendar-filter-menu__empty">
                    <div class="m3-calendar-filter-menu__empty-icon">
                        <span class="material-symbols-rounded">calendar_month</span>
                    </div>
                    <p>No calendars available</p>
                </div>
            `;
            return;
        }

        // Create "All Calendars" option
        const allCalendarsOption = this.createMenuItem({
            id: 'all',
            name: 'All Calendars',
            color: '#3788d8',
            description: 'Show events from all calendars'
        }, true);

        // Create individual calendar options
        const calendarOptions = this.calendars.map(calendar => 
            this.createMenuItem(calendar, this.selectedCalendars.has(calendar.id))
        );

        content.innerHTML = '';
        content.appendChild(allCalendarsOption);
        content.appendChild(...calendarOptions);
    }

    /**
     * Create a menu item element
     */
    createMenuItem(calendar, isSelected = false) {
        const item = document.createElement('button');
        item.className = 'm3-calendar-filter-menu-item';
        item.setAttribute('role', 'menuitemcheckbox');
        item.setAttribute('aria-checked', isSelected);
        item.dataset.calendarId = calendar.id;
        
        item.innerHTML = `
            <div class="m3-calendar-filter-menu-item__color" style="background-color: ${calendar.color}"></div>
            <div class="m3-calendar-filter-menu-item__content">
                <div class="m3-calendar-filter-menu-item__name">${calendar.name}</div>
                <div class="m3-calendar-filter-menu-item__description">${calendar.description || 'Calendar events'}</div>
            </div>
            <div class="m3-calendar-filter-menu-item__checkbox ${isSelected ? 'm3-calendar-filter-menu-item__checkbox--checked' : ''}">
                <span class="material-symbols-rounded m3-calendar-filter-menu-item__checkbox-icon">check</span>
            </div>
        `;

        // Add click handler
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleCalendar(calendar.id);
        });

        // Add keyboard handler
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleCalendar(calendar.id);
            } else if (e.key === 'Escape') {
                this.close();
            }
        });

        return item;
    }

    /**
     * Toggle calendar selection
     */
    toggleCalendar(calendarId) {
        if (calendarId === 'all') {
            // Toggle "All Calendars" - select all or clear all
            if (this.selectedCalendars.size === this.calendars.length) {
                this.clearAll();
            } else {
                this.selectAll();
            }
        } else {
            // Toggle individual calendar
            if (this.selectedCalendars.has(calendarId)) {
                this.selectedCalendars.delete(calendarId);
            } else {
                this.selectedCalendars.add(calendarId);
            }
            
            this.updateMenuItem(calendarId);
            this.updateAllCalendarsItem();
            this.notifyFilterChange();
        }
    }

    /**
     * Select all calendars
     */
    selectAll() {
        this.selectedCalendars.clear();
        this.calendars.forEach(calendar => {
            this.selectedCalendars.add(calendar.id);
        });
        
        this.updateAllMenuItems();
        this.updateAllCalendarsItem();
        this.notifyFilterChange();
    }

    /**
     * Clear all calendar selections
     */
    clearAll() {
        this.selectedCalendars.clear();
        this.updateAllMenuItems();
        this.updateAllCalendarsItem();
        this.notifyFilterChange();
    }

    /**
     * Update menu item visual state
     */
    updateMenuItem(calendarId) {
        const item = document.querySelector(`[data-calendar-id="${calendarId}"]`);
        if (!item) return;

        const isSelected = this.selectedCalendars.has(calendarId);
        const checkbox = item.querySelector('.m3-calendar-filter-menu-item__checkbox');
        
        if (isSelected) {
            checkbox.classList.add('m3-calendar-filter-menu-item__checkbox--checked');
        } else {
            checkbox.classList.remove('m3-calendar-filter-menu-item__checkbox--checked');
        }
        
        item.setAttribute('aria-checked', isSelected);
    }

    /**
     * Update all menu items
     */
    updateAllMenuItems() {
        this.calendars.forEach(calendar => {
            this.updateMenuItem(calendar.id);
        });
    }

    /**
     * Update "All Calendars" item state
     */
    updateAllCalendarsItem() {
        const allItem = document.querySelector('[data-calendar-id="all"]');
        if (!allItem) return;

        const isAllSelected = this.selectedCalendars.size === this.calendars.length;
        const checkbox = allItem.querySelector('.m3-calendar-filter-menu-item__checkbox');
        
        if (isAllSelected) {
            checkbox.classList.add('m3-calendar-filter-menu-item__checkbox--checked');
        } else {
            checkbox.classList.remove('m3-calendar-filter-menu-item__checkbox--checked');
        }
        
        allItem.setAttribute('aria-checked', isAllSelected);
    }

    /**
     * Toggle dropdown open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open the dropdown
     */
    open() {
        this.isOpen = true;
        this.dropdown.classList.add('m3-calendar-filter-menu--open');
        this.trigger.classList.add('m3-calendar-filter-trigger--active');
        this.trigger.setAttribute('aria-expanded', 'true');
        this.dropdown.setAttribute('aria-hidden', 'false');
        
        // Focus first menu item
        const firstItem = this.dropdown.querySelector('.m3-calendar-filter-menu-item');
        if (firstItem) {
            firstItem.focus();
        }
    }

    /**
     * Close the dropdown
     */
    close() {
        this.isOpen = false;
        this.dropdown.classList.remove('m3-calendar-filter-menu--open');
        this.trigger.classList.remove('m3-calendar-filter-trigger--active');
        this.trigger.setAttribute('aria-expanded', 'false');
        this.dropdown.setAttribute('aria-hidden', 'true');
        
        // Return focus to trigger
        this.trigger.focus();
    }

    /**
     * Show error message
     */
    showError(message) {
        const content = document.getElementById('calendar-filter-content');
        content.innerHTML = `
            <div class="m3-calendar-filter-menu__error">
                <span class="material-symbols-rounded">error</span>
                ${message}
            </div>
        `;
    }

    /**
     * Set filter change callback
     */
    setFilterChangeCallback(callback) {
        this.onFilterChange = callback;
    }

    /**
     * Notify filter change
     */
    notifyFilterChange() {
        if (this.onFilterChange) {
            const selectedIds = Array.from(this.selectedCalendars);
            this.onFilterChange(selectedIds);
        }
    }

    /**
     * Get currently selected calendar IDs
     */
    getSelectedCalendars() {
        return Array.from(this.selectedCalendars);
    }

    /**
     * Set selected calendars
     */
    setSelectedCalendars(calendarIds) {
        this.selectedCalendars.clear();
        calendarIds.forEach(id => {
            if (id !== 'all') {
                this.selectedCalendars.add(id);
            }
        });
        
        this.updateAllMenuItems();
        this.updateAllCalendarsItem();
    }

    /**
     * Check if all calendars are selected
     */
    isAllSelected() {
        return this.selectedCalendars.size === this.calendars.length;
    }

    /**
     * Check if no calendars are selected
     */
    isNoneSelected() {
        return this.selectedCalendars.size === 0;
    }
}

// Export for use in other modules
window.CalendarFilterDropdown = CalendarFilterDropdown;
