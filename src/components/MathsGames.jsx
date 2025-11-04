import { useState, useEffect } from 'react'
import BalloonMathPop from './BalloonMathPop'
import SpaceMission from './SpaceMission'
import NameModal from './NameModal'
import ScoreHistory from './ScoreHistory'
import './MathsGames.css'

const MathsGames = () => {
  const [activeTab, setActiveTab] = useState('balloon')
  const [userName, setUserName] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if user name exists
    const savedName = localStorage.getItem('maths_games_user_name')
    if (!savedName) {
      setShowModal(true)
    } else {
      setUserName(savedName)
    }
  }, [])

  const handleNameSubmit = (name) => {
    setUserName(name)
    setShowModal(false)
  }

  return (
    <div className="maths-games">
      {showModal && <NameModal onNameSubmit={handleNameSubmit} />}
      
      <h1 className="maths-games-title">🎮 Maths Games</h1>
      
      {userName && (
        <div className="user-welcome">
          <span>👋 Hello, {userName}!</span>
        </div>
      )}
      
      <ScoreHistory />
      
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
        {activeTab === 'balloon' && <BalloonMathPop userName={userName} />}
        {activeTab === 'space' && <SpaceMission userName={userName} />}
      </div>
    </div>
  )
}

export default MathsGames

