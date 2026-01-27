// Load environment variables from .env file
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const axios = require('axios')
const multer = require('multer')
const { PDFDocument, rgb } = require('pdf-lib')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const http = require('http')
const { Server } = require('socket.io')
const tradingConstants = require('./constants')
const puppeteer = require('puppeteer')

const app = express()
const server = http.createServer(app)

// Allowed origins list for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://priyankaclass.buzz',
  'https://www.priyankaclass.buzz',
  'https://react-udemy-rc44-lm6ymtpr0-sriharsh1104s-projects.vercel.app',
  'https://react-udemy-rc44-dvq0ffddo-sriharsh1104s-projects.vercel.app',
  'https://react-udemy-rc44.vercel.app',
  // Vercel preview deployments (pattern matching for preview URLs)
  /^https:\/\/react-udemy-rc44-.*-sriharsh1104s-projects\.vercel\.app$/,
  // Add any other origins you need
]

// Helper function to check if origin is allowed (supports strings and regex patterns)
function isOriginAllowed(origin) {
  if (!origin) return true
  
  for (const allowed of allowedOrigins) {
    if (typeof allowed === 'string' && allowed === origin) {
      return true
    }
    if (allowed instanceof RegExp && allowed.test(origin)) {
      return true
    }
  }
  
  // Allow all origins as fallback (public API)
  return true
}

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true)
      
      // Check if origin is in allowed list (supports pattern matching)
      if (isOriginAllowed(origin)) {
        return callback(null, true)
      }
      
      // Allow all origins as fallback (public API)
      callback(null, true)
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
    allowedHeaders: ['*']
  },
  transports: ['polling', 'websocket'], // Polling first for better compatibility
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
})
// PORT is automatically set by Render via environment variable
// Fallback to 3001 for local development only
const PORT = process.env.PORT || 3001

// Trust proxy for proper URL detection on Render/Heroku/etc
app.set('trust proxy', true)

// Helper function to get backend base URL (works for both local and Render)
function getBackendUrl(req) {
  // If BACKEND_URL env variable is set, use it
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL
  }
  
  // Otherwise, construct from request
  const protocol = req.protocol || (req.headers['x-forwarded-proto'] || 'http')
  const host = req.headers.host || req.get('host') || `localhost:${PORT}`
  return `${protocol}://${host}`
}

// Middleware - CORS Configuration - AGGRESSIVE FIX (ALLOW EVERYTHING)
// MUST be before any routes

app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  
  // ALWAYS set CORS headers - NO CONDITIONS
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Expose-Headers', '*')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }
  next()
})

// Use cors package as backup - ALLOW ALL ORIGINS
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
  credentials: false,
  optionsSuccessStatus: 204
}))

// Handle preflight for ALL routes - explicit
app.options('*', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.status(204).end()
})

app.use(express.json())
app.use('/downloads', express.static(path.join(__dirname, 'downloads')))

// Root endpoint for Render health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend server is running',
    service: 'social-media-downloader-backend'
  })
})

// File uploads (for PDF edit)
const upload = multer({ dest: path.join(__dirname, 'uploads') })

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads')
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true })
}

// Create uploads directory if it doesn't exist (for PDF edit)
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Create chat uploads dir and static mount (for chat images)
const chatUploadsDir = path.join(__dirname, 'chat_uploads')
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true })
}
app.use('/chat_uploads', express.static(chatUploadsDir))

// Multer config for chat images (<= 1MB)
const chatImageUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, chatUploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png'
      cb(null, `chat_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
    }
  }),
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    cb(allowed.includes(file.mimetype) ? null : new Error('Only image files allowed'), allowed.includes(file.mimetype))
  }
})

// YouTube download endpoint
app.post('/api/download/youtube', async (req, res) => {
  const { url } = req.body
  
  try {
    // Extract video ID
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' })
    }

    console.log('Downloading YouTube video:', url)
    
    // Using yt-dlp - output to a timestamped filename
    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `video_${timestamp}.%(ext)s`)
    // Let yt-dlp automatically select the best available format
    // Added retries and longer timeout for problematic downloads
    const command = `yt-dlp --no-playlist -f "best" -o "${outputPath}" --retries 3 --fragment-retries 3 --ignore-errors "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('YouTube download error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to download YouTube video',
          details: stderr || error.message
        })
      }
      
      // Find the downloaded file
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    console.error('YouTube endpoint error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Instagram download endpoint
app.post('/api/download/instagram', async (req, res) => {
  const { url } = req.body
  
  try {
    const mediaId = extractInstagramId(url)
    if (!mediaId) {
      return res.status(400).json({ error: 'Invalid Instagram URL' })
    }

    // Using yt-dlp for Instagram
    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `insta_${timestamp}.%(ext)s`)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Instagram download error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to download Instagram media',
          details: stderr || error.message
        })
      }
      
      // Find the downloaded file by timestamp
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Twitter download endpoint
app.post('/api/download/twitter', async (req, res) => {
  const { url } = req.body
  
  try {
    const tweetId = extractTwitterId(url)
    if (!tweetId) {
      return res.status(400).json({ error: 'Invalid Twitter URL' })
    }

    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `twitter_${timestamp}.%(ext)s`)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Twitter download error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to download Twitter media',
          details: stderr || error.message
        })
      }
      
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// TikTok download endpoint
app.post('/api/download/tiktok', async (req, res) => {
  const { url } = req.body
  
  try {
    const videoId = extractTikTokId(url)
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid TikTok URL' })
    }

    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `tiktok_${timestamp}.%(ext)s`)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('TikTok download error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to download TikTok video',
          details: stderr || error.message
        })
      }
      
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Facebook download endpoint
app.post('/api/download/facebook', async (req, res) => {
  const { url } = req.body
  
  try {
    const videoId = extractFacebookId(url)
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid Facebook URL' })
    }

    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `facebook_${timestamp}.%(ext)s`)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Facebook download error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to download Facebook video',
          details: stderr || error.message
        })
      }
      
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reddit download endpoint
app.post('/api/download/reddit', async (req, res) => {
  const { url } = req.body
  
  try {
    const postId = extractRedditId(url)
    if (!postId) {
      return res.status(400).json({ error: 'Invalid Reddit URL' })
    }

    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `reddit_${timestamp}.%(ext)s`)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Reddit download error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to download Reddit media',
          details: stderr || error.message
        })
      }
      
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Snapchat download endpoint
app.post('/api/download/snapchat', async (req, res) => {
  const { url } = req.body
  
  try {
    const mediaId = extractSnapchatId(url)
    
    // Warn user about Snapchat limitations
    if (!mediaId) {
      return res.status(400).json({ 
        error: 'Invalid Snapchat URL or link expired. Snapchat content is typically protected and cannot be downloaded.' 
      })
    }

    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `snapchat_${timestamp}.%(ext)s`)
    
    // Attempt to download with yt-dlp (will likely fail due to DRM)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 60000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Snapchat download error:', error.message)
        console.error('stderr:', stderr)
        
        // Check if it's a common Snapchat error
        if (stderr.includes('Unsupported URL') || stderr.includes('Private video') || stderr.includes('DRM')) {
          return res.status(500).json({ 
            error: 'Snapchat videos are protected by DRM and cannot be downloaded. This is a security feature.',
            details: 'Snapchat content requires authentication and is encrypted. Try downloading from Stories or Memories if available.'
          })
        }
        
        return res.status(500).json({ 
          error: 'Failed to download Snapchat media',
          details: stderr || error.message,
          note: 'Snapchat videos are ephemeral and heavily protected. Most cannot be downloaded.'
        })
      }
      
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      note: 'Snapchat content is protected and rarely downloadable' 
    })
  }
})

// Pinterest download endpoint
app.post('/api/download/pinterest', async (req, res) => {
  const { url } = req.body
  
  try {
    const pinId = extractPinterestId(url)
    if (!pinId) {
      return res.status(400).json({ error: 'Invalid Pinterest URL. Expected format: https://www.pinterest.com/pin/123456789/' })
    }

    console.log('Downloading Pinterest media:', url)
    
    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `pinterest_${timestamp}.%(ext)s`)
    
    // Use yt-dlp to download Pinterest media (images or videos)
    const command = `yt-dlp -f "best" --no-playlist -o "${outputPath}" "${url}"`
    
    exec(command, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Pinterest download error:', error.message)
        console.error('stderr:', stderr)
        
        if (stderr.includes('Unsupported URL')) {
          return res.status(400).json({ 
            error: 'This Pinterest URL format is not supported',
            details: 'Try using the standard /pin/ URL format'
          })
        }
        
        return res.status(500).json({ 
          error: 'Failed to download Pinterest media',
          details: stderr || error.message,
          note: 'Make sure the pin is public and accessible'
        })
      }
      
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile
      })
    })
  } catch (error) {
    console.error('Pinterest endpoint error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get available formats for a URL (like ytdown.to does)
app.post('/api/formats', async (req, res) => {
  const { url } = req.body
  
  // ALWAYS set CORS headers - NO CONDITIONS
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    console.log('Getting formats for:', url)
    const command = `yt-dlp --list-formats --dump-json --no-playlist "${url}" 2>&1`
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
      // ALWAYS set CORS headers in callback - NO CONDITIONS
      const respOrigin = req.headers.origin || '*'
      res.setHeader('Access-Control-Allow-Origin', respOrigin)
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
      res.setHeader('Access-Control-Allow-Headers', '*')
      res.setHeader('Access-Control-Allow-Credentials', 'false')
      
      // Check for common errors in stderr
      const errorOutput = stderr || (error ? error.message : '')
      
      if (errorOutput.includes('No video formats found') || errorOutput.includes('ERROR: [facebook]')) {
        return res.status(400).json({ 
          error: 'This video cannot be accessed. It may be private, require login, or from a restricted group.',
          details: 'Make sure the video is public and try again.'
        })
      }
      
      if (error) {
        console.error('Get formats error:', stderr)
        return res.status(500).json({ error: 'Failed to get formats', details: stderr })
      }
      
      try {
        const lines = stdout.trim().split('\n')
        const formats = lines.map(line => {
          try {
            return JSON.parse(line)
          } catch {
            return null
          }
        }).filter(f => f && f.format_id)
        
        res.json({ formats })
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse formats' })
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Netflix auto-login endpoint - returns a page that auto-fills Netflix login
app.get('/api/netflix/autologin', (req, res) => {
  // ALWAYS set CORS headers
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'false')

  const email = req.query.email
  const password = req.query.password

  if (!email || !password) {
    return res.status(400).send(`
      <html>
        <body>
          <h1>Error: Email and password are required</h1>
          <p>Please provide email and password as query parameters.</p>
        </body>
      </html>
    `)
  }

  // Return HTML page that redirects to Netflix and attempts to auto-fill
  // Note: Due to CORS, we can't directly fill Netflix's form, but we can open it
  // and provide instructions or use a bookmarklet approach
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Netflix Auto-Login</title>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          background: #141414;
          color: #fff;
        }
        .container {
          background: #1f1f1f;
          padding: 30px;
          border-radius: 8px;
        }
        button {
          background: #e50914;
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 16px;
          border-radius: 4px;
          cursor: pointer;
          width: 100%;
          margin-top: 20px;
        }
        button:hover {
          background: #f40612;
        }
        .info {
          background: #2d2d2d;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎬 Netflix Auto-Login</h1>
        <div class="info">
          <p><strong>Note:</strong> Due to browser security (CORS), we cannot automatically fill Netflix's login form from an external page.</p>
          <p>Click the button below to open Netflix. Then use the auto-fill script provided.</p>
        </div>
        <button onclick="openNetflix()">Open Netflix Login</button>
        <div class="info" id="scriptInfo" style="display: none; margin-top: 20px;">
          <p><strong>Auto-Fill Script:</strong></p>
          <p>After Netflix login page opens, open browser console (F12) and paste this:</p>
          <pre style="background: #000; padding: 10px; border-radius: 4px; overflow-x: auto;">
document.querySelector('input[type="email"], input[name="userLoginId"]').value = '${email.replace(/'/g, "\\'")}';
document.querySelector('input[type="password"], input[name="password"]').value = '${password.replace(/'/g, "\\'")}';
document.querySelector('button[type="submit"], button[data-uia="login-submit-button"]').click();
          </pre>
        </div>
      </div>
      <script>
        function openNetflix() {
          window.open('https://www.netflix.com/login', '_blank');
          document.getElementById('scriptInfo').style.display = 'block';
        }
        
        // Try to use Puppeteer-like automation via iframe (won't work due to CORS, but attempt it)
        // Alternative: Use a browser extension approach
        window.addEventListener('load', () => {
          console.log('Netflix Auto-Login page loaded');
          console.log('Email:', '${email.substring(0, 3)}***');
        });
      </script>
    </body>
    </html>
  `

  res.send(html)
})

// Netflix auto-login endpoint using Puppeteer (for server-side automation)
app.post('/api/netflix/login', async (req, res) => {
  // ALWAYS set CORS headers
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'false')

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Email and password are required',
      success: false 
    })
  }

  // For server-side automation, we'd need X11 or similar to show browser to user
  // Instead, return a URL to the auto-login page
  const autoLoginUrl = `${getBackendUrl(req)}/api/netflix/autologin?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  
  res.json({ 
    success: true,
    message: 'Opening Netflix auto-login page...',
    autoLoginUrl: autoLoginUrl,
    redirect: true
  })
})

// Generic download endpoint
app.post('/api/download', async (req, res) => {
  // ALWAYS set CORS headers - NO CONDITIONS
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  const { url, platform, format } = req.body
  
  console.log(`Downloading from ${platform}:`, url, format ? `format: ${format}` : '')
  
  try {
    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `${platform}_${timestamp}.%(ext)s`)
    
    // Use the same approach as yout.com - more aggressive settings
    let command = `yt-dlp --no-playlist -o "${outputPath}"`
    
    if (format) {
      command += ` -f "${format}"`
    } else {
      // Try multiple strategies like yout.com
      command += ` -f "bestvideo*+bestaudio/best"`
    }
    
    // Platform-specific settings
    if (platform === 'facebook') {
      // Facebook sometimes requires authentication - skip login requirement
      command += ` --extractor-args "facebook:skip_logged_out=False;facebook:include_comments=False"`
    }
    
    // Add options to work around YouTube blocking (similar to yout.com/yout-down.to)
    command += ` --retries 5 --fragment-retries 5 --concurrent-fragments 8`
    command += ` --no-warnings --extractor-retries 3`
    command += ` "${url}"`
    
    console.log(`Executing command: ${command}`)
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      // ALWAYS set CORS headers in callback - NO CONDITIONS
      const respOrigin = req.headers.origin || '*'
      res.setHeader('Access-Control-Allow-Origin', respOrigin)
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
      res.setHeader('Access-Control-Allow-Headers', '*')
      res.setHeader('Access-Control-Allow-Credentials', 'false')
      
      if (error) {
        console.error(`${platform} download error:`, error.message)
        console.error('stderr:', stderr)
        
        // Platform-specific error messages
        let errorMessage = `Failed to download from ${platform}`
        if (platform === 'facebook') {
          if (stderr.includes('No video formats found') || stderr.includes('No video found')) {
            errorMessage = 'Facebook video cannot be downloaded. This usually means:\n• The video is private or requires login\n• The video is from a private group\n• The link is broken or expired\n• Try making the video public first'
          } else if (stderr.includes('Private video') || stderr.includes('Login required')) {
            errorMessage = 'Facebook video requires login. Make the video public first.'
          } else if (stderr.includes('Unsupported URL')) {
            errorMessage = 'Unsupported Facebook URL format. Try using /watch/?v= or a direct video link.'
          } else if (stderr.includes('Access denied')) {
            errorMessage = 'Access denied. The video is private or restricted.'
          }
        }
        
        return res.status(500).json({ 
          error: errorMessage,
          details: stderr || error.message,
          platform
        })
      }
      
      console.log('Download stdout:', stdout)
      
      // Find the downloaded file
      const files = fs.readdirSync(downloadsDir)
      const downloadedFile = files.find(f => f.includes(timestamp.toString()))
      
      if (!downloadedFile) {
        return res.status(500).json({ error: 'Downloaded file not found' })
      }
      
      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${downloadedFile}`,
        filename: downloadedFile,
        platform
      })
    })
  } catch (error) {
    console.error('Generic download endpoint error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Text-to-Speech endpoint using free Google TTS API
app.post('/api/tts/speak', async (req, res) => {
  try {
    const { text, lang = 'en', slow = false } = req.body
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required' })
    }

    // Google Translate TTS API (free, no API key needed)
    // Limit text to reasonable length (5000 chars max)
    const textToSpeak = text.trim().substring(0, 5000)
    
    // Map language codes
    const langMap = {
      'hi': 'hi',      // Hindi
      'en': 'en',      // English
      'en-US': 'en-US',
      'en-IN': 'en-IN', // English India
      'es': 'es',      // Spanish
      'fr': 'fr',      // French
      'de': 'de',      // German
      'ja': 'ja',      // Japanese
      'zh': 'zh',      // Chinese
      'ar': 'ar',      // Arabic
      'pt': 'pt',      // Portuguese
      'ru': 'ru'       // Russian
    }
    
    const ttsLang = langMap[lang] || 'en'
    
    // Google Translate TTS URL
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&text=${encodeURIComponent(textToSpeak)}`
    
    // Fetch audio from Google TTS
    const response = await axios.get(ttsUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    // Return audio data
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"')
    res.send(Buffer.from(response.data))
    
  } catch (error) {
    console.error('TTS error:', error)
    res.status(500).json({ 
      error: error.message || 'Failed to convert text to speech',
      details: 'TTS service temporarily unavailable'
    })
  }
})

// Get available TTS languages
app.get('/api/tts/languages', (req, res) => {
  res.json({
    success: true,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-IN', name: 'English (India)' },
      { code: 'hi', name: 'Hindi' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'ja', name: 'Japanese' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' }
    ]
  })
})

// PDF edit endpoint: accepts a PDF file and an array of edits and returns a flattened PDF
// Request: multipart/form-data with fields:
// - file: PDF file
// - edits: JSON string of [{ page, x, y, text, fontSize, color, mask }] where coordinates are in PDF points
app.post('/api/pdf/edit', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' })
    }

    const editsRaw = req.body.edits
    let edits = []
    if (editsRaw) {
      try { edits = JSON.parse(editsRaw) } catch { edits = [] }
    }

    const pdfBytes = fs.readFileSync(req.file.path)
    const pdfDoc = await PDFDocument.load(pdfBytes)

    const pages = pdfDoc.getPages()
    const grouped = {}
    for (const e of edits) {
      if (!grouped[e.page]) grouped[e.page] = []
      grouped[e.page].push(e)
    }

    for (const pageNumStr of Object.keys(grouped)) {
      const idx = parseInt(pageNumStr, 10) - 1
      if (idx < 0 || idx >= pages.length) continue
      const page = pages[idx]
      
      // First pass: Draw all masks to cover original text
      for (const e of grouped[pageNumStr]) {
        if (e.mask) {
          const maskWidth = Number(e.mask.width || (612 - e.x))
          const maskHeight = Number(e.mask.height || ((e.fontSize || 12) * 1.4))
          
          // Draw white rectangle to mask original text
          // In PDF: (x, y) for text is bottom-left corner, text extends upward
          // So mask should cover from (e.x, e.y) upward to (e.x + width, e.y + height)
          const maskX = Math.max(e.x - 3, 0)
          const maskY = e.y // Start from text baseline (bottom of text)
          const maskW = Math.min(maskWidth + 6, 612 - maskX)
          const maskH = maskHeight + 3 // Extend upward to cover text height
          
          page.drawRectangle({
            x: maskX,
            y: maskY,
            width: maskW,
            height: maskH,
            color: rgb(1, 1, 1), // White
            borderColor: rgb(1, 1, 1),
            borderWidth: 0
          })
        }
      }
      
      // Second pass: Draw all edited text on top of masks
      for (const e of grouped[pageNumStr]) {
        const size = Number(e.fontSize || 12)
        const hex = (e.color || '#000000').replace('#','')
        const r = parseInt(hex.slice(0,2),16)/255
        const g = parseInt(hex.slice(2,4),16)/255
        const b = parseInt(hex.slice(4,6),16)/255

        const sanitized = (e.text || '')
          .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
          .replace(/[^\x00-\x7F]/g, '')

        if (!sanitized.trim()) continue
        
        page.drawText(sanitized, {
          x: e.x,
          y: e.y,
          size,
          color: rgb(r, g, b)
        })
      }
    }

    const outBytes = await pdfDoc.save()
    const outName = `edited_${Date.now()}.pdf`
    const outPath = path.join(downloadsDir, outName)
    fs.writeFileSync(outPath, outBytes)

    // Cleanup upload
    try { fs.unlinkSync(req.file.path) } catch {}

    res.json({
      success: true,
      downloadUrl: `${getBackendUrl(req)}/downloads/${outName}`,
      filename: outName
    })
  } catch (err) {
    console.error('PDF edit error:', err)
    res.status(500).json({ error: err.message || 'Failed to edit PDF' })
  }
})

// Stripe Payment Intent creation endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    console.log(`Creating payment intent for $${amount}`)
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    })
    
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      success: true 
    })
  } catch (error) {
    console.error('Stripe error:', error.message)
    res.status(500).json({ 
      error: error.message,
      details: error.type || 'Unknown error'
    })
  }
})

// Confirm payment endpoint
app.post('/api/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body
    
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' })
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    
    res.json({ 
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency
    })
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    })
  }
})

// Chat image upload endpoint (<=1MB)
app.post('/api/chat/upload-image', chatImageUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' })
    }
    const publicUrl = `${getBackendUrl(req)}/chat_uploads/${req.file.filename}`
    res.json({ success: true, url: publicUrl, filename: req.file.filename })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Upload failed' })
  }
})

// Helper function to fetch data with fallback APIs
async function fetchWithFallback(apis, symbol) {
  for (const api of apis) {
    try {
      const result = await api.fn()
      if (result) {
        console.log(`✓ ${symbol} fetched from ${api.name || 'API'}`)
        return result
      }
    } catch (error) {
      console.log(`✗ ${symbol} failed from ${api.name || 'API'}: ${error.message}`)
      continue
    }
  }
  return null
}

// Trading data endpoint - Get live trading prices with automatic fallback
app.get('/api/trading/data', async (req, res) => {
  try {
    const tradingData = {}
    const timestamp = new Date().toISOString()
    
    // ==================== BTC ====================
    // Fallback order: CoinGecko -> Binance -> Coinbase -> Twelve Data
    const btcApis = [
      {
        name: 'CoinGecko',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.COINGECKO_API_URL}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`, {
            timeout: 5000
          })
          if (response.data?.bitcoin?.usd) {
            return {
              BTC: {
                symbol: 'BTC',
                name: 'Bitcoin',
                price: response.data.bitcoin.usd,
                currency: 'USD',
                change: response.data.bitcoin.usd_24h_change || null,
                lastUpdate: timestamp
              },
              'BTC/USD': {
                symbol: 'BTC/USD',
                name: 'Bitcoin vs US Dollar',
                price: response.data.bitcoin.usd,
                currency: 'USD',
                change: response.data.bitcoin.usd_24h_change || null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      },
      {
        name: 'Binance',
        fn: async () => {
          // Binance public API - no key needed
          const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT', {
            timeout: 5000
          })
          if (response.data?.lastPrice) {
            const price = parseFloat(response.data.lastPrice)
            const change = response.data.priceChangePercent ? parseFloat(response.data.priceChangePercent) : null
            return {
              BTC: {
                symbol: 'BTC',
                name: 'Bitcoin',
                price: price,
                currency: 'USD',
                change: change,
                lastUpdate: timestamp
              },
              'BTC/USD': {
                symbol: 'BTC/USD',
                name: 'Bitcoin vs US Dollar',
                price: price,
                currency: 'USD',
                change: change,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      },
      {
        name: 'Coinbase',
        fn: async () => {
          // Coinbase public API - no key needed
          const response = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=BTC', {
            timeout: 5000
          })
          if (response.data?.data?.rates?.USD) {
            const price = parseFloat(response.data.data.rates.USD)
            return {
              BTC: {
                symbol: 'BTC',
                name: 'Bitcoin',
                price: price,
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              },
              'BTC/USD': {
                symbol: 'BTC/USD',
                name: 'Bitcoin vs US Dollar',
                price: price,
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      }
    ]
    
    // Add Twelve Data if API key is available
    if (tradingConstants.TWELVE_DATA_API_KEY && tradingConstants.TWELVE_DATA_API_KEY !== '') {
      btcApis.push({
        name: 'Twelve Data',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.TWELVE_DATA_API_URL}/price`, {
            params: {
              symbol: 'BTC/USD',
              apikey: tradingConstants.TWELVE_DATA_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.price) {
            const price = parseFloat(response.data.price)
            return {
              BTC: {
                symbol: 'BTC',
                name: 'Bitcoin',
                price: price,
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              },
              'BTC/USD': {
                symbol: 'BTC/USD',
                name: 'Bitcoin vs US Dollar',
                price: price,
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    const btcResult = await fetchWithFallback(btcApis, 'BTC')
    if (btcResult) {
      Object.assign(tradingData, btcResult)
    }
    
    // ==================== GOLD/USD ====================
    // Fallback order: Free Public APIs -> Twelve Data -> Alpha Vantage
    const goldApis = []
    
    // Free public API - Try multiple free endpoints
    goldApis.push({
      name: 'GoldAPI (Public)',
      fn: async () => {
        try {
          // Try gold-api.com free endpoint (may have rate limits)
          const response = await axios.get('https://www.goldapi.io/api/XAU/USD', {
            headers: {
              'x-access-token': 'goldapi-io-free' // Some endpoints accept free token
            },
            timeout: 5000
          })
          if (response.data?.price) {
            return {
              'GOLD/USD': {
                symbol: 'GOLD/USD',
                name: 'Gold vs US Dollar',
                price: parseFloat(response.data.price),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
        } catch (error) {
          // Try alternative free endpoint
          try {
            // Try freegoldprice.org free endpoint
            const response2 = await axios.get('https://api.freegoldprice.org/v1/latest', {
              params: {
                base: 'XAU',
                currencies: 'USD'
              },
              timeout: 5000
            })
            if (response2.data?.rates?.USD) {
              return {
                'GOLD/USD': {
                  symbol: 'GOLD/USD',
                  name: 'Gold vs US Dollar',
                  price: parseFloat(response2.data.rates.USD),
                  currency: 'USD',
                  change: null,
                  lastUpdate: timestamp
                }
              }
            }
          } catch (e) {
            // Continue to next API
          }
        }
        return null
      }
    })
    
    if (tradingConstants.TWELVE_DATA_API_KEY && tradingConstants.TWELVE_DATA_API_KEY !== '') {
      goldApis.push({
        name: 'Twelve Data',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.TWELVE_DATA_API_URL}/price`, {
            params: {
              symbol: 'XAU/USD',
              apikey: tradingConstants.TWELVE_DATA_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.price) {
            return {
              'GOLD/USD': {
                symbol: 'GOLD/USD',
                name: 'Gold vs US Dollar',
                price: parseFloat(response.data.price),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    if (tradingConstants.ALPHA_VANTAGE_API_KEY && tradingConstants.ALPHA_VANTAGE_API_KEY !== 'demo' && tradingConstants.ALPHA_VANTAGE_API_KEY !== '') {
      goldApis.push({
        name: 'Alpha Vantage',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.ALPHA_VANTAGE_API_URL}`, {
            params: {
              function: 'CURRENCY_EXCHANGE_RATE',
              from_currency: 'XAU',
              to_currency: 'USD',
              apikey: tradingConstants.ALPHA_VANTAGE_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']) {
            return {
              'GOLD/USD': {
                symbol: 'GOLD/USD',
                name: 'Gold vs US Dollar',
                price: parseFloat(response.data['Realtime Currency Exchange Rate']['5. Exchange Rate']),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    const goldResult = await fetchWithFallback(goldApis, 'GOLD/USD')
    if (goldResult) {
      Object.assign(tradingData, goldResult)
    }
    
    // ==================== SILVER/USD ====================
    // Fallback order: Free Public APIs -> Twelve Data -> Alpha Vantage
    const silverApis = []
    
    // Free public API - MetalPriceAPI (try without key first)
    silverApis.push({
      name: 'MetalPriceAPI (Public)',
      fn: async () => {
        try {
          const response = await axios.get('https://api.metalpriceapi.com/v1/latest', {
            params: {
              base: 'XAG',
              currencies: 'USD',
              api_key: 'free'
            },
            timeout: 5000
          })
          if (response.data?.rates?.USD) {
            return {
              'SILVER/USD': {
                symbol: 'SILVER/USD',
                name: 'Silver vs US Dollar',
                price: parseFloat(response.data.rates.USD),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
        } catch (error) {
          // Try alternative endpoint
          try {
            const response2 = await axios.get('https://api.exchangerate-api.com/v4/latest/XAG', {
              timeout: 5000
            })
            if (response2.data?.rates?.USD) {
              return {
                'SILVER/USD': {
                  symbol: 'SILVER/USD',
                  name: 'Silver vs US Dollar',
                  price: parseFloat(response2.data.rates.USD),
                  currency: 'USD',
                  change: null,
                  lastUpdate: timestamp
                }
              }
            }
          } catch (e) {
            // Continue to next API
          }
        }
        return null
      }
    })
    
    if (tradingConstants.TWELVE_DATA_API_KEY && tradingConstants.TWELVE_DATA_API_KEY !== '') {
      silverApis.push({
        name: 'Twelve Data',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.TWELVE_DATA_API_URL}/price`, {
            params: {
              symbol: 'XAG/USD',
              apikey: tradingConstants.TWELVE_DATA_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.price) {
            return {
              'SILVER/USD': {
                symbol: 'SILVER/USD',
                name: 'Silver vs US Dollar',
                price: parseFloat(response.data.price),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    if (tradingConstants.ALPHA_VANTAGE_API_KEY && tradingConstants.ALPHA_VANTAGE_API_KEY !== 'demo' && tradingConstants.ALPHA_VANTAGE_API_KEY !== '') {
      silverApis.push({
        name: 'Alpha Vantage',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.ALPHA_VANTAGE_API_URL}`, {
            params: {
              function: 'CURRENCY_EXCHANGE_RATE',
              from_currency: 'XAG',
              to_currency: 'USD',
              apikey: tradingConstants.ALPHA_VANTAGE_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate']) {
            return {
              'SILVER/USD': {
                symbol: 'SILVER/USD',
                name: 'Silver vs US Dollar',
                price: parseFloat(response.data['Realtime Currency Exchange Rate']['5. Exchange Rate']),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    const silverResult = await fetchWithFallback(silverApis, 'SILVER/USD')
    if (silverResult) {
      Object.assign(tradingData, silverResult)
    }
    
    // ==================== USOIL ====================
    // Fallback order: Free Public APIs -> Twelve Data -> Alpha Vantage
    const usoilApis = []
    
    // Free public API endpoints for oil
    usoilApis.push({
      name: 'OilPriceAPI (Public)',
      fn: async () => {
        try {
          // Try public endpoint for WTI crude oil
          const response = await axios.get('https://api.oilpriceapi.com/v1/prices/latest', {
            headers: {
              'Authorization': 'Token free' // Some endpoints accept 'free' token
            },
            timeout: 5000
          })
          if (response.data?.data?.formatted?.wti) {
            return {
              USOIL: {
                symbol: 'USOIL',
                name: 'WTI Crude Oil',
                price: parseFloat(response.data.data.formatted.wti),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
        } catch (error) {
          // Try alternative free endpoint
          try {
            // Alternative: Use a public data source
            const response2 = await axios.get('https://api.energypriceapi.com/v1/prices/wti', {
              timeout: 5000
            })
            if (response2.data?.price) {
              return {
                USOIL: {
                  symbol: 'USOIL',
                  name: 'WTI Crude Oil',
                  price: parseFloat(response2.data.price),
                  currency: 'USD',
                  change: null,
                  lastUpdate: timestamp
                }
              }
            }
          } catch (e) {
            // Continue to next API
          }
        }
        return null
      }
    })
    
    if (tradingConstants.TWELVE_DATA_API_KEY && tradingConstants.TWELVE_DATA_API_KEY !== '') {
      usoilApis.push({
        name: 'Twelve Data',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.TWELVE_DATA_API_URL}/price`, {
            params: {
              symbol: 'CL',
              apikey: tradingConstants.TWELVE_DATA_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.price) {
            return {
              USOIL: {
                symbol: 'USOIL',
                name: 'WTI Crude Oil',
                price: parseFloat(response.data.price),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    if (tradingConstants.ALPHA_VANTAGE_API_KEY && tradingConstants.ALPHA_VANTAGE_API_KEY !== 'demo' && tradingConstants.ALPHA_VANTAGE_API_KEY !== '') {
      usoilApis.push({
        name: 'Alpha Vantage',
        fn: async () => {
          // Alpha Vantage might not support oil directly in free tier
          return null
        }
      })
    }
    
    const usoilResult = await fetchWithFallback(usoilApis, 'USOIL')
    if (usoilResult) {
      Object.assign(tradingData, usoilResult)
    }
    
    // ==================== UKOIL ====================
    // Fallback order: Free Public APIs -> Twelve Data -> Alpha Vantage
    const ukoilApis = []
    
    // Free public API endpoints for oil
    ukoilApis.push({
      name: 'OilPriceAPI (Public)',
      fn: async () => {
        try {
          // Try public endpoint for Brent crude oil
          const response = await axios.get('https://api.oilpriceapi.com/v1/prices/latest', {
            headers: {
              'Authorization': 'Token free'
            },
            timeout: 5000
          })
          if (response.data?.data?.formatted?.brent) {
            return {
              UKOIL: {
                symbol: 'UKOIL',
                name: 'Brent Crude Oil',
                price: parseFloat(response.data.data.formatted.brent),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
        } catch (error) {
          // Try alternative free endpoint
          try {
            const response2 = await axios.get('https://api.energypriceapi.com/v1/prices/brent', {
              timeout: 5000
            })
            if (response2.data?.price) {
              return {
                UKOIL: {
                  symbol: 'UKOIL',
                  name: 'Brent Crude Oil',
                  price: parseFloat(response2.data.price),
                  currency: 'USD',
                  change: null,
                  lastUpdate: timestamp
                }
              }
            }
          } catch (e) {
            // Continue to next API
          }
        }
        return null
      }
    })
    
    if (tradingConstants.TWELVE_DATA_API_KEY && tradingConstants.TWELVE_DATA_API_KEY !== '') {
      ukoilApis.push({
        name: 'Twelve Data',
        fn: async () => {
          const response = await axios.get(`${tradingConstants.TWELVE_DATA_API_URL}/price`, {
            params: {
              symbol: 'BZ',
              apikey: tradingConstants.TWELVE_DATA_API_KEY
            },
            timeout: 5000
          })
          if (response.data?.price) {
            return {
              UKOIL: {
                symbol: 'UKOIL',
                name: 'Brent Crude Oil',
                price: parseFloat(response.data.price),
                currency: 'USD',
                change: null,
                lastUpdate: timestamp
              }
            }
          }
          return null
        }
      })
    }
    
    if (tradingConstants.ALPHA_VANTAGE_API_KEY && tradingConstants.ALPHA_VANTAGE_API_KEY !== 'demo' && tradingConstants.ALPHA_VANTAGE_API_KEY !== '') {
      ukoilApis.push({
        name: 'Alpha Vantage',
        fn: async () => {
          // Alpha Vantage might not support oil directly in free tier
          return null
        }
      })
    }
    
    const ukoilResult = await fetchWithFallback(ukoilApis, 'UKOIL')
    if (ukoilResult) {
      Object.assign(tradingData, ukoilResult)
    }
    
    // Return whatever data we managed to fetch
    const availablePairs = Object.keys(tradingData).length
    const missingPairs = []
    
    if (!tradingData['GOLD/USD']) missingPairs.push('GOLD/USD')
    if (!tradingData['SILVER/USD']) missingPairs.push('SILVER/USD')
    if (!tradingData.USOIL) missingPairs.push('USOIL')
    if (!tradingData.UKOIL) missingPairs.push('UKOIL')
    
    if (missingPairs.length > 0) {
      console.log(`⚠️  Missing data for: ${missingPairs.join(', ')}`)
      console.log(`💡 Tip: Add API keys to .env file for Gold, Silver, and Oil data:`)
      console.log(`   - ALPHA_VANTAGE_API_KEY (from https://www.alphavantage.co/support/#api-key)`)
      console.log(`   - TWELVE_DATA_API_KEY (from https://twelvedata.com/)`)
    }
    
    res.json({
      success: true,
      data: tradingData,
      timestamp: timestamp,
      availablePairs: availablePairs,
      totalPairs: 6,
      missingPairs: missingPairs,
      message: missingPairs.length > 0 
        ? `Note: ${missingPairs.join(', ')} data not available. Add API keys to .env file for full data.`
        : 'All trading pairs loaded successfully'
    })
  } catch (error) {
    console.error('Trading data endpoint error:', error)
    res.status(500).json({ 
      error: 'Failed to fetch trading data',
      details: error.message 
    })
  }
})

// Audio extraction directory
const audioProcessDir = path.join(__dirname, 'audio_processing')
if (!fs.existsSync(audioProcessDir)) {
  fs.mkdirSync(audioProcessDir, { recursive: true })
}

// MIME types and extensions allowed for audio/video. Mobile often sends empty/wrong mimetype — allow by extension too.
const AUDIO_VIDEO_MIMES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/flac',
  'audio/x-m4a', 'audio/x-wav', 'audio/3gpp'
]
const AUDIO_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.ogg', '.aac', '.m4a', '.wma', '.flac', '.3gp']

const audioVideoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, audioProcessDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.mp4'
      cb(null, `audio_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`)
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req, file, cb) => {
    const mimeOk = file.mimetype && AUDIO_VIDEO_MIMES.includes(file.mimetype)
    if (mimeOk) return cb(null, true)
    const ext = (path.extname(file.originalname || '') || '').toLowerCase()
    const extOk = AUDIO_VIDEO_EXTENSIONS.includes(ext)
    if (extOk) return cb(null, true)
    cb(new Error('Only video/audio files allowed'), false)
  }
})

// Extract audio from video endpoint
app.post('/api/audio/extract', audioVideoUpload.single('file'), async (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video or audio file is required' })
    }

    const rawFormat = (req.body && req.body.format) ? String(req.body.format).toLowerCase().trim() : 'mp3'
    const format = ['mp3', 'wav', 'aac'].includes(rawFormat) ? rawFormat : 'mp3'
    const inputPath = req.file.path
    const timestamp = Date.now()
    const outputFileName = `extracted_${timestamp}.${format}`
    const outputPath = path.join(downloadsDir, outputFileName)

    // Extract audio using FFmpeg
    const command = `ffmpeg -i "${inputPath}" -vn -acodec ${format === 'mp3' ? 'libmp3lame' : format === 'wav' ? 'pcm_s16le' : 'aac'} -ab 192k -ar 44100 "${outputPath}" -y`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      // Cleanup input file
      try { fs.unlinkSync(inputPath) } catch {}
      
      if (error) {
        console.error('Audio extraction error:', error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: 'Failed to extract audio',
          details: stderr || error.message
        })
      }

      res.json({ 
        success: true, 
        downloadUrl: `${getBackendUrl(req)}/downloads/${outputFileName}`,
        filename: outputFileName
      })
    })
  } catch (error) {
    // Cleanup on error
    if (req.file) {
      try { fs.unlinkSync(req.file.path) } catch {}
    }
    res.status(500).json({ error: error.message })
  }
})

// Separate voice from music endpoint
app.post('/api/audio/separate', audioVideoUpload.single('file'), async (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio or video file is required' })
    }

    const rawMode = (req.body && req.body.mode) ? String(req.body.mode).toLowerCase().trim() : 'voice'
    const mode = rawMode === 'music' ? 'music' : 'voice'
    const inputPath = req.file.path
    const timestamp = Date.now()
    const outputFileName = `${mode}_${timestamp}.mp3`
    const outputPath = path.join(downloadsDir, outputFileName)

    // First extract audio if it's a video
    const audioExtractPath = path.join(audioProcessDir, `temp_audio_${timestamp}.wav`)
    let extractCommand = `ffmpeg -i "${inputPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioExtractPath}" -y`
    
    exec(extractCommand, { timeout: 300000 }, (extractError, extractStdout, extractStderr) => {
      if (extractError) {
        // Cleanup
        try { fs.unlinkSync(inputPath) } catch {}
        try { fs.unlinkSync(audioExtractPath) } catch {}
        console.error('Audio extraction error:', extractError.message)
        return res.status(500).json({ 
          error: 'Failed to extract audio from video',
          details: extractStderr || extractError.message
        })
      }

      // Separate voice/music using FFmpeg pan filter (basic stereo L/R math, not AI)
      // voice = L+R (mid/center); music = L-R (sides). For real vocal separation use Spleeter/Demucs.
      let separationCommand
      if (mode === 'voice') {
        separationCommand = `ffmpeg -i "${audioExtractPath}" -af "pan=mono|c0=0.5*c0+0.5*c1" -acodec libmp3lame -ab 192k -ar 44100 "${outputPath}" -y`
      } else {
        separationCommand = `ffmpeg -i "${audioExtractPath}" -af "pan=mono|c0=0.5*c0+-0.5*c1" -acodec libmp3lame -ab 192k -ar 44100 "${outputPath}" -y`
      }

      exec(separationCommand, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (sepError, sepStdout, sepStderr) => {
        // Cleanup temp files
        try { fs.unlinkSync(inputPath) } catch {}
        try { fs.unlinkSync(audioExtractPath) } catch {}
        
        if (sepError) {
          console.error('Separation error:', sepError.message)
          console.error('stderr:', sepStderr)
          return res.status(500).json({ 
            error: `Failed to separate ${mode}`,
            details: sepStderr || sepError.message
          })
        }

        res.json({ 
          success: true, 
          downloadUrl: `${getBackendUrl(req)}/downloads/${outputFileName}`,
          filename: outputFileName,
          mode: mode
        })
      })
    })
  } catch (error) {
    // Cleanup on error
    if (req.file) {
      try { fs.unlinkSync(req.file.path) } catch {}
    }
    res.status(500).json({ error: error.message })
  }
})

// Maths Games Score API Endpoints
const scoresFilePath = path.join(__dirname, 'maths_scores.json')
const MAX_SCORES = 500 // Keep last 500 scores

// English Games Score API Endpoints
const englishScoresFilePath = path.join(__dirname, 'english_scores.json')

// Helper function to read scores from file
function readScores(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading scores file:', error)
  }
  return []
}

// Helper function to write scores to file
function writeScores(scores, filePath) {
  try {
    // Keep only last MAX_SCORES entries
    const trimmedScores = scores.length > MAX_SCORES 
      ? scores.slice(-MAX_SCORES) 
      : scores
    
    fs.writeFileSync(filePath, JSON.stringify(trimmedScores, null, 2))
    return trimmedScores
  } catch (error) {
    console.error('Error writing scores file:', error)
    throw error
  }
}

// POST /api/maths-games/scores - Save a score
app.post('/api/maths-games/scores', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    const { playerName, score, gameName } = req.body
    
    if (!playerName || score === undefined || !gameName) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerName, score, gameName' 
      })
    }
    
    const scoreEntry = {
      playerName: String(playerName).trim(),
      score: parseInt(score),
      gameName: String(gameName).trim(),
      date: new Date().toISOString()
    }
    
    // Read existing scores
    const scores = readScores(scoresFilePath)
    
    // Add new score
    scores.push(scoreEntry)
    
    // Write back to file
    const updatedScores = writeScores(scores, scoresFilePath)
    
    res.json({ 
      success: true, 
      message: 'Score saved successfully',
      scoreEntry,
      totalScores: updatedScores.length
    })
  } catch (error) {
    console.error('Error saving score:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/maths-games/scores - Get all scores
app.get('/api/maths-games/scores', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    const scores = readScores(scoresFilePath)
    
    // Sort by score (descending) then by date (descending)
    const sortedScores = scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.date) - new Date(a.date)
    })
    
    res.json({ 
      success: true,
      scores: sortedScores,
      count: sortedScores.length
    })
  } catch (error) {
    console.error('Error retrieving scores:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/maths-games/scores - Clear all scores
app.delete('/api/maths-games/scores', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    writeScores([], scoresFilePath)
    res.json({ 
      success: true, 
      message: 'All scores cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing scores:', error)
    res.status(500).json({ error: error.message })
  }
})

// English Games Score API Endpoints

// POST /api/english-games/scores - Save a score
app.post('/api/english-games/scores', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    const { playerName, score, gameName } = req.body
    
    if (!playerName || score === undefined || !gameName) {
      return res.status(400).json({ 
        error: 'Missing required fields: playerName, score, gameName' 
      })
    }
    
    const scoreEntry = {
      playerName: String(playerName).trim(),
      score: parseInt(score),
      gameName: String(gameName).trim(),
      date: new Date().toISOString()
    }
    
    // Read existing scores
    const scores = readScores(englishScoresFilePath)
    
    // Add new score
    scores.push(scoreEntry)
    
    // Write back to file
    const updatedScores = writeScores(scores, englishScoresFilePath)
    
    res.json({ 
      success: true, 
      message: 'Score saved successfully',
      scoreEntry,
      totalScores: updatedScores.length
    })
  } catch (error) {
    console.error('Error saving score:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET /api/english-games/scores - Get all scores
app.get('/api/english-games/scores', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    const scores = readScores(englishScoresFilePath)
    
    // Sort by score (descending) then by date (descending)
    const sortedScores = scores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return new Date(b.date) - new Date(a.date)
    })
    
    res.json({ 
      success: true,
      scores: sortedScores,
      count: sortedScores.length
    })
  } catch (error) {
    console.error('Error retrieving scores:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/english-games/scores - Clear all scores
app.delete('/api/english-games/scores', (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')
  
  try {
    writeScores([], englishScoresFilePath)
    res.json({ 
      success: true, 
      message: 'All scores cleared successfully' 
    })
  } catch (error) {
    console.error('Error clearing scores:', error)
    res.status(500).json({ error: error.message })
  }
})

// AI chat proxy – uses API keys from env (Render: OPENAI_API_KEY, PERPLEXITY_API_KEY, GEMINI_API_KEY)
app.post('/api/ai/chat', async (req, res) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)

  try {
    const { provider, messages } = req.body
    if (!provider || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing provider or messages' })
    }

    const envKeys = {
      openai: process.env.OPENAI_API_KEY,
      perplexity: process.env.PERPLEXITY_API_KEY,
      gemini: process.env.GEMINI_API_KEY
    }
    const apiKey = envKeys[provider]
    if (!apiKey) {
      return res.status(502).json({
        error: `API key for ${provider} not configured. Add OPENAI_API_KEY / PERPLEXITY_API_KEY / GEMINI_API_KEY in Render env.`
      })
    }

    if (provider === 'openai') {
      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      )
      return res.json({ content: data.choices[0].message.content })
    }

    if (provider === 'perplexity') {
      const { data } = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          }
        }
      )
      return res.json({ content: data.choices[0].message.content })
    }

    if (provider === 'gemini') {
      const lastUser = messages.filter(m => m.role === 'user').pop()
      const history = messages.slice(0, -1)
      const parts = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }))
      parts.push({ role: 'user', parts: [{ text: lastUser.content }] })

      const { data } = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        { contents: parts },
        { headers: { 'Content-Type': 'application/json' } }
      )
      return res.json({ content: data.candidates[0].content.parts[0].text })
    }

    return res.status(400).json({ error: 'Unknown provider' })
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message
    const status = err.response?.status || 500
    res.status(status >= 400 ? status : 500).json({ error: msg || 'AI request failed' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  // ALWAYS set CORS headers - NO CONDITIONS
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Credentials', 'false')

  res.json({
    status: 'ok',
    message: 'Backend server is running',
    socketio: 'enabled',
    timestamp: new Date().toISOString()
  })
})

// Socket.io test endpoint
const connectedUsers = new Map()
// Store recent chat messages (max 100 messages)
const chatMessages = []
const MAX_CHAT_MESSAGES = 100

app.get('/socket-test', (req, res) => {
  res.json({ 
    message: 'Socket.io server is configured',
    socketio: 'ready',
    connectedUsers: connectedUsers.size
  })
})

// Helper functions
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

function extractInstagramId(url) {
  const match = url.match(/instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/)
  return match ? match[2] : null
}

function extractTwitterId(url) {
  const match = url.match(/twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/)
  return match ? (match[1] || match[2]) : null
}

function extractTikTokId(url) {
  const match = url.match(/tiktok\.com\/@\w+\/video\/(\d+)|vm\.tiktok\.com\/(\w+)/)
  return match ? (match[1] || match[2]) : null
}

function extractFacebookId(url) {
  // Match various Facebook video URL patterns
  const patterns = [
    /facebook\.com\/watch\/\?v=(\d+)/,              // /watch/?v=123
    /facebook\.com\/.+?\/videos\/\/(\d+)/,          // /username/videos/123
    /facebook\.com\/.+?\/videos\/(\d+)/,             // /username/videos/123
    /facebook\.com\/video\.php\?v=(\d+)/,           // /video.php?v=123
    /fb\.watch\/([a-zA-Z0-9_-]+)/,                  // fb.watch/xxxx
    /facebook\.com\/story\.php\?story_fbid=(\d+)/   // story
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

function extractRedditId(url) {
  const match = url.match(/reddit\.com\/r\/\w+\/comments\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

function extractSnapchatId(url) {
  // Match various Snapchat URL patterns
  const patterns = [
    /snapchat\.com\/add\/([\w.-]+)/,           // add/<username>
    /snapchat\.com\/story\/([\w.-]+)/,          // story/<username>
    /snapchat\.com\/t\/([A-Za-z0-9%]+)/,        // share link /t/XXXX
    /snapchat\.com\/([\w.-]+)\/([\w.-]+)/       // other patterns
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1] || match[2] || 'unknown'
  }
  return null
}

function extractPinterestId(url) {
  // Match both numeric and alphanumeric pin IDs
  const patterns = [
    /pinterest\.com\/pin\/(\d+)/,              // Old numeric format
    /pinterest\.com\/pin\/([a-zA-Z0-9_-]+)/,    // Modern alphanumeric format
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Use client's saved session name if sent (same tab/session = same name until full exit)
  const requestedName = (socket.handshake.auth?.userName || socket.handshake.query?.userName || '').trim()
  const userName = requestedName && requestedName.length <= 50 ? requestedName : generateRandomName()
  connectedUsers.set(socket.id, { name: userName, socketId: socket.id })
  
  // Send welcome message, user's name, and message history
  socket.emit('userConnected', { 
    userId: socket.id, 
    userName,
    connectedUsers: Array.from(connectedUsers.values()),
    messageHistory: chatMessages // Send all stored messages
  })
  
  // Broadcast new user joined
  socket.broadcast.emit('userJoined', {
    userId: socket.id,
    userName
  })
  
  // Handle incoming messages (text or image)
  socket.on('sendMessage', (data) => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      const messageData = {
        userId: socket.id,
        userName: user.name,
        message: data.message || '',
        imageUrl: data.imageUrl || null,
        type: data.imageUrl ? 'image' : 'text',
        timestamp: new Date().toISOString()
      }
      
      // Store message in history (keep only last MAX_CHAT_MESSAGES user messages)
      // Note: join/left messages are NOT stored here, only user messages
      chatMessages.push(messageData)
      // Ensure we maintain exactly MAX_CHAT_MESSAGES (100) user messages
      if (chatMessages.length > MAX_CHAT_MESSAGES) {
        chatMessages.shift() // Remove oldest message
      }
      
      // Broadcast message to all users including sender
      io.emit('newMessage', messageData)
    }
  })
  
  // Handle disconnect
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      connectedUsers.delete(socket.id)
      socket.broadcast.emit('userLeft', {
        userId: socket.id,
        userName: user.name
      })
      console.log('User disconnected:', socket.id, user.name)
    }
  })
})

// Generate random name
function generateRandomName() {
  const adjectives = ['Cool', 'Swift', 'Brave', 'Smart', 'Bright', 'Fast', 'Sharp', 'Bold', 'Wild', 'Calm', 'Epic', 'Mega', 'Super', 'Ultra', 'Pro', 'Ace', 'Star', 'Moon', 'Sun', 'Fire', 'Ice', 'Storm', 'Rock', 'Wave']
  const nouns = ['Tiger', 'Eagle', 'Wolf', 'Lion', 'Falcon', 'Shark', 'Dragon', 'Phoenix', 'Fox', 'Bear', 'Hawk', 'Panther', 'Cobra', 'Jaguar', 'Lynx', 'Viper', 'Rhino', 'Panda', 'Orca', 'Raven', 'Thunder', 'Lightning', 'Flame', 'Blade']
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 999) + 1
  
  return `${adj}${noun}${num}`
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`)
  console.log(`📥 Download directory: ${downloadsDir}`)
  console.log(`💬 Socket.io ENABLED`)
  console.log(`✅ Server ready to accept connections`)
  console.log(`⚠️  Make sure yt-dlp is installed: apt install yt-dlp or pip install yt-dlp`)
  
  // Immediate signal that server is ready (helps with Render health checks)
  if (process.send) {
    process.send('ready')
  }
})

