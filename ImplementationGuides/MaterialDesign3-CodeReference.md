# Material Design 3 - Complete Code Reference

## Overview
Comprehensive code reference for implementing Material Design 3 components and Material Symbols in the WoodHome SPA Dashboard. Based on current best practices and official M3 guidelines.

## Material Symbols Integration

### Font Loading (Optimized for WoodHome WebApp)
```html
<!-- Material Symbols - Optimized for WoodHome WebApp -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=home,music_note,lightbulb,event,games,speaker,speaker_group,play_arrow,pause,stop,refresh,close,volume_up,volume_down,volume_off,skip_next,skip_previous,headphones,settings,menu,close,expand_more,expand_less,add,remove,edit,delete,save,cancel,check,wifi,wifi_off,signal_cellular_alt,battery_full,thermostat,light_mode,dark_mode,brightness_6&display=block" rel="stylesheet">
```

### Material Symbols CSS Base
```css
/* Material Symbols Base Styles */
.material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'liga';
    transition: font-variation-settings 0.3s ease;
}

/* Size Variants */
.material-symbols-outlined.small {
    font-size: 20px;
    font-variation-settings: 'opsz' 20;
}

.material-symbols-outlined.medium {
    font-size: 24px;
    font-variation-settings: 'opsz' 24;
}

.material-symbols-outlined.large {
    font-size: 32px;
    font-variation-settings: 'opsz' 32;
}

.material-symbols-outlined.xlarge {
    font-size: 48px;
    font-variation-settings: 'opsz' 48;
}

/* Weight Variants */
.material-symbols-outlined.thin {
    font-variation-settings: 'wght' 100;
}

.material-symbols-outlined.normal {
    font-variation-settings: 'wght' 400;
}

.material-symbols-outlined.bold {
    font-variation-settings: 'wght' 700;
}

/* Fill States */
.material-symbols-outlined.filled {
    font-variation-settings: 'FILL' 1;
}

.material-symbols-outlined.outlined {
    font-variation-settings: 'FILL' 0;
}

/* Grade Variants */
.material-symbols-outlined.low-emphasis {
    font-variation-settings: 'GRAD' -25;
}

.material-symbols-outlined.high-emphasis {
    font-variation-settings: 'GRAD' 200;
}

/* Interactive Animations */
.material-symbols-outlined.interactive {
    cursor: pointer;
    transition: font-variation-settings 0.2s ease, transform 0.2s ease;
}

.material-symbols-outlined.interactive:hover {
    font-variation-settings: 'wght' 600, 'GRAD' 50;
    transform: scale(1.1);
}

.material-symbols-outlined.interactive:active {
    transform: scale(0.95);
}

/* Play/Pause Icon Animations */
.play-button {
    font-variation-settings: 'FILL' 0;
    transition: font-variation-settings 0.3s ease;
}

.play-button:hover {
    font-variation-settings: 'FILL' 1, 'wght' 600;
}

/* Volume Control Icons */
.volume-icon {
    font-variation-settings: 'wght' 400;
    transition: font-variation-settings 0.2s ease;
}

.volume-icon:hover {
    font-variation-settings: 'wght' 600, 'GRAD' 50;
}
```

### Common Icon Usage Examples
```html
<!-- Navigation Icons -->
<span class="material-symbols-outlined filled">home</span>
<span class="material-symbols-outlined">lightbulb</span>
<span class="material-symbols-outlined">music_note</span>
<span class="material-symbols-outlined">event</span>
<span class="material-symbols-outlined">games</span>

<!-- Sonos Control Icons -->
<span class="material-symbols-outlined large interactive">speaker</span>
<span class="material-symbols-outlined large interactive">speaker_group</span>
<span class="material-symbols-outlined interactive play-button">play_arrow</span>
<span class="material-symbols-outlined interactive">pause</span>
<span class="material-symbols-outlined interactive">stop</span>
<span class="material-symbols-outlined volume-icon">volume_up</span>

<!-- System Icons -->
<span class="material-symbols-outlined">wifi</span>
<span class="material-symbols-outlined">battery_full</span>
<span class="material-symbols-outlined">thermostat</span>
<span class="material-symbols-outlined">light_mode</span>
<span class="material-symbols-outlined">dark_mode</span>
```

### Sonos Section Material Symbols
```html
<!-- Sonos Section Header -->
<div class="sonos-title">
    <span class="material-symbols-outlined large interactive">music_note</span>
    <h1 class="m3-section-title">Sonos Control</h1>
</div>

<!-- Quick Actions -->
<button class="m3-button m3-button-filled">
    <span class="material-symbols-outlined interactive play-button">play_arrow</span>
    Play All
</button>

<button class="m3-button m3-button-outlined">
    <span class="material-symbols-outlined interactive">pause</span>
    Pause All
</button>

<button class="m3-button m3-button-outlined">
    <span class="material-symbols-outlined interactive">stop</span>
    Stop All
</button>

<button class="m3-button m3-button-outlined">
    <span class="material-symbols-outlined interactive">refresh</span>
    Refresh
</button>

<!-- Device/Group Cards -->
<div class="m3-card sonos-group-card">
    <div class="m3-card-header">
        <h4>Living Room Group</h4>
        <span class="material-symbols-outlined large interactive">speaker_group</span>
    </div>
    <div class="device-controls">
        <button class="m3-button m3-button-text">
            <span class="material-symbols-outlined interactive play-button">play_arrow</span>
        </button>
        <button class="m3-button m3-button-text">
            <span class="material-symbols-outlined interactive">stop</span>
        </button>
        <div class="volume-control">
            <span class="material-symbols-outlined volume-icon">volume_up</span>
            <input type="range" min="0" max="100" value="50">
            <span class="volume-display">50%</span>
        </div>
    </div>
    <div class="group-members">
        <div class="member-device">
            <span class="material-symbols-outlined small">speaker</span>
            <span class="member-name">Kitchen Speaker</span>
        </div>
    </div>
</div>
```

### Performance Optimization
- **Font Size**: 295 KB → 2.6 KB (99% reduction with icon subsetting)
- **Variable Font Axes**: FILL, Weight, Grade, Optical Size for animations
- **Display Block**: Prevents FOUC (Flash of Unstyled Content)
- **Icon Subsetting**: Only loads needed icons for WoodHome WebApp

## Navigation Components

### 1. Navigation Rail (Desktop/Tablet)

#### HTML Structure (Updated with Material Symbols)
```html
<nav class="m3-navigation-rail" role="navigation" aria-label="Main navigation">
  <div class="m3-navigation-rail__container">
    <div class="m3-navigation-rail__header">
      <button class="m3-navigation-rail__menu-button" aria-label="Open navigation drawer">
        <span class="material-symbols-outlined interactive">menu</span>
      </button>
    </div>
    
    <div class="m3-navigation-rail__destinations">
      <a href="#home" class="m3-navigation-rail__destination m3-navigation-rail__destination--active" 
         aria-current="page" aria-label="Home">
        <div class="m3-navigation-rail__icon-container">
          <span class="material-symbols-outlined filled">home</span>
        </div>
        <span class="m3-navigation-rail__label">Home</span>
      </a>
      
      <a href="#hue" class="m3-navigation-rail__destination" aria-label="Hue Lighting">
        <div class="m3-navigation-rail__icon-container">
          <span class="material-symbols-outlined">lightbulb</span>
        </div>
        <span class="m3-navigation-rail__label">Hue</span>
      </a>
      
      <a href="#sonos" class="m3-navigation-rail__destination" aria-label="Sonos Audio">
        <div class="m3-navigation-rail__icon-container">
          <span class="material-symbols-outlined">music_note</span>
        </div>
        <span class="m3-navigation-rail__label">Sonos</span>
      </a>
      
      <a href="#calendar" class="m3-navigation-rail__destination" aria-label="Calendar">
        <div class="m3-navigation-rail__icon-container">
          <span class="material-symbols-outlined">event</span>
        </div>
        <span class="m3-navigation-rail__label">Calendar</span>
      </a>
      
      <a href="#games" class="m3-navigation-rail__destination" aria-label="Games">
        <div class="m3-navigation-rail__icon-container">
          <span class="material-symbols-outlined">games</span>
        </div>
        <span class="m3-navigation-rail__label">Games</span>
      </a>
    </div>
  </div>
</nav>
```

#### CSS Implementation
```css
/* M3 Navigation Rail */
.m3-navigation-rail {
  --m3-rail-width: 80px;
  --m3-rail-expanded-width: 256px;
  --m3-rail-height: 100vh;
  --m3-rail-bg: var(--m3-surface-container);
  --m3-rail-border: var(--m3-outline-variant);
  
  position: fixed;
  top: 0;
  left: 0;
  width: var(--m3-rail-width);
  height: var(--m3-rail-height);
  background: var(--m3-rail-bg);
  border-right: 1px solid var(--m3-rail-border);
  z-index: 1000;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.m3-navigation-rail__container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 0;
}

.m3-navigation-rail__header {
  padding: 0 12px 8px;
  border-bottom: 1px solid var(--m3-outline-variant);
  margin-bottom: 8px;
}

.m3-navigation-rail__menu-button {
  width: 56px;
  height: 56px;
  border: none;
  background: transparent;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.m3-navigation-rail__menu-button:hover {
  background: var(--m3-state-hover);
}

.m3-navigation-rail__destinations {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

.m3-navigation-rail__destination {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 16px;
  text-decoration: none;
  color: var(--m3-on-surface-variant);
  transition: all 0.2s ease;
  position: relative;
  min-height: 56px;
}

.m3-navigation-rail__destination:hover {
  background: var(--m3-state-hover);
}

.m3-navigation-rail__destination--active {
  color: var(--m3-primary);
  background: var(--m3-secondary-container);
}

.m3-navigation-rail__destination--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: var(--m3-primary);
  border-radius: 0 2px 2px 0;
}

.m3-navigation-rail__icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.m3-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.m3-navigation-rail__label {
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 64px;
}

/* Responsive Behavior */
@media (max-width: 768px) {
  .m3-navigation-rail {
    display: none;
  }
}

/* Expanded State */
.m3-navigation-rail--expanded {
  width: var(--m3-rail-expanded-width);
}

.m3-navigation-rail--expanded .m3-navigation-rail__destination {
  flex-direction: row;
  justify-content: flex-start;
  padding: 12px 16px;
  min-height: 48px;
}

.m3-navigation-rail--expanded .m3-navigation-rail__icon-container {
  margin-right: 12px;
  margin-bottom: 0;
}

.m3-navigation-rail--expanded .m3-navigation-rail__label {
  font-size: 14px;
  max-width: none;
}
```

### 2. Navigation Drawer (Expandable)

#### HTML Structure (Updated with Material Symbols)
```html
<nav class="m3-navigation-drawer" role="navigation" aria-label="Navigation drawer">
  <div class="m3-navigation-drawer__header">
    <div class="m3-navigation-drawer__title">WoodHome</div>
    <button class="m3-navigation-drawer__close" aria-label="Close navigation">
      <span class="material-symbols-outlined interactive">close</span>
    </button>
  </div>
  
  <div class="m3-navigation-drawer__content">
    <div class="m3-navigation-drawer__section">
      <div class="m3-navigation-drawer__section-header">Main</div>
      <a href="#home" class="m3-navigation-drawer__item m3-navigation-drawer__item--active">
        <span class="material-symbols-outlined filled">home</span>
        <span class="m3-navigation-drawer__label">Home</span>
      </a>
      <!-- Additional items... -->
    </div>
  </div>
</nav>
```

### 3. Bottom Navigation (Mobile)

#### HTML Structure
```html
<nav class="m3-bottom-navigation" role="navigation" aria-label="Bottom navigation">
  <a href="#home" class="m3-bottom-navigation__item m3-bottom-navigation__item--active" aria-current="page">
    <svg class="m3-icon m3-icon--filled" viewBox="0 0 24 24">
      <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
    </svg>
    <span class="m3-bottom-navigation__label">Home</span>
  </a>
  <!-- Additional items... -->
</nav>
```

## M3 Theming System

### CSS Custom Properties
```css
:root {
  /* Light Theme */
  --m3-primary: #6750A4;
  --m3-on-primary: #FFFFFF;
  --m3-primary-container: #EADDFF;
  --m3-on-primary-container: #21005D;
  
  --m3-secondary: #625B71;
  --m3-on-secondary: #FFFFFF;
  --m3-secondary-container: #E8DEF8;
  --m3-on-secondary-container: #1D192B;
  
  --m3-surface: #FFFBFE;
  --m3-on-surface: #1C1B1F;
  --m3-surface-container: #F3EDF7;
  --m3-on-surface-variant: #49454F;
  
  --m3-outline: #79747E;
  --m3-outline-variant: #CAC4D0;
  
  /* State Colors */
  --m3-state-hover: rgba(103, 80, 164, 0.08);
  --m3-state-focus: rgba(103, 80, 164, 0.12);
  --m3-state-pressed: rgba(103, 80, 164, 0.16);
  
  /* Typography */
  --m3-font-family: 'Roboto', sans-serif;
  --m3-font-size-label: 12px;
  --m3-font-size-body: 14px;
  --m3-font-size-title: 16px;
  
  /* Spacing */
  --m3-spacing-xs: 4px;
  --m3-spacing-sm: 8px;
  --m3-spacing-md: 12px;
  --m3-spacing-lg: 16px;
  --m3-spacing-xl: 24px;
  
  /* Elevation */
  --m3-elevation-1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3);
  --m3-elevation-2: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --m3-elevation-3: 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}

/* Dark Theme */
[data-theme="dark"] {
  --m3-primary: #D0BCFF;
  --m3-on-primary: #381E72;
  --m3-primary-container: #4F378B;
  --m3-on-primary-container: #EADDFF;
  
  --m3-secondary: #CCC2DC;
  --m3-on-secondary: #332D41;
  --m3-secondary-container: #4A4458;
  --m3-on-secondary-container: #E8DEF8;
  
  --m3-surface: #141218;
  --m3-on-surface: #E6E1E5;
  --m3-surface-container: #1D1B20;
  --m3-on-surface-variant: #CAC4D0;
  
  --m3-outline: #938F99;
  --m3-outline-variant: #49454F;
  
  --m3-state-hover: rgba(208, 188, 255, 0.08);
  --m3-state-focus: rgba(208, 188, 255, 0.12);
  --m3-state-pressed: rgba(208, 188, 255, 0.16);
}
```

## JavaScript Implementation

### Navigation Manager
```javascript
class M3NavigationManager {
  constructor() {
    this.currentSection = 'home';
    this.isDrawerOpen = false;
    this.init();
  }
  
  init() {
    this.setupNavigationRail();
    this.setupNavigationDrawer();
    this.setupBottomNavigation();
    this.setupResponsiveBehavior();
    this.setupAccessibility();
  }
  
  setupNavigationRail() {
    const rail = document.querySelector('.m3-navigation-rail');
    const destinations = rail.querySelectorAll('.m3-navigation-rail__destination');
    
    destinations.forEach(dest => {
      dest.addEventListener('click', (e) => {
        e.preventDefault();
        const section = dest.getAttribute('href').substring(1);
        this.navigateToSection(section);
        this.updateActiveState(destinations, dest);
      });
    });
  }
  
  setupNavigationDrawer() {
    const menuButton = document.querySelector('.m3-navigation-rail__menu-button');
    const drawer = document.querySelector('.m3-navigation-drawer');
    const closeButton = document.querySelector('.m3-navigation-drawer__close');
    
    menuButton?.addEventListener('click', () => this.openDrawer());
    closeButton?.addEventListener('click', () => this.closeDrawer());
    
    // Close drawer when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isDrawerOpen && !drawer.contains(e.target) && !menuButton.contains(e.target)) {
        this.closeDrawer();
      }
    });
  }
  
  setupBottomNavigation() {
    const bottomNav = document.querySelector('.m3-bottom-navigation');
    if (!bottomNav) return;
    
    const items = bottomNav.querySelectorAll('.m3-bottom-navigation__item');
    
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('href').substring(1);
        this.navigateToSection(section);
        this.updateActiveState(items, item);
      });
    });
  }
  
  setupResponsiveBehavior() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleResponsiveChange = (e) => {
      if (e.matches) {
        // Mobile: Show bottom navigation, hide rail
        document.querySelector('.m3-navigation-rail')?.classList.add('m3-navigation-rail--hidden');
        document.querySelector('.m3-bottom-navigation')?.classList.remove('m3-bottom-navigation--hidden');
      } else {
        // Desktop: Show rail, hide bottom navigation
        document.querySelector('.m3-navigation-rail')?.classList.remove('m3-navigation-rail--hidden');
        document.querySelector('.m3-bottom-navigation')?.classList.add('m3-bottom-navigation--hidden');
      }
    };
    
    mediaQuery.addListener(handleResponsiveChange);
    handleResponsiveChange(mediaQuery);
  }
  
  setupAccessibility() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isDrawerOpen) {
        this.closeDrawer();
      }
    });
    
    // Focus management
    this.setupFocusManagement();
  }
  
  navigateToSection(section) {
    this.currentSection = section;
    
    // Update URL without page refresh
    history.pushState({ section }, '', `#${section}`);
    
    // Load section content
    this.loadSectionContent(section);
    
    // Close drawer if open
    if (this.isDrawerOpen) {
      this.closeDrawer();
    }
  }
  
  updateActiveState(items, activeItem) {
    items.forEach(item => {
      item.classList.remove('m3-navigation-rail__destination--active');
      item.classList.remove('m3-bottom-navigation__item--active');
      item.classList.remove('m3-navigation-drawer__item--active');
      item.removeAttribute('aria-current');
    });
    
    activeItem.classList.add('m3-navigation-rail__destination--active');
    activeItem.classList.add('m3-bottom-navigation__item--active');
    activeItem.classList.add('m3-navigation-drawer__item--active');
    activeItem.setAttribute('aria-current', 'page');
  }
  
  openDrawer() {
    const drawer = document.querySelector('.m3-navigation-drawer');
    drawer?.classList.add('m3-navigation-drawer--open');
    this.isDrawerOpen = true;
    
    // Focus management
    const firstFocusable = drawer?.querySelector('button, a, [tabindex]');
    firstFocusable?.focus();
  }
  
  closeDrawer() {
    const drawer = document.querySelector('.m3-navigation-drawer');
    drawer?.classList.remove('m3-navigation-drawer--open');
    this.isDrawerOpen = false;
  }
  
  loadSectionContent(section) {
    // Implement section loading logic
    console.log(`Loading section: ${section}`);
  }
  
  setupFocusManagement() {
    // Implement focus trap for drawer
    // Implement focus restoration
  }
}

// Initialize navigation manager
document.addEventListener('DOMContentLoaded', () => {
  new M3NavigationManager();
});
```

## Accessibility Features

### ARIA Implementation
```html
<!-- Navigation Rail -->
<nav class="m3-navigation-rail" 
     role="navigation" 
     aria-label="Main navigation"
     aria-orientation="vertical">
  
  <div class="m3-navigation-rail__destinations" 
       role="list" 
       aria-label="Navigation destinations">
    
    <a href="#home" 
       class="m3-navigation-rail__destination m3-navigation-rail__destination--active"
       role="listitem"
       aria-current="page"
       aria-label="Home - Current page">
      <!-- Content -->
    </a>
  </div>
</nav>
```

### Keyboard Navigation
```javascript
// Keyboard navigation support
document.addEventListener('keydown', (e) => {
  const activeElement = document.activeElement;
  const navigationItems = document.querySelectorAll('[role="listitem"]');
  
  switch(e.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      e.preventDefault();
      navigateToNext(navigationItems, activeElement);
      break;
    case 'ArrowUp':
    case 'ArrowLeft':
      e.preventDefault();
      navigateToPrevious(navigationItems, activeElement);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      activeElement.click();
      break;
  }
});
```

## Best Practices Checklist

### Design Implementation
- [ ] Use 2-5 primary destinations maximum
- [ ] Implement proper visual hierarchy
- [ ] Ensure touch targets are at least 44px
- [ ] Use meaningful icons and labels
- [ ] Implement proper active states

### Accessibility
- [ ] Provide ARIA labels and roles
- [ ] Support keyboard navigation
- [ ] Ensure sufficient color contrast
- [ ] Test with screen readers
- [ ] Implement focus management

### Responsive Design
- [ ] Navigation rail for desktop/tablet
- [ ] Bottom navigation for mobile
- [ ] Smooth transitions between breakpoints
- [ ] Proper touch interactions

### Performance
- [ ] Optimize animations (60fps)
- [ ] Lazy load section content
- [ ] Minimize DOM manipulation
- [ ] Use CSS transforms for animations

## Material Symbols Integration Summary

### Key Benefits
- **99% Font Size Reduction**: From 295 KB to 2.6 KB with icon subsetting
- **Smooth Animations**: Variable font axes enable fluid transitions
- **Consistent Design**: Unified icon system across all components
- **Performance Optimized**: Only loads needed icons for WoodHome WebApp

### Implementation Checklist
- [x] Add optimized Material Symbols font loading
- [x] Implement base CSS with variable font support
- [x] Update navigation components with Material Symbols
- [x] Add interactive animations and hover effects
- [x] Implement Sonos-specific icon usage
- [x] Add size and weight variants
- [x] Include accessibility considerations

### Icon Usage Patterns
```html
<!-- Navigation Icons -->
<span class="material-symbols-outlined filled">home</span>
<span class="material-symbols-outlined">lightbulb</span>
<span class="material-symbols-outlined">music_note</span>

<!-- Interactive Controls -->
<span class="material-symbols-outlined interactive play-button">play_arrow</span>
<span class="material-symbols-outlined volume-icon">volume_up</span>

<!-- Size Variants -->
<span class="material-symbols-outlined small">speaker</span>
<span class="material-symbols-outlined large interactive">speaker_group</span>
```

### Performance Metrics
- **Font Loading**: Optimized subset reduces payload by 99%
- **Animation Performance**: 60fps smooth transitions with CSS transforms
- **Browser Support**: Full support for modern browsers with ligature fallbacks
- **Accessibility**: ARIA labels and keyboard navigation support

## References
- [Material Design 3 Navigation Guidelines](https://m3.material.io/components/navigation-rail)
- [Material Design 3 Theming](https://m3.material.io/foundations/color)
- [Accessibility Guidelines](https://m3.material.io/foundations/accessibility)
- [Material Symbols Documentation](https://developers.google.com/fonts/docs/material_symbols)
- [Material Symbols Library](https://fonts.google.com/icons)
