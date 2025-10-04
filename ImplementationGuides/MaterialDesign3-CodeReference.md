# Material Design 3 - Navigation Code Reference

## Overview
Comprehensive code reference for implementing Material Design 3 navigation components in the WoodHome SPA Dashboard. Based on current best practices and official M3 guidelines.

## Navigation Components

### 1. Navigation Rail (Desktop/Tablet)

#### HTML Structure
```html
<nav class="m3-navigation-rail" role="navigation" aria-label="Main navigation">
  <div class="m3-navigation-rail__container">
    <div class="m3-navigation-rail__header">
      <button class="m3-navigation-rail__menu-button" aria-label="Open navigation drawer">
        <svg class="m3-icon" viewBox="0 0 24 24">
          <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
        </svg>
      </button>
    </div>
    
    <div class="m3-navigation-rail__destinations">
      <a href="#home" class="m3-navigation-rail__destination m3-navigation-rail__destination--active" 
         aria-current="page" aria-label="Home">
        <div class="m3-navigation-rail__icon-container">
          <svg class="m3-icon m3-icon--filled" viewBox="0 0 24 24">
            <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
          </svg>
        </div>
        <span class="m3-navigation-rail__label">Home</span>
      </a>
      
      <a href="#hue" class="m3-navigation-rail__destination" aria-label="Hue Lighting">
        <div class="m3-navigation-rail__icon-container">
          <svg class="m3-icon" viewBox="0 0 24 24">
            <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z"/>
          </svg>
        </div>
        <span class="m3-navigation-rail__label">Hue</span>
      </a>
      
      <a href="#sonos" class="m3-navigation-rail__destination" aria-label="Sonos Audio">
        <div class="m3-navigation-rail__icon-container">
          <svg class="m3-icon" viewBox="0 0 24 24">
            <path d="M12,3V13.55C11.41,13.21 10.73,13 10,13C7.79,13 6,14.79 6,17S7.79,21 10,21 14,19.21 14,17V7H18V3H12Z"/>
          </svg>
        </div>
        <span class="m3-navigation-rail__label">Sonos</span>
      </a>
      
      <a href="#calendar" class="m3-navigation-rail__destination" aria-label="Calendar">
        <div class="m3-navigation-rail__icon-container">
          <svg class="m3-icon" viewBox="0 0 24 24">
            <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
          </svg>
        </div>
        <span class="m3-navigation-rail__label">Calendar</span>
      </a>
      
      <a href="#games" class="m3-navigation-rail__destination" aria-label="Games">
        <div class="m3-navigation-rail__icon-container">
          <svg class="m3-icon" viewBox="0 0 24 24">
            <path d="M21,6H3A2,2 0 0,0 1,8V16A2,2 0 0,0 3,18H21A2,2 0 0,0 23,16V8A2,2 0 0,0 21,6M21,16H3V8H21V16Z"/>
          </svg>
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

#### HTML Structure
```html
<nav class="m3-navigation-drawer" role="navigation" aria-label="Navigation drawer">
  <div class="m3-navigation-drawer__header">
    <div class="m3-navigation-drawer__title">WoodHome</div>
    <button class="m3-navigation-drawer__close" aria-label="Close navigation">
      <svg class="m3-icon" viewBox="0 0 24 24">
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
      </svg>
    </button>
  </div>
  
  <div class="m3-navigation-drawer__content">
    <div class="m3-navigation-drawer__section">
      <div class="m3-navigation-drawer__section-header">Main</div>
      <a href="#home" class="m3-navigation-drawer__item m3-navigation-drawer__item--active">
        <svg class="m3-icon m3-icon--filled" viewBox="0 0 24 24">
          <path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>
        </svg>
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

## References
- [Material Design 3 Navigation Guidelines](https://m3.material.io/components/navigation-rail)
- [Material Design 3 Theming](https://m3.material.io/foundations/color)
- [Accessibility Guidelines](https://m3.material.io/foundations/accessibility)
