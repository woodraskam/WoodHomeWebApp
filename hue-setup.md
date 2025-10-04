# Hue Bridge Setup Guide

## Security Note
Hue authentication is handled offline for security. The web interface does not expose authentication endpoints.

## Setup Instructions

### 1. Find Your Hue Bridge IP Address
- Check your router's admin panel for connected devices
- Look for "Philips Hue" or similar device names
- Or use network scanning tools to find the bridge

### 2. Generate Hue Username
You need to generate a username (access token) for your Hue bridge:

#### Option A: Using curl (recommended)
```bash
# Replace 192.168.1.100 with your bridge IP
curl -X POST http://192.168.1.100/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"WoodHome WebApp#WoodHome"}'
```

#### Option B: Using a tool like Postman
- Method: POST
- URL: `http://YOUR_BRIDGE_IP/api`
- Headers: `Content-Type: application/json`
- Body: `{"devicetype":"WoodHome WebApp#WoodHome"}`

### 3. Press the Link Button
- **IMPORTANT**: Press the physical link button on your Hue bridge
- You have 30 seconds to press the button after making the request
- The bridge will return a username in the response

### 4. Configure Environment Variables
Set these environment variables before starting the application:

```bash
# Windows (PowerShell)
$env:HUE_BRIDGE_IP="192.168.1.100"
$env:HUE_USERNAME="your-generated-username"

# Windows (Command Prompt)
set HUE_BRIDGE_IP=192.168.1.100
set HUE_USERNAME=your-generated-username

# Linux/Mac
export HUE_BRIDGE_IP="192.168.1.100"
export HUE_USERNAME="your-generated-username"
```

### 5. Restart the Application
After setting the environment variables, restart the WoodHome WebApp.

## Troubleshooting

### Bridge Not Found
- Ensure the bridge is connected to your network
- Check that the IP address is correct
- Try pinging the bridge: `ping 192.168.1.100`

### Authentication Failed
- Make sure you pressed the link button within 30 seconds
- Try generating a new username
- Check that the bridge IP and username are correct

### Lights Not Showing
- Verify the bridge is online and accessible
- Check that lights are properly paired with the bridge
- Ensure the username has proper permissions

## Security Best Practices

- Never expose Hue credentials in web interfaces
- Store credentials securely (environment variables, not in code)
- Regularly rotate access tokens if needed
- Use HTTPS for the web application when possible
