# Backend Setup Guide

This project now includes a complete backend service for downloading media from social platforms.

## Quick Start

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install yt-dlp (Required)

**On Ubuntu/Debian:**
```bash
sudo apt install yt-dlp
```

**Using pip:**
```bash
pip install yt-dlp
# or
pip3 install yt-dlp
```

### 4. Start the Backend Server

**Method 1 - Using npm:**
```bash
npm start
```

**Method 2 - Using the startup script:**
```bash
./start.sh
```

The server will run on `http://localhost:3001`

### 5. Start the Frontend

In a separate terminal, from the project root:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or similar)

## Architecture

```
frontend (React)
    ↓ HTTP Request
    ↓ POST /api/download
backend (Express.js)
    ↓ Executes yt-dlp command
yt-dlp (External tool)
    ↓ Downloads media
    ↓ Saves to /backend/downloads/
    ↓ Returns download URL
frontend
    ↓ User can download file
```

## Supported Platforms

- ✅ YouTube
- ✅ Instagram
- ✅ Twitter/X
- ✅ TikTok
- ✅ Facebook
- ✅ Reddit
- ✅ Pinterest

## API Endpoints

### Generic Download
```bash
POST http://localhost:3001/api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=...",
  "platform": "youtube"
}
```

### Platform-Specific Endpoints
- `POST /api/download/youtube`
- `POST /api/download/instagram`
- `POST /api/download/twitter`
- `POST /api/download/tiktok`
- `POST /api/download/facebook`
- `POST /api/download/reddit`
- `POST /api/download/pinterest`

### Health Check
```bash
GET http://localhost:3001/api/health
```

## Directory Structure

```
backend/
├── server.js          # Main backend server
├── package.json       # Node.js dependencies
├── .gitignore         # Git ignore rules
├── start.sh          # Easy startup script
├── downloads/        # Downloaded media (created automatically)
└── README.md         # Backend documentation
```

## Configuration

All configurations are in `server.js`:
- Port: Default is 3001
- Download directory: `backend/downloads/`
- CORS: Enabled for all origins

## Troubleshooting

### "yt-dlp not found"
Install it using one of the methods above.

### "Port already in use"
Change the PORT in `server.js` (line 8)

### "Permission denied"
Make sure the downloads directory has write permissions:
```bash
chmod 755 backend/downloads
```

### Downloads failing
Check that:
1. yt-dlp is installed and up to date: `yt-dlp --version`
2. The URL is valid and accessible
3. The backend server is running

## Security Notes

⚠️ **This is a development setup. For production:**
- Add authentication/API keys
- Implement rate limiting
- Add request validation
- Use HTTPS
- Add error logging
- Implement file size limits

## License

MIT

