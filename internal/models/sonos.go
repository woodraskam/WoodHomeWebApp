package models

import (
	"encoding/json"
	"time"
)

// SonosDevice represents a Sonos device
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

// SonosGroup represents a group of Sonos devices
type SonosGroup struct {
	ID           string         `json:"id"`
	Coordinator  *SonosDevice   `json:"coordinator"`
	Members      []*SonosDevice `json:"members"`
	Volume       int            `json:"volume"`
	Mute         bool           `json:"mute"`
	State        string         `json:"state"`
	CurrentTrack *TrackInfo     `json:"current_track"`
}

// TrackInfo represents current track information
type TrackInfo struct {
	Artist string `json:"artist"`
	Title  string `json:"title"`
	Album  string `json:"album"`
	Art    string `json:"art"`
}

// SonosServiceConfig represents configuration for Sonos service
type SonosServiceConfig struct {
	JishiURL     string        `json:"jishi_url"`
	Timeout      time.Duration `json:"timeout"`
	RetryCount   int           `json:"retry_count"`
	PollInterval time.Duration `json:"poll_interval"`
}

// NewSonosDevice creates a new SonosDevice instance
func NewSonosDevice(uuid, name, room string) *SonosDevice {
	return &SonosDevice{
		UUID:     uuid,
		Name:     name,
		Room:     room,
		IsOnline: false,
		Volume:   0,
		Mute:     false,
		State:    "STOPPED",
		LastSeen: time.Now(),
	}
}

// SetOnline updates the online status and last seen time
func (d *SonosDevice) SetOnline(online bool) {
	d.IsOnline = online
	if online {
		d.LastSeen = time.Now()
	}
}

// ToJSON converts the device to JSON string
func (d *SonosDevice) ToJSON() (string, error) {
	jsonBytes, err := json.Marshal(d)
	if err != nil {
		return "", err
	}
	return string(jsonBytes), nil
}

// FromJSON creates a SonosDevice from JSON string
func (d *SonosDevice) FromJSON(jsonStr string) error {
	return json.Unmarshal([]byte(jsonStr), d)
}

// IsGrouped returns true if the device is part of a group
func (d *SonosDevice) IsGrouped() bool {
	return d.GroupID != "" && d.GroupID != d.UUID
}

// IsCoordinator returns true if the device is a group coordinator
func (d *SonosDevice) IsCoordinator() bool {
	return d.Coordinator == d.UUID
}

// NewSonosGroup creates a new SonosGroup instance
func NewSonosGroup(id string, coordinator *SonosDevice) *SonosGroup {
	return &SonosGroup{
		ID:          id,
		Coordinator: coordinator,
		Members:     []*SonosDevice{coordinator},
		Volume:      coordinator.Volume,
		Mute:        coordinator.Mute,
		State:       coordinator.State,
	}
}

// AddMember adds a member to the group
func (g *SonosGroup) AddMember(device *SonosDevice) {
	g.Members = append(g.Members, device)
	device.GroupID = g.ID
	device.Coordinator = g.Coordinator.UUID
}

// RemoveMember removes a member from the group
func (g *SonosGroup) RemoveMember(device *SonosDevice) {
	for i, member := range g.Members {
		if member.UUID == device.UUID {
			g.Members = append(g.Members[:i], g.Members[i+1:]...)
			device.GroupID = ""
			device.Coordinator = ""
			break
		}
	}
}

// GetMemberCount returns the number of members in the group
func (g *SonosGroup) GetMemberCount() int {
	return len(g.Members)
}

// ToJSON converts the group to JSON string
func (g *SonosGroup) ToJSON() (string, error) {
	jsonBytes, err := json.Marshal(g)
	if err != nil {
		return "", err
	}
	return string(jsonBytes), nil
}

// FromJSON creates a SonosGroup from JSON string
func (g *SonosGroup) FromJSON(jsonStr string) error {
	return json.Unmarshal([]byte(jsonStr), g)
}
