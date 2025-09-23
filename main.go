package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
)

type APIResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type WoodHomeConfig struct {
	APIBaseURL string
	Port       string
}

var config WoodHomeConfig

func main() {
	// Configuration
	config.APIBaseURL = getEnv("WOODHOME_API_URL", "http://localhost:8080")
	config.Port = getEnv("PORT", "3000")

	// Setup routes using standard http package for testing
	// Register specific routes first (most specific to least specific)
	http.HandleFunc("/play/CandyLand", candyLandHandler)
	http.HandleFunc("/play/Candyland", candyLandHandler) // Handle lowercase variation
	http.HandleFunc("/candyland", candyLandHandler) // Keep simple path as backup
	http.HandleFunc("/test", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Test route called for path: %s", r.URL.Path)
		w.Write([]byte("Test route is working!"))
	})
	http.HandleFunc("/api/health", healthCheckHandler)
	http.HandleFunc("/api/connectivity", connectivityTestHandler)
	
	// Static files (register before catch-all)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))
	
	// Root handler last (catch-all)
	http.HandleFunc("/", homeHandler)
	
	log.Printf("Routes registered:")
	log.Printf("  GET /games/CandyLand")
	log.Printf("  GET /games/Candyland")
	log.Printf("  GET /api/health")
	log.Printf("  GET /api/connectivity")
	log.Printf("  GET / (catch-all)")

	log.Printf("Starting WoodHome WebApp on port %s", config.Port)
	log.Printf("WoodHome API URL: %s", config.APIBaseURL)

	if err := http.ListenAndServe(":"+config.Port, nil); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	tmpl := template.Must(template.ParseFiles("templates/index.html"))

	data := map[string]interface{}{
		"Title":       "WoodHome Dashboard",
		"APIBaseURL":  config.APIBaseURL,
		"CurrentTime": time.Now().Format("2006-01-02 15:04:05"),
	}

	if err := tmpl.Execute(w, data); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func candyLandHandler(w http.ResponseWriter, r *http.Request) {
	log.Printf("CandyLand handler called for path: %s", r.URL.Path)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Try to parse the template with error handling
	tmpl, err := template.ParseFiles("templates/candyland.html")
	if err != nil {
		log.Printf("Template parsing error: %v", err)
		http.Error(w, "Template parsing error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	data := map[string]interface{}{
		"Title": "CandyLand Adventure - Mark Woodraska",
	}

	if err := tmpl.Execute(w, data); err != nil {
		log.Printf("Template execution error: %v", err)
		http.Error(w, "Template execution error: "+err.Error(), http.StatusInternalServerError)
		return
	}
	log.Printf("CandyLand template executed successfully")
}

func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	response := APIResponse{
		Status:  "success",
		Message: "WoodHome WebApp is running",
		Data: map[string]interface{}{
			"timestamp": time.Now().Unix(),
			"version":   "1.0.0",
		},
	}
	json.NewEncoder(w).Encode(response)
}

func connectivityTestHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Test connection to WoodHome API
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(config.APIBaseURL + "/health")

	var response APIResponse
	if err != nil {
		response = APIResponse{
			Status:  "error",
			Message: "Failed to connect to WoodHome API: " + err.Error(),
		}
		w.WriteHeader(http.StatusServiceUnavailable)
	} else {
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			response = APIResponse{
				Status:  "success",
				Message: "Successfully connected to WoodHome API",
				Data: map[string]interface{}{
					"api_url":     config.APIBaseURL,
					"status_code": resp.StatusCode,
				},
			}
		} else {
			response = APIResponse{
				Status:  "warning",
				Message: fmt.Sprintf("WoodHome API responded with status %d", resp.StatusCode),
				Data: map[string]interface{}{
					"api_url":     config.APIBaseURL,
					"status_code": resp.StatusCode,
				},
			}
		}
	}

	json.NewEncoder(w).Encode(response)
}

func proxyToWoodHomeAPI(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	path := vars["path"]

	// Build the target URL
	targetURL := config.APIBaseURL + "/" + path
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	// Create the request
	req, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Copy headers
	for key, values := range r.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Make the request
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		http.Error(w, "Failed to connect to API: "+err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer resp.Body.Close()

	// Copy response headers
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// Copy status code
	w.WriteHeader(resp.StatusCode)

	// Copy response body
	io.Copy(w, resp.Body)
}
