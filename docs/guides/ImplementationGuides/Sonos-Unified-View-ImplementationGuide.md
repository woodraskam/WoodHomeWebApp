# Sonos Unified View Implementation Guide

## Overview
This guide outlines the implementation of a unified Sonos dashboard view that displays both individual speakers and groups in a single, cohesive interface. The interface will show group coordinators with their members, support drag-and-drop operations for group management, and hide technical RINCON group names from the UI.

## Current State Analysis
- ✅ Sonos Control Module is fully implemented with backend services
- ✅ WebSocket integration for real-time updates
- ✅ Jishi API integration for actual Sonos control
- ✅ Basic dashboard with separate device and group views

## Implementation Requirements

### 1. Unified View Architecture
- **Single List View**: Display both individual speakers and groups in one scrollable list
- **Group Representation**: Show coordinator first, then indented members
- **Visual Hierarchy**: Clear distinction between coordinators and group members
- **Status Indicators**: Show playback state, volume, and track information

### 2. Drag-and-Drop Functionality
- **Individual Speaker Movement**: Drag speakers between groups or to create new groups
- **Group Coordinator Movement**: Drag entire groups by their coordinator
- **Visual Feedback**: Highlight drop zones and show valid drop targets
- **Real-time Updates**: Update UI immediately after successful operations

### 3. UI/UX Improvements
- **Compact Cards**: Space-efficient design showing all relevant information
- **Touch Support**: Mobile-friendly drag-and-drop gestures
- **Status Icons**: Play/pause indicators, volume levels, grouping status
- **Error Handling**: Clear feedback for failed operations

## Implementation Plan

### Phase 1: Unified View Structure
**Duration**: 1-2 days

#### 1.1 Update HTML Template
- Modify `templates/sonos/dashboard.html` to use single list view
- Remove separate device and group sections
- Add unified container with drag-and-drop support

#### 1.2 Update CSS Styling
- Create unified card styles for both speakers and groups
- Add visual hierarchy for coordinators vs members
- Implement drag-and-drop visual feedback
- Add responsive design for mobile touch

#### 1.3 Update JavaScript Architecture
- Modify `static/sonos/js/sonos-dashboard.js` for unified view
- Update device and group management modules
- Add drag-and-drop event handlers

### Phase 2: Drag-and-Drop Implementation
**Duration**: 2-3 days

#### 2.1 HTML5 Drag-and-Drop API
- Implement draggable attributes for speakers and groups
- Add drop zones with visual feedback
- Handle drag start, drag over, and drop events

#### 2.2 Group Management Logic
- Add methods to move speakers between groups
- Implement group creation via drag-and-drop
- Add group dissolution when removing all members

#### 2.3 Visual Feedback System
- Highlight valid drop zones during drag operations
- Show preview of group changes
- Add loading states during API calls

### Phase 3: Real-time Updates
**Duration**: 1 day

#### 3.1 WebSocket Integration
- Update WebSocket handlers for unified view
- Add real-time group membership changes
- Implement live status updates for all items

#### 3.2 State Synchronization
- Ensure UI reflects actual Sonos group state
- Handle concurrent operations gracefully
- Add conflict resolution for simultaneous changes

## Technical Implementation Details

### 1. HTML Template Updates

#### Unified List Structure
```html
<div class="sonos-unified-view">
  <div class="device-list" id="unifiedDeviceList">
    <!-- Dynamic content: speakers and groups -->
  </div>
</div>
```

#### Card Structure for Groups
```html
<div class="sonos-card group-card" data-group-id="office-group" draggable="true">
  <div class="coordinator">
    <div class="device-info">
      <span class="device-name">Office</span>
      <span class="device-status">Playing</span>
    </div>
    <div class="device-controls">
      <button class="play-btn">▶</button>
      <div class="volume-control">
        <input type="range" min="0" max="100" value="75">
      </div>
    </div>
  </div>
  <div class="group-members">
    <div class="member-device" data-device-id="basement">
      <span class="member-name">Basement</span>
      <span class="member-status">Grouped</span>
    </div>
    <div class="member-device" data-device-id="basement-bath">
      <span class="member-name">Basement Bath</span>
      <span class="member-status">Grouped</span>
    </div>
    <div class="member-device" data-device-id="kitchen">
      <span class="member-name">Kitchen</span>
      <span class="member-status">Grouped</span>
    </div>
  </div>
</div>
```

#### Card Structure for Individual Speakers
```html
<div class="sonos-card individual-card" data-device-id="living-room" draggable="true">
  <div class="device-info">
    <span class="device-name">Living Room</span>
    <span class="device-status">[No music selected]</span>
  </div>
  <div class="device-controls">
    <button class="play-btn">▶</button>
    <div class="volume-control">
      <input type="range" min="0" max="100" value="50">
    </div>
  </div>
</div>
```

### 2. CSS Styling Updates

#### Unified Card Styles
```css
.sonos-unified-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.sonos-card {
  background: #2d2d2d;
  border-radius: 8px;
  padding: 16px;
  cursor: grab;
  transition: all 0.2s ease;
}

.sonos-card:hover {
  background: #3a3a3a;
  transform: translateY(-2px);
}

.sonos-card.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.group-card {
  border-left: 4px solid #4CAF50;
}

.individual-card {
  border-left: 4px solid #2196F3;
}

.coordinator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.group-members {
  margin-left: 16px;
  border-left: 2px solid #555;
  padding-left: 12px;
}

.member-device {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  color: #ccc;
  font-size: 0.9em;
}

.drop-zone {
  border: 2px dashed #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: #4CAF50;
}
```

### 3. JavaScript Implementation

#### Unified View Manager
```javascript
class SonosUnifiedView {
  constructor() {
    this.devices = new Map();
    this.groups = new Map();
    this.dragState = null;
    this.init();
  }

  init() {
    this.setupDragAndDrop();
    this.loadInitialData();
    this.setupWebSocket();
  }

  setupDragAndDrop() {
    const container = document.getElementById('unifiedDeviceList');
    
    container.addEventListener('dragstart', (e) => {
      this.handleDragStart(e);
    });
    
    container.addEventListener('dragover', (e) => {
      this.handleDragOver(e);
    });
    
    container.addEventListener('drop', (e) => {
      this.handleDrop(e);
    });
    
    container.addEventListener('dragend', (e) => {
      this.handleDragEnd(e);
    });
  }

  handleDragStart(e) {
    const card = e.target.closest('.sonos-card');
    if (!card) return;
    
    this.dragState = {
      element: card,
      type: card.classList.contains('group-card') ? 'group' : 'device',
      id: card.dataset.groupId || card.dataset.deviceId
    };
    
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  handleDragOver(e) {
    e.preventDefault();
    const targetCard = e.target.closest('.sonos-card');
    if (!targetCard || targetCard === this.dragState.element) return;
    
    // Highlight valid drop targets
    if (this.isValidDropTarget(targetCard)) {
      targetCard.classList.add('drop-highlight');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const targetCard = e.target.closest('.sonos-card');
    if (!targetCard || !this.isValidDropTarget(targetCard)) return;
    
    this.performGroupOperation(targetCard);
  }

  handleDragEnd(e) {
    const card = e.target.closest('.sonos-card');
    if (card) {
      card.classList.remove('dragging');
    }
    
    // Remove all drop highlights
    document.querySelectorAll('.drop-highlight').forEach(el => {
      el.classList.remove('drop-highlight');
    });
    
    this.dragState = null;
  }

  isValidDropTarget(targetCard) {
    if (!this.dragState) return false;
    
    // Can't drop on self
    if (targetCard === this.dragState.element) return false;
    
    // Can drop individual devices on groups or other devices
    if (this.dragState.type === 'device') {
      return true;
    }
    
    // Can drop groups on other groups (merge groups)
    if (this.dragState.type === 'group') {
      return targetCard.classList.contains('group-card');
    }
    
    return false;
  }

  async performGroupOperation(targetCard) {
    const targetId = targetCard.dataset.groupId || targetCard.dataset.deviceId;
    const targetIsGroup = targetCard.classList.contains('group-card');
    
    try {
      if (this.dragState.type === 'device') {
        if (targetIsGroup) {
          // Add device to existing group
          await this.addDeviceToGroup(this.dragState.id, targetId);
        } else {
          // Create new group with both devices
          await this.createGroupWithDevices(targetId, [this.dragState.id]);
        }
      } else if (this.dragState.type === 'group') {
        if (targetIsGroup) {
          // Merge groups
          await this.mergeGroups(this.dragState.id, targetId);
        }
      }
      
      // Refresh the view
      await this.refreshView();
      
    } catch (error) {
      console.error('Group operation failed:', error);
      this.showError('Failed to update group: ' + error.message);
    }
  }

  async addDeviceToGroup(deviceId, groupId) {
    const response = await fetch(`/api/sonos/group/${groupId}/join/${deviceId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error('Failed to add device to group');
    }
  }

  async createGroupWithDevices(coordinatorId, memberIds) {
    const response = await fetch('/api/sonos/group/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinator: coordinatorId,
        members: memberIds
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create group');
    }
  }

  async mergeGroups(sourceGroupId, targetGroupId) {
    // Get source group members
    const sourceGroup = this.groups.get(sourceGroupId);
    if (!sourceGroup) return;
    
    // Add all source group members to target group
    for (const memberId of sourceGroup.members) {
      await this.addDeviceToGroup(memberId, targetGroupId);
    }
    
    // Source group will be automatically dissolved when empty
  }

  async refreshView() {
    // Reload devices and groups from API
    const [devicesResponse, groupsResponse] = await Promise.all([
      fetch('/api/sonos/devices'),
      fetch('/api/sonos/groups')
    ]);
    
    const devices = await devicesResponse.json();
    const groups = await groupsResponse.json();
    
    this.updateView(devices, groups);
  }

  updateView(devices, groups) {
    const container = document.getElementById('unifiedDeviceList');
    container.innerHTML = '';
    
    // Create unified list of items to display
    const items = this.createUnifiedItems(devices, groups);
    
    items.forEach(item => {
      const card = this.createCard(item);
      container.appendChild(card);
    });
  }

  createUnifiedItems(devices, groups) {
    const items = [];
    
    // Add groups first
    groups.forEach(group => {
      items.push({
        type: 'group',
        id: group.id,
        coordinator: group.coordinator,
        members: group.members,
        status: group.playback_state,
        volume: group.volume,
        currentTrack: group.current_track
      });
    });
    
    // Add individual devices (not in any group)
    devices.forEach(device => {
      if (!device.group_id) {
        items.push({
          type: 'device',
          id: device.uuid,
          name: device.name,
          status: device.playback_state,
          volume: device.volume,
          currentTrack: device.current_track
        });
      }
    });
    
    return items;
  }

  createCard(item) {
    const card = document.createElement('div');
    card.className = `sonos-card ${item.type}-card`;
    card.draggable = true;
    card.dataset[`${item.type}Id`] = item.id;
    
    if (item.type === 'group') {
      card.innerHTML = this.createGroupCardHTML(item);
    } else {
      card.innerHTML = this.createDeviceCardHTML(item);
    }
    
    return card;
  }

  createGroupCardHTML(group) {
    return `
      <div class="coordinator">
        <div class="device-info">
          <span class="device-name">${group.coordinator.name}</span>
          <span class="device-status">${group.status}</span>
        </div>
        <div class="device-controls">
          <button class="play-btn" onclick="sonosDashboard.playGroup('${group.id}')">▶</button>
          <div class="volume-control">
            <input type="range" min="0" max="100" value="${group.volume}" 
                   onchange="sonosDashboard.setGroupVolume('${group.id}', this.value)">
          </div>
        </div>
      </div>
      <div class="group-members">
        ${group.members.map(member => `
          <div class="member-device" data-device-id="${member.uuid}">
            <span class="member-name">${member.name}</span>
            <span class="member-status">Grouped</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  createDeviceCardHTML(device) {
    return `
      <div class="device-info">
        <span class="device-name">${device.name}</span>
        <span class="device-status">${device.status}</span>
      </div>
      <div class="device-controls">
        <button class="play-btn" onclick="sonosDashboard.playDevice('${device.id}')">▶</button>
        <div class="volume-control">
          <input type="range" min="0" max="100" value="${device.volume}" 
                 onchange="sonosDashboard.setDeviceVolume('${device.id}', this.value)">
        </div>
      </div>
    `;
  }
}
```

### 4. Backend API Updates

#### Group Management Endpoints
```go
// Add device to existing group
router.HandleFunc("/api/sonos/group/{groupId}/join/{deviceId}", h.joinDeviceToGroup).Methods("POST")

// Remove device from group
router.HandleFunc("/api/sonos/group/{groupId}/leave/{deviceId}", h.removeDeviceFromGroup).Methods("POST")

// Merge two groups
router.HandleFunc("/api/sonos/group/{sourceGroupId}/merge/{targetGroupId}", h.mergeGroups).Methods("POST")
```

#### Handler Implementation
```go
func (h *SonosHandler) joinDeviceToGroup(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    groupId := vars["groupId"]
    deviceId := vars["deviceId"]
    
    group, exists := h.sonosService.GetGroup(groupId)
    if !exists {
        http.Error(w, "Group not found", http.StatusNotFound)
        return
    }
    
    device, exists := h.sonosService.GetDevice(deviceId)
    if !exists {
        http.Error(w, "Device not found", http.StatusNotFound)
        return
    }
    
    ctx := r.Context()
    if err := h.sonosService.JoinGroup(ctx, device.Name, group.Coordinator.Name); err != nil {
        logrus.Errorf("Failed to join device %s to group %s: %v", device.Name, groupId, err)
        http.Error(w, "Failed to join device to group: "+err.Error(), http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "status": "success",
        "action": "join_group",
        "device": device.Name,
        "group": groupId,
    })
}
```

## Testing Strategy

### 1. Unit Tests
- Test drag-and-drop event handlers
- Test group operation methods
- Test unified view rendering

### 2. Integration Tests
- Test WebSocket updates with unified view
- Test API endpoints for group operations
- Test error handling and recovery

### 3. User Acceptance Tests
- Test drag-and-drop on desktop and mobile
- Test group creation and management
- Test real-time updates and synchronization

## Deployment Considerations

### 1. Performance
- Implement virtual scrolling for large device lists
- Optimize WebSocket message handling
- Add debouncing for rapid drag operations

### 2. Accessibility
- Add keyboard navigation support
- Implement screen reader compatibility
- Add high contrast mode support

### 3. Mobile Support
- Test touch gestures on various devices
- Optimize for different screen sizes
- Add haptic feedback for touch operations

## Success Criteria

### 1. Functional Requirements
- ✅ Unified view showing both speakers and groups
- ✅ Drag-and-drop functionality for group management
- ✅ Real-time updates via WebSocket
- ✅ Mobile-friendly touch interface

### 2. Performance Requirements
- ✅ Smooth drag-and-drop animations
- ✅ Fast API response times (< 500ms)
- ✅ Efficient WebSocket message handling
- ✅ Responsive UI on all devices

### 3. User Experience Requirements
- ✅ Intuitive group management
- ✅ Clear visual hierarchy
- ✅ Error handling and user feedback
- ✅ Consistent behavior across devices

## Conclusion

This implementation guide provides a comprehensive plan for updating the Sonos dashboard to use a unified view with drag-and-drop functionality. The approach maintains the existing backend architecture while significantly improving the user experience for group management.

The implementation follows the established incremental approach, ensuring stability and maintainability throughout the development process.
