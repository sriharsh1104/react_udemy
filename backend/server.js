const express = require('express')
const cors = require('cors')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use('/downloads', express.static(path.join(__dirname, 'downloads')))

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads')
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true })
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

// Pinterest download endpoint
app.post('/api/download/pinterest', async (req, res) => {
  const { url } = req.body
  
  try {
    const pinId = extractPinterestId(url)
    if (!pinId) {
      return res.status(400).json({ error: 'Invalid Pinterest URL' })
    }

    // Pinterest media download
    const response = await axios.get(url, { responseType: 'text' })
    // Parse HTML to find image/video URL
    
    res.json({ error: 'Pinterest download not fully implemented' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get available formats for a URL (like ytdown.to does)
app.post('/api/formats', async (req, res) => {
  const { url } = req.body
  
  try {
    console.log('Getting formats for:', url)
    const command = `yt-dlp --list-formats --dump-json --no-playlist "${url}"`
    
    exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
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
  const { url, platform, format } = req.body
  
  console.log(`Downloading from ${platform}:`, url, format ? `format: ${format}` : '')
  
  try {
    const timestamp = Date.now()
    const outputPath = path.join(downloadsDir, `media_${timestamp}.%(ext)s`)
    
    // Use the same approach as yout.com - more aggressive settings
    let command = `yt-dlp --no-playlist -o "${outputPath}"`
    
    if (format) {
      command += ` -f "${format}"`
    } else {
      // Try multiple strategies like yout.com
      command += ` -f "bestvideo*+bestaudio/best"`
    }
    
    // Add options to work around YouTube blocking (similar to yout.com/yout-down.to)
    command += ` --retries 5 --fragment-retries 5 --concurrent-fragments 8`
    command += ` --no-warnings --extractor-retries 3`
    command += ` "${url}"`
    
    exec(command, { timeout: 300000, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`${platform} download error:`, error.message)
        console.error('stderr:', stderr)
        return res.status(500).json({ 
          error: `Failed to download from ${platform}`,
          details: stderr || error.message
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' })
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
  const match = url.match(/facebook\.com\/.+\/videos\/(\d+)/)
  return match ? match[1] : null
}

function extractRedditId(url) {
  const match = url.match(/reddit\.com\/r\/\w+\/comments\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

function extractPinterestId(url) {
  const match = url.match(/pinterest\.com\/pin\/(\d+)/)
  return match ? match[1] : null
}

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`)
  console.log(`📥 Download directory: ${downloadsDir}`)
  console.log(`⚠️  Make sure yt-dlp is installed: apt install yt-dlp or pip install yt-dlp`)
})

