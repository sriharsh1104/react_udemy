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

const app = express()
const server = http.createServer(app)

// Allowed origins list for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
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
const PORT = process.env.PORT || 3001

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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
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
        downloadUrl: `http://localhost:${PORT}/downloads/${downloadedFile}`,
        filename: downloadedFile,
        platform
      })
    })
  } catch (error) {
    console.error('Generic download endpoint error:', error)
    res.status(500).json({ error: error.message })
  }
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
      downloadUrl: `http://localhost:${PORT}/downloads/${outName}`,
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
  
  // Generate random name for user
  const randomName = generateRandomName()
  connectedUsers.set(socket.id, { name: randomName, socketId: socket.id })
  
  // Send welcome message and user's name
  socket.emit('userConnected', { 
    userId: socket.id, 
    userName: randomName,
    connectedUsers: Array.from(connectedUsers.values())
  })
  
  // Broadcast new user joined
  socket.broadcast.emit('userJoined', {
    userId: socket.id,
    userName: randomName
  })
  
  // Handle incoming messages
  socket.on('sendMessage', (data) => {
    const user = connectedUsers.get(socket.id)
    if (user) {
      const messageData = {
        userId: socket.id,
        userName: user.name,
        message: data.message,
        timestamp: new Date().toISOString()
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

server.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📥 Download directory: ${downloadsDir}`)
  console.log(`💬 Socket.io ENABLED`)
  console.log(`⚠️  Make sure yt-dlp is installed: apt install yt-dlp or pip install yt-dlp`)
})

