import { useState, useMemo } from 'react'
import { esportsOfficialLinks, esportsThirdPartyLinks } from '../constants'
import './OTTLinks.css'

function Esports() {
  const [subTab, setSubTab] = useState('official')

  const officialByGame = useMemo(() => {
    const groups = {
      BGMI: [],
      'Free Fire': [],
      Other: [],
    }
    for (const item of esportsOfficialLinks) {
      if (item.name.toLowerCase().includes('free fire')) groups['Free Fire'].push(item)
      else if (item.name.toLowerCase().includes('krafton') || item.name.toLowerCase().includes('bgmi')) groups.BGMI.push(item)
      else groups.Other.push(item)
    }
    return groups
  }, [])

  const thirdPartyByGame = useMemo(() => {
    const groups = { BGMI: [], 'Free Fire': [], Other: [] }
    for (const item of esportsThirdPartyLinks) {
      const games = Array.isArray(item.games) ? item.games : []
      if (games.includes('BGMI')) groups.BGMI.push(item)
      if (games.includes('Free Fire')) groups['Free Fire'].push(item)
      if (games.length === 0) groups.Other.push(item)
    }
    return groups
  }, [])

  const [hoveredOrg, setHoveredOrg] = useState(null)

  const getLinkType = (url) => {
    try {
      const u = new URL(url)
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) return 'YouTube'
      if (u.hostname.includes('instagram.com')) return 'Instagram'
      return 'Website'
    } catch (_) {
      return 'Website'
    }
  }

  const getDisplayName = (name) => {
    // Remove any form of "Official" including within parentheses
    return name
      .replace(/\(\s*official\s*\)/gi, '')
      .replace(/\bofficial\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  const renderOfficialGroup = (title, items) => (
    items && items.length > 0 && (
      <>
        <h4 className="ott-subtitle">{title}</h4>
        <div className="ott-grid">
          {items.map((p) => (
            <a
              key={p.name}
              href={p.url}
              className="ott-card"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="ott-name">{p.icon} {getDisplayName(p.name)} ({getLinkType(p.url)})</span>
              <span className="ott-link">Visit →</span>
            </a>
          ))}
        </div>
      </>
    )
  )

  const renderThirdPartyGroup = (title, items) => (
    items && items.length > 0 && (
      <>
        <h4 className="ott-subtitle">{title}</h4>
        <div className="ott-grid">
          {items.map((org, idx) => {
            const orgId = `${org.name}-${idx}`
            const isHovered = hoveredOrg === orgId
            const primaryLink = org.links?.[0] || { url: '#', type: 'Website' }
            
            return (
              <div
                key={orgId}
                className="esports-org-card-wrapper"
                onMouseEnter={() => setHoveredOrg(orgId)}
                onMouseLeave={() => setHoveredOrg(null)}
              >
                <a
                  href={primaryLink.url}
                  className="ott-card esports-org-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="ott-name">{org.icon} {org.name}</span>
                  <span className="ott-link">Visit →</span>
                </a>
                {isHovered && org.links && org.links.length > 1 && (
                  <div 
                    className="esports-links-dropdown"
                    onMouseEnter={() => setHoveredOrg(orgId)}
                    onMouseLeave={() => setHoveredOrg(null)}
                  >
                    {org.links.map((link, linkIdx) => (
                      <a
                        key={linkIdx}
                        href={link.url}
                        className="esports-link-item"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{link.type}</span>
                        <span>→</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </>
    )
  )

  return (
    <div className="ott">
      <h2 className="ott-title">Esports (India)</h2>

      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className={`tab ${subTab === 'official' ? 'active' : ''}`} onClick={() => setSubTab('official')} style={{ textTransform: 'none' }}>Official</button>
        <button className={`tab ${subTab === 'third' ? 'active' : ''}`} onClick={() => setSubTab('third')}>3rd Party</button>
      </div>

      {subTab === 'official' && (
        <div>
          {renderOfficialGroup('BGMI', officialByGame.BGMI)}
          {renderOfficialGroup('Free Fire', officialByGame['Free Fire'])}
          {renderOfficialGroup('Other', officialByGame.Other)}
        </div>
      )}

      {subTab === 'third' && (
        <div>
          {renderThirdPartyGroup('BGMI', thirdPartyByGame.BGMI)}
          {renderThirdPartyGroup('Free Fire', thirdPartyByGame['Free Fire'])}
          {renderThirdPartyGroup('Other', thirdPartyByGame.Other)}
        </div>
      )}
    </div>
  )
}

export default Esports


