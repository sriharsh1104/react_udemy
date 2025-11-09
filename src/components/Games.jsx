import { useState } from 'react'
import MathsGamesContent from './MathsGamesContent'
import EnglishGamesContent from './EnglishGamesContent'
import AnimalQuiz from './AnimalQuiz'
import './MathsGames.css'

const Games = ({ onExitGameMode }) => {
  const [activeGameTab, setActiveGameTab] = useState('maths')

  return (
    <div className="maths-games">
      <div className="maths-games-header">
        <div className="tabs-container" style={{ borderBottom: 'none', paddingBottom: 0, margin: 0, gap: '20px' }}>
          <button
            className={`tab-button ${activeGameTab === 'maths' ? 'active' : ''}`}
            onClick={() => setActiveGameTab('maths')}
            style={{ fontSize: '24px', fontWeight: 700, padding: '12px 24px' }}
          >
            🎮 Maths Games
          </button>
          <button
            className={`tab-button ${activeGameTab === 'english' ? 'active' : ''}`}
            onClick={() => setActiveGameTab('english')}
            style={{ fontSize: '24px', fontWeight: 700, padding: '12px 24px' }}
          >
            📚 English Games
          </button>
          <button
            className={`tab-button ${activeGameTab === 'computer' ? 'active' : ''}`}
            onClick={() => setActiveGameTab('computer')}
            style={{ fontSize: '24px', fontWeight: 700, padding: '12px 24px' }}
          >
            🖥️ Computer
          </button>
        </div>
      </div>

      {activeGameTab === 'maths' && (
        <MathsGamesContent onExitGameMode={onExitGameMode} />
      )}
      {activeGameTab === 'english' && (
        <EnglishGamesContent onExitGameMode={onExitGameMode} />
      )}
      {activeGameTab === 'computer' && (
        <AnimalQuiz />
      )}
    </div>
  )
}

export default Games
