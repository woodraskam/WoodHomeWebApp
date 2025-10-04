/**
 * Games Section
 * Games collection with iframe integration
 */
class GamesSection {
    constructor() {
        this.isLoaded = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createGamesSection();
    }

    setupEventListeners() {
        document.addEventListener('sectionload', (e) => {
            if (e.detail.section === 'games') {
                this.load();
            }
        });

        document.addEventListener('sectionchange', (e) => {
            if (e.detail.section === 'games') {
                this.show();
            } else {
                this.hide();
            }
        });
    }

    createGamesSection() {
        const contentArea = document.getElementById('main-content');
        if (!contentArea) return;

        const gamesSection = document.createElement('div');
        gamesSection.id = 'games-section';
        gamesSection.className = 'm3-section';
        gamesSection.innerHTML = `
      <div class="m3-section-header">
        <div>
          <h1 class="m3-section-title">Games</h1>
          <p class="m3-section-subtitle">Play your favorite games</p>
        </div>
      </div>
      
      <div class="m3-games-grid">
        <a href="/candyland" class="m3-game-card" target="_blank">
          <svg class="m3-game-card__icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
          </svg>
          <h4 class="m3-game-card__title">Candy Land</h4>
          <p class="m3-game-card__description">Classic board game adventure</p>
        </a>
        
        <a href="/tictactoe" class="m3-game-card" target="_blank">
          <svg class="m3-game-card__icon" viewBox="0 0 24 24">
            <path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H17V17H7V15Z"/>
          </svg>
          <h4 class="m3-game-card__title">Tic Tac Toe</h4>
          <p class="m3-game-card__description">Simple strategy game</p>
        </a>
        
        <a href="/cribbage" class="m3-game-card" target="_blank">
          <svg class="m3-game-card__icon" viewBox="0 0 24 24">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/>
          </svg>
          <h4 class="m3-game-card__title">Cribbage</h4>
          <p class="m3-game-card__description">Classic card game</p>
        </a>
      </div>
    `;

        contentArea.appendChild(gamesSection);
    }

    load() {
        if (!this.isLoaded) {
            this.isLoaded = true;
        }
        this.show();
    }

    show() {
        const section = document.getElementById('games-section');
        if (section) {
            section.classList.add('m3-section--active');
        }
    }

    hide() {
        const section = document.getElementById('games-section');
        if (section) {
            section.classList.remove('m3-section--active');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.gamesSection = new GamesSection();
});
