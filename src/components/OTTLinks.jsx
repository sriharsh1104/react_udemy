import { platforms, pSites, sportsLinks } from '../constants'
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
  return (
    <div className="ott">
      <h2 className="ott-title">Content</h2>
      <div className="ott-grid">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            className="ott-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            {p.icon === 'svg' && p.name === 'Netflix' ? (
              <img src={netflixIcon} alt={p.name} className="ott-icon" />
            ) : p.icon === 'svg' && p.name === 'YouTube' ? (
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
        ))}
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


