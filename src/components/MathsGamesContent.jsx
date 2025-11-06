import { useState, useEffect } from 'react'
import BalloonMathPop from './BalloonMathPop'
import SpaceMission from './SpaceMission'
import ScoreHistory from './ScoreHistory'
import StudentsNamesModal from './StudentsNamesModal'
import { BACKEND_URL } from '../constants'
import './MathsGames.css'

const MathsGamesContent = ({ onExitGameMode }) => {
  const [activeTab, setActiveTab] = useState('balloon')
  const [showModal, setShowModal] = useState(false)
  const [balloonStarted, setBalloonStarted] = useState(false)
  const [spaceStarted, setSpaceStarted] = useState(false)
  const [balloonNames, setBalloonNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [spaceNames, setSpaceNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [currentGameType, setCurrentGameType] = useState(null) // 'balloon' or 'space'

  // Load started games state and names
  useEffect(() => {
    // Load balloon game state
    const balloonStartedState = localStorage.getItem('maths_games_balloon_started')
    const balloonNamesData = localStorage.getItem('balloon_math_pop_students_names')
    if (balloonStartedState === 'true') setBalloonStarted(true)
    if (balloonNamesData) {
      try {
        const parsed = JSON.parse(balloonNamesData)
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setBalloonNames(parsed)
        }
      } catch (e) {
        console.error('Error loading balloon names:', e)
      }
    }

    // Load space game state
    const spaceStartedState = localStorage.getItem('maths_games_space_started')
    const spaceNamesData = localStorage.getItem('space_mission_students_names')
    if (spaceStartedState === 'true') setSpaceStarted(true)
    if (spaceNamesData) {
      try {
        const parsed = JSON.parse(spaceNamesData)
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setSpaceNames(parsed)
        }
      } catch (e) {
        console.error('Error loading space names:', e)
      }
    }
  }, [])

  const handleNamesSubmit = (names) => {
    if (currentGameType === 'balloon') {
      setBalloonNames(names)
      localStorage.setItem('balloon_math_pop_students_names', JSON.stringify(names))
      setBalloonStarted(true)
      localStorage.setItem('maths_games_balloon_started', 'true')
    } else if (currentGameType === 'space') {
      setSpaceNames(names)
      localStorage.setItem('space_mission_students_names', JSON.stringify(names))
      setSpaceStarted(true)
      localStorage.setItem('maths_games_space_started', 'true')
    }
    setShowModal(false)
    setCurrentGameType(null)
  }

  const handleNameChange = (studentId, name) => {
    if (currentGameType === 'balloon') {
      setBalloonNames(prev => ({
        ...prev,
        [studentId]: name.trim()
      }))
    } else if (currentGameType === 'space') {
      setSpaceNames(prev => ({
        ...prev,
        [studentId]: name.trim()
      }))
    }
  }

  // Check if name is valid (not empty and not default placeholder)
  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

  // Check if all names are valid for balloon game
  const balloonNamesValid = () => {
    return isValidName(balloonNames.student1) &&
           isValidName(balloonNames.student2) &&
           isValidName(balloonNames.student3) &&
           isValidName(balloonNames.student4)
  }

  // Check if all names are valid for space game
  const spaceNamesValid = () => {
    return isValidName(spaceNames.student1) &&
           isValidName(spaceNames.student2) &&
           isValidName(spaceNames.student3) &&
           isValidName(spaceNames.student4)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setCurrentGameType(null)
    // If game mode exit handler is provided, call it to turn off game mode
    if (onExitGameMode) {
      onExitGameMode()
    }
  }

  const handleResetAll = async () => {
    const confirmMessage = 'क्या आप सभी games reset करना चाहते हैं?\n\nयह करने से:\n• सभी student names हट जाएंगे\n• सभी scores हट जाएंगे\n• आपको नए names enter करने होंगे'
    
    if (window.confirm(confirmMessage)) {
      try {
        // Clear scores from API
        const response = await fetch(`${BACKEND_URL}/api/maths-games/scores`, {
          method: 'DELETE'
        })
        if (response.ok) {
          console.log('Scores cleared from API')
        }
      } catch (error) {
        console.warn('Failed to clear from API:', error)
      }
      
      // Clear localStorage
      localStorage.removeItem('balloon_math_pop_students_names')
      localStorage.removeItem('space_mission_students_names')
      localStorage.removeItem('maths_games_scores')
      localStorage.removeItem('maths_games_balloon_started')
      localStorage.removeItem('maths_games_space_started')
      
      // Reset state
      setBalloonNames({
        student1: '',
        student2: '',
        student3: '',
        student4: ''
      })
      setSpaceNames({
        student1: '',
        student2: '',
        student3: '',
        student4: ''
      })
      setBalloonStarted(false)
      setSpaceStarted(false)
      
      // Trigger score update event to refresh leaderboard
      window.dispatchEvent(new CustomEvent('scoreUpdated'))
    }
  }

  const handleStartBalloon = () => {
    setCurrentGameType('balloon')
    setShowModal(true)
  }

  const handleStartSpace = () => {
    setCurrentGameType('space')
    setShowModal(true)
  }

  return (
    <>
      {showModal && (
        <StudentsNamesModal 
          onNamesSubmit={handleNamesSubmit} 
          onClose={handleModalClose}
          storageKey={currentGameType === 'balloon' ? 'balloon_math_pop_students_names' : 'space_mission_students_names'}
          gameTitle={currentGameType === 'balloon' ? 'Balloon Math Pop' : 'Space Mission'}
        />
      )}
      
      <div className="maths-games-header" style={{ justifyContent: 'flex-end' }}>
        {(balloonStarted && balloonNamesValid()) || (spaceStarted && spaceNamesValid()) ? (
          <button onClick={handleResetAll} className="reset-all-btn" title="Reset all games and enter new names">
            🔄 Reset All
          </button>
        ) : null}
      </div>
      
      <ScoreHistory category="maths-games" />
      
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
          {activeTab === 'balloon' && (
            <>
              {!balloonStarted ? (
                <div className="games-placeholder">
                  <div className="placeholder-content">
                    <h3>🎈 Balloon Math Pop</h3>
                    <p>Ready to start the game?</p>
                    <button onClick={handleStartBalloon} className="open-modal-btn">
                      ▶️ Start Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="balloon-games-grid">
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 1:</label>
                      <span className="student-name">{balloonNames.student1}</span>
                    </div>
                    <BalloonMathPop userName={balloonNames.student1} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 2:</label>
                      <span className="student-name">{balloonNames.student2}</span>
                    </div>
                    <BalloonMathPop userName={balloonNames.student2} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 3:</label>
                      <span className="student-name">{balloonNames.student3}</span>
                    </div>
                    <BalloonMathPop userName={balloonNames.student3} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 4:</label>
                      <span className="student-name">{balloonNames.student4}</span>
                    </div>
                    <BalloonMathPop userName={balloonNames.student4} />
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'space' && (
            <>
              {!spaceStarted ? (
                <div className="games-placeholder">
                  <div className="placeholder-content">
                    <h3>🚀 Space Mission</h3>
                    <p>Ready to start the game?</p>
                    <button onClick={handleStartSpace} className="open-modal-btn">
                      ▶️ Start Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-game-wrapper">
                  <div className="student-name-display">
                    <label>Player Name:</label>
                    <span className="student-name">{spaceNames.student1}</span>
                  </div>
                  <SpaceMission userName={spaceNames.student1} />
                </div>
              )}
            </>
          )}
      </div>
    </>
  )
}

export default MathsGamesContent

