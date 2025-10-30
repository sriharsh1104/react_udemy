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


