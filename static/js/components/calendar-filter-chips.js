/**
 * Material Design 3 Calendar Filter Chips Component
 * Provides interactive chip-based calendar filtering
 */

class CalendarFilterChips {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            showActions: true,
            showSelectAll: true,
            showClearAll: true,
            persistState: true,
            storageKey: 'calendar-filter-chips',
            onFilterChange: null,
            onError: null,
            enableSearch: true,
            enableGrouping: true,
            showEventCounts: true,
            ...options
        };
        
        this.calendars = [];
        this.selectedCalendars = new Set();
        this.isLoading = false;
        this.error = null;
        this.searchQuery = '';
        this.filteredCalendars = [];
        
        this.init();
    }
    
    /**
     * Initialize the component
     */
    init() {
        if (!this.container) {
            console.error(`CalendarFilterChips: Container with ID '${this.containerId}' not found`);
            return;
        }
        
        this.render();
        this.loadCalendars();
        this.loadState();
        this.bindEvents();
    }
    
    /**
     * Render the component HTML
     */
    render() {
        this.container.innerHTML = `
            <div class="m3-calendar-filter-chips">
                <div class="m3-calendar-filter-chips__header">
                    <h3 class="m3-calendar-filter-chips__title">Calendar Filter</h3>
                    ${this.options.showActions ? this.renderActions() : ''}
                </div>
                <div class="m3-calendar-filter-chips__chips-container" id="calendar-chips-container">
                    ${this.renderLoadingState()}
                </div>
            </div>
        `;
    }
    
    /**
     * Render action buttons
     */
    renderActions() {
        return `
            <div class="m3-calendar-filter-chips__actions">
                ${this.options.enableSearch ? `
                    <div class="m3-calendar-filter-chips__search">
                        <input type="text" 
                               id="calendar-search-input" 
                               placeholder="Search calendars..." 
                               class="m3-calendar-filter-chips__search-input"
                               value="${this.searchQuery}">
                        <span class="material-symbols-outlined m3-calendar-filter-chips__search-icon">search</span>
                    </div>
                ` : ''}
                ${this.options.showSelectAll ? `
                    <button class="m3-calendar-filter-chips__action-button" id="select-all-btn">
                        Select All
                    </button>
                ` : ''}
                ${this.options.showClearAll ? `
                    <button class="m3-calendar-filter-chips__action-button" id="clear-all-btn">
                        Clear All
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render loading state
     */
    renderLoadingState() {
        return `
            <div class="m3-calendar-filter-chips__loading">
                <div class="m3-circular-progress">
                    <div class="m3-circular-progress__circle"></div>
                </div>
                <p class="m3-loading__text">Loading calendars...</p>
            </div>
        `;
    }
    
    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="m3-calendar-filter-chips__empty">
                <span class="material-symbols-outlined m3-calendar-filter-chips__empty-icon">calendar_month</span>
                <h4 class="m3-calendar-filter-chips__empty-title">No Calendars Available</h4>
                <p class="m3-calendar-filter-chips__empty-description">
                    No calendars were found. Please check your Google Calendar connection.
                </p>
            </div>
        `;
    }
    
    /**
     * Render error state
     */
    renderErrorState(error) {
        return `
            <div class="m3-calendar-filter-chips__error">
                <span class="material-symbols-outlined m3-calendar-filter-chips__error-icon">error</span>
                <h4 class="m3-calendar-filter-chips__error-title">Failed to Load Calendars</h4>
                <p class="m3-calendar-filter-chips__error-description">
                    ${error || 'An error occurred while loading your calendars.'}
                </p>
                <button class="m3-calendar-filter-chips__error-action" id="retry-btn">
                    Try Again
                </button>
            </div>
        `;
    }
    
    /**
     * Render calendar chips
     */
    renderChips() {
        if (this.calendars.length === 0) {
            return this.renderEmptyState();
        }
        
        const calendarsToRender = this.filteredCalendars.length > 0 ? this.filteredCalendars : this.calendars;
        return calendarsToRender.map(calendar => this.renderChip(calendar)).join('');
    }
    
    /**
     * Render individual calendar chip
     */
    renderChip(calendar) {
        const isSelected = this.selectedCalendars.has(calendar.id);
        const chipClass = isSelected ? 'm3-chip--filter m3-chip--selected' : 'm3-chip--filter';
        const calendarColor = calendar.color || '#4285f4';
        
        return `
            <div class="m3-calendar-chip ${isSelected ? 'm3-calendar-chip--selected' : ''}" 
                 data-calendar-id="${calendar.id}"
                 style="--calendar-color: ${calendarColor}">
                <button class="m3-chip ${chipClass}" 
                        data-calendar-id="${calendar.id}"
                        aria-pressed="${isSelected}"
                        aria-label="Toggle ${calendar.name} calendar">
                    <div class="m3-chip__content">
                        <div class="m3-chip__avatar m3-chip__color-indicator" 
                             style="background-color: ${calendarColor}"></div>
                        <span class="m3-chip__label">${this.escapeHtml(calendar.name)}</span>
                    </div>
                </button>
            </div>
        `;
    }
    
    /**
     * Load calendars from API
     */
    async loadCalendars() {
        this.isLoading = true;
        this.error = null;
        this.updateContainer();
        
        try {
            const response = await fetch('/api/calendar/calendars');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            this.calendars = await response.json();
            this.updateContainer();
            
            // If no calendars are selected and we have calendars, select all by default
            if (this.selectedCalendars.size === 0 && this.calendars.length > 0) {
                this.selectAll();
            }
            
        } catch (error) {
            console.error('Failed to load calendars:', error);
            this.error = error.message;
            this.updateContainer();
            
            if (this.options.onError) {
                this.options.onError(error);
            }
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Update container content
     */
    updateContainer() {
        const container = document.getElementById('calendar-chips-container');
        if (!container) return;
        
        if (this.isLoading) {
            container.innerHTML = this.renderLoadingState();
        } else if (this.error) {
            container.innerHTML = this.renderErrorState(this.error);
        } else {
            container.innerHTML = this.renderChips();
        }
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Delegate events to handle dynamic content
        this.container.addEventListener('click', (e) => {
            const chip = e.target.closest('.m3-chip[data-calendar-id]');
            if (chip) {
                this.toggleCalendar(chip.dataset.calendarId);
                return;
            }
            
            const selectAllBtn = e.target.closest('#select-all-btn');
            if (selectAllBtn) {
                this.selectAll();
                return;
            }
            
            const clearAllBtn = e.target.closest('#clear-all-btn');
            if (clearAllBtn) {
                this.clearAll();
                return;
            }
            
            const retryBtn = e.target.closest('#retry-btn');
            if (retryBtn) {
                this.loadCalendars();
                return;
            }
        });

        // Search input
        const searchInput = document.getElementById('calendar-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.filterCalendars();
                this.updateContainer();
            });
        }
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const chip = e.target.closest('.m3-chip[data-calendar-id]');
                if (chip) {
                    e.preventDefault();
                    this.toggleCalendar(chip.dataset.calendarId);
                }
            }
        });
    }
    
    /**
     * Toggle calendar selection
     */
    toggleCalendar(calendarId) {
        const chip = this.container.querySelector(`[data-calendar-id="${calendarId}"]`);
        if (!chip) return;
        
        // Add selection animation
        chip.classList.add('m3-chip--selecting');
        setTimeout(() => {
            chip.classList.remove('m3-chip--selecting');
        }, 200);
        
        if (this.selectedCalendars.has(calendarId)) {
            this.selectedCalendars.delete(calendarId);
        } else {
            this.selectedCalendars.add(calendarId);
        }
        
        this.updateChipState(calendarId);
        this.saveState();
        this.notifyFilterChange();
    }
    
    /**
     * Update chip visual state
     */
    updateChipState(calendarId) {
        const chip = this.container.querySelector(`[data-calendar-id="${calendarId}"]`);
        if (!chip) return;
        
        const isSelected = this.selectedCalendars.has(calendarId);
        const button = chip.querySelector('.m3-chip');
        
        if (isSelected) {
            button.classList.add('m3-chip--selected');
            button.setAttribute('aria-pressed', 'true');
            chip.classList.add('m3-calendar-chip--selected');
        } else {
            button.classList.remove('m3-chip--selected');
            button.setAttribute('aria-pressed', 'false');
            chip.classList.remove('m3-calendar-chip--selected');
        }
    }
    
    /**
     * Select all calendars
     */
    selectAll() {
        this.calendars.forEach(calendar => {
            this.selectedCalendars.add(calendar.id);
        });
        this.updateAllChips();
        this.saveState();
        this.notifyFilterChange();
    }
    
    /**
     * Clear all calendar selections
     */
    clearAll() {
        this.selectedCalendars.clear();
        this.updateAllChips();
        this.saveState();
        this.notifyFilterChange();
    }
    
    /**
     * Update all chip states
     */
    updateAllChips() {
        this.calendars.forEach(calendar => {
            this.updateChipState(calendar.id);
        });
    }
    
    /**
     * Get selected calendar IDs
     */
    getSelectedCalendars() {
        return Array.from(this.selectedCalendars);
    }
    
    /**
     * Set selected calendar IDs
     */
    setSelectedCalendars(calendarIds) {
        this.selectedCalendars.clear();
        calendarIds.forEach(id => this.selectedCalendars.add(id));
        this.updateAllChips();
        this.saveState();
        this.notifyFilterChange();
    }
    
    /**
     * Check if calendar is selected
     */
    isCalendarSelected(calendarId) {
        return this.selectedCalendars.has(calendarId);
    }
    
    /**
     * Get filter state for API calls
     */
    getFilterState() {
        return {
            calendars: this.getSelectedCalendars(),
            hasSelection: this.selectedCalendars.size > 0,
            isAllSelected: this.selectedCalendars.size === this.calendars.length,
            isNoneSelected: this.selectedCalendars.size === 0
        };
    }
    
    /**
     * Save state to localStorage
     */
    saveState() {
        if (!this.options.persistState) return;
        
        try {
            const state = {
                selectedCalendars: this.getSelectedCalendars(),
                timestamp: Date.now()
            };
            localStorage.setItem(this.options.storageKey, JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save filter state:', error);
        }
    }
    
    /**
     * Load state from localStorage
     */
    loadState() {
        if (!this.options.persistState) return;
        
        try {
            const saved = localStorage.getItem(this.options.storageKey);
            if (saved) {
                const state = JSON.parse(saved);
                // Only restore if saved within last 24 hours
                if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
                    this.setSelectedCalendars(state.selectedCalendars);
                }
            }
        } catch (error) {
            console.warn('Failed to load filter state:', error);
        }
    }
    
    /**
     * Notify filter change
     */
    notifyFilterChange() {
        if (this.options.onFilterChange) {
            this.options.onFilterChange(this.getFilterState());
        }
        
        // Dispatch custom event
        const event = new CustomEvent('calendarFilterChange', {
            detail: this.getFilterState()
        });
        this.container.dispatchEvent(event);
    }
    
    /**
     * Refresh calendars
     */
    async refresh() {
        await this.loadCalendars();
    }
    
    /**
     * Destroy component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
    
    /**
     * Filter calendars based on search query
     */
    filterCalendars() {
        if (!this.searchQuery.trim()) {
            this.filteredCalendars = [];
            return;
        }

        this.filteredCalendars = this.calendars.filter(calendar => 
            calendar.name.toLowerCase().includes(this.searchQuery)
        );
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarFilterChips;
}

// Make available globally
window.CalendarFilterChips = CalendarFilterChips;
