# Sonos Dashboard Polish - Complete Implementation Plan

## Executive Summary

This guide outlines the implementation of a polished Sonos dashboard with a unified view that displays both individual speakers and groups in a single, cohesive interface. The interface will show group coordinators with their members, support drag-and-drop operations for group management, and provide a seamless user experience within the SPA dashboard.

## Current State Analysis

- ✅ Sonos Control Module is fully implemented with backend services
- ✅ WebSocket integration for real-time updates
- ✅ Jishi API integration for actual Sonos control
- ✅ Unified view JavaScript implementation exists (`sonos-unified-view.js`)
- ⚠️ Unified view lost during auth refactoring in SPA dashboard
- ⚠️ Drag-and-drop functionality needs restoration
- ⚠️ Visual hierarchy for groups needs polishing

## Phase 1: SPA Integration Restoration (Days 1-2)

### 1.1 SPA Dashboard Integration
**Deliverable**: Restore unified view in SPA dashboard

**Key Files to Update**:
- `static/js/sections/sonos.js` - Update to use unified view
- `templates/spa-dashboard.html` - Ensure Sonos section is properly integrated
- `static/css/spa-dashboard.css` - Add unified view styles

**Technical Requirements**:
- Integrate `SonosUnifiedView` class into SPA section
- Ensure proper initialization and cleanup
- Add unified view container to SPA layout

### 1.2 Unified View Container Setup
**Deliverable**: Proper unified view container in SPA

**Features**:
- Single list view for both devices and groups
- Group cards showing coordinator + members
- Individual device cards for ungrouped speakers
- Drag-and-drop support for group management

**Technical Requirements**:
- Update SPA section to use unified view
- Ensure proper container initialization
- Add drag-and-drop event handling

## Phase 2: Visual Hierarchy Implementation (Days 2-3)

### 2.1 Group Card Design
**Deliverable**: Polished group cards with clear hierarchy

**Features**:
- Coordinator prominently displayed at top
- Member devices indented and grouped underneath
- Clear visual distinction between coordinator and members
- Status indicators for playback state and volume

**Technical Requirements**:
- CSS styling for group cards
- Coordinator highlighting
- Member device indentation
- Status icon implementation

### 2.2 Individual Device Cards
**Deliverable**: Consistent individual device cards

**Features**:
- Same styling as group coordinators
- Clear status indicators
- Volume controls
- Playback controls

**Technical Requirements**:
- Consistent card styling
- Status indicator implementation
- Control button styling

## Phase 3: Drag-and-Drop Functionality (Days 3-4)

### 3.1 Drag-and-Drop Implementation
**Deliverable**: Complete drag-and-drop group management

**Features**:
- Drag individual devices to create groups
- Drag devices between existing groups
- Drag groups to merge them
- Visual feedback during drag operations

**Technical Requirements**:
- HTML5 drag-and-drop API implementation
- Touch support for mobile devices
- Visual feedback system
- Drop zone highlighting

### 3.2 Group Management Logic
**Deliverable**: Backend integration for group operations

**Features**:
- Add device to group
- Remove device from group
- Create new groups
- Merge existing groups
- Dissolve groups

**Technical Requirements**:
- API endpoint integration
- Error handling and user feedback
- Real-time updates via WebSocket
- Optimistic UI updates

## Phase 4: Real-time Updates & Polish (Days 4-5)

### 4.1 WebSocket Integration
**Deliverable**: Real-time updates for unified view

**Features**:
- Live device status updates
- Group membership changes
- Playback state synchronization
- Volume level updates

**Technical Requirements**:
- WebSocket message handling
- State synchronization
- Conflict resolution
- Error recovery

### 4.2 UI Polish & Responsiveness
**Deliverable**: Polished, responsive interface

**Features**:
- Mobile-friendly touch interface
- Smooth animations and transitions
- Loading states and error handling
- Accessibility support

**Technical Requirements**:
- Responsive CSS design
- Touch gesture support
- Animation implementation
- Accessibility compliance

## Technical Architecture

### Data Flow
1. **Initial Load**: Fetch devices and groups from API
2. **Unified Rendering**: Create single list with groups first, then individual devices
3. **Group Cards**: Show coordinator with indented members
4. **Individual Cards**: Show standalone devices
5. **Real-time Updates**: WebSocket updates refresh the unified view

### Service Dependencies
- **SonosService**: Backend API for device and group management
- **WebSocketService**: Real-time updates
- **UnifiedViewManager**: Frontend unified view management
- **DragDropManager**: Drag-and-drop functionality

### UI Components
- **GroupCard**: Coordinator + members with controls
- **DeviceCard**: Individual device with controls
- **DragDropHandler**: Drag-and-drop event management
- **StatusIndicator**: Playback state and volume display

## Success Criteria

### Functional Requirements
- ✅ Unified view showing both speakers and groups
- ✅ Group coordinators prominently displayed
- ✅ Member devices indented under coordinators
- ✅ Drag-and-drop group management
- ✅ Real-time updates via WebSocket
- ✅ Mobile-friendly touch interface

### Technical Requirements
- ✅ Smooth drag-and-drop animations (60fps)
- ✅ Fast API response times (< 500ms)
- ✅ Efficient WebSocket message handling
- ✅ Responsive UI on all devices
- ✅ Proper error handling and user feedback

### User Experience Requirements
- ✅ Intuitive group management
- ✅ Clear visual hierarchy
- ✅ Consistent behavior across devices
- ✅ Touch-friendly mobile interface
- ✅ Accessible keyboard navigation

## Risk Assessment

### High Risk Items
- **SPA Integration**: Ensuring unified view works properly in SPA context
- **Drag-and-Drop Compatibility**: Cross-browser and mobile support
- **WebSocket Reliability**: Real-time update synchronization

### Dependencies
- **Jishi API**: Sonos device communication
- **WebSocket Server**: Real-time updates
- **SPA Router**: Section navigation and lifecycle

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-------------------|
| Phase 1 | 1-2 days | SPA integration, unified view restoration |
| Phase 2 | 1 day | Visual hierarchy, group card design |
| Phase 3 | 1-2 days | Drag-and-drop functionality |
| Phase 4 | 1 day | Real-time updates, UI polish |

**Total Estimated Duration**: 4-6 days

## Implementation Notes

### Key Design Decisions
1. **Unified View**: Single list showing both individual speakers and groups
2. **Visual Hierarchy**: Coordinators highlighted, members indented
3. **Drag-and-Drop**: HTML5 native API with touch support
4. **Real-time Updates**: WebSocket integration for live changes
5. **Mobile First**: Touch-friendly interface for all devices

### Technical Considerations
- **RINCON Group Names**: Hidden from UI, managed in background
- **Group State**: Maintained through WebSocket updates
- **Error Handling**: Comprehensive error handling with user feedback
- **Performance**: Optimized for large device lists and smooth animations

### Testing Strategy
- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end functionality testing
- **User Acceptance Tests**: Real-world usage scenarios
- **Performance Tests**: Load testing and optimization
- **Accessibility Tests**: Screen reader and keyboard navigation
