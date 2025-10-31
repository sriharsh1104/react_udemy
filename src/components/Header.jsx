import './Header.css'

const Header = ({ activeTab, onTabChange }) => {
  return (
    <div className="header">
      <div className="header-content">
        <h1 className="header-title">All in One Toolbox</h1>
        <nav className="tabs">
          <button
            className={`tab ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => onTabChange('video')}
          >
            🎵🎥 Audio / Video 
          </button>
          <button
            className={`tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => onTabChange('image')}
          >
            🖼️ Image Converter & Crop
          </button>
          <button
            className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
            onClick={() => onTabChange('pdf')}
          >
            📄 PDF Editor
          </button>
          <button
            className={`tab ${activeTab === 'social' ? 'active' : ''}`}
            onClick={() => onTabChange('social')}
          >
            🎬 Social Download
          </button>
          <button
            className={`tab ${activeTab === 'ott' ? 'active' : ''}`}
            onClick={() => onTabChange('ott')}
          >
            📺 OTT / Content
          </button>
          <button
            className={`tab ${activeTab === 'esports' ? 'active' : ''}`}
            onClick={() => onTabChange('esports')}
          >
            🎮 Esports
          </button>
          <button
            className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => onTabChange('ai')}
          >
            🤖 AI Chat
          </button>
        </nav>
      </div>
    </div>
  )
}

export default Header
