# Sonos Control Module - Complete Implementation Plan

## Executive Summary

This implementation guide outlines the creation of a comprehensive Sonos control module for the WoodHome dashboard, based on the existing Go console application architecture. The module will provide a modern, space-efficient interface for controlling Sonos speakers, managing room groups, and monitoring device status with real-time updates.

## Phase 1: Project Foundation (Days 1-2)

### 1.1 Project Structure Setup
**Deliverable**: Complete folder structure and dependencies
- Create Sonos module directories in WoodHome WebApp
- Add required Go dependencies for Sonos integration
- Set up project references and using statements
- Configure build settings for Sonos module

**Key Files to Create**:
- `static/sonos/` - Frontend assets (HTML, CSS, JS)
- `templates/sonos/` - Template files
- `internal/sonos/` - Go backend services
- `internal/models/sonos.go` - Data models
- `internal/services/sonos_service.go` - Core service layer
- `internal/handlers/sonos_handler.go` - HTTP handlers

**Dependencies**: 
- Existing WoodHome WebApp Go modules
- Sonos HTTP API integration (node-sonos-http-api)
- WebSocket support for real-time updates
- Material Design 3 components

### 1.2 Data Models Implementation
**Deliverable**: Core data structures for Sonos integration

**SonosDevice Model**:
```go
type SonosDevice struct {
    UUID        string    `json:"uuid"`
    Name        string    `json:"name"`
    Room        string    `json:"room"`
    IP          string    `json:"ip"`
    Model       string    `json:"model"`
    IsOnline    bool      `json:"is_online"`
    GroupID     string    `json:"group_id"`
    Coordinator string    `json:"coordinator"`
    Volume      int       `json:"volume"`
    Mute        bool      `json:"mute"`
    State       string    `json:"state"`
    LastSeen    time.Time `json:"last_seen"`
}
```

**SonosGroup Model**:
```go
type SonosGroup struct {
    ID           string         `json:"id"`
    Coordinator  *SonosDevice   `json:"coordinator"`
    Members      []*SonosDevice `json:"members"`
    Volume       int            `json:"volume"`
    Mute         bool           `json:"mute"`
    State        string         `json:"state"`
    CurrentTrack *TrackInfo     `json:"current_track"`
}
```

**TrackInfo Model**:
```go
type TrackInfo struct {
    Artist string `json:"artist"`
    Title  string `json:"title"`
    Album  string `json:"album"`
    Art    string `json:"art"`
}
```

## Phase 2: Core Services (Days 3-5)

### 2.1 Sonos Service Implementation
**Deliverable**: Complete service layer for Sonos integration

**Features**:
- Device discovery and enumeration
- Real-time device status monitoring
- Playback control (play, pause, stop, next, previous)
- Volume control and muting
- Room grouping and ungrouping
- Group management and coordination
- Track information retrieval
- WebSocket real-time updates

**Technical Requirements**:
- Integration with node-sonos-http-api (Jishi)
- WebSocket connections for real-time updates
- Async/await patterns for all operations
- Comprehensive error handling and retry logic
- Connection pooling and timeout management
- Rate limiting to prevent device overload

### 2.2 Device Discovery Service
**Deliverable**: Automatic Sonos device discovery

**Features**:
- Network scanning for Sonos devices
- UPnP/SSDP discovery protocol support
- Device capability detection
- Automatic reconnection on network changes
- Device health monitoring
- Group membership tracking

**Technical Requirements**:
- Background discovery process
- Device state synchronization
- Network topology mapping
- Connection health monitoring
- Automatic device registration

## Phase 3: UI Implementation (Days 6-8)

### 3.1 Modern Dashboard Interface
**Deliverable**: Space-efficient, modern UI for Sonos control

**Main Dashboard Components**:
- Compact device grid with status indicators
- Room grouping visualization
- Quick action controls
- Volume sliders with real-time updates
- Current track display
- Group management interface

**Design Principles**:
- Material Design 3 components
- Compact card-based layout
- Responsive design for all screen sizes
- Dark/light theme support
- Touch-friendly controls
- Real-time visual feedback

### 3.2 Room Grouping Interface
**Deliverable**: Intuitive group management system

**Grouping Features**:
- Drag-and-drop room grouping
- Visual group coordinator indication
- Group volume control
- Group playback synchronization
- Easy group creation and dissolution
- Group state persistence

**UI Components**:
- Interactive room grid
- Group coordinator highlighting
- Connection lines between grouped rooms
- Group action buttons
- Volume control for groups
- Group status indicators

### 3.3 Compact Control Interface
**Deliverable**: Space-efficient control panels

**Control Features**:
- Mini player controls
- Quick volume adjustment
- Playback state indicators
- Track information display
- Group membership indicators
- One-click group actions

**Space Optimization**:
- Collapsible control panels
- Tabbed interface for different functions
- Modal dialogs for complex operations
- Keyboard shortcuts for power users
- Mobile-responsive design

## Phase 4: Integration & Testing (Days 9-10)

### 4.1 WoodHome Integration
**Deliverable**: Seamless integration with existing system

**Integration Points**:
- WoodHome dashboard navigation
- User authentication and permissions
- Configuration management
- Logging and monitoring
- Error handling and reporting

**Technical Requirements**:
- RESTful API endpoints
- WebSocket integration
- Database integration for settings
- User preference storage
- System health monitoring

### 4.2 Testing & Validation
**Deliverable**: Comprehensive testing suite

**Test Scenarios**:
- Device discovery and connection
- Playback control operations
- Room grouping functionality
- Real-time updates and synchronization
- Error handling and recovery
- Performance under load
- Mobile responsiveness
- Cross-browser compatibility

## Technical Architecture

### Data Flow
```
User Interface → WebSocket → Sonos Service → Jishi API → Sonos Devices
     ↓              ↓            ↓              ↓
Database ← Configuration ← Device Manager ← Network Discovery
```

### Service Dependencies
- **Jishi Service**: Node.js HTTP API for Sonos control
- **WebSocket Service**: Real-time communication
- **Device Manager**: Device discovery and management
- **Group Manager**: Room grouping operations
- **Playback Service**: Audio control operations

### UI Components
- **Dashboard**: Main control interface
- **Device Grid**: Compact device display
- **Group Manager**: Room grouping interface
- **Player Controls**: Playback and volume controls
- **Settings Panel**: Configuration interface

## Success Criteria

### Functional Requirements
- Successfully discover and control all Sonos devices
- Real-time device status updates
- Intuitive room grouping interface
- Reliable playback control
- Group volume and state management
- Mobile-responsive design
- Cross-browser compatibility

### Technical Requirements
- Response time < 2 seconds for all operations
- Real-time updates via WebSocket
- 99% uptime for device connections
- Support for up to 32 Sonos devices
- Automatic reconnection on network issues
- Comprehensive error handling

### User Experience Requirements
- Intuitive drag-and-drop grouping
- Visual feedback for all operations
- Compact, space-efficient design
- Touch-friendly mobile interface
- Keyboard shortcuts for power users
- Clear status indicators and notifications

## Risk Assessment

### High Risk Items
- **Jishi API Reliability**: Node.js service dependency
- **Network Stability**: Real-time updates require stable connections
- **Device Compatibility**: Different Sonos model variations

### Dependencies
- Node.js runtime for Jishi service
- Network connectivity to Sonos devices
- WebSocket support in browsers
- Material Design 3 CSS framework

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|-------------------|
| Phase 1 | 1-2 days | Project structure, data models |
| Phase 2 | 2-3 days | Core services, device discovery |
| Phase 3 | 2-3 days | Modern UI, grouping interface |
| Phase 4 | 1-2 days | Integration, testing |

**Total Estimated Duration**: 6-10 days

## Modern UI Design Specifications

### Compact Dashboard Layout
- **Grid System**: 4-column responsive grid for devices
- **Card Design**: Minimalist cards with essential controls
- **Status Indicators**: Color-coded online/offline states
- **Quick Actions**: One-click play/pause/group buttons

### Room Grouping Visualization
- **Group Coordinator**: Highlighted with distinct styling
- **Connection Lines**: Visual connections between grouped rooms
- **Group Controls**: Centralized volume and playback controls
- **Drag & Drop**: Intuitive room assignment interface

### Space Optimization Features
- **Collapsible Panels**: Hide/show detailed controls
- **Tabbed Interface**: Organize functions efficiently
- **Modal Dialogs**: Complex operations in overlay windows
- **Responsive Design**: Adapt to different screen sizes

### Real-time Updates
- **Live Status**: Real-time device status updates
- **Volume Sync**: Synchronized volume controls
- **Playback Sync**: Coordinated playback states
- **Group Changes**: Instant group membership updates
