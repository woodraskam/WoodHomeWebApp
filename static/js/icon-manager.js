/**
 * Material Symbols Icon Manager
 * Manages icon mapping and provides consistent icon usage across the application
 */

class IconManager {
  constructor() {
    this.iconMap = {
      // Navigation Icons
      'home': 'home',
      'menu': 'menu',
      'close': 'close',
      'back': 'arrow_back',
      'forward': 'arrow_forward',
      'up': 'keyboard_arrow_up',
      'down': 'keyboard_arrow_down',
      'left': 'keyboard_arrow_left',
      'right': 'keyboard_arrow_right',
      
      // Status Icons
      'wifi': 'wifi',
      'wifi-off': 'wifi_off',
      'connected': 'check_circle',
      'disconnected': 'error',
      'loading': 'refresh',
      'success': 'check_circle',
      'error': 'error',
      'warning': 'warning',
      'info': 'info',
      
      // Device Icons
      'devices': 'devices',
      'phone': 'phone',
      'tablet': 'tablet',
      'computer': 'computer',
      'speaker': 'speaker',
      'headphones': 'headphones',
      'camera': 'camera',
      'security': 'security',
      
      // Control Icons
      'play': 'play_arrow',
      'pause': 'pause',
      'stop': 'stop',
      'next': 'skip_next',
      'previous': 'skip_previous',
      'volume': 'volume_up',
      'volume-off': 'volume_off',
      'mute': 'volume_off',
      'settings': 'settings',
      'refresh': 'refresh',
      
      // Weather Icons
      'sunny': 'wb_sunny',
      'cloudy': 'cloud',
      'rainy': 'rainy',
      'snowy': 'ac_unit',
      'stormy': 'thunderstorm',
      'foggy': 'foggy',
      'windy': 'air',
      
      // Game Icons
      'game': 'sports_esports',
      'card': 'style',
      'dice': 'casino',
      'trophy': 'emoji_events',
      'star': 'star',
      'heart': 'favorite',
      
      // Action Icons
      'add': 'add',
      'remove': 'remove',
      'edit': 'edit',
      'delete': 'delete',
      'save': 'save',
      'cancel': 'cancel',
      'confirm': 'check',
      'search': 'search',
      'filter': 'filter_list',
      'sort': 'sort',
      
      // UI Icons
      'expand': 'expand_more',
      'collapse': 'expand_less',
      'more': 'more_vert',
      'less': 'less',
      'fullscreen': 'fullscreen',
      'exit-fullscreen': 'fullscreen_exit',
      'minimize': 'minimize',
      'maximize': 'open_in_full',
      
      // Communication Icons
      'email': 'email',
      'message': 'message',
      'notification': 'notifications',
      'notification-off': 'notifications_off',
      'call': 'call',
      'video': 'videocam',
      'video-off': 'videocam_off',
      
      // File Icons
      'file': 'description',
      'folder': 'folder',
      'folder-open': 'folder_open',
      'download': 'download',
      'upload': 'upload',
      'share': 'share',
      'copy': 'content_copy',
      'paste': 'content_paste',
      
      // Time Icons
      'time': 'schedule',
      'calendar': 'calendar_today',
      'clock': 'access_time',
      'timer': 'timer',
      'alarm': 'alarm',
      
      // Location Icons
      'location': 'location_on',
      'location-off': 'location_off',
      'map': 'map',
      'directions': 'directions',
      'navigation': 'navigation',
      
      // Social Icons
      'user': 'person',
      'users': 'group',
      'profile': 'account_circle',
      'login': 'login',
      'logout': 'logout',
      'register': 'person_add',
      
      // System Icons
      'power': 'power_settings_new',
      'restart': 'restart_alt',
      'shutdown': 'power_off',
      'update': 'system_update',
      'maintenance': 'build',
      'help': 'help',
      'question': 'help_outline',
      
      // Emoji to Material Symbol mappings
      '🏠': 'home',
      '🎵': 'music_note',
      '🍭': 'cake',
      '🃏': 'style',
      '⚡': 'flash_on',
      '🎮': 'sports_esports',
      '🃏': 'style',
      '🏆': 'emoji_events',
      '⭐': 'star',
      '❤️': 'favorite',
      '📱': 'phone_android',
      '💻': 'laptop',
      '🖥️': 'desktop_windows',
      '🔊': 'volume_up',
      '🔇': 'volume_off',
      '🎧': 'headphones',
      '📷': 'camera_alt',
      '🔒': 'lock',
      '🔓': 'lock_open',
      '⚙️': 'settings',
      '🔧': 'build',
      '❓': 'help_outline',
      '✅': 'check_circle',
      '❌': 'cancel',
      '⚠️': 'warning',
      'ℹ️': 'info',
      '🔄': 'refresh',
      '➕': 'add',
      '➖': 'remove',
      '✏️': 'edit',
      '🗑️': 'delete',
      '💾': 'save',
      '🔍': 'search',
      '📧': 'email',
      '💬': 'message',
      '🔔': 'notifications',
      '📞': 'call',
      '📹': 'videocam',
      '📁': 'folder',
      '📄': 'description',
      '⬇️': 'download',
      '⬆️': 'upload',
      '🔗': 'link',
      '📋': 'content_copy',
      '⏰': 'schedule',
      '📅': 'calendar_today',
      '⏰': 'access_time',
      '📍': 'location_on',
      '🗺️': 'map',
      '🧭': 'navigation',
      '👤': 'person',
      '👥': 'group',
      '🔑': 'vpn_key',
      '🚪': 'exit_to_app',
      '👤': 'person_add',
      '⚡': 'flash_on',
      '🔄': 'restart_alt',
      '🛠️': 'build',
      '❓': 'help',
      '❓': 'help_outline'
    };
    
    this.init();
  }
  
  init() {
    // Load Material Symbols font if not already loaded
    this.loadMaterialSymbols();
    
    // Replace emoji icons on page load
    document.addEventListener('DOMContentLoaded', () => {
      this.replaceEmojiIcons();
    });
  }
  
  loadMaterialSymbols() {
    // Check if Material Symbols is already loaded
    if (document.querySelector('link[href*="Material+Symbols"]')) {
      return;
    }
    
    // Load Material Symbols font with optimization
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  
  /**
   * Get Material Symbol name for a given key
   * @param {string} key - Icon key or emoji
   * @returns {string} Material Symbol name
   */
  getIcon(key) {
    return this.iconMap[key] || key;
  }
  
  /**
   * Create a Material Symbol element
   * @param {string} iconName - Icon name
   * @param {Object} options - Icon options
   * @returns {HTMLElement} Material Symbol element
   */
  createIcon(iconName, options = {}) {
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.textContent = this.getIcon(iconName);
    
    // Apply options
    if (options.size) {
      icon.classList.add(`md-${options.size}`);
    }
    
    if (options.weight) {
      icon.classList.add(`wght-${options.weight}`);
    }
    
    if (options.fill !== undefined) {
      icon.classList.add(`fill-${options.fill ? 1 : 0}`);
    }
    
    if (options.grade !== undefined) {
      icon.classList.add(`grade-${options.grade}`);
    }
    
    if (options.color) {
      icon.classList.add(options.color);
    }
    
    if (options.className) {
      icon.classList.add(options.className);
    }
    
    return icon;
  }
  
  /**
   * Replace emoji icons with Material Symbols
   */
  replaceEmojiIcons() {
    const emojiElements = document.querySelectorAll('[data-emoji]');
    
    emojiElements.forEach(element => {
      const emoji = element.dataset.emoji;
      const iconName = this.getIcon(emoji);
      
      if (iconName !== emoji) {
        const icon = this.createIcon(iconName, {
          size: element.dataset.size || '24',
          color: element.dataset.color || 'surface',
          className: element.className
        });
        
        element.parentNode.replaceChild(icon, element);
      }
    });
  }
  
  /**
   * Update icon in an element
   * @param {HTMLElement} element - Target element
   * @param {string} iconName - New icon name
   * @param {Object} options - Icon options
   */
  updateIcon(element, iconName, options = {}) {
    const icon = this.createIcon(iconName, options);
    element.innerHTML = '';
    element.appendChild(icon);
  }
  
  /**
   * Add icon to button
   * @param {HTMLElement} button - Button element
   * @param {string} iconName - Icon name
   * @param {string} position - 'left' or 'right'
   */
  addIconToButton(button, iconName, position = 'left') {
    const icon = this.createIcon(iconName, {
      size: '18',
      color: 'surface'
    });
    
    if (position === 'left') {
      button.insertBefore(icon, button.firstChild);
    } else {
      button.appendChild(icon);
    }
  }
  
  /**
   * Create icon button
   * @param {string} iconName - Icon name
   * @param {Object} options - Button options
   * @returns {HTMLElement} Icon button element
   */
  createIconButton(iconName, options = {}) {
    const button = document.createElement('button');
    button.className = `icon-button ${options.className || ''}`;
    button.type = options.type || 'button';
    
    const icon = this.createIcon(iconName, {
      size: options.size || '24',
      color: options.color || 'surface'
    });
    
    button.appendChild(icon);
    
    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }
    
    if (options.title) {
      button.title = options.title;
    }
    
    return button;
  }
}

// Initialize Icon Manager
const iconManager = new IconManager();

// Export for use in other scripts
window.IconManager = IconManager;
window.iconManager = iconManager;
