package models

import (
	"time"
)

// HueBridge represents a Philips Hue bridge
type HueBridge struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	IP           string    `json:"ip"`
	Username     string    `json:"username"`
	IsOnline     bool      `json:"is_online"`
	LastSeen     time.Time `json:"last_seen"`
	Version      string    `json:"version"`
	ModelID      string    `json:"model_id"`
	SwVersion    string    `json:"sw_version"`
	API          string    `json:"api"`
	NetMask      string    `json:"netmask"`
	Gateway      string    `json:"gateway"`
	ProxyAddress string    `json:"proxy_address"`
	ProxyPort    int       `json:"proxy_port"`
}

// HueLight represents a Philips Hue light
type HueLight struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	ModelID      string    `json:"modelid"`
	Manufacturer string    `json:"manufacturername"`
	ProductName  string    `json:"productname"`
	UniqueID     string    `json:"uniqueid"`
	RoomID       string    `json:"room_id"`
	RoomName     string    `json:"room_name"`
	IsOn         bool      `json:"on"`
	Brightness   int       `json:"bri"`        // 0-254
	Hue          int       `json:"hue"`        // 0-65535
	Saturation   int       `json:"sat"`        // 0-254
	ColorTemp    int       `json:"ct"`         // 153-500 (mired)
	ColorMode    string    `json:"colormode"`  // "xy", "ct", "hs"
	XY           []float64 `json:"xy"`         // [x, y] color coordinates
	IsReachable  bool      `json:"reachable"`
	LastSeen     time.Time `json:"last_seen"`
	Effect       string    `json:"effect"` // "none", "colorloop"
	Alert        string    `json:"alert"`  // "none", "select", "lselect"
}

// HueRoom represents a Philips Hue room/zone
type HueRoom struct {
	ID           string      `json:"id"`
	Name         string      `json:"name"`
	Type         string      `json:"type"`
	Class        string      `json:"class"`
	Lights       []string    `json:"lights"` // Light IDs
	LightObjects []*HueLight `json:"light_objects,omitempty"`
	IsOn         bool        `json:"is_on"`
	Brightness   int         `json:"brightness"`
	Hue          int         `json:"hue"`
	Saturation   int         `json:"saturation"`
	ColorTemp    int         `json:"color_temp"`
	ColorMode    string      `json:"color_mode"`
	XY           []float64   `json:"xy"`
	Effect       string      `json:"effect"`
	Alert        string      `json:"alert"`
}

// HueScene represents a Philips Hue scene
type HueScene struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Type        string                 `json:"type"`
	Group       string                 `json:"group"` // Room ID
	Lights      []string               `json:"lights"`
	Owner       string                 `json:"owner"`
	Recycle     bool                   `json:"recycle"`
	Locked      bool                   `json:"locked"`
	AppData     map[string]interface{} `json:"app_data"`
	Picture     string                 `json:"picture"`
	LastUpdated time.Time              `json:"last_updated"`
	Version     int                    `json:"version"`
}

// HueGroup represents a Philips Hue group (room or zone)
type HueGroup struct {
	ID           string      `json:"id"`
	Name         string      `json:"name"`
	Type         string      `json:"type"`
	Class        string      `json:"class"`
	Lights       []string    `json:"lights"`
	LightObjects []*HueLight `json:"light_objects,omitempty"`
	IsOn         bool        `json:"is_on"`
	Brightness   int         `json:"brightness"`
	Hue          int         `json:"hue"`
	Saturation   int         `json:"saturation"`
	ColorTemp    int         `json:"color_temp"`
	ColorMode    string      `json:"color_mode"`
	XY           []float64   `json:"xy"`
	Effect       string      `json:"effect"`
	Alert        string      `json:"alert"`
}

// HueServiceConfig represents configuration for Hue service
type HueServiceConfig struct {
	BridgeIP     string        `json:"bridge_ip"`
	Username     string        `json:"username"`
	Timeout      time.Duration `json:"timeout"`
	RetryCount   int           `json:"retry_count"`
	PollInterval time.Duration `json:"poll_interval"`
	AutoDiscover bool          `json:"auto_discover"`
	AuthRequired bool          `json:"auth_required"`
}

// HueAuthRequest represents a request to authenticate with Hue bridge
type HueAuthRequest struct {
	Devicetype string `json:"devicetype"`
	Username   string `json:"username,omitempty"`
}

// HueAuthResponse represents the response from Hue bridge authentication
type HueAuthResponse struct {
	Success *HueAuthSuccess `json:"success,omitempty"`
	Error   *HueAPIError    `json:"error,omitempty"`
}

// HueAuthSuccess represents successful authentication response
type HueAuthSuccess struct {
	Username string `json:"username"`
}

// HueAuthStatus represents the current authentication status
type HueAuthStatus struct {
	IsAuthenticated bool      `json:"is_authenticated"`
	Username        string    `json:"username,omitempty"`
	BridgeIP        string    `json:"bridge_ip,omitempty"`
	LastAuth        time.Time `json:"last_auth,omitempty"`
	RequiresAuth    bool      `json:"requires_auth"`
}

// HueAPIResponse represents a generic API response
type HueAPIResponse struct {
	Success map[string]interface{} `json:"success,omitempty"`
	Error   *HueAPIError           `json:"error,omitempty"`
}

// HueAPIError represents an API error response
type HueAPIError struct {
	Type        int    `json:"type"`
	Address     string `json:"address"`
	Description string `json:"description"`
}

// HueLightState represents the state of a light
type HueLightState struct {
	On             *bool     `json:"on,omitempty"`
	Brightness     *int      `json:"bri,omitempty"`
	Hue            *int      `json:"hue,omitempty"`
	Saturation     *int      `json:"sat,omitempty"`
	ColorTemp      *int      `json:"ct,omitempty"`
	XY             []float64 `json:"xy,omitempty"`
	Effect         *string   `json:"effect,omitempty"`
	Alert          *string   `json:"alert,omitempty"`
	TransitionTime *int      `json:"transitiontime,omitempty"`
}

// HueGroupState represents the state of a group
type HueGroupState struct {
	On             *bool     `json:"on,omitempty"`
	Brightness     *int      `json:"bri,omitempty"`
	Hue            *int      `json:"hue,omitempty"`
	Saturation     *int      `json:"sat,omitempty"`
	ColorTemp      *int      `json:"ct,omitempty"`
	XY             []float64 `json:"xy,omitempty"`
	Effect         *string   `json:"effect,omitempty"`
	Alert          *string   `json:"alert,omitempty"`
	TransitionTime *int      `json:"transitiontime,omitempty"`
}

// HueDiscoveryResponse represents the response from bridge discovery
type HueDiscoveryResponse struct {
	ID                string `json:"id"`
	InternalIPAddress string `json:"internalipaddress"`
	Port              int    `json:"port"`
	Username          string `json:"username"`
	MacAddress        string `json:"mac"`
	BridgeID          string `json:"bridgeid"`
	ModelID           string `json:"modelid"`
	SwVersion         string `json:"swversion"`
	APIVersion        string `json:"apiversion"`
	Name              string `json:"name"`
}
