# Calendar Layout Optimization - Implementation Guide

## Executive Summary

Optimize the Calendar section layout by removing redundant headers, consolidating controls, and implementing a split-pane design with the calendar/filter on the left and upcoming events on the right.

## Implementation Plan

### Phase 1: Header Consolidation (Day 1)

#### 1.1 Remove Redundant Headers
**Deliverable**: Clean header structure
- Remove "Calendar" main header
- Remove "View your Google Calendar Events" subheader
- Keep only essential navigation elements

#### 1.2 Consolidate Controls
**Deliverable**: Streamlined control bar
- Move refresh button to calendar control bar
- Remove view change controls (month/week/day) from header
- Keep only navigation arrows and current date display

### Phase 2: Split-Pane Layout (Day 1-2)

#### 2.1 Create Split Container
**Deliverable**: Responsive split-pane structure
- Create main container with CSS Grid layout
- Left pane: Calendar card + Filter card
- Right pane: Upcoming events list
- Implement resizable grid splitter

#### 2.2 Left Pane Components
**Deliverable**: Optimized left sidebar
- Calendar card (month view)
- Calendar filter card below calendar
- Maintain existing functionality

#### 2.3 Right Pane Components
**Deliverable**: Dedicated events area
- Upcoming events list
- Event details and interactions
- Scrollable content area

### Phase 3: Responsive Design (Day 2)

#### 3.1 Mobile Layout
**Deliverable**: Mobile-optimized layout
- Stack panes vertically on mobile
- Maintain calendar functionality
- Preserve filter accessibility

#### 3.2 Tablet Layout
**Deliverable**: Tablet-optimized layout
- Adjustable split ratios
- Touch-friendly controls
- Optimized spacing

## Technical Implementation

### CSS Changes Required

```css
/* Main split container */
.calendar-split-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--m3-spacing-md);
    height: calc(100vh - 200px);
    min-height: 600px;
}

/* Left pane */
.calendar-left-pane {
    display: flex;
    flex-direction: column;
    gap: var(--m3-spacing-md);
    min-width: 0;
}

#calendar-section{
    height: calc(100% - 16px);
}

/* Right pane */
.calendar-right-pane {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
}

/* Resizable splitter */
.calendar-splitter {
    width: 4px;
    background: var(--m3-outline-variant);
    cursor: col-resize;
    transition: background-color 0.2s ease;
}

.calendar-splitter:hover {
    background: var(--m3-primary);
}
```

### JavaScript Changes Required

```javascript
// Remove header elements
removeCalendarHeaders() {
    const calendarHeader = document.getElementById('calendar-header');
    const eventsHeader = document.getElementById('events-header');
    if (calendarHeader) calendarHeader.remove();
    if (eventsHeader) eventsHeader.remove();
}

// Move refresh button
moveRefreshButton() {
    const refreshBtn = document.getElementById('calendar-refresh');
    const controlBar = document.getElementById('calendar-controls');
    if (refreshBtn && controlBar) {
        controlBar.appendChild(refreshBtn);
    }
}

// Implement split pane
initializeSplitPane() {
    const container = document.getElementById('calendar-split-container');
    if (container) {
        // Add resize functionality
        this.setupResizeHandler();
    }
}
```

## Success Criteria

### Functional Requirements
- ✅ Clean header with no redundant text
- ✅ Refresh button integrated into calendar controls
- ✅ Split-pane layout with resizable divider
- ✅ Calendar and filter on left, events on right
- ✅ Responsive design for mobile/tablet

### Technical Requirements
- ✅ CSS Grid layout implementation
- ✅ Resizable splitter functionality
- ✅ Maintained existing calendar features
- ✅ Preserved filter functionality
- ✅ Mobile-first responsive design

## Risk Assessment

### Low Risk Items
- Header removal (straightforward DOM manipulation)
- Control consolidation (simple element movement)

### Medium Risk Items
- Split-pane implementation (requires careful CSS Grid setup)
- Responsive behavior (needs testing across devices)

### Dependencies
- Existing calendar functionality must remain intact
- Filter system must continue working
- Mobile responsiveness is critical

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-------------------|
| Phase 1 | 0.5 days | Header cleanup, control consolidation |
| Phase 2 | 1 day | Split-pane layout implementation |
| Phase 3 | 0.5 days | Responsive design and testing |

**Total Estimated Duration**: 2 days

## Implementation Notes

- Start with header cleanup (lowest risk)
- Implement split-pane gradually with fallback
- Test responsive behavior thoroughly
- Maintain all existing functionality during transition
