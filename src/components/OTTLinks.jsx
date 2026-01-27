import { useState } from 'react'
import { platforms, pSites, sportsLinks, BACKEND_URL } from '../constants'
import './OTTLinks.css'
import netflixIcon from '../assets/icons/netflix.svg'
import youtubeIcon from '../assets/icons/youtube.svg'
import amazonIcon from '../assets/icons/amazon.svg'
import hotstarIcon from '../assets/icons/hotstar.svg'
import sonyLivIcon from '../assets/icons/sonyliv.jpeg'
import zee5Icon from '../assets/icons/zee5.png'
import fancodeIcon from '../assets/icons/fancode.png'



function extractYouTubeId(rawUrl) {
  try {
    const url = new URL(rawUrl)
    // youtu.be/<id>
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/')[1]
    }
    // youtube.com/shorts/<id>
    if (url.pathname.startsWith('/shorts/')) {
      return url.pathname.split('/')[2] || url.pathname.split('/')[1]
    }
    // youtube.com/embed/<id>
    if (url.pathname.startsWith('/embed/')) {
      return url.pathname.split('/')[2] || url.pathname.split('/')[1]
    }
    // youtube.com/watch?v=<id>
    const v = url.searchParams.get('v')
    if (v) return v
  } catch (_) {
    // ignore parse errors
  }
  return null
}

function openYouTubeNoCookie() {
  const input = window.prompt('Paste YouTube URL to open on Ads free version:')
  if (!input) return
  const videoId = extractYouTubeId(input.trim())
  if (!videoId) {
    alert('Could not detect a valid YouTube video URL.')
    return
  }
  const altHost = `https://www.yout-ube.com/embed/${videoId}`
  window.open(altHost, '_blank', 'noopener,noreferrer')
}

function OTTLinks() {
  const [netflixLoading, setNetflixLoading] = useState(false)

  const handleNetflixClick = (e) => {
    e.preventDefault()
    
    // Get credentials from .env
    const email = import.meta.env.VITE_NETFLIX_EMAIL
    const password = import.meta.env.VITE_NETFLIX_PASSWORD

    if (!email || !password) {
      alert('Netflix credentials not found in .env file. Please set VITE_NETFLIX_EMAIL and VITE_NETFLIX_PASSWORD')
      window.open('https://www.netflix.com/', '_blank', 'noopener,noreferrer')
      return
    }

    setNetflixLoading(true)

    // Store credentials in localStorage for the userscript to access
    try {
      localStorage.setItem('netflix_auto_email', email)
      localStorage.setItem('netflix_auto_password', password)
      console.log('Netflix credentials stored in localStorage')
    } catch (error) {
      console.error('Failed to store credentials:', error)
      alert('Failed to store credentials. Please check browser settings.')
      setNetflixLoading(false)
      return
    }

    // Check if userscript is installed (by checking if we can detect it)
    // Open Netflix login page
    const netflixWindow = window.open('https://www.netflix.com/login', '_blank', 'noopener,noreferrer')
    
    if (!netflixWindow) {
      alert('Please allow popups for auto-login to work')
      setNetflixLoading(false)
      return
    }

    // Check if userscript is installed and show instructions if needed
    setTimeout(() => {
      const hasUserscript = localStorage.getItem('netflix_userscript_installed')
      
      if (!hasUserscript) {
        // Show one-time instruction with link to full instructions
        const userChoice = confirm(
          'For fully automatic Netflix login, install the userscript!\n\n' +
          'Click OK to see installation instructions, or Cancel to continue.\n\n' +
          '(You only need to do this once)'
        )
        
        if (userChoice) {
          window.open('/netflix-autologin-instructions.html', '_blank', 'noopener,noreferrer')
        }
      } else {
        console.log('Netflix Auto-Login: Userscript detected! Auto-login will work automatically.')
      }
      
      setNetflixLoading(false)
    }, 1000)
  }
  return (
    <div className="ott">
      <h2 className="ott-title">Content</h2>
      <div className="ott-grid">
        {platforms.map((p) => {
          // Special handling for Netflix with auto-login
          if (p.name === 'Netflix') {
            return (
              <button
                key={p.name}
                type="button"
                className="ott-card"
                onClick={handleNetflixClick}
                disabled={netflixLoading}
              >
                <img src={netflixIcon} alt={p.name} className="ott-icon" />
                <span className="ott-name">
                  {netflixLoading ? 'Logging in...' : p.name}
                </span>
              </button>
            )
          }
          
          return (
            <a
              key={p.name}
              href={p.url}
              className="ott-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              {p.icon === 'svg' && p.name === 'YouTube' ? (
              <img src={youtubeIcon} alt={p.name} className="ott-icon" />
            ) : p.icon === 'svg' && p.name === 'Amazon Prime' ? (
              <img src={amazonIcon} alt={p.name} className="ott-icon" />
            ) : p.icon === 'svg' && p.name === 'Hotstar' ? (
              <img src={hotstarIcon} alt={p.name} className="ott-icon" />
            ) : p.icon === 'svg' && p.name === 'Sony LIV' ? (
              <img src={sonyLivIcon} alt={p.name} className="ott-icon" />
            ) : p.icon === 'svg' && p.name === 'ZEE5' ? (
              <img src={zee5Icon} alt={p.name} className="ott-icon" />
            ) : p.icon === 'svg' && p.name === 'FanCode' ? (
              <img src={fancodeIcon} alt={p.name} className="ott-icon" />
            ) : (
              p.icon && p.icon !== 'svg' && (
                <span className="ott-icon-emoji">{p.icon}</span>
              )
            )}
            <span className="ott-name">{p.name}</span>
          </a>
          )
        })}
        <button
          type="button"
          className="ott-card"
          onClick={openYouTubeNoCookie}
        >
          <img src={youtubeIcon} alt="YouTube" className="ott-icon" />
          <span className="ott-name">YouTube (Ads Free)</span>
        </button>
      </div>

      <h3 className="ott-subtitle"> P-site(Download)</h3>
      <div className="ott-grid">
        {pSites.map((p) => (
          <a
            key={p.name}
            href={p.url}
            className="ott-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ott-name">{p.name}</span>
          </a>
        ))}
      </div>

      <h3 className="ott-subtitle">Sports</h3>
      <div className="ott-grid">
        {sportsLinks.map((p) => (
          <a
            key={p.name}
            href={p.url}
            className="ott-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ott-name">{p.icon} {p.name}</span>
          </a>
        ))}
      </div>

      {/* Esports moved to its own tab */}
    </div>
  )
}

export default OTTLinks


