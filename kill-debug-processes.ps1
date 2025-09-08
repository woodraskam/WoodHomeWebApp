# Kill debug processes script
# This script ensures all debug-related processes are properly terminated

Write-Host "Cleaning up debug processes..." -ForegroundColor Yellow

# Kill dlv (Delve debugger) processes
Get-Process | Where-Object { $_.ProcessName -eq "dlv" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill any debug binary processes
Get-Process | Where-Object { $_.ProcessName -like "_debug_bin*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill our specific debug executable
Get-Process | Where-Object { $_.ProcessName -eq "woodhome-webapp-debug" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill any processes using port 3000 (our web app port)
$port3000Processes = netstat -ano | findstr ":3000" | ForEach-Object { 
    $parts = $_ -split '\s+' 
    if ($parts[-1] -and $parts[-1] -ne "0") { 
        $parts[-1] 
    } 
}

foreach ($processId in $port3000Processes) {
    if ($processId) {
        try {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        catch {
            # Ignore errors if process doesn't exist
        }
    }
}

Write-Host "Debug process cleanup complete!" -ForegroundColor Green
