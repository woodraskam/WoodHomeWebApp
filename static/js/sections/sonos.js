/**
 * Sonos Audio Section
 * Placeholder for Sonos audio controls
 */
class SonosSection {
    constructor() {
        this.isLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createSonosSection();
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            if (e.detail.section === 'sonos') {
                this.load();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            if (e.detail.section === 'sonos') {
                this.show();
            } else {
                this.hide();
            }
        });
    }

    createSonosSection() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        const sonosSection = document.createElement('div');
        sonosSection.id = 'sonos-section';
        sonosSection.className = 'm3-section';
        sonosSection.innerHTML = `
      <div class="m3-section-header">
        <div>
          <h1 class="m3-section-title">Sonos Audio</h1>
          <p class="m3-section-subtitle">Control your Sonos speakers</p>
        </div>
      </div>
      <div class="m3-card">
        <p>Sonos audio controls will be implemented here.</p>
        <p>This section will integrate with the existing Sonos API.</p>
      </div>
    `;

        contentArea.appendChild(sonosSection);
    }

    load() {
        if (!this.isLoaded) {
            this.isLoaded = true;
        }
        this.show();
    }

    show() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    hide() {
        const section = document.getElementById('sonos-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.sonosSection = new SonosSection();
});
