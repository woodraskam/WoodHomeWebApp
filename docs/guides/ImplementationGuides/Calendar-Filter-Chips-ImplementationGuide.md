# Calendar Filter Dropdown Menu - Complete Implementation Plan

## Executive Summary

This implementation plan outlines the addition of a Material Design 3 dropdown menu for calendar filtering, triggered by the calendar icon in the top menu bar. The feature will allow users to select one or more calendars to view events, with "All Calendars" as the default selection, providing a clean and intuitive way to filter calendar events by source calendar.

## Phase 1: Backend API Enhancement (Days 1-2)

### 1.1 Enhanced Calendar Filtering API
**Deliverable**: Updated API endpoints with calendar filtering support

**Key Features**:
- Filter events by selected calendar IDs
- Maintain existing calendar list endpoint
- Add calendar visibility state management
- Support for multiple calendar selection

**Technical Requirements**:
- Update `/api/calendar/events` endpoint to accept `calendars` query parameter
- Add calendar filtering logic to event fetching
- Implement calendar selection state persistence
- Add error handling for invalid calendar IDs

**API Endpoints to Enhance**:
```
GET /api/calendar/events?calendars=id1,id2,id3 - Filter events by calendar IDs
GET /api/calendar/calendars - List all user calendars (existing)
PUT /api/calendar/calendars/{id}/visibility - Toggle calendar visibility (new)
```

### 1.2 Calendar Filtering Service
**Deliverable**: Enhanced calendar service with filtering capabilities

**Features**:
- Calendar ID-based event filtering
- Calendar visibility state management
- Efficient event filtering with caching
- Support for "select all" and "select none" operations

**Technical Requirements**:
- Add `FilterEventsByCalendars()` method
- Implement calendar selection state tracking
- Add bulk calendar operations support
- Maintain existing caching mechanisms

## Phase 2: Material Design 3 Dropdown Menu Components (Days 3-4)

### 2.1 Dropdown Menu Component Implementation
**Deliverable**: Complete Material Design 3 dropdown menu system

**Components to Create**:
- `CalendarFilterDropdown` - Main dropdown menu component
- `CalendarFilterMenuItem` - Individual calendar menu item
- `CalendarFilterMenuHeader` - "All Calendars" default option

**Key Files to Create**:
- `static/css/components/calendar-filter-dropdown.css`
- `static/js/components/calendar-filter-dropdown.js`

**Dependencies**: Material Design 3 menu and dropdown styles

### 2.2 Dropdown Menu Styling and Behavior
**Deliverable**: Complete dropdown visual design and interactions

**Features**:
- Material Design 3 dropdown menu appearance
- Calendar colors as menu item indicators
- Hover and focus states for menu items
- Multi-select checkbox behavior
- Smooth dropdown animations
- Responsive design for mobile devices

**Technical Requirements**:
- Use calendar colors as menu item indicators
- Implement proper contrast ratios for accessibility
- Add ripple effects for touch interactions
- Support keyboard navigation and escape key
- Position dropdown relative to calendar icon

## Phase 3: Frontend Integration (Days 5-6)

### 3.1 Calendar Header Integration
**Deliverable**: Updated calendar header with dropdown menu trigger

**Features**:
- Add dropdown menu trigger to existing calendar icon
- Implement dropdown positioning relative to icon
- Add visual feedback for active filter state
- Implement click-outside-to-close behavior

**Technical Requirements**:
- Integrate with existing calendar header structure
- Position dropdown menu below calendar icon
- Add loading states for calendar data
- Implement error handling for failed calendar loads
- Handle responsive behavior for mobile devices

### 3.2 Event Filtering Logic
**Deliverable**: Complete event filtering system

**Features**:
- Filter calendar events based on selected chips
- Real-time event filtering without page reload
- Maintain event display state across calendar navigation
- Persist filter selections in session storage

**Technical Requirements**:
- Update event loading to include calendar filter parameter
- Implement client-side event filtering as fallback
- Add filter state management
- Handle edge cases (no calendars selected, all calendars selected)

## Phase 4: User Experience Enhancements (Days 7-8)

### 4.1 Advanced Filter Features
**Deliverable**: Enhanced filtering capabilities

**Features**:
- Quick filter presets (Work, Personal, All)
- Calendar search within filter chips
- Calendar grouping by type (primary, shared, etc.)
- Filter state persistence across sessions

**Technical Requirements**:
- Add preset filter configurations
- Implement calendar search functionality
- Add calendar grouping logic
- Implement localStorage for filter persistence

### 4.2 Visual Feedback and States
**Deliverable**: Complete visual feedback system

**Features**:
- Loading states for calendar data
- Empty state when no calendars available
- Error states for failed calendar loads
- Success feedback for filter changes

**Technical Requirements**:
- Add loading spinners and skeleton states
- Implement error message display
- Add success toast notifications
- Handle network connectivity issues

## Technical Architecture

### Data Flow
1. **Calendar Loading**: Fetch available calendars from `/api/calendar/calendars`
2. **Chip Generation**: Create chip components for each calendar with colors
3. **User Interaction**: Handle chip selection/deselection events
4. **Event Filtering**: Update event display based on selected calendars
5. **State Persistence**: Save filter state to session storage

### Service Dependencies
- **CalendarService**: Fetch calendar list and events
- **CacheService**: Maintain calendar and event caching
- **FilterService**: Handle calendar filtering logic

### UI Components
- **CalendarFilterDropdown**: Main dropdown menu container
- **CalendarFilterMenuItem**: Individual calendar menu item with checkbox
- **CalendarFilterMenuHeader**: "All Calendars" default option
- **CalendarIconTrigger**: Calendar icon with dropdown trigger

## Success Criteria

### Functional Requirements
- Users can access calendar filter via dropdown menu from calendar icon
- "All Calendars" option is selected by default
- Users can select one or more calendars from dropdown menu
- Events are filtered in real-time based on menu selection
- Filter state persists across page navigation
- All calendar colors are properly displayed as menu item indicators

### Technical Requirements
- Dropdown menu follows Material Design 3 specifications
- Filtering works with existing calendar caching
- Mobile-responsive design
- Keyboard navigation support (arrow keys, enter, escape)
- Accessibility compliance (WCAG 2.1)

## Risk Assessment

### High Risk Items
- **Calendar Color Contrast**: Ensuring proper contrast ratios for menu item text
- **Dropdown Positioning**: Proper positioning relative to calendar icon
- **Performance**: Large number of calendars may impact dropdown rendering
- **State Synchronization**: Keeping filter state in sync with calendar data

### Dependencies
- **Material Design 3 Menu Reference**: GitHub documentation for dropdown menu styling
- **Existing Calendar API**: Current calendar service implementation
- **Calendar Color System**: Existing color management system

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-------------------|
| Phase 1 | 1-2 days | Enhanced API with calendar filtering |
| Phase 2 | 1-2 days | Material Design 3 dropdown menu components |
| Phase 3 | 1-2 days | Frontend integration and filtering logic |
| Phase 4 | 1-2 days | UX enhancements and visual feedback |

**Total Estimated Duration**: 4-8 days

## Implementation Notes

### Material Design 3 Menu Reference
The implementation will follow the Material Design 3 dropdown menu specifications:
- Use proper menu sizing and spacing
- Implement correct hover and focus states
- Follow accessibility guidelines
- Use appropriate color theming for menu items

### Integration Points
- **Calendar Header Icon**: Enhance the existing calendar icon in the header
- **Calendar Service**: Extend existing calendar service with filtering
- **Event Display**: Update event rendering to respect filter selections
- **State Management**: Integrate with existing calendar state management

### Performance Considerations
- **Lazy Loading**: Load calendar menu items only when dropdown is opened
- **Efficient Filtering**: Use server-side filtering when possible
- **Caching**: Leverage existing calendar caching for performance
- **Debouncing**: Debounce filter changes to avoid excessive API calls
