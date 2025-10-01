# WoodHome System Architecture & Features

## Overview
WoodHome is a modern home automation control center built with Go, featuring a web-based dashboard, game platform, and API infrastructure. The system is designed for extensibility and integration with smart home devices.

## System Architecture

### Core Components
- **Web Application Server** (Go/HTTP) - Main dashboard and game platform
- **Database Layer** (SQL Server) - Game state and user data persistence
- **Email Service** (SMTP/Gmail) - Notification system for multiplayer games
- **Static Asset Server** - Game assets, CSS, and JavaScript files
- **Cloudflare Tunnel** - Secure external access to local services

### Technology Stack
- **Backend**: Go 1.24+ with standard library HTTP server
- **Database**: Microsoft SQL Server with trusted connection
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Material Design 3
- **Templating**: Go html/template package
- **Email**: Gmail SMTP with app passwords
- **Tunneling**: Cloudflare Tunnel for external access
- **Styling**: Material Design 3 with custom CSS variables

## API Architecture

### Web Application Endpoints

#### Health & Status
- `GET /api/health` - WebApp health check
- `GET /api/connectivity` - API connectivity test
- `GET /` - Main dashboard (catch-all route)

#### Game Platform
- `GET /play/CandyLand` - CandyLand Adventure game
- `GET /play/TicTacToe` - Tic Tac Toe game
- `GET /play/cribbage` - Woodraska Cribbage home
- `GET /play/WoodraskaCribbage/board/` - Cribbage game board
- `GET /play/WoodraskaCribbage/player/` - Cribbage player controller

#### Cribbage API (Multiplayer Card Game)
- `POST /api/cribbage/create` - Create new cribbage game
- `POST /api/cribbage/join` - Join existing game
- `POST /api/cribbage/play` - Play card or make move
- `GET /api/cribbage/state` - Get current game state
- `GET /api/cribbage/updates` - Server-sent events for real-time updates

#### Static Assets
- `GET /static/*` - Static file server for CSS, JS, images

### Data Models

#### Game Management
```go
type Game struct {
    ID            string    `json:"id"`
    Player1Email  string    `json:"player1_email"`
    Player2Email  string    `json:"player2_email"`
    Status        string    `json:"status"`
    Player1Score  int       `json:"player1_score"`
    Player2Score  int       `json:"player2_score"`
    CurrentPhase  string    `json:"current_phase"`
    CurrentPlayer string    `json:"current_player"`
    GameData      string    `json:"game_data"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
}
```

#### API Response Format
```go
type APIResponse struct {
    Status  string      `json:"status"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
}
```

## Game Platform Features

### 1. CandyLand Adventure
- **Type**: Single-player board game
- **Technology**: HTML5 Canvas, JavaScript ES6
- **Features**: 
  - Animated game board with forest theme
  - Player movement with dice rolling
  - Sound effects and visual feedback
  - Responsive design for mobile/desktop

### 2. Tic Tac Toe
- **Type**: Single-player vs AI or two-player
- **Technology**: Vanilla JavaScript, CSS animations
- **Features**:
  - Multiple difficulty levels (Easy/Hard AI)
  - Game statistics tracking (localStorage)
  - Animated UI with Material Design 3
  - Real-time game state management

### 3. Woodraska Cribbage
- **Type**: Multiplayer card game
- **Technology**: Real-time updates via Server-Sent Events
- **Features**:
  - Two-player online gameplay
  - Email invitation system
  - Real-time game state synchronization
  - Split-screen player interface
  - Game history and statistics

## Database Schema

### Cribbage Tables
```sql
-- Games table
CREATE TABLE cribbage_games (
    id NVARCHAR(255) PRIMARY KEY,
    player1_email NVARCHAR(255) NOT NULL,
    player2_email NVARCHAR(255),
    status NVARCHAR(50) NOT NULL DEFAULT 'waiting',
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    current_phase NVARCHAR(50) DEFAULT 'waiting',
    current_player NVARCHAR(255),
    game_data NTEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- Game tokens for authentication
CREATE TABLE cribbage_game_tokens (
    token NVARCHAR(255) PRIMARY KEY,
    game_id NVARCHAR(255) NOT NULL,
    user_email NVARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (game_id) REFERENCES cribbage_games (id) ON DELETE CASCADE
);

-- Game moves history
CREATE TABLE cribbage_game_moves (
    id INT IDENTITY(1,1) PRIMARY KEY,
    game_id NVARCHAR(255) NOT NULL,
    player_email NVARCHAR(255) NOT NULL,
    move_type NVARCHAR(50) NOT NULL,
    move_data NTEXT,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (game_id) REFERENCES cribbage_games (id) ON DELETE CASCADE
);
```

## Configuration

### Environment Variables
```bash
# WebApp Configuration
PORT=3000

# WoodHome API Configuration
WOODHOME_API_URL=http://localhost:8080

# Database Configuration
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=WoodHome
DB_TRUSTED_CONNECTION=true

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=your-email@gmail.com
FROM_PASSWORD=your-app-password
```

### Cloudflare Tunnel Configuration
- **Tunnel ID**: b13c235e-e013-447f-be6b-24da41bc0115
- **External URL**: https://api.markwoodraska.com
- **Local Service**: http://localhost:3000

## Frontend Architecture

### Material Design 3 Implementation
- **Design System**: Google Material Design 3
- **Color Scheme**: Dynamic color system with light/dark theme support
- **Typography**: Roboto font family with multiple weights
- **Components**: Custom CSS components following Material Design patterns

### JavaScript Architecture
- **Modular Design**: Separate JS files for different game components
- **State Management**: Centralized game state with localStorage persistence
- **Animation System**: CSS animations with JavaScript triggers
- **Event Handling**: HTMX for dynamic content updates

### Responsive Design
- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: Responsive grid system
- **Touch Support**: Touch-friendly interface elements
- **Accessibility**: ARIA labels and keyboard navigation

## Integration Points for Sonos Control Module

### Recommended Integration Architecture

#### 1. API Endpoint Structure
```go
// Sonos Control API endpoints
GET  /api/sonos/devices          // List available Sonos devices
GET  /api/sonos/devices/{id}     // Get specific device info
POST /api/sonos/play             // Start playback
POST /api/sonos/pause            // Pause playback
POST /api/sonos/volume           // Set volume
POST /api/sonos/queue            // Manage playback queue
GET  /api/sonos/status           // Get system status
```

#### 2. Data Models for Sonos Integration
```go
type SonosDevice struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    Room        string `json:"room"`
    IPAddress   string `json:"ip_address"`
    Status      string `json:"status"`
    Volume      int    `json:"volume"`
    IsPlaying   bool   `json:"is_playing"`
    CurrentTrack Track `json:"current_track"`
}

type Track struct {
    Title    string `json:"title"`
    Artist   string `json:"artist"`
    Album    string `json:"album"`
    Duration int    `json:"duration"`
    Position int    `json:"position"`
}
```

#### 3. WebSocket Integration for Real-time Updates
```go
// Real-time Sonos status updates
GET /api/sonos/events  // Server-sent events for device status changes
```

#### 4. Dashboard Integration
- **New Section**: Add Sonos control panel to main dashboard
- **Device Cards**: Display available devices with status
- **Quick Controls**: Play/pause, volume, track selection
- **Room Management**: Group/ungroup devices by room

#### 5. Game Integration Opportunities
- **Background Music**: Automatic music selection for different games
- **Sound Effects**: Use Sonos for game audio feedback
- **Ambient Audio**: Environmental sounds for game immersion

### Implementation Recommendations

#### 1. Service Architecture
```go
type SonosService struct {
    devices map[string]*SonosDevice
    client  *http.Client
    baseURL string
}

func (s *SonosService) DiscoverDevices() error
func (s *SonosService) ControlDevice(deviceID string, action string) error
func (s *SonosService) GetStatus(deviceID string) (*SonosDevice, error)
```

#### 2. Frontend Components
- **Sonos Dashboard Widget**: Real-time device status
- **Room Control Panel**: Group management interface
- **Music Queue Manager**: Playlist and queue control
- **Volume Controls**: Individual and group volume management

#### 3. Database Extensions
```sql
-- Sonos device registry
CREATE TABLE sonos_devices (
    id NVARCHAR(255) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    room NVARCHAR(255),
    ip_address NVARCHAR(45) NOT NULL,
    last_seen DATETIME2 DEFAULT GETDATE(),
    is_active BIT DEFAULT 1
);

-- Sonos control history
CREATE TABLE sonos_control_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    device_id NVARCHAR(255) NOT NULL,
    action NVARCHAR(50) NOT NULL,
    parameters NTEXT,
    timestamp DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (device_id) REFERENCES sonos_devices (id)
);
```

## Security Considerations

### Authentication
- **Game Tokens**: Time-limited tokens for game access
- **Email Verification**: Player identity through email
- **CORS Configuration**: Proper cross-origin resource sharing

### Network Security
- **Cloudflare Tunnel**: Encrypted external access
- **HTTPS**: SSL/TLS encryption for all external traffic
- **Local Network**: Trusted connection for internal services

## Deployment & Operations

### Local Development
- **Port**: 3000 (WebApp), 8080 (API)
- **Database**: SQL Server with trusted connection
- **Tunnel**: Cloudflare tunnel for external access

### Logging & Monitoring
- **File Logging**: woodhome.log with rotation
- **Console Output**: Real-time logging to stdout
- **Error Tracking**: Comprehensive error logging with context

### Performance Considerations
- **Static Assets**: Efficient serving of game assets
- **Database Connections**: Connection pooling for SQL Server
- **Real-time Updates**: Server-sent events for live game updates
- **Caching**: Browser caching for static resources

## Future Extensibility

### Plugin Architecture
- **Game Modules**: Easy addition of new games
- **Device Integrations**: Standardized device control interfaces
- **API Extensions**: RESTful API for third-party integrations

### Smart Home Integration
- **Device Discovery**: Automatic device detection
- **Control Protocols**: Standardized device control
- **Automation Rules**: Event-driven automation system
- **Voice Control**: Integration with voice assistants

This architecture provides a solid foundation for integrating Sonos control capabilities while maintaining the existing game platform and dashboard functionality.

