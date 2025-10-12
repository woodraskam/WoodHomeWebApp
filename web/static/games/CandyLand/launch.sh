#!/bin/bash
# Launch Candyland Game in Browser
echo "🎮 Launching Candyland Adventure..."

# Try different browsers in order of preference
if command -v open &> /dev/null; then
    # macOS - use default browser
    open index.html
elif command -v google-chrome &> /dev/null; then
    # Linux - Chrome
    google-chrome index.html
elif command -v firefox &> /dev/null; then
    # Linux - Firefox
    firefox index.html
else
    echo "❌ No supported browser found"
    echo "Please open index.html manually in your browser"
fi

echo "✅ Game launched successfully!"
