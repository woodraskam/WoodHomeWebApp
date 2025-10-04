/**
 * SPA Components
 * Reusable Material Design 3 components for the SPA
 */
class SPAComponents {
    constructor() {
        this.components = new Map();
        this.init();
    }

    init() {
        this.setupComponents();
    }

    /**
     * Setup all components
     */
    setupComponents() {
        this.setupButtons();
        this.setupCards();
        this.setupLoadingStates();
        this.setupErrorStates();
    }

    /**
     * Setup button components
     */
    setupButtons() {
        // Add ripple effect to buttons
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('m3-button')) {
                this.addRippleEffect(e.target, e);
            } else if (e.target && e.target.closest) {
                const button = e.target.closest('.m3-button');
                if (button) {
                    this.addRippleEffect(button, e);
                }
            }
        });
    }

    /**
     * Add ripple effect to button
     */
    addRippleEffect(button, event) {
        if (!button || !event) return;

        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Setup card components
     */
    setupCards() {
        // Add hover effects to cards
        document.addEventListener('mouseenter', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('m3-card')) {
                this.addCardHoverEffect(e.target);
            } else if (e.target && e.target.closest) {
                const card = e.target.closest('.m3-card');
                if (card) {
                    this.addCardHoverEffect(card);
                }
            }
        }, true);
    }

    /**
     * Add hover effect to card
     */
    addCardHoverEffect(card) {
        if (!card || !card.classList) return;

        if (!card.classList.contains('m3-card--hover')) {
            card.classList.add('m3-card--hover');
        }
    }

    /**
     * Setup loading states
     */
    setupLoadingStates() {
        // Create loading component
        this.createLoadingComponent();
    }

    /**
     * Create loading component
     */
    createLoadingComponent() {
        const loadingHTML = `
      <div class="m3-loading" id="global-loading">
        <div class="m3-circular-progress">
          <div class="m3-circular-progress__circle"></div>
        </div>
        <p class="m3-loading__text">Loading...</p>
      </div>
    `;

        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    /**
     * Show loading state
     */
    showLoading(message = 'Loading...') {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.querySelector('.m3-loading__text').textContent = message;
            loading.style.display = 'flex';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Setup error states
     */
    setupErrorStates() {
        // Create error notification system
        this.createErrorNotificationSystem();
    }

    /**
     * Create error notification system
     */
    createErrorNotificationSystem() {
        const errorContainer = document.createElement('div');
        errorContainer.id = 'error-notifications';
        errorContainer.className = 'm3-error-notifications';
        document.body.appendChild(errorContainer);
    }

    /**
     * Show error notification
     */
    showError(message, type = 'error') {
        const errorContainer = document.getElementById('error-notifications');
        if (!errorContainer) return;

        const notification = document.createElement('div');
        notification.className = `m3-error-notification m3-error-notification--${type}`;
        notification.innerHTML = `
      <div class="m3-error-notification__content">
        <svg class="m3-icon" viewBox="0 0 24 24">
          <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
        </svg>
        <span>${message}</span>
        <button class="m3-error-notification__close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

        errorContainer.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Show success notification
     */
    showSuccess(message) {
        this.showError(message, 'success');
    }

    /**
     * Show warning notification
     */
    showWarning(message) {
        this.showError(message, 'warning');
    }

    /**
     * Create snackbar notification
     */
    showSnackbar(message, action = null) {
        const snackbar = document.createElement('div');
        snackbar.className = 'm3-snackbar';
        snackbar.innerHTML = `
      <div class="m3-snackbar__content">
        <span>${message}</span>
        ${action ? `<button class="m3-snackbar__action">${action}</button>` : ''}
      </div>
    `;

        document.body.appendChild(snackbar);

        // Show snackbar
        setTimeout(() => {
            snackbar.classList.add('m3-snackbar--show');
        }, 100);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            snackbar.classList.remove('m3-snackbar--show');
            setTimeout(() => {
                if (snackbar.parentElement) {
                    snackbar.remove();
                }
            }, 300);
        }, 4000);
    }

    /**
     * Create dialog
     */
    createDialog(title, content, actions = []) {
        const dialog = document.createElement('div');
        dialog.className = 'm3-dialog';
        dialog.innerHTML = `
      <div class="m3-dialog__backdrop"></div>
      <div class="m3-dialog__container">
        <div class="m3-dialog__header">
          <h2 class="m3-dialog__title">${title}</h2>
          <button class="m3-dialog__close" onclick="this.closest('.m3-dialog').remove()">×</button>
        </div>
        <div class="m3-dialog__content">
          ${content}
        </div>
        <div class="m3-dialog__actions">
          ${actions.map(action => `
            <button class="m3-button m3-button--${action.type || 'text'}" onclick="${action.onclick || 'this.closest(\'.m3-dialog\').remove()'}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

        document.body.appendChild(dialog);

        // Show dialog
        setTimeout(() => {
            dialog.classList.add('m3-dialog--show');
        }, 100);

        return dialog;
    }

    /**
     * Create progress indicator
     */
    createProgressIndicator(type = 'circular') {
        const progress = document.createElement('div');
        progress.className = `m3-progress m3-progress--${type}`;

        if (type === 'circular') {
            progress.innerHTML = `
        <div class="m3-circular-progress">
          <div class="m3-circular-progress__circle"></div>
        </div>
      `;
        } else {
            progress.innerHTML = `
        <div class="m3-linear-progress">
          <div class="m3-linear-progress__bar"></div>
        </div>
      `;
        }

        return progress;
    }

    /**
     * Create skeleton loader
     */
    createSkeletonLoader(lines = 3) {
        const skeleton = document.createElement('div');
        skeleton.className = 'm3-skeleton';

        for (let i = 0; i < lines; i++) {
            const line = document.createElement('div');
            line.className = 'm3-skeleton__line';
            line.style.width = `${Math.random() * 40 + 60}%`;
            skeleton.appendChild(line);
        }

        return skeleton;
    }
}

// Add CSS for components
const componentStyles = `
  <style>
    /* Ripple Effect */
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    /* Error Notifications */
    .m3-error-notifications {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .m3-error-notification {
      background: var(--m3-surface-container);
      border-radius: var(--m3-shape-corner-large);
      padding: var(--m3-spacing-md);
      box-shadow: var(--m3-elevation-3);
      display: flex;
      align-items: center;
      gap: var(--m3-spacing-sm);
      max-width: 400px;
      animation: slideIn 0.3s ease;
    }

    .m3-error-notification--success {
      border-left: 4px solid var(--m3-primary);
    }

    .m3-error-notification--warning {
      border-left: 4px solid var(--m3-secondary);
    }

    .m3-error-notification--error {
      border-left: 4px solid var(--m3-error);
    }

    .m3-error-notification__close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: var(--m3-on-surface-variant);
    }

    /* Snackbar */
    .m3-snackbar {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: var(--m3-surface-container);
      border-radius: var(--m3-shape-corner-large);
      padding: var(--m3-spacing-md) var(--m3-spacing-lg);
      box-shadow: var(--m3-elevation-3);
      z-index: 3000;
      transition: transform 0.3s ease;
    }

    .m3-snackbar--show {
      transform: translateX(-50%) translateY(0);
    }

    .m3-snackbar__content {
      display: flex;
      align-items: center;
      gap: var(--m3-spacing-md);
    }

    .m3-snackbar__action {
      background: var(--m3-primary);
      color: var(--m3-on-primary);
      border: none;
      border-radius: var(--m3-shape-corner-medium);
      padding: var(--m3-spacing-xs) var(--m3-spacing-sm);
      cursor: pointer;
    }

    /* Dialog */
    .m3-dialog {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 4000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .m3-dialog--show {
      opacity: 1;
    }

    .m3-dialog__backdrop {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
    }

    .m3-dialog__container {
      background: var(--m3-surface);
      border-radius: var(--m3-shape-corner-large);
      padding: var(--m3-spacing-xl);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      position: relative;
    }

    .m3-dialog__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--m3-spacing-lg);
    }

    .m3-dialog__title {
      font-size: var(--m3-font-size-title-large);
      font-weight: 500;
      margin: 0;
    }

    .m3-dialog__close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--m3-on-surface-variant);
    }

    .m3-dialog__actions {
      display: flex;
      gap: var(--m3-spacing-md);
      justify-content: flex-end;
      margin-top: var(--m3-spacing-xl);
    }

    /* Skeleton Loader */
    .m3-skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--m3-spacing-sm);
    }

    .m3-skeleton__line {
      height: 16px;
      background: var(--m3-surface-variant);
      border-radius: var(--m3-shape-corner-small);
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  </style>
`;

// Add styles to document
document.head.insertAdjacentHTML('beforeend', componentStyles);

// Initialize components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.spaComponents = new SPAComponents();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SPAComponents;
}
