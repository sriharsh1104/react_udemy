import { useState } from 'react'
import ComputerQuiz from './ComputerQuiz'
import ComputerPartsMatch from './ComputerPartsMatch'
import ComputerBasicsQuiz from './ComputerBasicsQuiz'
import './MathsGames.css'

const ComputerGamesContent = ({ onExitGameMode }) => {
  const [activeTab, setActiveTab] = useState('quiz')

  return (
    <div className="maths-games">
      <div className="tabs-container" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-button ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setActiveTab('quiz')}
        >
          🖥️ Computer Quiz
        </button>
        <button
          className={`tab-button ${activeTab === 'match' ? 'active' : ''}`}
          onClick={() => setActiveTab('match')}
        >
          🔗 Parts Match
        </button>
        <button
          className={`tab-button ${activeTab === 'basics' ? 'active' : ''}`}
          onClick={() => setActiveTab('basics')}
        >
          ❓ Basics Quiz
        </button>
      </div>

      <div className="games-container">
        {activeTab === 'quiz' && (
          <div className="game-wrapper">
            <ComputerQuiz />
          </div>
        )}
        {activeTab === 'match' && (
          <div className="game-wrapper">
            <ComputerPartsMatch />
          </div>
        )}
        {activeTab === 'basics' && (
          <div className="game-wrapper">
            <ComputerBasicsQuiz />
          </div>
        )}
      </div>
    </div>
  )
}

export default ComputerGamesContent

