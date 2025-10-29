import { useState } from 'react'
import './SocialDownload.css'

const SocialDownload = () => {
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('youtube')
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState('')
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [videoInfo, setVideoInfo] = useState(null)

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: '📺', color: '#FF0000' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
    { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
    { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2' },
    { id: 'reddit', name: 'Reddit', icon: '🤖', color: '#FF4500' },
    { id: 'snapchat', name: 'Snapchat', icon: '👻', color: '#FFFC00' },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#BD081C' }
  ]

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)

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
      case 'pinterest':
        // Match both numeric and alphanumeric pin IDs
        const pinterestPatterns = [
          /pinterest\.com\/pin\/(\d+)/,              // Old numeric format
          /pinterest\.com\/pin\/([a-zA-Z0-9_-]+)/,    // Modern alphanumeric format
        ]
        for (const pattern of pinterestPatterns) {
          const match = url.match(pattern)
          if (match && match[1]) return match[1]
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
      snapchat: /^(https?:\/\/)?(www\.)?snapchat\.com\/.+/,
      pinterest: /^(https?:\/\/)?(www\.)?pinterest\.com\/.+\/.+/
    }
    return patterns[platform] ? patterns[platform].test(url) : false
  }

  const handleDownload = async () => {
    if (!videoUrl.trim()) {
      setError(`Please enter a ${currentPlatform.name} URL`)
      return
    }

    if (!validateUrl(videoUrl, selectedPlatform)) {
      setError(`Please enter a valid ${currentPlatform.name} URL`)
      return
    }

    setIsDownloading(true)
    setError('')
    
    try {
      // Extract media ID (not all platforms require it)
      const mediaId = extractVideoId(videoUrl, selectedPlatform)
      
      // Some platforms like Facebook/Snapchat don't need strict ID extraction
      const requiresMediaId = ['youtube', 'twitter'].includes(selectedPlatform)
      if (requiresMediaId && !mediaId) {
        throw new Error('Could not extract media ID from URL')
      }

      // First, get video info (like ytdown.to approach)
      const infoResponse = await fetch(`http://localhost:3001/api/formats`, {
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
        if (selectedPlatform === 'facebook' && infoData.error) {
          throw new Error(infoData.error)
        }
        throw new Error(infoData.error || 'Failed to get video info')
      }
      
      // Show video info
      setVideoInfo({
        id: mediaId || 'processing',
        title: 'Processing video...',
        thumbnail: selectedPlatform === 'youtube' && mediaId
          ? `https://img.youtube.com/vi/${mediaId}/maxresdefault.jpg`
          : `https://via.placeholder.com/640x360/667eea/ffffff?text=${currentPlatform.icon}`,
        duration: 'Ready',
      })
      
      // Now download with the best available format
      const response = await fetch(`http://localhost:3001/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: videoUrl,
          platform: selectedPlatform,
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
        title: data.filename || `${currentPlatform.name} Media`,
        thumbnail: selectedPlatform === 'youtube' && mediaId
          ? `https://img.youtube.com/vi/${mediaId}/maxresdefault.jpg`
          : `https://via.placeholder.com/640x360/667eea/ffffff?text=${currentPlatform.icon}`,
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

  return (
    <div className="social-download-container">
      <div className="download-section" style={{ background: `linear-gradient(135deg, ${currentPlatform.color} 0%, ${currentPlatform.color}dd 100%)` }}>
        <h3>{currentPlatform.icon} Download from {currentPlatform.name}</h3>
        <p className="description">
          Paste a {currentPlatform.name} link below to download it
        </p>

        <div className="info-notice-box" style={{
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          border: '2px solid #2196f3',
          borderRadius: '8px',
          padding: '12px',
          margin: '15px 0',
          color: '#fff'
        }}>
          <strong>ℹ️ Platform Status:</strong>
          <ul style={{ margin: '8px 0 0 20px', padding: 0, listStyle: 'disc' }}>
            <li>YouTube, Facebook, and Pinterest servers are currently down</li>
            <li>TikTok is banned in India</li>
          </ul>
        </div>

        {selectedPlatform === 'snapchat' && (
          <div className="warning-box" style={{
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            border: '2px solid #ffc107',
            borderRadius: '8px',
            padding: '12px',
            margin: '15px 0',
            color: '#fff'
          }}>
            <strong>⚠️ Important:</strong> Snapchat videos are heavily protected with DRM and authentication. Most Snapchat content <strong>cannot be downloaded</strong> due to security features. Public Stories may work, but private snaps and Memories will fail.
          </div>
        )}

        <div className="platform-selector">
          <label>Select Platform:</label>
          <div className="platform-grid">
            {platforms.map(platform => (
              <button
                key={platform.id}
                className={`platform-btn ${selectedPlatform === platform.id ? 'active' : ''}`}
                onClick={() => setSelectedPlatform(platform.id)}
                style={{
                  background: selectedPlatform === platform.id 
                    ? platform.color 
                    : 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
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
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={`Paste ${currentPlatform.name} URL here...`}
            className="url-input"
            disabled={isDownloading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleDownload()
              }
            }}
          />
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
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
            This feature connects to a backend service running on <code>localhost:3001</code>
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

