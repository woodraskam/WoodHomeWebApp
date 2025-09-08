# WoodHome WebApp

A modern Material Design 3 frontend for the WoodHome API, built with Go and HTMX.

## Features

- 🎨 **Material Design 3** - Modern Material You design system
- ⚡ **HTMX Integration** - Dynamic interactions without JavaScript complexity
- 🚀 **Go Backend** - Fast and efficient web server
- 📱 **Responsive Design** - Works on all device sizes
- 🔌 **API Proxy** - Seamless integration with WoodHome API
- 🏠 **Home Automation Ready** - Built for smart home management

## Quick Start

### Prerequisites

- Go 1.21 or later
- WoodHome API running (default: http://localhost:8080)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd WoodHomeWebApp
```

2. Install dependencies:
```bash
go mod tidy
```

3. Set environment variables (optional):
```bash
# Windows PowerShell
$env:WOODHOME_API_URL="http://localhost:8080"
$env:PORT="3000"

# Linux/Mac
export WOODHOME_API_URL="http://localhost:8080"
export PORT="3000"
```

4. Run the application:
```bash
go run main.go
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## Configuration

### Environment Variables

- `WOODHOME_API_URL` - URL of your WoodHome API (default: http://localhost:8080)
- `PORT` - Port for the web application (default: 3000)

### Cloudflare Tunnel Setup

For public access via your domain (e.g., `markwoodraska.com`):

1. **Install cloudflared**:
   ```bash
   # Windows
   winget install --id Cloudflare.cloudflared
   
   # Or download from: https://github.com/cloudflare/cloudflared/releases
   ```

2. **Login to Cloudflare**:
   ```bash
   cloudflared tunnel login
   ```

3. **Run the setup script**:
   ```powershell
   .\setup-tunnel.ps1
   ```

4. **Start the tunnel**:
   ```bash
   cloudflared tunnel run woodhome-webapp
   ```

5. **Use the Cloudflare Tunnel launch configuration** in VS Code:
   - Select "Launch WoodHome WebApp (Cloudflare Tunnel)"
   - Press F5

6. **Access your app** at: `https://markwoodraska.com`

### API Endpoints

#### WebApp Endpoints
- `GET /` - Main dashboard
- `GET /api/health` - WebApp health check
- `GET /api/connectivity` - Test connection to WoodHome API

#### WoodHome API Proxy
- `GET /api/woodhome/*` - Proxied to WoodHome API
- `POST /api/woodhome/*` - Proxied to WoodHome API
- `PUT /api/woodhome/*` - Proxied to WoodHome API
- `DELETE /api/woodhome/*` - Proxied to WoodHome API

## Project Structure

```
WoodHomeWebApp/
├── main.go                 # Main application file
├── go.mod                  # Go module file
├── templates/              # HTML templates
│   └── index.html         # Main dashboard template
├── static/                 # Static assets
│   ├── css/
│   │   └── material-design-3.css  # Material Design 3 styles
│   └── js/                # JavaScript files (if needed)
└── README.md              # This file
```

## Material Design 3

This application uses Material Design 3 (Material You) design system with:

- **Dynamic Color** - Adapts to user preferences
- **Typography** - Roboto font family with proper scale
- **Elevation** - Proper shadow system
- **Components** - Cards, buttons, status indicators
- **Responsive** - Mobile-first design approach

## Development

### Adding New Features

1. Add new routes in `main.go`
2. Create corresponding HTML templates
3. Style with Material Design 3 classes
4. Use HTMX for dynamic interactions

### Styling Guidelines

- Use CSS custom properties for colors and spacing
- Follow Material Design 3 component patterns
- Ensure responsive design for all screen sizes
- Use semantic HTML elements

## API Integration

The application automatically proxies requests to your WoodHome API. To test connectivity:

1. Ensure your WoodHome API is running
2. Click "Test API Connection" on the dashboard
3. Check the status indicator in the app bar

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the WoodHome API documentation
- Review the HTMX documentation
- Open an issue in this repository
