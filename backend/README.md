# Social Media Downloader Backend

Backend service for downloading media from social platforms like YouTube, Instagram, TikTok, Twitter, etc.

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Install yt-dlp (required for downloads):
```bash
# Ubuntu/Debian
sudo apt install yt-dlp

# Or using pip
pip install yt-dlp

# Or using npm
npm install -g yt-dlp
```

## Running the Server

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

- `POST /api/download` - Generic download endpoint
- `POST /api/download/youtube` - YouTube specific
- `POST /api/download/instagram` - Instagram specific
- `POST /api/download/twitter` - Twitter/X specific
- `POST /api/download/tiktok` - TikTok specific
- `POST /api/download/facebook` - Facebook specific
- `POST /api/download/reddit` - Reddit specific
- `GET /api/health` - Health check

### Example Request

```bash
curl -X POST http://localhost:3001/api/download/youtube \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Notes

- All downloads are saved in the `downloads/` directory
- yt-dlp is used as the primary downloader (supports most platforms)
- The server uses Express.js with CORS enabled
- Downloaded files are served statically from `/downloads`

