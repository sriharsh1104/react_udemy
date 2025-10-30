import './OTTLinks.css'

const platforms = [
  { name: 'Netflix', url: 'https://www.netflix.com/' },
  { name: 'Amazon Prime Video', url: 'https://www.primevideo.com/' },
  { name: 'JioHotstar', url: 'https://www.hotstar.com/' },
  { name: 'Sony LIV', url: 'https://www.sonyliv.com/' },
  { name: 'ZEE5', url: 'https://www.zee5.com/' },
  { name: 'FanCode', url: 'https://www.fancode.com/' },
  { name: 'YouTube', url: 'https://www.youtube.com/' },
  
]

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
  const input = window.prompt('Paste YouTube URL to open on yout-ube.com:')
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
      <h2 className="ott-title">Popular OTT Platforms</h2>
      <div className="ott-grid">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            className="ott-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ott-name">{p.name}</span>
            <span className="ott-link">Visit →</span>
          </a>
        ))}
        <button
          type="button"
          className="ott-card"
          onClick={openYouTubeNoCookie}
        >
          <span className="ott-name">YouTube (Ads Free)</span>
          <span className="ott-link">Open →</span>
        </button>
      </div>

      <h3 className="ott-subtitle"> P-site</h3>
      <div className="ott-grid">
        {[
          { name: 'HdHub4u', url: 'https://hdhub4u.gd/' },
          { name: 'WorldFree4u', url: 'https://worldfree4u.prof/' },
          { name: 'FilmyZillaMoviez', url: 'https://filmyzillamoviez.com/' },
          { name: 'IndexMovies', url: 'http://103.145.232.246/Data/movies/' },
          { name: 'Movies4u', url: 'https://movies4u.sx/' },
          // { name: 'Tab 6', url: 'https://example.com' }
        ].map((p) => (
          <a
            key={p.name}
            href={p.url}
            className="ott-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="ott-name">{p.name}</span>
            <span className="ott-link">Visit →</span>
          </a>
        ))}
      </div>
    </div>
  )
}

export default OTTLinks


