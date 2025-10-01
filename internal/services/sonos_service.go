package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"woodhome-webapp/internal/models"

	"github.com/sirupsen/logrus"
)

// SonosService handles Sonos device operations
type SonosService struct {
	config        *models.SonosServiceConfig
	devices       map[string]*models.SonosDevice
	groups        map[string]*models.SonosGroup
	httpClient    *http.Client
	mu            sync.RWMutex
	lastUpdate    time.Time
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

	return &SonosService{
		config:  config,
		devices: make(map[string]*models.SonosDevice),
		groups:  make(map[string]*models.SonosGroup),
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// Start initializes the Sonos service
func (s *SonosService) Start(ctx context.Context) error {
	logrus.Info("Starting Sonos service...")
	
	// Start device discovery
	if err := s.discoverDevices(ctx); err != nil {
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
func (s *SonosService) discoverDevices(ctx context.Context) error {
	logrus.Info("Discovering Sonos devices...")

	// Test Jishi connection
	if err := s.testJishiConnection(ctx); err != nil {
		return fmt.Errorf("Jishi API not available: %w", err)
	}

	// Get zones from Jishi API
	zones, err := s.getZones(ctx)
	if err != nil {
		return fmt.Errorf("failed to get zones: %w", err)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Process discovered zones
	for _, zone := range zones {
		s.processZone(zone)
	}

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
		return nil, err
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

	// Create group if there are members
	if len(members) > 0 {
		group := models.NewSonosGroup(zoneID, coordDevice)
		s.groups[zoneID] = group

		// Process members
		for _, memberData := range members {
			if member, ok := memberData.(map[string]interface{}); ok {
				memberDevice := s.createDeviceFromZoneData(member, zoneID)
				if memberDevice != nil {
					s.devices[memberDevice.UUID] = memberDevice
					group.AddMember(memberDevice)
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
		if volume, ok := state["volume"].(float64); ok {
			device.Volume = int(volume)
		}
		if mute, ok := state["mute"].(bool); ok {
			device.Mute = mute
		}
		if playbackState, ok := state["playbackState"].(string); ok {
			device.State = playbackState
		}
	}

	device.SetOnline(true)
	return device
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
