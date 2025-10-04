/**
 * Hue Lighting Section
 * Placeholder for Hue lighting controls
 */
class HueSection {
    constructor() {
        this.isLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createHueSection();
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            if (e.detail.section === 'hue') {
                this.load();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            if (e.detail.section === 'hue') {
                this.show();
            } else {
                this.hide();
            }
        });
    }

    createHueSection() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        const hueSection = document.createElement('div');
        hueSection.id = 'hue-section';
        hueSection.className = 'm3-section';
        hueSection.innerHTML = `
      <div class="m3-section-header">
        <div>
          <h1 class="m3-section-title">Hue Lighting</h1>
          <p class="m3-section-subtitle">Control your Philips Hue lights</p>
        </div>
      </div>
      <div class="m3-card">
        <p>Hue lighting controls will be implemented here.</p>
        <p>This section will integrate with the existing Hue API.</p>
      </div>
    `;

        contentArea.appendChild(hueSection);
    }

    load() {
        if (!this.isLoaded) {
            this.isLoaded = true;
        }
        this.show();
    }

    show() {
        const section = document.getElementById('hue-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    hide() {
        const section = document.getElementById('hue-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.hueSection = new HueSection();
});
