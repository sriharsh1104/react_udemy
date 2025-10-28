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
        const facebookMatch = url.match(/facebook\.com\/.+\/videos\/(\d+)/)
        return facebookMatch ? facebookMatch[1] : null
      case 'reddit':
        const redditMatch = url.match(/reddit\.com\/r\/\w+\/comments\/([a-zA-Z0-9]+)/)
        return redditMatch ? redditMatch[1] : null
      case 'snapchat':
        const snapMatch = url.match(/snapchat\.com\/add\/([\w.-]+)|snapchat\.com\/story\/([\w.-]+)/)
        return snapMatch ? (snapMatch[1] || snapMatch[2]) : null
      case 'pinterest':
        const pinterestMatch = url.match(/pinterest\.com\/pin\/(\d+)/)
        return pinterestMatch ? pinterestMatch[1] : null
    }
    return null
  }

  const validateUrl = (url, platform) => {
    const patterns = {
      youtube: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+/,
      twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/,
      tiktok: /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/,
      facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/.+\/.+/,
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
      // Extract media ID
      const mediaId = extractVideoId(videoUrl, selectedPlatform)
      
      if (!mediaId) {
        throw new Error('Could not extract media ID from URL')
      }

      // Simulate media info fetch (in real implementation, this would call your backend)
      setVideoInfo({
        id: mediaId,
        title: `${currentPlatform.name} Media`,
        thumbnail: selectedPlatform === 'youtube' 
          ? `https://img.youtube.com/vi/${mediaId}/maxresdefault.jpg`
          : `https://via.placeholder.com/640x360/667eea/ffffff?text=${currentPlatform.icon}`,
        duration: 'Loading...'
      })

      // Note: Actual download requires a backend service
      // This is a frontend-only implementation that shows the structure
      setTimeout(() => {
        // In a real app, you would:
        // 1. Call your backend API: /api/download-media
        // 2. Backend uses platform-specific libraries to download
        // 3. Return download link or stream the file
        
        alert(`⚠️ Backend not configured.\n\nFor actual ${currentPlatform.name} media download, you need a backend service.\nRecommended: Use platform-specific libraries on a Node.js/Python backend.`)
        setIsDownloading(false)
      }, 2000)

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
              alt="Video thumbnail"
              className="thumbnail"
            />
            <div className="video-info">
              <h4>{videoInfo.title}</h4>
              <p>Duration: {videoInfo.duration}</p>
            </div>
          </div>
        )}

        {(videoInfo || error) && (
          <button onClick={handleReset} className="reset-btn">
            🔄 Try Another Video
          </button>
        )}

        <div className="info-box">
          <h4>⚠️ Implementation Note</h4>
          <p>
            This is a frontend-only demo. Actual social media downloading requires backend services.
          </p>
          <p>
            <strong>Recommended Backend Libraries by Platform:</strong>
          </p>
          <ul>
            <li><strong>YouTube:</strong> yt-dlp, @distube/ytdl-core</li>
            <li><strong>Instagram:</strong> instaloader (Python)</li>
            <li><strong>Twitter/X:</strong> twitter-scraper, twitfix</li>
            <li><strong>TikTok:</strong> TikTokApi, @tobyg74/tiktok-download-api</li>
            <li><strong>Facebook:</strong> facebook-scraper (Python)</li>
            <li><strong>Reddit:</strong> praw (Python Reddit API Wrapper)</li>
            <li><strong>Snapchat:</strong> Custom web scraper (limited API access)</li>
            <li><strong>Pinterest:</strong> pinterest-web-scraper (Python)</li>
          </ul>
          <p><em>Note: Each platform has different API restrictions and terms of service.</em></p>
        </div>
      </div>
    </div>
  )
}

export default SocialDownload

