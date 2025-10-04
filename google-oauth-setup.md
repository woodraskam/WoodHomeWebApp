# Google OAuth Setup Guide for WoodHome WebApp

## Issue Identified
The Google OAuth login button is not working because the required environment variables are not set.

## Required Environment Variables
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `GOOGLE_REDIRECT_URL`: The callback URL for OAuth
- `SESSION_KEY`: A secure random key for session management

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"

### 1.2 Create OAuth 2.0 Client ID
1. Click "Create Credentials" > "OAuth 2.0 Client ID"
2. Choose "Web application" as the application type
3. Set the name (e.g., "WoodHome WebApp")
4. Add authorized redirect URIs:
   - For local development: `http://localhost:3000/auth/google/callback`
   - For production: `https://markwoodraska.com/auth/google/callback`
5. Click "Create"

### 1.3 Copy Credentials
1. Copy the **Client ID** and **Client Secret**
2. Save these values securely

## Step 2: Configure Environment Variables

### 2.1 Create .env File
Create a `.env` file in your project root with the following content:

```env
# Google Calendar OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

# Session Management
SESSION_KEY=your_random_32_byte_key_here

# Other existing variables...
HUE_BRIDGE_IP=192.168.86.236
HUE_USERNAME=VPEueUoO2YHTXb-o1133RQKLHty4DnhLV-j1YpfB
PORT=3000
WOODHOME_API_URL=http://localhost:8080
```

### 2.2 Generate Session Key
Generate a secure random session key:

**Option 1: Using PowerShell**
```powershell
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

**Option 2: Using OpenSSL (if available)**
```bash
openssl rand -base64 32
```

**Option 3: Using Node.js**
```javascript
require('crypto').randomBytes(32).toString('base64')
```

## Step 3: Enable Google Calendar API

### 3.1 Enable API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 3.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: "WoodHome WebApp"
   - User support email: Your email
   - Developer contact: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Add test users (your email address)

## Step 4: Test the OAuth Flow

### 4.1 Start the Application
```bash
# Set environment variables and start the app
$env:GOOGLE_CLIENT_ID="your_client_id_here"
$env:GOOGLE_CLIENT_SECRET="your_client_secret_here"
$env:GOOGLE_REDIRECT_URL="http://localhost:3000/auth/google/callback"
$env:SESSION_KEY="your_session_key_here"
go run .
```

### 4.2 Test OAuth Login
1. Open `http://localhost:3000`
2. Click the "Sign in with Google" button
3. You should be redirected to Google's OAuth page
4. After authorization, you should be redirected back to the app

## Step 5: Production Configuration

### 5.1 Update Redirect URLs
For production deployment on `markwoodraska.com`:
1. Update the authorized redirect URI in Google Cloud Console:
   - `https://markwoodraska.com/auth/google/callback`
2. Update the environment variable:
   - `GOOGLE_REDIRECT_URL=https://markwoodraska.com/auth/google/callback`

### 5.2 Security Considerations
- Use HTTPS in production
- Set `Secure: true` for cookies in production
- Use a strong, unique session key
- Regularly rotate credentials

## Troubleshooting

### Common Issues:
1. **"Invalid client" error**: Check that Client ID and Secret are correct
2. **"Redirect URI mismatch"**: Ensure the redirect URI matches exactly
3. **"Access blocked"**: Check OAuth consent screen configuration
4. **Session errors**: Verify SESSION_KEY is set and is 32+ characters

### Debug Steps:
1. Check server logs for OAuth configuration
2. Verify environment variables are loaded
3. Test OAuth flow in incognito mode
4. Check browser console for JavaScript errors

## Security Notes
- Never commit `.env` file to version control
- Use different credentials for development and production
- Regularly rotate secrets
- Monitor OAuth usage in Google Cloud Console
