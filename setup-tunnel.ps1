# Cloudflare Tunnel Setup Script for WoodHome WebApp
# Run this script to set up your Cloudflare tunnel

Write-Host "🌐 Setting up Cloudflare Tunnel for WoodHome WebApp" -ForegroundColor Cyan

# Check if cloudflared is installed
if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "❌ cloudflared is not installed. Please install it first:" -ForegroundColor Red
  Write-Host "   Download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
  Write-Host "   Or use: winget install --id Cloudflare.cloudflared" -ForegroundColor Yellow
  exit 1
}

Write-Host "✅ cloudflared is installed" -ForegroundColor Green

# Create tunnel (if it doesn't exist)
Write-Host "🔧 Creating tunnel..." -ForegroundColor Yellow
$tunnelName = "woodhome-webapp"
cloudflared tunnel create $tunnelName

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Failed to create tunnel. You may need to login first:" -ForegroundColor Red
  Write-Host "   Run: cloudflared tunnel login" -ForegroundColor Yellow
  exit 1
}

Write-Host "✅ Tunnel created successfully" -ForegroundColor Green

# Get tunnel ID
$tunnelId = (cloudflared tunnel list | Select-String $tunnelName | ForEach-Object { $_.ToString().Split()[0] })
Write-Host "🆔 Tunnel ID: $tunnelId" -ForegroundColor Cyan

# Update the cloudflare-tunnel.yml file with the actual tunnel ID
$configContent = @"
# Cloudflare Tunnel Configuration for WoodHome WebApp
# Place this file in your Cloudflare tunnel directory (usually ~/.cloudflared/)

tunnel: $tunnelId
credentials-file: ~/.cloudflared/$tunnelId.json

ingress:
  # Main WebApp - serves the frontend
  - hostname: markwoodraska.com
    service: http://localhost:3000
    originRequest:
      httpHostHeader: markwoodraska.com
      noTLSVerify: false
      
  # API endpoint - serves the WoodHome API
  - hostname: api.markwoodraska.com
    service: http://localhost:8080
    originRequest:
      httpHostHeader: api.markwoodraska.com
      noTLSVerify: false
      
  # Catch-all rule (required)
  - service: http_status:404
"@

$configContent | Out-File -FilePath "cloudflare-tunnel.yml" -Encoding UTF8
Write-Host "✅ Updated cloudflare-tunnel.yml with tunnel ID" -ForegroundColor Green

# Create DNS records
Write-Host "🌍 Creating DNS records..." -ForegroundColor Yellow
cloudflared tunnel route dns $tunnelId markwoodraska.com
cloudflared tunnel route dns $tunnelId api.markwoodraska.com

if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ DNS records created successfully" -ForegroundColor Green
}
else {
  Write-Host "⚠️  DNS records may need to be created manually in Cloudflare dashboard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete! Next steps:" -ForegroundColor Green
Write-Host "1. Copy cloudflare-tunnel.yml to ~/.cloudflared/config.yml" -ForegroundColor White
Write-Host "2. Start the tunnel: cloudflared tunnel run $tunnelName" -ForegroundColor White
Write-Host "3. Use the 'Launch WoodHome WebApp (Cloudflare Tunnel)' configuration in VS Code" -ForegroundColor White
Write-Host "4. Access your app at: https://markwoodraska.com" -ForegroundColor White
Write-Host ""
Write-Host "📝 Note: Make sure your WoodHome API is running on localhost:8080" -ForegroundColor Cyan
