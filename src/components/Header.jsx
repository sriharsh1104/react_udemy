import './Header.css'
import PingDisplay from './PingDisplay'

const Header = ({ activeTab, onTabChange, gameMode, onGameModeToggle }) => {
  return (
    <div className="header">
      <PingDisplay />
      <div className="header-content">
        <div className="header-top">
        <h1 className="header-title">{gameMode ? 'Priyanka Smart Class' : 'All in One Toolbox'}</h1>
          <div className="game-mode-toggle">
            <label className="toggle-label">
              <span className="toggle-text">Game Mode</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={gameMode}
                  onChange={(e) => onGameModeToggle(e.target.checked)}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
        <nav className={`tabs ${gameMode ? 'game-mode-active' : ''}`}>
          {!gameMode && (
            <>
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
          <button
            className={`tab ${activeTab === 'trade' ? 'active' : ''}`}
            onClick={() => onTabChange('trade')}
          >
            📈 Trade Chart
          </button>
            </>
          )}
          <button
            className={`tab ${activeTab === 'games' ? 'active' : ''}`}
            onClick={() => onTabChange('games')}
          >
            🎮 Games
          </button>
        </nav>
      </div>
    </div>
  )
}

export default Header
