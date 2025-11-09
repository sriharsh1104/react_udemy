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
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <ComputerQuiz />
          </div>
        )}
        {activeTab === 'match' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <ComputerPartsMatch />
          </div>
        )}
        {activeTab === 'basics' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <ComputerBasicsQuiz />
          </div>
        )}
      </div>
    </div>
  )
}

export default ComputerGamesContent

