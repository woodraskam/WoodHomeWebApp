# Hue Bridge Setup Guide

## Step 1: Find Your Hue Bridge IP Address

### Method 1: Using the Hue App
1. Open the Philips Hue app on your phone
2. Go to Settings → Hue bridges
3. Note the IP address shown

### Method 2: Using Network Discovery
1. Visit https://discovery.meethue.com/ in your browser
2. Look for the "internalipaddress" field
3. Note the IP address (usually something like 192.168.1.xxx)

## Step 2: Get a Username from the Bridge

### Using the Hue API
1. Open a web browser and go to: `http://YOUR_BRIDGE_IP/debug/clip.html`
2. In the "URL" field, enter: `/api`
3. In the "Message body" field, enter:
   ```json
   {"devicetype":"WoodHome WebApp"}
   ```
4. Click "POST"
5. You'll get a response like:
   ```json
   [{"error":{"type":101,"address":"","description":"link button not pressed"}}]
   ```
6. **Press the physical button on your Hue bridge**
7. Click "POST" again within 30 seconds
8. You'll get a response with your username:
   ```json
   [{"success":{"username":"YOUR_USERNAME_HERE"}}]
   ```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root with:

```env
# Hue Bridge Configuration
HUE_BRIDGE_IP=192.168.1.xxx
HUE_USERNAME=YOUR_USERNAME_HERE
```

Replace:
- `192.168.1.xxx` with your actual bridge IP
- `YOUR_USERNAME_HERE` with the username from step 2

## Step 4: Restart the Application

After setting the environment variables, restart the WoodHome WebApp:

```bash
# Stop the current application
# Then restart it
.\webapp_new.exe
```

## Troubleshooting

- **Bridge not found**: Make sure your bridge and computer are on the same network
- **Authentication failed**: Make sure you pressed the bridge button within 30 seconds of the API call
- **No lights found**: Make sure you have lights connected to your Hue bridge and they're powered on

## Testing

Once configured, you can test the connection by visiting:
- http://localhost:3000/api/hue/lights
- http://localhost:3000/api/hue/rooms

These should return JSON data instead of empty arrays.
