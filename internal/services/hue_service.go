package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"woodhome-webapp/internal/models"

	"github.com/sirupsen/logrus"
)

// HueService handles Philips Hue operations
type HueService struct {
	config     *models.HueServiceConfig
	bridge     *models.HueBridge
	lights     map[string]*models.HueLight
	rooms      map[string]*models.HueRoom
	groups     map[string]*models.HueGroup
	scenes     map[string]*models.HueScene
	httpClient *http.Client
	mu         sync.RWMutex
	lastUpdate time.Time
	baseURL    string
	authStatus *models.HueAuthStatus
}

// NewHueService creates a new HueService instance
func NewHueService(config *models.HueServiceConfig) *HueService {
	if config == nil {
		config = &models.HueServiceConfig{
			BridgeIP:     "",
			Username:     "",
			Timeout:      30 * time.Second,
			RetryCount:   3,
			PollInterval: 5 * time.Second,
			AutoDiscover: true,
			AuthRequired: true,
		}
	}

	authStatus := &models.HueAuthStatus{
		IsAuthenticated: config.Username != "",
		Username:        config.Username,
		BridgeIP:        config.BridgeIP,
		RequiresAuth:    config.Username == "",
	}

	return &HueService{
		config:     config,
		lights:     make(map[string]*models.HueLight),
		rooms:      make(map[string]*models.HueRoom),
		groups:     make(map[string]*models.HueGroup),
		scenes:     make(map[string]*models.HueScene),
		authStatus: authStatus,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
	}
}

// Start initializes the Hue service
func (h *HueService) Start(ctx context.Context) error {
	logrus.Info("Starting Hue service...")

	// Load authentication from environment or config file
	if err := h.loadAuthConfig(); err != nil {
		logrus.Warnf("Failed to load Hue authentication: %v", err)
		logrus.Info("Hue service will run in offline mode. Configure HUE_BRIDGE_IP and HUE_USERNAME environment variables.")
		return nil
	}

	// Auto-discover bridge if not configured
	if h.config.AutoDiscover && h.config.BridgeIP == "" {
		if err := h.discoverBridge(); err != nil {
			logrus.Warnf("Bridge discovery failed: %v", err)
		}
	}

	// Set up base URL if bridge is configured
	if h.config.BridgeIP != "" && h.config.Username != "" {
		h.baseURL = fmt.Sprintf("http://%s/api/%s", h.config.BridgeIP, h.config.Username)
		h.authStatus.IsAuthenticated = true
		h.authStatus.RequiresAuth = false
		logrus.Infof("Hue service configured with bridge %s", h.config.BridgeIP)
	} else {
		logrus.Info("Hue service not configured - running in offline mode")
		return nil
	}

	// Start polling for updates
	go h.startPolling(ctx)

	logrus.Info("Hue service started successfully")
	return nil
}

// Stop stops the Hue service
func (h *HueService) Stop() error {
	logrus.Info("Stopping Hue service...")
	return nil
}

// discoverBridge attempts to discover Hue bridges on the network
func (h *HueService) discoverBridge() error {
	// Use Philips Hue discovery API
	resp, err := http.Get("https://discovery.meethue.com/")
	if err != nil {
		return fmt.Errorf("failed to discover bridges: %w", err)
	}
	defer resp.Body.Close()

	var bridges []models.HueDiscoveryResponse
	if err := json.NewDecoder(resp.Body).Decode(&bridges); err != nil {
		return fmt.Errorf("failed to decode bridge discovery response: %w", err)
	}

	if len(bridges) == 0 {
		return fmt.Errorf("no bridges found")
	}

	// Use the first discovered bridge
	bridge := bridges[0]
	h.config.BridgeIP = bridge.InternalIPAddress
	h.baseURL = fmt.Sprintf("http://%s/api/%s", bridge.InternalIPAddress, h.config.Username)

	logrus.Infof("Discovered bridge at %s", bridge.InternalIPAddress)
	return nil
}

// startPolling starts the polling loop for device updates
func (h *HueService) startPolling(ctx context.Context) {
	ticker := time.NewTicker(h.config.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := h.updateDevices(); err != nil {
				logrus.Errorf("Failed to update devices: %v", err)
			}
		}
	}
}

// updateDevices fetches the latest device states from the bridge
func (h *HueService) updateDevices() error {
	if h.baseURL == "" {
		return fmt.Errorf("bridge not configured")
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Update lights
	if err := h.updateLights(); err != nil {
		return fmt.Errorf("failed to update lights: %w", err)
	}

	// Update rooms/groups
	if err := h.updateRooms(); err != nil {
		return fmt.Errorf("failed to update rooms: %w", err)
	}

	// Update scenes
	if err := h.updateScenes(); err != nil {
		return fmt.Errorf("failed to update scenes: %w", err)
	}

	h.lastUpdate = time.Now()
	return nil
}

// updateLights fetches all lights from the bridge
func (h *HueService) updateLights() error {
	logrus.Debugf("Updating lights from bridge: %s", h.baseURL+"/lights")
	resp, err := h.httpClient.Get(h.baseURL + "/lights")
	if err != nil {
		logrus.Errorf("Failed to fetch lights from bridge: %v", err)
		return err
	}
	defer resp.Body.Close()

	var lightsData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&lightsData); err != nil {
		logrus.Errorf("Failed to decode lights data: %v", err)
		return err
	}

	logrus.Debugf("Received %d lights from bridge", len(lightsData))
	for lightID, lightData := range lightsData {
		// Extract the state data and merge it with the main light data
		lightMap, ok := lightData.(map[string]interface{})
		if !ok {
			logrus.Warnf("Failed to parse light %s data", lightID)
			continue
		}

		// Extract state data if it exists
		if stateData, exists := lightMap["state"]; exists {
			if stateMap, ok := stateData.(map[string]interface{}); ok {
				// Merge state data into the main light data
				for key, value := range stateMap {
					lightMap[key] = value
				}
			}
		}

		lightBytes, err := json.Marshal(lightMap)
		if err != nil {
			logrus.Warnf("Failed to marshal light %s: %v", lightID, err)
			continue
		}

		var light models.HueLight
		if err := json.Unmarshal(lightBytes, &light); err != nil {
			logrus.Warnf("Failed to unmarshal light %s: %v", lightID, err)
			continue
		}

		light.ID = lightID
		light.LastSeen = time.Now()
		h.lights[lightID] = &light
		logrus.Debugf("Updated light %s: %s (on: %v)", lightID, light.Name, light.IsOn)
	}

	logrus.Debugf("Successfully updated %d lights", len(h.lights))
	return nil
}

// updateRooms fetches all rooms/groups from the bridge
func (h *HueService) updateRooms() error {
	resp, err := h.httpClient.Get(h.baseURL + "/groups")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var groupsData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&groupsData); err != nil {
		return err
	}

	for groupID, groupData := range groupsData {
		groupMap, ok := groupData.(map[string]interface{})
		if !ok {
			continue
		}

		// Extract state data if it exists
		var isOn bool
		var brightness int
		if stateData, exists := groupMap["state"]; exists {
			if stateMap, ok := stateData.(map[string]interface{}); ok {
				if anyOn, exists := stateMap["any_on"]; exists {
					if anyOnBool, ok := anyOn.(bool); ok {
						isOn = anyOnBool
					}
				}
			}
		}

		// Extract action data for brightness
		if actionData, exists := groupMap["action"]; exists {
			if actionMap, ok := actionData.(map[string]interface{}); ok {
				if bri, exists := actionMap["bri"]; exists {
					if briFloat, ok := bri.(float64); ok {
						brightness = int(briFloat)
					}
				}
			}
		}

		groupBytes, err := json.Marshal(groupData)
		if err != nil {
			continue
		}

		var group models.HueGroup
		if err := json.Unmarshal(groupBytes, &group); err != nil {
			continue
		}

		group.ID = groupID
		group.IsOn = isOn
		group.Brightness = brightness
		h.groups[groupID] = &group

		// Also create room entry for room-type groups
		if group.Type == "Room" {
			room := &models.HueRoom{
				ID:         group.ID,
				Name:       group.Name,
				Type:       group.Type,
				Class:      group.Class,
				Lights:     group.Lights,
				IsOn:       isOn,
				Brightness: brightness,
				Hue:        group.Hue,
				Saturation: group.Saturation,
				ColorTemp:  group.ColorTemp,
				ColorMode:  group.ColorMode,
				XY:         group.XY,
				Effect:     group.Effect,
				Alert:      group.Alert,
			}
			h.rooms[groupID] = room
			logrus.Debugf("Updated room %s: %s (on: %v, brightness: %d)", groupID, room.Name, room.IsOn, room.Brightness)
		}
	}

	return nil
}

// updateScenes fetches all scenes from the bridge
func (h *HueService) updateScenes() error {
	resp, err := h.httpClient.Get(h.baseURL + "/scenes")
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var scenesData map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&scenesData); err != nil {
		return err
	}

	for sceneID, sceneData := range scenesData {
		sceneBytes, err := json.Marshal(sceneData)
		if err != nil {
			continue
		}

		var scene models.HueScene
		if err := json.Unmarshal(sceneBytes, &scene); err != nil {
			continue
		}

		scene.ID = sceneID
		h.scenes[sceneID] = &scene
	}

	return nil
}

// GetLights returns all lights
func (h *HueService) GetLights() []*models.HueLight {
	h.mu.RLock()
	defer h.mu.RUnlock()

	lights := make([]*models.HueLight, 0, len(h.lights))
	for _, light := range h.lights {
		lights = append(lights, light)
	}
	return lights
}

// GetRooms returns all rooms
func (h *HueService) GetRooms() []*models.HueRoom {
	h.mu.RLock()
	defer h.mu.RUnlock()

	rooms := make([]*models.HueRoom, 0, len(h.rooms))
	for _, room := range h.rooms {
		rooms = append(rooms, room)
	}
	return rooms
}

// GetScenes returns all scenes
func (h *HueService) GetScenes() []*models.HueScene {
	h.mu.RLock()
	defer h.mu.RUnlock()

	scenes := make([]*models.HueScene, 0, len(h.scenes))
	for _, scene := range h.scenes {
		scenes = append(scenes, scene)
	}
	return scenes
}

// SetLightState updates the state of a specific light
func (h *HueService) SetLightState(lightID string, state *models.HueLightState) error {
	if h.baseURL == "" {
		return fmt.Errorf("bridge not configured")
	}

	stateBytes, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("failed to marshal state: %w", err)
	}

	url := fmt.Sprintf("%s/lights/%s/state", h.baseURL, lightID)
	req, err := http.NewRequest("PUT", url, strings.NewReader(string(stateBytes)))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var responses []models.HueAPIResponse
	if err := json.Unmarshal(body, &responses); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Check for errors in the response
	for _, response := range responses {
		if response.Error != nil {
			return fmt.Errorf("API error: %s", response.Error.Description)
		}
	}

	// Refresh the light state after successful update
	if err := h.updateLights(); err != nil {
		logrus.Warnf("Failed to refresh light state after update: %v", err)
	}

	return nil
}

// RefreshLights refreshes the light state from the bridge
func (h *HueService) RefreshLights() error {
	return h.updateLights()
}

// RefreshRooms refreshes the room state from the bridge
func (h *HueService) RefreshRooms() error {
	return h.updateRooms()
}

// SetGroupState updates the state of a specific group/room
func (h *HueService) SetGroupState(groupID string, state *models.HueGroupState) error {
	if h.baseURL == "" {
		return fmt.Errorf("bridge not configured")
	}

	stateBytes, err := json.Marshal(state)
	if err != nil {
		return fmt.Errorf("failed to marshal state: %w", err)
	}

	url := fmt.Sprintf("%s/groups/%s/action", h.baseURL, groupID)
	req, err := http.NewRequest("PUT", url, strings.NewReader(string(stateBytes)))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var responses []models.HueAPIResponse
	if err := json.Unmarshal(body, &responses); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Check for errors in the response
	for _, response := range responses {
		if response.Error != nil {
			return fmt.Errorf("API error: %s", response.Error.Description)
		}
	}

	// Refresh the group and light states after successful update
	if err := h.updateRooms(); err != nil {
		logrus.Warnf("Failed to refresh group state after update: %v", err)
	}
	if err := h.updateLights(); err != nil {
		logrus.Warnf("Failed to refresh light state after update: %v", err)
	}

	return nil
}

// ActivateScene activates a specific scene
func (h *HueService) ActivateScene(sceneID string) error {
	if h.baseURL == "" {
		return fmt.Errorf("bridge not configured")
	}

	url := fmt.Sprintf("%s/scenes/%s", h.baseURL, sceneID)
	req, err := http.NewRequest("PUT", url, strings.NewReader(`{"recall":{"action":"activate"}}`))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var responses []models.HueAPIResponse
	if err := json.Unmarshal(body, &responses); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Check for errors in the response
	for _, response := range responses {
		if response.Error != nil {
			return fmt.Errorf("API error: %s", response.Error.Description)
		}
	}

	return nil
}

// GetBridgeInfo returns information about the connected bridge
func (h *HueService) GetBridgeInfo() (*models.HueBridge, error) {
	if h.baseURL == "" {
		return nil, fmt.Errorf("bridge not configured")
	}

	resp, err := h.httpClient.Get(h.baseURL + "/config")
	if err != nil {
		return nil, fmt.Errorf("failed to get bridge info: %w", err)
	}
	defer resp.Body.Close()

	var config map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&config); err != nil {
		return nil, fmt.Errorf("failed to decode bridge config: %w", err)
	}

	bridge := &models.HueBridge{
		ID:       h.config.BridgeIP,
		IP:       h.config.BridgeIP,
		Username: h.config.Username,
		IsOnline: true,
		LastSeen: time.Now(),
	}

	if name, ok := config["name"].(string); ok {
		bridge.Name = name
	}
	if version, ok := config["swversion"].(string); ok {
		bridge.SwVersion = version
	}
	if api, ok := config["apiversion"].(string); ok {
		bridge.API = api
	}

	return bridge, nil
}

// GetAuthStatus returns the current authentication status
func (h *HueService) GetAuthStatus() *models.HueAuthStatus {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.authStatus
}

// StartAuth initiates the authentication process with the bridge
func (h *HueService) StartAuth() error {
	if h.config.BridgeIP == "" {
		return fmt.Errorf("bridge IP not configured")
	}

	// Create auth request
	authReq := &models.HueAuthRequest{
		Devicetype: "WoodHome WebApp#WoodHome",
	}

	authBytes, err := json.Marshal(authReq)
	if err != nil {
		return fmt.Errorf("failed to marshal auth request: %w", err)
	}

	// Send auth request to bridge
	url := fmt.Sprintf("http://%s/api", h.config.BridgeIP)
	resp, err := h.httpClient.Post(url, "application/json", strings.NewReader(string(authBytes)))
	if err != nil {
		return fmt.Errorf("failed to send auth request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read auth response: %w", err)
	}

	var authResponses []models.HueAuthResponse
	if err := json.Unmarshal(body, &authResponses); err != nil {
		return fmt.Errorf("failed to unmarshal auth response: %w", err)
	}

	// Check for errors in the response
	for _, authResp := range authResponses {
		if authResp.Error != nil {
			if authResp.Error.Type == 101 { // Link button not pressed
				return fmt.Errorf("please press the link button on your Hue bridge and try again")
			}
			return fmt.Errorf("authentication error: %s", authResp.Error.Description)
		}
		if authResp.Success != nil {
			// Authentication successful
			h.mu.Lock()
			h.config.Username = authResp.Success.Username
			h.authStatus.IsAuthenticated = true
			h.authStatus.Username = authResp.Success.Username
			h.authStatus.RequiresAuth = false
			h.authStatus.LastAuth = time.Now()
			h.baseURL = fmt.Sprintf("http://%s/api/%s", h.config.BridgeIP, authResp.Success.Username)
			h.mu.Unlock()

			logrus.Infof("Successfully authenticated with Hue bridge. Username: %s", authResp.Success.Username)
			return nil
		}
	}

	return fmt.Errorf("unexpected authentication response")
}

// TestAuth tests if the current authentication is valid
func (h *HueService) TestAuth() error {
	if h.baseURL == "" {
		return fmt.Errorf("not authenticated")
	}

	resp, err := h.httpClient.Get(h.baseURL + "/config")
	if err != nil {
		return fmt.Errorf("failed to test authentication: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		h.mu.Lock()
		h.authStatus.IsAuthenticated = false
		h.authStatus.RequiresAuth = true
		h.mu.Unlock()
		return fmt.Errorf("authentication expired")
	}

	return nil
}

// loadAuthConfig loads authentication configuration from environment variables
func (h *HueService) loadAuthConfig() error {
	// Load from environment variables
	bridgeIP := os.Getenv("HUE_BRIDGE_IP")
	username := os.Getenv("HUE_USERNAME")

	if bridgeIP == "" || username == "" {
		return fmt.Errorf("HUE_BRIDGE_IP and HUE_USERNAME environment variables not set")
	}

	h.config.BridgeIP = bridgeIP
	h.config.Username = username
	h.authStatus.BridgeIP = bridgeIP
	h.authStatus.Username = username
	h.authStatus.IsAuthenticated = true
	h.authStatus.RequiresAuth = false

	logrus.Infof("Loaded Hue authentication from environment - Bridge: %s, Username: %s",
		bridgeIP, username)
	return nil
}

// SaveAuthConfig saves the authentication configuration (for offline use)
func (h *HueService) SaveAuthConfig() error {
	// Log the configuration for reference
	logrus.Infof("Hue authentication configured - Bridge: %s, Username: %s",
		h.config.BridgeIP, h.config.Username)
	logrus.Info("To configure Hue authentication, set environment variables:")
	logrus.Info("  HUE_BRIDGE_IP=<your-bridge-ip>")
	logrus.Info("  HUE_USERNAME=<your-username>")
	return nil
}
