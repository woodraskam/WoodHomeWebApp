package services

import (
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// JishiServerManager manages the internal Jishi server process
type JishiServerManager struct {
	process    *exec.Cmd
	httpClient *http.Client
	jishiURL   string
	mu         sync.RWMutex
	isRunning  bool
	port       int
}

// NewJishiServerManager creates a new JishiServerManager instance
func NewJishiServerManager(port int) *JishiServerManager {
	return &JishiServerManager{
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		jishiURL: fmt.Sprintf("http://localhost:%d", port),
		port:     port,
	}
}

// StartJishi starts the Jishi Node.js server
func (jsm *JishiServerManager) StartJishi() error {
	jsm.mu.Lock()
	defer jsm.mu.Unlock()

	// Check if already running
	if jsm.isRunning {
		logrus.Info("Jishi server is already running")
		return nil
	}

	// Check if Node.js is available
	if !jsm.isNodeAvailable() {
		return fmt.Errorf("Node.js is not available. Please install Node.js to use Jishi")
	}

	// Check if Jishi is already running on the port
	if jsm.IsJishiRunning() {
		logrus.Infof("Jishi server is already running on port %d", jsm.port)
		jsm.isRunning = true
		return nil
	}

	// Get the absolute path to the node-sonos-http-api directory
	jishiPath, err := filepath.Abs("node-sonos-http-api")
	if err != nil {
		return fmt.Errorf("failed to get Jishi path: %w", err)
	}

	// Check if the directory exists
	if _, err := filepath.Glob(filepath.Join(jishiPath, "server.js")); err != nil {
		return fmt.Errorf("Jishi server.js not found in %s. Make sure node-sonos-http-api is properly installed", jishiPath)
	}

	logrus.Infof("Starting Jishi server from %s on port %d", jishiPath, jsm.port)

	// Start Jishi server with custom port
	cmd := exec.Command("node", "server.js")
	cmd.Dir = jishiPath
	cmd.Env = append(cmd.Env, fmt.Sprintf("PORT=%d", jsm.port))
	cmd.Stdout = io.Discard
	cmd.Stderr = io.Discard

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start Jishi server: %w", err)
	}

	jsm.process = cmd
	jsm.isRunning = true

	// Wait for Jishi to start
	logrus.Info("Waiting for Jishi server to start...")
	for i := 0; i < 30; i++ {
		if jsm.IsJishiRunning() {
			logrus.Infof("Jishi server started successfully on port %d", jsm.port)
			return nil
		}
		time.Sleep(1 * time.Second)
	}

	// If we get here, the server didn't start properly
	jsm.isRunning = false
	return fmt.Errorf("Jishi server failed to start within 30 seconds")
}

// StopJishi stops the Jishi Node.js server
func (jsm *JishiServerManager) StopJishi() error {
	jsm.mu.Lock()
	defer jsm.mu.Unlock()

	if !jsm.isRunning {
		logrus.Info("Jishi server is not running")
		return nil
	}

	if jsm.process != nil && jsm.process.Process != nil {
		logrus.Info("Stopping Jishi server...")
		if err := jsm.process.Process.Kill(); err != nil {
			logrus.Errorf("Failed to kill Jishi process: %v", err)
			return err
		}
	}

	jsm.isRunning = false
	jsm.process = nil
	logrus.Info("Jishi server stopped")
	return nil
}

// IsJishiRunning checks if Jishi is running and responding
func (jsm *JishiServerManager) IsJishiRunning() bool {
	resp, err := jsm.httpClient.Get(jsm.jishiURL + "/zones")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

// GetJishiURL returns the Jishi server URL
func (jsm *JishiServerManager) GetJishiURL() string {
	return jsm.jishiURL
}

// GetStatus returns the current status of the Jishi server
func (jsm *JishiServerManager) GetStatus() map[string]interface{} {
	jsm.mu.RLock()
	defer jsm.mu.RUnlock()

	status := map[string]interface{}{
		"is_running": jsm.isRunning,
		"port":       jsm.port,
		"url":        jsm.jishiURL,
		"responding": jsm.IsJishiRunning(),
	}

	return status
}

// isNodeAvailable checks if Node.js is available
func (jsm *JishiServerManager) isNodeAvailable() bool {
	_, err := exec.LookPath("node")
	return err == nil
}

// RestartJishi restarts the Jishi server
func (jsm *JishiServerManager) RestartJishi() error {
	logrus.Info("Restarting Jishi server...")
	
	// Stop first
	if err := jsm.StopJishi(); err != nil {
		logrus.Warnf("Error stopping Jishi server: %v", err)
	}
	
	// Wait a moment
	time.Sleep(2 * time.Second)
	
	// Start again
	return jsm.StartJishi()
}
