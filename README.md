# WoodHome WebApp

A modern Material Design 3 Single Page Application (SPA) for home automation, built with Go backend and vanilla JavaScript frontend. Features smart home integration with Philips Hue, Sonos, Google Calendar, and built-in games.

## 🏠 Features

### Smart Home Integration
- **Philips Hue** - Control lights and rooms with real-time status updates
- **Sonos** - Manage audio devices, groups, and playback controls
- **Google Calendar** - View and manage calendar events with OAuth integration
- **Database Integration** - SQL Server backend with OAuth token management

### User Interface
- **Material Design 3** - Modern Material You design system with dynamic theming
- **Single Page Application** - Smooth navigation with section-based routing
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Authentication** - Google OAuth 2.0 integration with session management
- **Real-time Updates** - Live status updates for all connected devices

### Built-in Games
- **CandyLand** - Classic board game with animated characters
- **Tic-Tac-Toe** - AI-powered game with multiple difficulty levels
- **Woodraska Cribbage** - Full cribbage implementation with scoring

### Architecture
- **Go Backend** - High-performance HTTP server with structured routing
- **Modular Design** - Clean separation of concerns with handlers, services, and models
- **Configuration Management** - Environment-based configuration system
- **Database Integration** - SQL Server with connection pooling and migrations
- **External Services** - Node.js Sonos HTTP API (Jishi) integration

## 🚀 Quick Start

### Prerequisites

- **Go 1.21+** - Backend runtime
- **Node.js 18+** - For Sonos HTTP API (Jishi)
- **SQL Server** - Database backend
- **Philips Hue Bridge** - For smart lighting (optional)
- **Sonos Devices** - For audio control (optional)
- **Google OAuth** - For calendar integration (optional)

### Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd WoodHomeWebApp
```

2. **Install Go dependencies:**
```bash
go mod tidy
```

3. **Install Sonos HTTP API (Jishi):**
```bash
cd external/node-sonos-http-api
npm install
```

4. **Configure environment variables:**
```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your configuration
```

5. **Run the application:**
```bash
# Start the main application
go run cmd/webapp/main.go

# In another terminal, start the Sonos API (optional)
cd external/node-sonos-http-api
node server.js
```

6. **Access the application:**
```
http://localhost:3000
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# WebApp Configuration
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=yourStrongPassword123!
DB_NAME=WoodHomeDB

# Google OAuth (for Calendar integration)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar.readonly

# Philips Hue (for smart lighting)
HUE_BRIDGE_IP=192.168.1.100
HUE_USERNAME=your_hue_username_here

# Sonos Configuration
SONOS_JISHI_URL=http://localhost:5005

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=your-email@gmail.com
FROM_PASSWORD=your-app-password

# Session Security
SESSION_KEY=your_random_32_byte_key_here
```

### Service Setup

#### Philips Hue Setup
1. Find your Hue Bridge IP address
2. Create a username via the Hue API
3. Set `HUE_BRIDGE_IP` and `HUE_USERNAME` in your `.env` file
4. See `docs/guides/HUE_SETUP.md` for detailed instructions

#### Google Calendar Setup
1. Create a Google Cloud Project
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials
4. Set the redirect URI to `http://localhost:3000/auth/google/callback`
5. Add your credentials to the `.env` file

#### Sonos Setup
1. Ensure your Sonos devices are on the same network
2. Start the Jishi server: `cd external/node-sonos-http-api && node server.js`
3. The application will automatically connect to Sonos devices

## 🏗️ Architecture

### Project Structure

```
WoodHomeWebApp/
├── cmd/webapp/              # Application entry point
│   └── main.go
├── internal/                # Internal packages
│   ├── config/             # Configuration management
│   ├── database/           # Database connection and migrations
│   ├── handlers/           # HTTP request handlers
│   ├── models/             # Data models and structures
│   ├── services/           # Business logic services
│   └── server/             # HTTP server setup
├── web/                    # Web assets
│   ├── static/            # Static files (CSS, JS, images)
│   │   ├── css/           # Material Design 3 styles
│   │   ├── js/            # Frontend JavaScript
│   │   └── games/         # Built-in games
│   └── templates/         # HTML templates
├── external/              # External services
│   └── node-sonos-http-api/  # Sonos HTTP API (Jishi)
├── docs/                  # Documentation
│   ├── guides/           # Setup and implementation guides
│   └── api/              # API documentation
└── scripts/              # Utility scripts
```

### Backend Architecture

- **Configuration Layer** - Environment-based configuration with validation
- **Database Layer** - SQL Server integration with connection pooling
- **Service Layer** - Business logic for Hue, Sonos, Calendar, and OAuth
- **Handler Layer** - HTTP request/response handling with proper error handling
- **Server Layer** - HTTP server setup with routing and middleware

### Frontend Architecture

- **SPA Router** - Client-side routing with hash-based navigation
- **Section Management** - Modular section-based architecture
- **Authentication Manager** - OAuth 2.0 integration with session management
- **Theme Manager** - Material Design 3 theming with dynamic colors
- **State Manager** - Application state management with persistence
- **Component System** - Reusable UI components with Material Design 3

## 🔌 API Endpoints

### Authentication
- `GET /auth/google/login` - Initiate Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status

### Smart Home APIs
- `GET /api/hue/lights` - Get all Hue lights
- `GET /api/hue/rooms` - Get all Hue rooms
- `POST /api/hue/lights/{id}/toggle` - Toggle individual light
- `POST /api/hue/groups/{id}/toggle` - Toggle room/group

- `GET /api/sonos/devices` - Get all Sonos devices
- `GET /api/sonos/groups` - Get all Sonos groups
- `POST /api/sonos/devices/{uuid}/play` - Play on device
- `POST /api/sonos/groups/{id}/volume/{volume}` - Set group volume

### Calendar APIs
- `GET /api/calendar/events` - Get calendar events
- `GET /api/calendar/calendars` - Get user calendars
- `GET /api/calendar/colors` - Get calendar colors

### System APIs
- `GET /api/health` - Health check
- `GET /api/connectivity` - Connectivity test

## 🎮 Games

### CandyLand
- Classic board game implementation
- Animated characters and smooth gameplay
- Multiplayer support with up to 4 players
- Sound effects and visual feedback

### Tic-Tac-Toe
- AI-powered opponent with multiple difficulty levels
- Character-based gameplay with custom avatars
- Responsive design for all screen sizes

### Woodraska Cribbage
- Full cribbage implementation with proper scoring
- Real-time multiplayer with SignalR
- Interactive card dealing and pegging
- Complete scoring system with crib counting

## 🎨 Material Design 3

The application implements Material Design 3 (Material You) with:

- **Dynamic Color** - Adapts to user preferences and system themes
- **Typography Scale** - Proper text hierarchy with Roboto font family
- **Component Library** - Cards, buttons, navigation, and form elements
- **Elevation System** - Proper shadow and depth management
- **Responsive Design** - Mobile-first approach with breakpoint management
- **Accessibility** - WCAG 2.1 compliance with proper ARIA labels

## 🚀 Deployment

### Local Development
```bash
# Start the main application
go run cmd/webapp/main.go

# Start Sonos API (optional)
cd external/node-sonos-http-api
node server.js
```

### Cloudflare Tunnel (Public Access)
```bash
# Install cloudflared
winget install --id Cloudflare.cloudflared

# Login to Cloudflare
cloudflared tunnel login

# Run setup script
.\scripts\setup-tunnel.ps1

# Start tunnel
cloudflared tunnel run woodhome-webapp
```

### Production Deployment
1. Set up SQL Server database
2. Configure environment variables
3. Set up reverse proxy (nginx/Apache)
4. Configure SSL certificates
5. Set up monitoring and logging

## 🧪 Development

### Adding New Features

1. **Backend Services:**
   - Add models in `internal/models/`
   - Implement business logic in `internal/services/`
   - Create HTTP handlers in `internal/handlers/`
   - Register routes in `internal/server/server.go`

2. **Frontend Components:**
   - Create section files in `web/static/js/sections/`
   - Add styles in `web/static/css/`
   - Update routing in `web/static/js/spa-router.js`

3. **Database Changes:**
   - Add migration scripts in `configs/database/`
   - Update models and services accordingly

### Testing

```bash
# Run unit tests
go test ./internal/...

# Run integration tests
go test ./tests/integration/...

# Run end-to-end tests
go test ./tests/e2e/...
```

### Code Quality

- **Go Formatting:** `gofmt -w .`
- **Go Imports:** `goimports -w .`
- **Go Vet:** `go vet ./...`
- **Go Lint:** `golint ./...`

## 📚 Documentation

- **Setup Guides:** `docs/guides/`
- **Implementation Guides:** `docs/guides/ImplementationGuides/`
- **API Documentation:** `docs/api/`
- **Architecture:** `WoodHome-System-Architecture.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines

- Follow Go best practices and conventions
- Use Material Design 3 components consistently
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure responsive design for all screen sizes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

- **Documentation:** Check the `docs/` directory
- **Issues:** Open an issue in this repository
- **Discussions:** Use GitHub Discussions for questions
- **Email:** Contact the maintainers

## 🔗 Related Projects

- **WoodHome API** - Backend API service
- **Sonos HTTP API (Jishi)** - Sonos integration service
- **Material Design 3** - Design system reference
- **Google Calendar API** - Calendar integration
- **Philips Hue API** - Smart lighting integration