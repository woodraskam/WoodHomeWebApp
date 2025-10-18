package server

import (
	"context"
	"fmt"
	"html/template"
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
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// Server holds the HTTP server and its dependencies
type Server struct {
	httpServer *http.Server
	db         *database.DB
	config     *config.Config
	router     *mux.Router
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

	// Update the server's router
	s.router = router

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

	// Debug Hue configuration
	log.Printf("Hue Bridge IP: %s", s.config.Hue.BridgeIP)
	log.Printf("Hue Username: %s", s.config.Hue.Username)

	hueService := services.NewHueService(&models.HueServiceConfig{
		BridgeIP:     s.config.Hue.BridgeIP,
		Username:     s.config.Hue.Username,
		Timeout:      s.config.Hue.Timeout,
		RetryCount:   s.config.Hue.RetryCount,
		PollInterval: 20 * time.Second, // Set a default poll interval
		AutoDiscover: true,
		AuthRequired: false, // We have credentials, so auth is not required
	})

	// Initialize the Hue service
	if err := hueService.Start(context.Background()); err != nil {
		log.Printf("Warning: Failed to start Hue service: %v", err)
	}

	hueHandler := handlers.NewHueHandler(hueService)

	// Initialize calendar service
	oauthConfig := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes:       []string{"https://www.googleapis.com/auth/calendar.readonly"},
		Endpoint:     google.Endpoint,
	}
	calendarService := services.NewCalendarService(oauthConfig)
	calendarHandler := handlers.NewCalendarHandler(calendarService)

	// Register service routes
	log.Println("Registering Sonos routes...")
	sonosHandler.RegisterRoutes(api.PathPrefix("/sonos").Subrouter())
	log.Println("Registering Hue routes...")
	hueHandler.RegisterRoutes(api.PathPrefix("/hue").Subrouter())
	log.Println("Registering Calendar routes...")
	calendarHandler.RegisterRoutes(api.PathPrefix("/calendar").Subrouter())

	// OAuth routes
	router.HandleFunc("/auth/google/login", handlers.GoogleLoginHandler).Methods("GET")
	router.HandleFunc("/auth/google/callback", handlers.GoogleCallbackHandler).Methods("GET")
	router.HandleFunc("/auth/logout", handlers.LogoutHandler).Methods("POST")
	router.HandleFunc("/auth/status", handlers.AuthStatusHandler).Methods("GET")

	// API OAuth routes (for frontend compatibility)
	api.HandleFunc("/auth/status", handlers.AuthStatusHandler).Methods("GET")
	api.HandleFunc("/auth/logout", handlers.LogoutHandler).Methods("POST")

	// Game routes
	router.HandleFunc("/candyland", s.candylandHandler).Methods("GET")
	router.HandleFunc("/tictactoe", s.tictactoeHandler).Methods("GET")
	router.HandleFunc("/cribbage", s.cribbageHandler).Methods("GET")
	router.HandleFunc("/cribbage-board", s.cribbageBoardHandler).Methods("GET")
	router.HandleFunc("/cribbage-controller", s.cribbageControllerHandler).Methods("GET")

	// Static files
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./web/static/"))))

	// Root handler (SPA) - MUST be last to avoid intercepting API routes
	router.PathPrefix("/").HandlerFunc(s.homeHandler)

	// Create HTTP server
	s.httpServer = &http.Server{
		Addr:         ":" + s.config.Port,
		Handler:      s.router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}
}

// Start starts the HTTP server
func (s *Server) Start() error {
	log.Printf("Starting WoodHome WebApp on port %s", s.config.Port)
	log.Printf("WoodHome API URL: %s", s.config.APIBaseURL)

	// Setup routes before starting server
	s.SetupRoutes()

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
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// Parse and serve the SPA dashboard template
	tmpl, err := template.ParseFiles("web/templates/spa-dashboard.html")
	if err != nil {
		log.Printf("Error parsing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tmpl.Execute(w, nil); err != nil {
		log.Printf("Error executing template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

// Game handlers
func (s *Server) candylandHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl, err := template.ParseFiles("web/templates/candyland.html")
	if err != nil {
		log.Printf("Error parsing candyland template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Printf("Error executing candyland template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) tictactoeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl, err := template.ParseFiles("web/templates/tictactoe.html")
	if err != nil {
		log.Printf("Error parsing tictactoe template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Printf("Error executing tictactoe template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) cribbageHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl, err := template.ParseFiles("web/templates/cribbage-home.html")
	if err != nil {
		log.Printf("Error parsing cribbage template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Printf("Error executing cribbage template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) cribbageBoardHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl, err := template.ParseFiles("web/templates/cribbage-board.html")
	if err != nil {
		log.Printf("Error parsing cribbage-board template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Printf("Error executing cribbage-board template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *Server) cribbageControllerHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl, err := template.ParseFiles("web/templates/cribbage-controller.html")
	if err != nil {
		log.Printf("Error parsing cribbage-controller template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tmpl.Execute(w, nil); err != nil {
		log.Printf("Error executing cribbage-controller template: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
