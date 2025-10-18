package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"woodhome-webapp/internal/models"
	"woodhome-webapp/internal/services"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
)

// HueHandler handles HTTP requests for Hue operations
type HueHandler struct {
	hueService *services.HueService
}

// NewHueHandler creates a new HueHandler
func NewHueHandler(hueService *services.HueService) *HueHandler {
	return &HueHandler{
		hueService: hueService,
	}
}

// RegisterRoutes registers all Hue routes
func (h *HueHandler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/lights", h.GetLights).Methods("GET")
	router.HandleFunc("/rooms", h.GetRooms).Methods("GET")
	router.HandleFunc("/lights/{id}/toggle", h.ToggleLight).Methods("POST")
	router.HandleFunc("/rooms/{id}/toggle", h.ToggleGroup).Methods("POST")
	router.HandleFunc("/groups/{id}/toggle", h.ToggleGroup).Methods("POST")
}

// GetLights returns all lights
func (h *HueHandler) GetLights(w http.ResponseWriter, r *http.Request) {
	lights := h.hueService.GetLights()

	// Disable caching
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(lights); err != nil {
		logrus.Errorf("Failed to encode lights response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// GetRooms returns all rooms
func (h *HueHandler) GetRooms(w http.ResponseWriter, r *http.Request) {
	rooms := h.hueService.GetRooms()

	// Disable caching
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(rooms); err != nil {
		logrus.Errorf("Failed to encode rooms response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// GetScenes returns all scenes
func (h *HueHandler) GetScenes(w http.ResponseWriter, r *http.Request) {
	scenes := h.hueService.GetScenes()

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(scenes); err != nil {
		logrus.Errorf("Failed to encode scenes response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// GetBridgeInfo returns bridge information
func (h *HueHandler) GetBridgeInfo(w http.ResponseWriter, r *http.Request) {
	bridge, err := h.hueService.GetBridgeInfo()
	if err != nil {
		logrus.Errorf("Failed to get bridge info: %v", err)
		http.Error(w, "Failed to get bridge info", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(bridge); err != nil {
		logrus.Errorf("Failed to encode bridge info response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// SetLightState updates the state of a specific light
func (h *HueHandler) SetLightState(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lightID := vars["id"]

	if lightID == "" {
		http.Error(w, "Light ID is required", http.StatusBadRequest)
		return
	}

	var state models.HueLightState
	if err := json.NewDecoder(r.Body).Decode(&state); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.hueService.SetLightState(lightID, &state); err != nil {
		logrus.Errorf("Failed to set light state: %v", err)
		http.Error(w, "Failed to set light state", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// SetGroupState updates the state of a specific group/room
func (h *HueHandler) SetGroupState(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID := vars["id"]

	if groupID == "" {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	var state models.HueGroupState
	if err := json.NewDecoder(r.Body).Decode(&state); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := h.hueService.SetGroupState(groupID, &state); err != nil {
		logrus.Errorf("Failed to set group state: %v", err)
		http.Error(w, "Failed to set group state", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// ActivateScene activates a specific scene
func (h *HueHandler) ActivateScene(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sceneID := vars["id"]

	if sceneID == "" {
		http.Error(w, "Scene ID is required", http.StatusBadRequest)
		return
	}

	if err := h.hueService.ActivateScene(sceneID); err != nil {
		logrus.Errorf("Failed to activate scene: %v", err)
		http.Error(w, "Failed to activate scene", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// ToggleLight toggles a light on/off
func (h *HueHandler) ToggleLight(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lightID := vars["id"]

	if lightID == "" {
		http.Error(w, "Light ID is required", http.StatusBadRequest)
		return
	}

	// Refresh light state from bridge to get current state
	if err := h.hueService.RefreshLights(); err != nil {
		logrus.Warnf("Failed to refresh lights before toggle: %v", err)
	}

	// Get current light state from bridge to determine toggle action
	lights := h.hueService.GetLights()
	var currentLight *models.HueLight
	for _, light := range lights {
		if light.ID == lightID {
			currentLight = light
			break
		}
	}

	if currentLight == nil {
		http.Error(w, "Light not found", http.StatusNotFound)
		return
	}

	// Toggle the light state (use the actual current state from bridge)
	newState := !currentLight.IsOn
	state := &models.HueLightState{
		On: &newState,
	}

	if err := h.hueService.SetLightState(lightID, state); err != nil {
		logrus.Errorf("Failed to toggle light: %v", err)
		http.Error(w, "Failed to toggle light", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"on":     newState,
	})
}

// ToggleGroup toggles a group/room on/off
func (h *HueHandler) ToggleGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID := vars["id"]

	if groupID == "" {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	// Get current group state to determine toggle action
	rooms := h.hueService.GetRooms()
	var currentRoom *models.HueRoom
	for _, room := range rooms {
		if room.ID == groupID {
			currentRoom = room
			break
		}
	}

	if currentRoom == nil {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Toggle the group state
	newState := !currentRoom.IsOn
	state := &models.HueGroupState{
		On: &newState,
	}

	if err := h.hueService.SetGroupState(groupID, state); err != nil {
		logrus.Errorf("Failed to toggle group: %v", err)
		http.Error(w, "Failed to toggle group", http.StatusInternalServerError)
		return
	}

	// Refresh room state from bridge to get current state
	if err := h.hueService.RefreshRooms(); err != nil {
		logrus.Warnf("Failed to refresh rooms after toggle: %v", err)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"on":     newState,
	})
}

// SetLightBrightness sets the brightness of a specific light
func (h *HueHandler) SetLightBrightness(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lightID := vars["id"]

	if lightID == "" {
		http.Error(w, "Light ID is required", http.StatusBadRequest)
		return
	}

	// Parse brightness from query parameter
	brightnessStr := r.URL.Query().Get("brightness")
	if brightnessStr == "" {
		http.Error(w, "Brightness parameter is required", http.StatusBadRequest)
		return
	}

	brightness, err := strconv.Atoi(brightnessStr)
	if err != nil || brightness < 0 || brightness > 254 {
		http.Error(w, "Invalid brightness value (0-254)", http.StatusBadRequest)
		return
	}

	state := &models.HueLightState{
		Brightness: &brightness,
	}

	if err := h.hueService.SetLightState(lightID, state); err != nil {
		logrus.Errorf("Failed to set light brightness: %v", err)
		http.Error(w, "Failed to set light brightness", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "success",
		"brightness": brightness,
	})
}

// SetGroupBrightness sets the brightness of a specific group/room
func (h *HueHandler) SetGroupBrightness(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID := vars["id"]

	if groupID == "" {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	// Parse brightness from query parameter
	brightnessStr := r.URL.Query().Get("brightness")
	if brightnessStr == "" {
		http.Error(w, "Brightness parameter is required", http.StatusBadRequest)
		return
	}

	brightness, err := strconv.Atoi(brightnessStr)
	if err != nil || brightness < 0 || brightness > 254 {
		http.Error(w, "Invalid brightness value (0-254)", http.StatusBadRequest)
		return
	}

	state := &models.HueGroupState{
		Brightness: &brightness,
	}

	if err := h.hueService.SetGroupState(groupID, state); err != nil {
		logrus.Errorf("Failed to set group brightness: %v", err)
		http.Error(w, "Failed to set group brightness", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "success",
		"brightness": brightness,
	})
}

// SetLightColor sets the color of a specific light
func (h *HueHandler) SetLightColor(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	lightID := vars["id"]

	if lightID == "" {
		http.Error(w, "Light ID is required", http.StatusBadRequest)
		return
	}

	var colorRequest struct {
		Hue        *int      `json:"hue,omitempty"`
		Saturation *int      `json:"saturation,omitempty"`
		ColorTemp  *int      `json:"color_temp,omitempty"`
		XY         []float64 `json:"xy,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&colorRequest); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	state := &models.HueLightState{
		Hue:        colorRequest.Hue,
		Saturation: colorRequest.Saturation,
		ColorTemp:  colorRequest.ColorTemp,
		XY:         colorRequest.XY,
	}

	if err := h.hueService.SetLightState(lightID, state); err != nil {
		logrus.Errorf("Failed to set light color: %v", err)
		http.Error(w, "Failed to set light color", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// SetGroupColor sets the color of a specific group/room
func (h *HueHandler) SetGroupColor(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID := vars["id"]

	if groupID == "" {
		http.Error(w, "Group ID is required", http.StatusBadRequest)
		return
	}

	var colorRequest struct {
		Hue        *int      `json:"hue,omitempty"`
		Saturation *int      `json:"saturation,omitempty"`
		ColorTemp  *int      `json:"color_temp,omitempty"`
		XY         []float64 `json:"xy,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&colorRequest); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	state := &models.HueGroupState{
		Hue:        colorRequest.Hue,
		Saturation: colorRequest.Saturation,
		ColorTemp:  colorRequest.ColorTemp,
		XY:         colorRequest.XY,
	}

	if err := h.hueService.SetGroupState(groupID, state); err != nil {
		logrus.Errorf("Failed to set group color: %v", err)
		http.Error(w, "Failed to set group color", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// GetSystemStatus returns the overall Hue system status
func (h *HueHandler) GetSystemStatus(w http.ResponseWriter, r *http.Request) {
	lights := h.hueService.GetLights()
	rooms := h.hueService.GetRooms()
	scenes := h.hueService.GetScenes()
	bridge, err := h.hueService.GetBridgeInfo()

	status := map[string]interface{}{
		"bridge": bridge,
		"lights": map[string]interface{}{
			"total":   len(lights),
			"online":  countOnlineLights(lights),
			"offline": countOfflineLights(lights),
		},
		"rooms": map[string]interface{}{
			"total": len(rooms),
		},
		"scenes": map[string]interface{}{
			"total": len(scenes),
		},
		"last_update": time.Now(),
	}

	if err != nil {
		status["bridge_error"] = err.Error()
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(status); err != nil {
		logrus.Errorf("Failed to encode system status response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// Note: Authentication methods removed for security
// Hue authentication should be configured offline using environment variables

// Helper functions
func countOnlineLights(lights []*models.HueLight) int {
	count := 0
	for _, light := range lights {
		if light.IsReachable {
			count++
		}
	}
	return count
}

func countOfflineLights(lights []*models.HueLight) int {
	count := 0
	for _, light := range lights {
		if !light.IsReachable {
			count++
		}
	}
	return count
}
