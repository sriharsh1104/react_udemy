import { useState } from 'react'
import MathsGamesContent from './MathsGamesContent'
import ComputerGamesContent from './ComputerGamesContent'
import EnglishGamesContent from './EnglishGamesContent'
import './MathsGames.css'

const Games = ({ onExitGameMode }) => {
  const [activeGameTab, setActiveGameTab] = useState('maths')

  return (
    <div className="maths-games">
      <div className="maths-games-header">
        <div className="tabs-container maths-games-tabs">
          <button
            className={`tab-button ${activeGameTab === 'maths' ? 'active' : ''}`}
            onClick={() => setActiveGameTab('maths')}
          >
            🎮 Maths Games
          </button>
          <button
            className={`tab-button ${activeGameTab === 'computer' ? 'active' : ''}`}
            onClick={() => setActiveGameTab('computer')}
          >
            🖥️ Computer
          </button>
          <button
            className={`tab-button ${activeGameTab === 'english' ? 'active' : ''}`}
            onClick={() => setActiveGameTab('english')}
          >
            📚 English
          </button>
        </div>
      </div>

      {activeGameTab === 'maths' && (
        <MathsGamesContent onExitGameMode={onExitGameMode} />
      )}
      {activeGameTab === 'computer' && (
        <ComputerGamesContent onExitGameMode={onExitGameMode} />
      )}
      {activeGameTab === 'english' && (
        <EnglishGamesContent onExitGameMode={onExitGameMode} />
      )}
    </div>
  )
}

export default Games
