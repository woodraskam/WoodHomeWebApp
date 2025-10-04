/**
 * Calendar Section
 * Placeholder for Google Calendar integration
 */
class CalendarSection {
    constructor() {
        this.isLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createCalendarSection();
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
    }

    createCalendarSection() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        const calendarSection = document.createElement('div');
        calendarSection.id = 'calendar-section';
        calendarSection.className = 'm3-section';
        calendarSection.innerHTML = `
      <div class="m3-section-header">
        <div>
          <h1 class="m3-section-title">Calendar</h1>
          <p class="m3-section-subtitle">View your Google Calendar events</p>
        </div>
      </div>
      <div class="m3-card">
        <p>Calendar integration will be implemented here.</p>
        <p>This section will integrate with the existing Google Calendar API.</p>
      </div>
    `;

        contentArea.appendChild(calendarSection);
    }

    load() {
        if (!this.isLoaded) {
            this.isLoaded = true;
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
