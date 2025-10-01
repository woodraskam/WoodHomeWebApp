package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"woodhome-webapp/internal/services"

	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
)

// SonosHandler handles HTTP requests for Sonos operations
type SonosHandler struct {
	sonosService *services.SonosService
}

// NewSonosHandler creates a new SonosHandler instance
func NewSonosHandler(sonosService *services.SonosService) *SonosHandler {
	return &SonosHandler{
		sonosService: sonosService,
	}
}

// RegisterRoutes registers all Sonos routes
func (h *SonosHandler) RegisterRoutes(router *mux.Router) {
	sonosRouter := router.PathPrefix("/api/sonos").Subrouter()

	// Device routes
	sonosRouter.HandleFunc("/devices", h.GetDevices).Methods("GET")
	sonosRouter.HandleFunc("/devices/{uuid}", h.GetDevice).Methods("GET")

	// Group routes
	sonosRouter.HandleFunc("/groups", h.GetGroups).Methods("GET")
	sonosRouter.HandleFunc("/groups/{id}", h.GetGroup).Methods("GET")

	// Playback routes
	sonosRouter.HandleFunc("/devices/{uuid}/play", h.PlayDevice).Methods("POST")
	sonosRouter.HandleFunc("/devices/{uuid}/pause", h.PauseDevice).Methods("POST")
	sonosRouter.HandleFunc("/devices/{uuid}/stop", h.StopDevice).Methods("POST")
	sonosRouter.HandleFunc("/devices/{uuid}/next", h.NextTrack).Methods("POST")
	sonosRouter.HandleFunc("/devices/{uuid}/previous", h.PreviousTrack).Methods("POST")

	// Volume routes
	sonosRouter.HandleFunc("/devices/{uuid}/volume/{volume}", h.SetVolume).Methods("POST")
	sonosRouter.HandleFunc("/devices/{uuid}/mute", h.SetMute).Methods("POST")

	// Group routes
	sonosRouter.HandleFunc("/groups/{id}/play", h.PlayGroup).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/pause", h.PauseGroup).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/stop", h.StopGroup).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/volume/{volume}", h.SetGroupVolume).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/mute", h.SetGroupMute).Methods("POST")

	// Group management routes
	sonosRouter.HandleFunc("/groups", h.CreateGroup).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/join/{deviceUuid}", h.JoinGroup).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/leave/{deviceUuid}", h.LeaveGroup).Methods("POST")
	sonosRouter.HandleFunc("/groups/{id}/dissolve", h.DissolveGroup).Methods("POST")
	
	// Jishi server management routes
	sonosRouter.HandleFunc("/jishi/status", h.GetJishiStatus).Methods("GET")
	sonosRouter.HandleFunc("/jishi/start", h.StartJishiServer).Methods("POST")
	sonosRouter.HandleFunc("/jishi/stop", h.StopJishiServer).Methods("POST")
	sonosRouter.HandleFunc("/jishi/restart", h.RestartJishiServer).Methods("POST")
}

// GetDevices returns all discovered devices
func (h *SonosHandler) GetDevices(w http.ResponseWriter, r *http.Request) {
	devices := h.sonosService.GetDevices()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"devices": devices,
		"count":   len(devices),
	})
}

// GetDevice returns a specific device
func (h *SonosHandler) GetDevice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(device)
}

// GetGroups returns all active groups
func (h *SonosHandler) GetGroups(w http.ResponseWriter, r *http.Request) {
	groups := h.sonosService.GetGroups()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"groups": groups,
		"count":  len(groups),
	})
}

// GetGroup returns a specific group
func (h *SonosHandler) GetGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	group, exists := h.sonosService.GetGroup(id)
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(group)
}

// PlayDevice plays a specific device
func (h *SonosHandler) PlayDevice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.PlayDevice(ctx, device.Name); err != nil {
		logrus.Errorf("Failed to play device %s: %v", device.Name, err)
		http.Error(w, "Failed to play device: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Playing device: %s", device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "play",
		"device": device.Name,
	})
}

// PauseDevice pauses a specific device
func (h *SonosHandler) PauseDevice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.PauseDevice(ctx, device.Name); err != nil {
		logrus.Errorf("Failed to pause device %s: %v", device.Name, err)
		http.Error(w, "Failed to pause device: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Pausing device: %s", device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "pause",
		"device": device.Name,
	})
}

// StopDevice stops a specific device
func (h *SonosHandler) StopDevice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.StopDevice(ctx, device.Name); err != nil {
		logrus.Errorf("Failed to stop device %s: %v", device.Name, err)
		http.Error(w, "Failed to stop device: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Stopping device: %s", device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "stop",
		"device": device.Name,
	})
}

// NextTrack skips to next track on a device
func (h *SonosHandler) NextTrack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.NextTrack(ctx, device.Name); err != nil {
		logrus.Errorf("Failed to skip to next track on device %s: %v", device.Name, err)
		http.Error(w, "Failed to skip to next track: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Next track on device: %s", device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "next",
		"device": device.Name,
	})
}

// PreviousTrack skips to previous track on a device
func (h *SonosHandler) PreviousTrack(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.PreviousTrack(ctx, device.Name); err != nil {
		logrus.Errorf("Failed to skip to previous track on device %s: %v", device.Name, err)
		http.Error(w, "Failed to skip to previous track: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Previous track on device: %s", device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "previous",
		"device": device.Name,
	})
}

// SetVolume sets volume for a device
func (h *SonosHandler) SetVolume(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]
	volumeStr := vars["volume"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	// Parse volume from URL parameter
	volume, err := strconv.Atoi(volumeStr)
	if err != nil {
		http.Error(w, "Invalid volume parameter", http.StatusBadRequest)
		return
	}

	if volume < 0 || volume > 100 {
		http.Error(w, "Volume must be between 0 and 100", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.SetVolume(ctx, device.Name, volume); err != nil {
		logrus.Errorf("Failed to set volume on device %s: %v", device.Name, err)
		http.Error(w, "Failed to set volume: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Setting volume to %d on device: %s", volume, device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"action": "volume",
		"device": device.Name,
		"volume": volume,
	})
}

// SetMute sets mute state for a device
func (h *SonosHandler) SetMute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uuid := vars["uuid"]

	device, exists := h.sonosService.GetDevice(uuid)
	if !exists {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	// Parse mute from request body
	var request struct {
		Mute bool `json:"mute"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.SetMute(ctx, device.Name, request.Mute); err != nil {
		logrus.Errorf("Failed to set mute on device %s: %v", device.Name, err)
		http.Error(w, "Failed to set mute: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Setting mute to %t on device: %s", request.Mute, device.Name)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"action": "mute",
		"device": device.Name,
		"mute":   request.Mute,
	})
}

// PlayGroup plays a group
func (h *SonosHandler) PlayGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	group, exists := h.sonosService.GetGroup(id)
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.PlayGroup(ctx, group.Coordinator.Name); err != nil {
		logrus.Errorf("Failed to play group %s: %v", group.ID, err)
		http.Error(w, "Failed to play group: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Playing group: %s", group.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "play",
		"group":  group.ID,
	})
}

// PauseGroup pauses a group
func (h *SonosHandler) PauseGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	group, exists := h.sonosService.GetGroup(id)
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// TODO: Implement actual group pause command via Jishi API
	logrus.Infof("Pausing group: %s", group.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "pause",
		"group":  group.ID,
	})
}

// StopGroup stops a group
func (h *SonosHandler) StopGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	group, exists := h.sonosService.GetGroup(id)
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// TODO: Implement actual group stop command via Jishi API
	logrus.Infof("Stopping group: %s", group.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "stop",
		"group":  group.ID,
	})
}

// SetGroupVolume sets volume for a group
func (h *SonosHandler) SetGroupVolume(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	volumeStr := vars["volume"]

	group, exists := h.sonosService.GetGroup(id)
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Parse volume from URL parameter
	volume, err := strconv.Atoi(volumeStr)
	if err != nil {
		http.Error(w, "Invalid volume parameter", http.StatusBadRequest)
		return
	}

	if volume < 0 || volume > 100 {
		http.Error(w, "Volume must be between 0 and 100", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.SetGroupVolume(ctx, group.Coordinator.Name, volume); err != nil {
		logrus.Errorf("Failed to set group volume on group %s: %v", group.ID, err)
		http.Error(w, "Failed to set group volume: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Setting group volume to %d on group: %s", volume, group.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"action": "volume",
		"group":  group.ID,
		"volume": volume,
	})
}

// SetGroupMute sets mute state for a group
func (h *SonosHandler) SetGroupMute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	group, exists := h.sonosService.GetGroup(id)
	if !exists {
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Parse mute from request body
	var request struct {
		Mute bool `json:"mute"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// TODO: Implement actual group mute command via Jishi API
	logrus.Infof("Setting group mute to %t on group: %s", request.Mute, group.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"action": "mute",
		"group":  group.ID,
		"mute":   request.Mute,
	})
}

// CreateGroup creates a new group
func (h *SonosHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Coordinator string   `json:"coordinator"`
		Members     []string `json:"members"`
	}
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	if err := h.sonosService.CreateGroup(ctx, request.Coordinator, request.Members); err != nil {
		logrus.Errorf("Failed to create group: %v", err)
		http.Error(w, "Failed to create group: "+err.Error(), http.StatusInternalServerError)
		return
	}

	logrus.Infof("Creating group with coordinator: %s, members: %v", request.Coordinator, request.Members)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "success",
		"action":      "create_group",
		"coordinator": request.Coordinator,
		"members":     request.Members,
	})
}

// JoinGroup adds a device to a group
func (h *SonosHandler) JoinGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	deviceUuid := vars["deviceUuid"]

	// TODO: Implement actual join group command via Jishi API
	logrus.Infof("Adding device %s to group %s", deviceUuid, id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "join_group",
		"group":  id,
		"device": deviceUuid,
	})
}

// LeaveGroup removes a device from a group
func (h *SonosHandler) LeaveGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	deviceUuid := vars["deviceUuid"]

	// TODO: Implement actual leave group command via Jishi API
	logrus.Infof("Removing device %s from group %s", deviceUuid, id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "leave_group",
		"group":  id,
		"device": deviceUuid,
	})
}

// DissolveGroup dissolves a group
func (h *SonosHandler) DissolveGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	// TODO: Implement actual group dissolution via Jishi API
	logrus.Infof("Dissolving group: %s", id)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "dissolve_group",
		"group":  id,
	})
}

// Jishi Server Management Handlers

// GetJishiStatus returns the status of the Jishi server
func (h *SonosHandler) GetJishiStatus(w http.ResponseWriter, r *http.Request) {
	status := h.sonosService.GetJishiStatus()
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// StartJishiServer starts the internal Jishi server
func (h *SonosHandler) StartJishiServer(w http.ResponseWriter, r *http.Request) {
	if err := h.sonosService.StartJishiServer(); err != nil {
		logrus.Errorf("Failed to start Jishi server: %v", err)
		http.Error(w, "Failed to start Jishi server: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	logrus.Info("Jishi server started successfully")
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "start_jishi",
		"message": "Jishi server started successfully",
	})
}

// StopJishiServer stops the internal Jishi server
func (h *SonosHandler) StopJishiServer(w http.ResponseWriter, r *http.Request) {
	if err := h.sonosService.StopJishiServer(); err != nil {
		logrus.Errorf("Failed to stop Jishi server: %v", err)
		http.Error(w, "Failed to stop Jishi server: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	logrus.Info("Jishi server stopped successfully")
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "stop_jishi",
		"message": "Jishi server stopped successfully",
	})
}

// RestartJishiServer restarts the internal Jishi server
func (h *SonosHandler) RestartJishiServer(w http.ResponseWriter, r *http.Request) {
	if err := h.sonosService.RestartJishiServer(); err != nil {
		logrus.Errorf("Failed to restart Jishi server: %v", err)
		http.Error(w, "Failed to restart Jishi server: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	logrus.Info("Jishi server restarted successfully")
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"action": "restart_jishi",
		"message": "Jishi server restarted successfully",
	})
}
