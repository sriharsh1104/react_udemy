import { useState } from 'react'
import BalloonMathPop from './BalloonMathPop'
import SpaceMission from './SpaceMission'
import './MathsGames.css'

const MathsGames = () => {
  const [activeTab, setActiveTab] = useState('balloon')

  return (
    <div className="maths-games">
      <h1 className="maths-games-title">🎮 Maths Games</h1>
      
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'balloon' ? 'active' : ''}`}
          onClick={() => setActiveTab('balloon')}
        >
          🎈 Balloon Math Pop
        </button>
        <button
          className={`tab-button ${activeTab === 'space' ? 'active' : ''}`}
          onClick={() => setActiveTab('space')}
        >
          🚀 Space Mission
        </button>
      </div>

      <div className="games-container">
        {activeTab === 'balloon' && <BalloonMathPop />}
        {activeTab === 'space' && <SpaceMission />}
      </div>
    </div>
  )
}

export default MathsGames

