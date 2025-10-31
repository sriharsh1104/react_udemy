import { useState } from 'react'
import { BACKEND_URL } from '../constants'
import './SocialDownload.css'

const SocialDownload = () => {
  const QUICK_OPEN_ENABLED = true
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [videoInfo, setVideoInfo] = useState(null)
  const [quickOpenUrl, setQuickOpenUrl] = useState('')

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2' },
    { id: 'reddit', name: 'Reddit', icon: '🤖', color: '#FF4500' },
    { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00' }
  ]

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)

  // Auto-detect platform from URL
  const detectPlatform = (url) => {
    if (!url || !url.trim()) return null
    
    const urlLower = url.toLowerCase()
    
    // Check each platform's patterns
    if (/youtube\.com|youtu\.be/.test(urlLower)) return 'youtube'
    if (/instagram\.com/.test(urlLower)) return 'instagram'
    if (/twitter\.com|x\.com/.test(urlLower)) return 'twitter'
    if (/tiktok\.com|vm\.tiktok\.com/.test(urlLower)) return 'tiktok'
    if (/facebook\.com|fb\.watch/.test(urlLower)) return 'facebook'
    if (/reddit\.com/.test(urlLower)) return 'reddit'
    if (/snapchat\.com/.test(urlLower)) return 'snapchat'
    
    return null
  }

  const extractVideoId = (url, platform) => {
    switch (platform) {
      case 'youtube':
        const youtubePatterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ]
        for (const pattern of youtubePatterns) {
          const match = url.match(pattern)
          if (match && match[1]) return match[1]
        }
        break
      case 'instagram':
        const instagramMatch = url.match(/instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/)
        return instagramMatch ? instagramMatch[2] : null
      case 'twitter':
        const twitterMatch = url.match(/twitter\.com\/\w+\/status\/(\d+)|x\.com\/\w+\/status\/(\d+)/)
        return twitterMatch ? (twitterMatch[1] || twitterMatch[2]) : null
      case 'tiktok':
        const tiktokMatch = url.match(/tiktok\.com\/@\w+\/video\/(\d+)|vm\.tiktok\.com\/(\w+)/)
        return tiktokMatch ? (tiktokMatch[1] || tiktokMatch[2]) : null
      case 'facebook':
        // Match various Facebook video URL patterns
        const facebookPatterns = [
          /facebook\.com\/watch\/\?v=(\d+)/,              // /watch/?v=123
          /facebook\.com\/.+?\/videos\/\/(\d+)/,          // /username/videos/123
          /facebook\.com\/.+?\/videos\/(\d+)/,             // /username/videos/123
          /facebook\.com\/video\.php\?v=(\d+)/,           // /video.php?v=123
          /fb\.watch\/([a-zA-Z0-9_-]+)/,                  // fb.watch/xxxx
          /facebook\.com\/story\.php\?story_fbid=(\d+)/   // story
        ]
        for (const pattern of facebookPatterns) {
          const match = url.match(pattern)
          if (match && match[1]) return match[1]
        }
        return null
      case 'reddit':
        const redditMatch = url.match(/reddit\.com\/r\/\w+\/comments\/([a-zA-Z0-9]+)/)
        return redditMatch ? redditMatch[1] : null
      case 'snapchat':
        // Match various Snapchat URL patterns
        const snapPatterns = [
          /snapchat\.com\/add\/([\w.-]+)/,           // add/<username>
          /snapchat\.com\/story\/([\w.-]+)/,          // story/<username>
          /snapchat\.com\/t\/([A-Za-z0-9%]+)/,        // share link /t/XXXX
          /snapchat\.com\/([\w.-]+)\/([\w.-]+)/       // other patterns
        ]
        for (const pattern of snapPatterns) {
          const match = url.match(pattern)
          if (match && match[1]) return match[1] || match[2] || 'unknown'
        }
        return null
    }
    return null
  }

  const validateUrl = (url, platform) => {
    const patterns = {
      youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+/,
      twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/,
      tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/,
      facebook: /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/,
      reddit: /^(https?:\/\/)?(www\.)?reddit\.com\/r\/.+/,
      snapchat: /^(https?:\/\/)?(www\.)?snapchat\.com\/.+/
    }
    return patterns[platform] ? patterns[platform].test(url) : false
  }

  const handleDownload = async () => {
    // Disable main download only for YouTube
    if (selectedPlatform === 'youtube') {
      setError('YouTube downloads are disabled. Please use the "Youtube Download(Low Quality Free)" option below.')
      return
    }
    if (!videoUrl.trim()) {
      setError('Please enter a social media URL')
      return
    }

    // Auto-detect platform if not already detected
    const detectedPlatform = detectPlatform(videoUrl)
    if (!detectedPlatform) {
      setError('Unsupported platform. Supported platforms: YouTube, Instagram, Twitter/X, TikTok, Facebook, Reddit, Snapchat')
      return
    }

    // Disable main download for YouTube (use quick open option instead)
    if (detectedPlatform === 'youtube') {
      setError('YouTube downloads are disabled. Please use the "Youtube Download(Low Quality Free)" option below.')
      return
    }

    // Auto-set platform if detected and different
    if (detectedPlatform !== selectedPlatform) {
      setSelectedPlatform(detectedPlatform)
    }

    // Validate URL with detected platform
    if (!validateUrl(videoUrl, detectedPlatform)) {
      setError(`Please enter a valid ${platforms.find(p => p.id === detectedPlatform)?.name || 'social media'} URL`)
      return
    }

    setIsDownloading(true)
    setError('')
    
    try {
      // Use the detected platform for processing
      const platformToUse = detectedPlatform || selectedPlatform
      
      // Extract media ID (not all platforms require it)
      const mediaId = extractVideoId(videoUrl, platformToUse)
      
      // Some platforms like Facebook/Snapchat don't need strict ID extraction
      const requiresMediaId = ['youtube', 'twitter'].includes(platformToUse)
      if (requiresMediaId && !mediaId) {
        throw new Error('Could not extract media ID from URL')
      }

      // First, get video info (like ytdown.to approach)
      const infoResponse = await fetch(`${BACKEND_URL}/api/formats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl
        })
      })
      
      const infoData = await infoResponse.json()
      
      if (!infoResponse.ok) {
        // Better error messages for Facebook private/restricted videos
        if (platformToUse === 'facebook' && infoData.error) {
          throw new Error(infoData.error)
        }
        throw new Error(infoData.error || 'Failed to get video info')
      }
      
      const platformInfo = platforms.find(p => p.id === platformToUse) || currentPlatform
      
      // Show video info
      setVideoInfo({
        id: mediaId || 'processing',
        title: 'Processing video...',
        thumbnail: platformToUse === 'youtube' && mediaId
          ? `https://img.youtube.com/vi/${mediaId}/maxresdefault.jpg`
          : `https://via.placeholder.com/640x360/667eea/ffffff?text=${platformInfo.icon}`,
        duration: 'Ready',
      })
      
      // Now download with the best available format
      const response = await fetch(`${BACKEND_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          platform: platformToUse,
          format: null // Use yt-dlp's best format selection
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Download failed')
      }

      // Set video info
      setVideoInfo({
        id: mediaId || 'downloaded',
        title: data.filename || `${platformInfo.name} Media`,
        thumbnail: platformToUse === 'youtube' && mediaId
          ? `https://img.youtube.com/vi/${mediaId}/maxresdefault.jpg`
          : `https://via.placeholder.com/640x360/667eea/ffffff?text=${platformInfo.icon}`,
        duration: 'Ready',
        downloadUrl: data.downloadUrl,
        filename: data.filename
      })

      setDownloadUrl(data.downloadUrl)
      setIsDownloading(false)

    } catch (error) {
      setError(error.message || 'Failed to process URL')
      setIsDownloading(false)
    }
  }

  const handleReset = () => {
    setVideoUrl('')
    setError('')
    setDownloadUrl(null)
    setVideoInfo(null)
  }

  const handleQuickOpen = () => {
    if (!QUICK_OPEN_ENABLED) {
      setError('Quick Open is temporarily disabled')
      return
    }
    const raw = quickOpenUrl.trim()
    if (!raw) {
      setError('Please enter a youtube.com URL to open')
      return
    }
    // Only modify full youtube.com links by removing 'ube' (youtube -> yout)
    if (!/youtube\.com/i.test(raw)) {
      setError('Quick Open expects a youtube.com URL')
      return
    }
    const modified = raw.replace(/youtube/gi, 'yout')
    window.open(modified, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="social-download-container">
      <div className="download-section" style={{ '--platform-color': currentPlatform.color }}>
        <h3>📱 Download from Social Media</h3>
        <p className="description">
          Paste any social media link below to download it
        </p>

        <div className="info-notice-box">
          <strong>ℹ️ Platform Status:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, listStyle: 'disc' }}>
            <li>YouTube and Facebook servers are currently down</li>
            <li>TikTok is banned in India</li>
          </ul>
        </div>

        {selectedPlatform === 'snapchat' && videoUrl && (
          <div className="warning-box">
            <strong>⚠️ Important:</strong> Snapchat videos are heavily protected with DRM and authentication. Most Snapchat content <strong>cannot be downloaded</strong> due to security features. Public Stories may work, but private snaps and Memories will fail.
          </div>
        )}

        <div className="platform-selector">
          <label>Select Platform (or paste link below to auto-detect):</label>
          <div className="platform-grid">
            {platforms.map(platform => (
              <button
                key={platform.id}
                className={`platform-btn ${selectedPlatform === platform.id ? 'active' : ''}`}
                onClick={() => setSelectedPlatform(platform.id)}
                style={{ '--platform-color': platform.color }}
              >
                {platform.icon} {platform.name}
              </button>
            ))}
          </div>
        </div>

        <div className="url-input-section">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => {
              const url = e.target.value
              setVideoUrl(url)
              // Auto-detect and set platform when URL is pasted
              const detectedPlatform = detectPlatform(url)
              if (detectedPlatform) {
                setSelectedPlatform(detectedPlatform)
                setError('') // Clear previous errors
              }
            }}
            placeholder={selectedPlatform === 'youtube' ? "YouTube downloads disabled - use the below option instead" : "Paste any social media link here (Instagram, Twitter, TikTok, Facebook, etc.)"}
            className="url-input"
            disabled={isDownloading || selectedPlatform === 'youtube'}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDownload()
              }
            }}
          />
          
          <button
            onClick={handleDownload}
            disabled={isDownloading || selectedPlatform === 'youtube'}
            className="download-btn"
          >
            {isDownloading ? '⏳ Processing...' : '⬇️ Download'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* Quick Open: open new tab with youtube -> yout transformation */}
        <div className="url-input-section" style={{ marginTop: '16px' }}>
          <input
            type="text"
            value={quickOpenUrl}
            onChange={(e) => setQuickOpenUrl(e.target.value)}
            placeholder="Paste youtube.com URL here to open with 'ube' removed (yout...)"
            className="url-input"
            disabled={!QUICK_OPEN_ENABLED}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && QUICK_OPEN_ENABLED) {
                handleQuickOpen()
              }
            }}
          />
          <button
            onClick={handleQuickOpen}
            className="download-btn"
            disabled={!QUICK_OPEN_ENABLED}
          >
            🔗 Youtube Download(Low Quality Free)
          </button>
        </div>

        {videoInfo && (
          <div className="video-preview">
            <img
              src={videoInfo.thumbnail}
              alt="Media thumbnail"
              className="thumbnail"
            />
            <div className="video-info">
              <h4>{videoInfo.title}</h4>
              <p>Status: {videoInfo.duration}</p>
              {videoInfo.downloadUrl && (
                <a 
                  href={videoInfo.downloadUrl} 
                  download 
                  className="download-link-btn"
                >
                  ⬇️ Download File
                </a>
              )}
            </div>
          </div>
        )}

        {(videoInfo || error) && (
          <button onClick={handleReset} className="reset-btn">
            🔄 Try Another Video
          </button>
        )}

        <div className="info-box">
          <h4>ℹ️ How to Use</h4>
          <p>
            This feature connects to a backend service running on <code>{BACKEND_URL}</code>
          </p>
          <p>
            <strong>To start the backend:</strong>
          </p>
          <ol>
            <li>Navigate to the <code>backend</code> folder</li>
            <li>Run <code>npm install</code> to install dependencies</li>
            <li>Install yt-dlp: <code>apt install yt-dlp</code> or <code>pip install yt-dlp</code></li>
            <li>Run <code>npm start</code> to start the server</li>
          </ol>
          <p><em>Note: Make sure both frontend and backend are running for downloads to work.</em></p>
        </div>
      </div>
    </div>
  )
}

export default SocialDownload

