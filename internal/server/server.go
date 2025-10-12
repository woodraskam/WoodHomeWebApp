package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"woodhome-webapp/internal/config"
	"woodhome-webapp/internal/database"
	"woodhome-webapp/internal/handlers"
	"woodhome-webapp/internal/models"
	"woodhome-webapp/internal/services"

	"github.com/gorilla/mux"
)

// Server holds the HTTP server and its dependencies
type Server struct {
	httpServer *http.Server
	db         *database.DB
	config     *config.Config
}

// New creates a new server instance
func New(cfg *config.Config, db *database.DB) *Server {
	return &Server{
		config: cfg,
		db:     db,
	}
}

// SetupRoutes configures all HTTP routes
func (s *Server) SetupRoutes() {
	// Create main router
	router := mux.NewRouter()
	
	// API routes
	api := router.PathPrefix("/api").Subrouter()
	
	// Health check
	api.HandleFunc("/health", s.healthHandler).Methods("GET")
	api.HandleFunc("/connectivity", s.connectivityHandler).Methods("GET")
	
	// Initialize services
	sonosService := services.NewSonosService(&models.SonosServiceConfig{
		JishiURL:   s.config.Sonos.APIURL,
		Timeout:    s.config.Sonos.Timeout,
		RetryCount: s.config.Sonos.RetryCount,
	})
	sonosHandler := handlers.NewSonosHandler(sonosService)
	
	hueService := services.NewHueService(&models.HueServiceConfig{
		BridgeIP:   s.config.Hue.BridgeIP,
		Username:   s.config.Hue.Username,
		Timeout:    s.config.Hue.Timeout,
		RetryCount: s.config.Hue.RetryCount,
	})
	hueHandler := handlers.NewHueHandler(hueService)
	
	// Register service routes
	sonosHandler.RegisterRoutes(api.PathPrefix("/sonos").Subrouter())
	hueHandler.RegisterRoutes(api.PathPrefix("/hue").Subrouter())
	
	// Static files
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./web/static/"))))
	
	// Root handler (SPA)
	router.PathPrefix("/").HandlerFunc(s.homeHandler)
	
	// Create HTTP server
	s.httpServer = &http.Server{
		Addr:         ":" + s.config.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	log.Printf("Starting WoodHome WebApp on port %s", s.config.Port)
	log.Printf("WoodHome API URL: %s", s.config.APIBaseURL)
	
	return s.httpServer.ListenAndServe()
}

// Stop gracefully stops the HTTP server
func (s *Server) Stop(ctx context.Context) error {
	return s.httpServer.Shutdown(ctx)
}

// Run starts the server and handles graceful shutdown
func (s *Server) Run() error {
	// Start server in goroutine
	go func() {
		if err := s.Start(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()
	
	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	
	log.Println("Shutting down server...")
	
	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := s.Stop(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	
	log.Println("Server exited")
	return nil
}

// Health check handler
func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"success","message":"WoodHome WebApp is running","data":{"timestamp":%d,"version":"1.0.0"}}`, time.Now().Unix())
}

// Connectivity test handler
func (s *Server) connectivityHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"success","message":"Connectivity test passed"}`)
}

// Home handler (SPA)
func (s *Server) homeHandler(w http.ResponseWriter, r *http.Request) {
	// This will be implemented to serve the SPA
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, "<h1>WoodHome WebApp</h1><p>SPA Dashboard coming soon...</p>")
}
