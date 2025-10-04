package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"woodhome-webapp/internal/models"

	"github.com/sirupsen/logrus"
)

// SonosService handles Sonos device operations
type SonosService struct {
	config       *models.SonosServiceConfig
	devices      map[string]*models.SonosDevice
	groups       map[string]*models.SonosGroup
	httpClient   *http.Client
	mu           sync.RWMutex
	lastUpdate   time.Time
	jishiURL     string
	jishiManager *JishiServerManager
}

// NewSonosService creates a new SonosService instance
func NewSonosService(config *models.SonosServiceConfig) *SonosService {
	if config == nil {
		config = &models.SonosServiceConfig{
			JishiURL:     "http://localhost:5005",
			Timeout:      30 * time.Second,
			RetryCount:   3,
			PollInterval: 5 * time.Second,
		}
	}

	// Create Jishi server manager
	jishiManager := NewJishiServerManager(5005)

	return &SonosService{
		config:  config,
		devices: make(map[string]*models.SonosDevice),
		groups:  make(map[string]*models.SonosGroup),
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
		jishiURL:     config.JishiURL,
		jishiManager: jishiManager,
	}
}

// Start initializes the Sonos service
func (s *SonosService) Start(ctx context.Context) error {
	logrus.Info("Starting Sonos service...")

	// Start Jishi server if not running
	if !s.jishiManager.IsJishiRunning() {
		logrus.Info("Starting internal Jishi server...")
		if err := s.jishiManager.StartJishi(); err != nil {
			logrus.Warnf("Failed to start internal Jishi server: %v", err)
			logrus.Warnf("Will attempt to use external Jishi server at %s", s.config.JishiURL)
		} else {
			// Update Jishi URL to use internal server
			s.jishiURL = s.jishiManager.GetJishiURL()
			logrus.Infof("Using internal Jishi server at %s", s.jishiURL)
		}
	} else {
		logrus.Info("Jishi server is already running")
	}

	// Test Jishi API connection
	if err := s.testJishiConnection(ctx); err != nil {
		logrus.Warnf("Jishi API connection test failed: %v", err)
		logrus.Warnf("Make sure Jishi API is running at %s", s.jishiURL)
	} else {
		logrus.Info("Jishi API connection successful")
	}

	// Start device discovery
	if err := s.DiscoverDevices(ctx); err != nil {
		return fmt.Errorf("failed to discover devices: %w", err)
	}

	// Start background monitoring
	go s.monitorDevices(ctx)

	logrus.Info("Sonos service started successfully")
	return nil
}

// Stop stops the Sonos service
func (s *SonosService) Stop() error {
	logrus.Info("Stopping Sonos service...")
	s.mu.Lock()
	defer s.mu.Unlock()

	// Stop Jishi server if we started it
	if s.jishiManager != nil {
		if err := s.jishiManager.StopJishi(); err != nil {
			logrus.Warnf("Failed to stop Jishi server: %v", err)
		}
	}

	// Clear devices and groups
	s.devices = make(map[string]*models.SonosDevice)
	s.groups = make(map[string]*models.SonosGroup)

	logrus.Info("Sonos service stopped")
	return nil
}

// GetDevices returns all discovered devices
func (s *SonosService) GetDevices() []*models.SonosDevice {
	s.mu.RLock()
	defer s.mu.RUnlock()

	devices := make([]*models.SonosDevice, 0, len(s.devices))
	for _, device := range s.devices {
		devices = append(devices, device)
	}
	return devices
}

// GetGroups returns all active groups
func (s *SonosService) GetGroups() []*models.SonosGroup {
	s.mu.RLock()
	defer s.mu.RUnlock()

	groups := make([]*models.SonosGroup, 0, len(s.groups))
	for _, group := range s.groups {
		groups = append(groups, group)
	}
	return groups
}

// GetDevice returns a specific device by UUID
func (s *SonosService) GetDevice(uuid string) (*models.SonosDevice, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	device, exists := s.devices[uuid]
	return device, exists
}

// GetGroup returns a specific group by ID
func (s *SonosService) GetGroup(id string) (*models.SonosGroup, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	group, exists := s.groups[id]
	return group, exists
}

// discoverDevices discovers Sonos devices using Jishi API
func (s *SonosService) DiscoverDevices(ctx context.Context) error {
	logrus.Info("Discovering Sonos devices...")

	// Test Jishi connection
	if err := s.testJishiConnection(ctx); err != nil {
		logrus.Warnf("Jishi API not available: %v", err)
		logrus.Info("Attempting to start Jishi server automatically...")
		
		// Try to start Jishi server automatically
		if startErr := s.StartJishiServer(); startErr != nil {
			return fmt.Errorf("Jishi API not available and failed to start server: %w (original error: %v)", startErr, err)
		}
		
		// Wait a moment for the server to start up
		time.Sleep(2 * time.Second)
		
		// Test connection again after starting
		if err := s.testJishiConnection(ctx); err != nil {
			return fmt.Errorf("Jishi API still not available after auto-start: %w", err)
		}
		
		logrus.Info("Jishi server started successfully, continuing with device discovery...")
	}

	// Get zones from Jishi API
	zones, err := s.getZones(ctx)
	if err != nil {
		return fmt.Errorf("failed to get zones: %w", err)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Clear existing groups and devices to prevent stale data
	// This ensures we only show current groups, not old destroyed ones
	s.groups = make(map[string]*models.SonosGroup)
	s.devices = make(map[string]*models.SonosDevice)

	// Process discovered zones
	for _, zone := range zones {
		s.processZone(zone)
	}

	// Clean up zombie groups - groups that appear to be dissolved but still in the API
	s.cleanupZombieGroups()

	logrus.Infof("Discovered %d devices in %d groups", len(s.devices), len(s.groups))
	return nil
}

// testJishiConnection tests connection to Jishi API
func (s *SonosService) testJishiConnection(ctx context.Context) error {
	url := s.config.JishiURL + "/zones"
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Jishi API returned status %d", resp.StatusCode)
	}

	return nil
}

// getZones retrieves zones from Jishi API
func (s *SonosService) getZones(ctx context.Context) ([]map[string]interface{}, error) {
	url := s.config.JishiURL + "/zones"
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		// Check if this is a connection error that might indicate Jishi server is not running
		if strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "no such host") {
			logrus.Warnf("Connection error detected in getZones, attempting to start Jishi server automatically...")
			
			// Try to start Jishi server automatically
			if startErr := s.StartJishiServer(); startErr != nil {
				return nil, fmt.Errorf("failed to get zones and failed to start server: %w (original error: %v)", startErr, err)
			}
			
			// Wait a moment for the server to start up
			time.Sleep(2 * time.Second)
			
			// Retry the request
			logrus.Info("Retrying getZones after starting Jishi server...")
			req, err = http.NewRequestWithContext(ctx, "GET", url, nil)
			if err != nil {
				return nil, err
			}
			
			resp, err = s.httpClient.Do(req)
			if err != nil {
				return nil, fmt.Errorf("failed to get zones even after starting server: %w", err)
			}
		} else {
			return nil, err
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Jishi API returned status %d", resp.StatusCode)
	}

	var zones []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&zones); err != nil {
		return nil, err
	}

	return zones, nil
}

// processZone processes a discovered zone
func (s *SonosService) processZone(zone map[string]interface{}) {
	// Extract zone information
	zoneID, _ := zone["uuid"].(string)
	coordinator, _ := zone["coordinator"].(map[string]interface{})
	members, _ := zone["members"].([]interface{})

	if zoneID == "" || coordinator == nil {
		return
	}

	// Create coordinator device
	coordDevice := s.createDeviceFromZoneData(coordinator, zoneID)
	if coordDevice != nil {
		s.devices[coordDevice.UUID] = coordDevice
	}

	// Check if this is a real group (multiple different devices) or just a single device
	// A real group should have members with different UUIDs than the coordinator
	hasOtherMembers := false
	for _, memberData := range members {
		if member, ok := memberData.(map[string]interface{}); ok {
			if memberUUID, ok := member["uuid"].(string); ok && memberUUID != coordDevice.UUID {
				hasOtherMembers = true
				break
			}
		}
	}

	if hasOtherMembers {
		// This is a real group with multiple devices
		var group *models.SonosGroup

		// Check if group already exists
		if existingGroup, exists := s.groups[zoneID]; exists {
			group = existingGroup
			// Update coordinator and group state from current coordinator device
			group.Coordinator = coordDevice
			group.Volume = coordDevice.Volume
			group.Mute = coordDevice.Mute
			group.State = coordDevice.State
			group.CurrentTrack = coordDevice.CurrentTrack

			// Debug logging for group updates
			logrus.Debugf("Updated group %s: State=%s, Track=%s",
				zoneID, group.State,
				func() string {
					if group.CurrentTrack != nil {
						return fmt.Sprintf("%s - %s", group.CurrentTrack.Artist, group.CurrentTrack.Title)
					}
					return "No track"
				}())
		} else {
			// Create new group
			group = models.NewSonosGroup(zoneID, coordDevice)
			// Set group current track from coordinator
			if coordDevice.CurrentTrack != nil {
				group.CurrentTrack = coordDevice.CurrentTrack
			}
		}

		// Process members and add to group
		group.Members = []*models.SonosDevice{coordDevice} // Reset members list
		for _, memberData := range members {
			if member, ok := memberData.(map[string]interface{}); ok {
				memberDevice := s.createDeviceFromZoneData(member, zoneID)
				if memberDevice != nil {
					s.devices[memberDevice.UUID] = memberDevice
					group.AddMember(memberDevice)
				}
			}
		}

		// Only add/update the group if it has valid members and isn't a zombie
		if len(group.Members) > 1 && s.isValidGroup(group) {
			s.groups[zoneID] = group
		} else {
			logrus.Debugf("Skipping zombie group %s with %d members", zoneID, len(group.Members))
		}
	} else {
		// Single device - create without group_id
		coordDevice.GroupID = ""
		coordDevice.Coordinator = ""

		// Process members as individual devices
		for _, memberData := range members {
			if member, ok := memberData.(map[string]interface{}); ok {
				memberDevice := s.createDeviceFromZoneData(member, "")
				if memberDevice != nil {
					s.devices[memberDevice.UUID] = memberDevice
				}
			}
		}
	}
}

// createDeviceFromZoneData creates a device from zone data
func (s *SonosService) createDeviceFromZoneData(data map[string]interface{}, groupID string) *models.SonosDevice {
	uuid, _ := data["uuid"].(string)
	roomName, _ := data["roomName"].(string)

	if uuid == "" || roomName == "" {
		return nil
	}

	device := models.NewSonosDevice(uuid, roomName, roomName)
	device.GroupID = groupID
	device.Coordinator = uuid // Will be updated if not coordinator

	// Extract state information
	if state, ok := data["state"].(map[string]interface{}); ok {
		// Debug logging for state information
		logrus.Debugf("Device %s state data: %+v", roomName, state)
		if volume, ok := state["volume"].(float64); ok {
			device.Volume = int(volume)
		}
		if mute, ok := state["mute"].(bool); ok {
			device.Mute = mute
		}
		// Try different state field names
		if playbackState, ok := state["playbackState"].(string); ok {
			device.State = playbackState
		} else if playerState, ok := state["playerState"].(string); ok {
			device.State = playerState
		} else if zoneState, ok := state["zoneState"].(string); ok {
			device.State = zoneState
		}

		// Extract current track information
		if currentTrack, ok := state["currentTrack"].(map[string]interface{}); ok {
			device.CurrentTrack = &models.TrackInfo{}
			if artist, ok := currentTrack["artist"].(string); ok {
				device.CurrentTrack.Artist = artist
			}
			if title, ok := currentTrack["title"].(string); ok {
				device.CurrentTrack.Title = title
			}
			if album, ok := currentTrack["album"].(string); ok {
				device.CurrentTrack.Album = album
			}
			// Try different album art field names
			if art, ok := currentTrack["albumArtURI"].(string); ok {
				device.CurrentTrack.Art = art
			} else if art, ok := currentTrack["albumArtUri"].(string); ok {
				device.CurrentTrack.Art = art
			} else if art, ok := currentTrack["absoluteAlbumArtUri"].(string); ok {
				device.CurrentTrack.Art = art
			}

			// Debug logging for track information
			logrus.Debugf("Device %s current track: Artist=%s, Title=%s, Album=%s, Art=%s",
				device.Name, device.CurrentTrack.Artist, device.CurrentTrack.Title,
				device.CurrentTrack.Album, device.CurrentTrack.Art)
		} else {
			logrus.Debugf("Device %s has no current track information", device.Name)
		}
	}

	device.SetOnline(true)
	return device
}

// cleanupZombieGroups removes groups that appear to be dissolved or invalid
func (s *SonosService) cleanupZombieGroups() {
	groupsToRemove := make([]string, 0)

	for groupID, group := range s.groups {
		// Check if group is valid
		if !s.isValidGroup(group) {
			logrus.Debugf("Removing zombie group %s", groupID)
			groupsToRemove = append(groupsToRemove, groupID)
		}
	}

	// Remove zombie groups
	for _, groupID := range groupsToRemove {
		delete(s.groups, groupID)
	}

	if len(groupsToRemove) > 0 {
		logrus.Infof("Cleaned up %d zombie groups", len(groupsToRemove))
	}
}

// isValidGroup checks if a group is valid and not a zombie
func (s *SonosService) isValidGroup(group *models.SonosGroup) bool {
	// A valid group should have:
	// 1. At least 2 members (coordinator + at least one other)
	// 2. All members should be online
	// 3. Coordinator should be valid
	// 4. Members should have different UUIDs than coordinator

	if group == nil || len(group.Members) < 2 {
		return false
	}

	// Check if coordinator is valid
	if group.Coordinator == nil || group.Coordinator.UUID == "" {
		return false
	}

	// Check if all members are online and have valid UUIDs
	coordinatorUUID := group.Coordinator.UUID
	hasOtherMembers := false

	for _, member := range group.Members {
		if member == nil || member.UUID == "" {
			return false
		}

		// Check if member is online
		if !member.IsOnline {
			logrus.Debugf("Group %s has offline member %s", group.ID, member.Name)
			return false
		}

		// Check if this is a different device than coordinator
		if member.UUID != coordinatorUUID {
			hasOtherMembers = true
		}
	}

	// Must have at least one member that's different from coordinator
	if !hasOtherMembers {
		logrus.Debugf("Group %s has no other members besides coordinator", group.ID)
		return false
	}

	return true
}

// RefreshDevices forces a refresh of all devices and groups
func (s *SonosService) RefreshDevices() error {
	ctx := context.Background()
	return s.DiscoverDevices(ctx)
}

// monitorDevices monitors device status in the background
func (s *SonosService) monitorDevices(ctx context.Context) {
	ticker := time.NewTicker(s.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.updateDeviceStatus(ctx)
		}
	}
}

// updateDeviceStatus updates device status
func (s *SonosService) updateDeviceStatus(ctx context.Context) {
	zones, err := s.getZones(ctx)
	if err != nil {
		logrus.Errorf("Failed to update device status: %v", err)
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Update devices with current status
	for _, zone := range zones {
		s.processZone(zone)
	}

	s.lastUpdate = time.Now()
}

// Jishi API Methods for Device Control

// PlayDevice plays a specific device via Jishi API
func (s *SonosService) PlayDevice(ctx context.Context, deviceName string) error {
	url := fmt.Sprintf("%s/%s/play", s.jishiURL, deviceName)
	return s.executeJishiCommand(ctx, url, "play", deviceName)
}

// PauseDevice pauses a specific device via Jishi API
func (s *SonosService) PauseDevice(ctx context.Context, deviceName string) error {
	url := fmt.Sprintf("%s/%s/pause", s.jishiURL, deviceName)
	return s.executeJishiCommand(ctx, url, "pause", deviceName)
}

// StopDevice stops a specific device via Jishi API
func (s *SonosService) StopDevice(ctx context.Context, deviceName string) error {
	url := fmt.Sprintf("%s/%s/stop", s.jishiURL, deviceName)
	return s.executeJishiCommand(ctx, url, "stop", deviceName)
}

// NextTrack skips to next track on a device via Jishi API
func (s *SonosService) NextTrack(ctx context.Context, deviceName string) error {
	url := fmt.Sprintf("%s/%s/next", s.jishiURL, deviceName)
	return s.executeJishiCommand(ctx, url, "next", deviceName)
}

// PreviousTrack skips to previous track on a device via Jishi API
func (s *SonosService) PreviousTrack(ctx context.Context, deviceName string) error {
	url := fmt.Sprintf("%s/%s/previous", s.jishiURL, deviceName)
	return s.executeJishiCommand(ctx, url, "previous", deviceName)
}

// SetVolume sets volume for a device via Jishi API
func (s *SonosService) SetVolume(ctx context.Context, deviceName string, volume int) error {
	url := fmt.Sprintf("%s/%s/volume/%d", s.jishiURL, deviceName, volume)
	return s.executeJishiCommand(ctx, url, "volume", deviceName)
}

// SetMute sets mute state for a device via Jishi API
func (s *SonosService) SetMute(ctx context.Context, deviceName string, mute bool) error {
	action := "mute"
	if !mute {
		action = "unmute"
	}
	url := fmt.Sprintf("%s/%s/%s", s.jishiURL, deviceName, action)
	return s.executeJishiCommand(ctx, url, action, deviceName)
}

// Group Management Methods

// CreateGroup creates a new group via Jishi API
func (s *SonosService) CreateGroup(ctx context.Context, coordinatorName string, memberNames []string) error {
	if len(memberNames) == 0 {
		return fmt.Errorf("no member rooms provided")
	}

	logrus.Debugf("Creating group with coordinator %s and members: %v", coordinatorName, memberNames)

	// Check if coordinator is currently playing TV audio (SPDIF/HDMI ARC)
	coordinatorState, err := s.getDeviceState(ctx, coordinatorName)
	if err != nil {
		logrus.Debugf("Could not get coordinator state: %v", err)
	}

	var wasPlayingTVAudio bool
	var currentVolume int
	if coordinatorState != nil {
		// Check if playing TV audio via SPDIF
		if currentTrack, ok := coordinatorState["currentTrack"].(map[string]interface{}); ok {
			if uri, ok := currentTrack["uri"].(string); ok && uri != "" {
				wasPlayingTVAudio = strings.Contains(uri, "spdif") || strings.Contains(uri, "htastream")
			}
		}
		// Get current volume
		if volume, ok := coordinatorState["volume"].(float64); ok {
			currentVolume = int(volume)
		}
	}

	// First, ensure the coordinator is not in any group
	if err := s.LeaveGroup(ctx, coordinatorName); err != nil {
		logrus.Debugf("Coordinator %s was not in a group or error occurred: %v", coordinatorName, err)
	}

	// Join each member room to the coordinator
	for i, memberName := range memberNames {
		if memberName != coordinatorName {
			url := fmt.Sprintf("%s/%s/join/%s", s.jishiURL, memberName, coordinatorName)
			if err := s.executeJishiCommand(ctx, url, "join", memberName); err != nil {
				return fmt.Errorf("failed to join %s to group: %w", memberName, err)
			}

			// Add a small delay between group operations to allow Sonos to process
			if i < len(memberNames)-1 {
				time.Sleep(2 * time.Second)
			}
		}
	}

	// If coordinator was playing TV audio, try to restore it
	if wasPlayingTVAudio {
		logrus.Debugf("Coordinator was playing TV audio, attempting to restore...")
		// Wait a moment for the group to stabilize
		time.Sleep(3 * time.Second)

		// Try to restore TV audio by setting the same volume (this can help trigger the input)
		if currentVolume > 0 {
			if err := s.SetGroupVolume(ctx, coordinatorName, currentVolume); err != nil {
				logrus.Debugf("Could not restore volume after group creation: %v", err)
			}
		}

		// Note: The TV audio should automatically resume if the TV is still outputting
		// The SPDIF connection should be maintained through the group change
		logrus.Debugf("TV audio restoration attempted for coordinator %s", coordinatorName)
	}

	logrus.Debugf("Group created successfully with coordinator %s", coordinatorName)
	return nil
}

// JoinGroup adds a device to an existing group via Jishi API
func (s *SonosService) JoinGroup(ctx context.Context, deviceName, targetDeviceName string) error {
	url := fmt.Sprintf("%s/%s/join/%s", s.jishiURL, deviceName, targetDeviceName)
	return s.executeJishiCommand(ctx, url, "join", deviceName)
}

// LeaveGroup removes a device from its current group via Jishi API
func (s *SonosService) LeaveGroup(ctx context.Context, deviceName string) error {
	url := fmt.Sprintf("%s/%s/leave", s.jishiURL, deviceName)
	return s.executeJishiCommand(ctx, url, "leave", deviceName)
}

// PlayGroup plays a group via Jishi API
func (s *SonosService) PlayGroup(ctx context.Context, coordinatorName string) error {
	url := fmt.Sprintf("%s/%s/play", s.jishiURL, coordinatorName)
	return s.executeJishiCommand(ctx, url, "play", coordinatorName)
}

// PauseGroup pauses a group via Jishi API
func (s *SonosService) PauseGroup(ctx context.Context, coordinatorName string) error {
	url := fmt.Sprintf("%s/%s/pause", s.jishiURL, coordinatorName)
	return s.executeJishiCommand(ctx, url, "pause", coordinatorName)
}

// StopGroup stops a group via Jishi API
func (s *SonosService) StopGroup(ctx context.Context, coordinatorName string) error {
	url := fmt.Sprintf("%s/%s/stop", s.jishiURL, coordinatorName)
	return s.executeJishiCommand(ctx, url, "stop", coordinatorName)
}

// SetGroupVolume sets volume for a group via Jishi API
func (s *SonosService) SetGroupVolume(ctx context.Context, coordinatorName string, volume int) error {
	url := fmt.Sprintf("%s/%s/volume/%d", s.jishiURL, coordinatorName, volume)
	return s.executeJishiCommand(ctx, url, "volume", coordinatorName)
}

// SetGroupMute sets mute state for a group via Jishi API
func (s *SonosService) SetGroupMute(ctx context.Context, coordinatorName string, mute bool) error {
	action := "mute"
	if !mute {
		action = "unmute"
	}
	url := fmt.Sprintf("%s/%s/%s", s.jishiURL, coordinatorName, action)
	return s.executeJishiCommand(ctx, url, action, coordinatorName)
}

// getDeviceState gets the current state of a device via Jishi API
func (s *SonosService) getDeviceState(ctx context.Context, deviceName string) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/%s/state", s.jishiURL, deviceName)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get device state: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Jishi API returned status %d for device state", resp.StatusCode)
	}

	var state map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&state); err != nil {
		return nil, fmt.Errorf("failed to decode device state: %w", err)
	}

	return state, nil
}

// executeJishiCommand executes a command via Jishi API
func (s *SonosService) executeJishiCommand(ctx context.Context, url, action, deviceName string) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	logrus.Infof("Executing %s command on %s via Jishi API: %s", action, deviceName, url)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		logrus.Errorf("Failed to execute %s command on %s: %v", action, deviceName, err)
		
		// Check if this is a connection error that might indicate Jishi server is not running
		if strings.Contains(err.Error(), "connection refused") || strings.Contains(err.Error(), "no such host") {
			logrus.Warnf("Connection error detected, attempting to start Jishi server automatically...")
			
			// Try to start Jishi server automatically
			if startErr := s.StartJishiServer(); startErr != nil {
				return fmt.Errorf("failed to execute %s command and failed to start server: %w (original error: %v)", action, startErr, err)
			}
			
			// Wait a moment for the server to start up
			time.Sleep(2 * time.Second)
			
			// Retry the command
			logrus.Info("Retrying command after starting Jishi server...")
			req, err = http.NewRequestWithContext(ctx, "GET", url, nil)
			if err != nil {
				return fmt.Errorf("failed to create retry request: %w", err)
			}
			
			resp, err = s.httpClient.Do(req)
			if err != nil {
				return fmt.Errorf("failed to execute %s command even after starting server: %w", action, err)
			}
		} else {
			return fmt.Errorf("failed to execute %s command: %w", action, err)
		}
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	logrus.Infof("Jishi API response for %s on %s: Status %d, Body: %s", action, deviceName, resp.StatusCode, string(body))

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Jishi API returned status %d for %s: %s", resp.StatusCode, action, string(body))
	}

	logrus.Infof("%s command executed successfully on %s", action, deviceName)
	return nil
}

// Jishi Server Management Methods

// GetJishiStatus returns the status of the Jishi server
func (s *SonosService) GetJishiStatus() map[string]interface{} {
	if s.jishiManager == nil {
		return map[string]interface{}{
			"is_running": false,
			"error":      "Jishi manager not initialized",
		}
	}
	return s.jishiManager.GetStatus()
}

// StartJishiServer starts the internal Jishi server
func (s *SonosService) StartJishiServer() error {
	if s.jishiManager == nil {
		return fmt.Errorf("Jishi manager not initialized")
	}

	if err := s.jishiManager.StartJishi(); err != nil {
		return err
	}

	// Update Jishi URL to use internal server
	s.jishiURL = s.jishiManager.GetJishiURL()
	logrus.Infof("Jishi server started at %s", s.jishiURL)
	return nil
}

// StopJishiServer stops the internal Jishi server
func (s *SonosService) StopJishiServer() error {
	if s.jishiManager == nil {
		return fmt.Errorf("Jishi manager not initialized")
	}

	return s.jishiManager.StopJishi()
}

// RestartJishiServer restarts the internal Jishi server
func (s *SonosService) RestartJishiServer() error {
	if s.jishiManager == nil {
		return fmt.Errorf("Jishi manager not initialized")
	}

	if err := s.jishiManager.RestartJishi(); err != nil {
		return err
	}

	// Update Jishi URL to use internal server
	s.jishiURL = s.jishiManager.GetJishiURL()
	logrus.Infof("Jishi server restarted at %s", s.jishiURL)
	return nil
}
