#!/bin/bash

echo "🚀 Starting Social Media Downloader Backend..."
echo ""

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "⚠️  yt-dlp is not installed!"
    echo "Installing yt-dlp..."
    
    # Try different installation methods
    if command -v apt &> /dev/null; then
        sudo apt install yt-dlp -y
    elif command -v pip3 &> /dev/null; then
        pip3 install yt-dlp
    elif command -v pip &> /dev/null; then
        pip install yt-dlp
    else
        echo "❌ Could not install yt-dlp. Please install it manually:"
        echo "   apt install yt-dlp"
        echo "   or"
        echo "   pip install yt-dlp"
        exit 1
    fi
fi

echo "✅ yt-dlp is installed"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🎯 Starting server on http://localhost:3001"
echo ""
npm start

