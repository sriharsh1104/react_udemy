import { useState, useEffect } from 'react'
import BalloonMathPop from './BalloonMathPop'
import SpaceMission from './SpaceMission'
import RomanNumerals from './RomanNumerals'
import ScoreHistory from './ScoreHistory'
import StudentsNamesModal from './StudentsNamesModal'
import { BACKEND_URL } from '../constants'
import './MathsGames.css'

const MathsGamesContent = ({ onExitGameMode }) => {
  const [activeTab, setActiveTab] = useState('balloon')
  const [showModal, setShowModal] = useState(false)
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [balloonMode, setBalloonMode] = useState(null) // 'single' or 'multiplayer'
  const [balloonStarted, setBalloonStarted] = useState(false)
  const [spaceStarted, setSpaceStarted] = useState(false)
  const [romanStarted, setRomanStarted] = useState(false)
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
  const [romanNames, setRomanNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [currentGameType, setCurrentGameType] = useState(null) // 'balloon', 'space', or 'roman'

  // Load started games state and names
  useEffect(() => {
    // Load balloon game state
    const balloonStartedState = localStorage.getItem('maths_games_balloon_started')
    const balloonNamesData = localStorage.getItem('balloon_math_pop_students_names')
    const savedBalloonMode = localStorage.getItem('balloon_math_pop_mode') // 'single' or 'multiplayer'
    if (balloonStartedState === 'true') setBalloonStarted(true)
    if (savedBalloonMode) setBalloonMode(savedBalloonMode)
    if (balloonNamesData) {
      try {
        const parsed = JSON.parse(balloonNamesData)
        // Check based on mode
        if (savedBalloonMode === 'single') {
          if (parsed.student1) {
            setBalloonNames(parsed)
          }
        } else {
          if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
            setBalloonNames(parsed)
          }
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

    // Load roman game state (single player - only student1 required)
    const romanStartedState = localStorage.getItem('maths_games_roman_started')
    const romanNamesData = localStorage.getItem('roman_numerals_students_names')
    if (romanStartedState === 'true') setRomanStarted(true)
    if (romanNamesData) {
      try {
        const parsed = JSON.parse(romanNamesData)
        if (parsed.student1) {
          setRomanNames(parsed)
        }
      } catch (e) {
        console.error('Error loading roman names:', e)
      }
    }
  }, [])

  const handleNamesSubmit = (names) => {
    if (currentGameType === 'balloon') {
      setBalloonNames(names)
      localStorage.setItem('balloon_math_pop_students_names', JSON.stringify(names))
      setBalloonStarted(true)
      localStorage.setItem('maths_games_balloon_started', 'true')
      localStorage.setItem('balloon_math_pop_mode', balloonMode)
    } else if (currentGameType === 'space') {
      setSpaceNames(names)
      localStorage.setItem('space_mission_students_names', JSON.stringify(names))
      setSpaceStarted(true)
      localStorage.setItem('maths_games_space_started', 'true')
    } else if (currentGameType === 'roman') {
      setRomanNames(names)
      localStorage.setItem('roman_numerals_students_names', JSON.stringify(names))
      setRomanStarted(true)
      localStorage.setItem('maths_games_roman_started', 'true')
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
    } else if (currentGameType === 'roman') {
      setRomanNames(prev => ({
        ...prev,
        [studentId]: name.trim()
      }))
    }
  }

  // Check if name is valid (not empty and not default placeholder)
  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

  // Check if names are valid for balloon game (based on mode)
  const balloonNamesValid = () => {
    if (balloonMode === 'single') {
      return isValidName(balloonNames.student1)
    } else {
      return isValidName(balloonNames.student1) &&
             isValidName(balloonNames.student2) &&
             isValidName(balloonNames.student3) &&
             isValidName(balloonNames.student4)
    }
  }

  // Check if all names are valid for space game
  const spaceNamesValid = () => {
    return isValidName(spaceNames.student1) &&
           isValidName(spaceNames.student2) &&
           isValidName(spaceNames.student3) &&
           isValidName(spaceNames.student4)
  }

  // Check if name is valid for roman game (single player - only student1 required)
  const romanNamesValid = () => {
    return isValidName(romanNames.student1)
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
      localStorage.removeItem('balloon_math_pop_mode')
      localStorage.removeItem('space_mission_students_names')
      localStorage.removeItem('roman_numerals_students_names')
      localStorage.removeItem('maths_games_scores')
      localStorage.removeItem('maths_games_balloon_started')
      localStorage.removeItem('maths_games_space_started')
      localStorage.removeItem('maths_games_roman_started')
      
      // Reset state
      setBalloonNames({
        student1: '',
        student2: '',
        student3: '',
        student4: ''
      })
      setBalloonMode(null)
      setSpaceNames({
        student1: '',
        student2: '',
        student3: '',
        student4: ''
      })
      setRomanNames({
        student1: '',
        student2: '',
        student3: '',
        student4: ''
      })
      setBalloonStarted(false)
      setSpaceStarted(false)
      setRomanStarted(false)
      
      // Trigger score update event to refresh leaderboard
      window.dispatchEvent(new CustomEvent('scoreUpdated'))
    }
  }

  const handleStartBalloon = () => {
    setCurrentGameType('balloon')
    setShowModeSelection(true)
  }

  const handleModeSelect = (mode) => {
    setBalloonMode(mode)
    localStorage.setItem('balloon_math_pop_mode', mode)
    setShowModeSelection(false)
    setShowModal(true)
  }

  const handleModeSelectionClose = () => {
    setShowModeSelection(false)
    setCurrentGameType(null)
  }

  const handleStartSpace = () => {
    setCurrentGameType('space')
    setShowModal(true)
  }

  const handleStartRoman = () => {
    setCurrentGameType('roman')
    setShowModal(true)
  }

  return (
    <>
      {showModeSelection && (
        <div className="mode-selection-overlay" onClick={handleModeSelectionClose}>
          <div className="mode-selection-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={handleModeSelectionClose}
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="modal-header">
              <h2>🎈 Balloon Math Pop</h2>
              <p>कृपया game mode चुनें</p>
            </div>
            <div className="mode-selection-buttons">
              <button 
                className="mode-button single-mode"
                onClick={() => handleModeSelect('single')}
              >
                <div className="mode-icon">👤</div>
                <div className="mode-title">Single Player</div>
                <div className="mode-description">1 player के लिए</div>
              </button>
              <button 
                className="mode-button multiplayer-mode"
                onClick={() => handleModeSelect('multiplayer')}
              >
                <div className="mode-icon">👥</div>
                <div className="mode-title">Multiplayer</div>
                <div className="mode-description">4 players के लिए</div>
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <StudentsNamesModal 
          onNamesSubmit={handleNamesSubmit} 
          onClose={handleModalClose}
          storageKey={
            currentGameType === 'balloon' ? 'balloon_math_pop_students_names' :
            currentGameType === 'space' ? 'space_mission_students_names' :
            'roman_numerals_students_names'
          }
          gameTitle={
            currentGameType === 'balloon' ? 'Balloon Math Pop' :
            currentGameType === 'space' ? 'Space Mission' :
            'Roman Numerals'
          }
          singlePlayer={currentGameType === 'roman' || (currentGameType === 'balloon' && balloonMode === 'single')}
        />
      )}
      
      <div className="maths-games-header" style={{ justifyContent: 'flex-end' }}>
        {(balloonStarted && balloonNamesValid()) || (spaceStarted && spaceNamesValid()) || (romanStarted && romanNamesValid()) ? (
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
        <button
          className={`tab-button ${activeTab === 'roman' ? 'active' : ''}`}
          onClick={() => setActiveTab('roman')}
        >
          🏛️ Roman Numerals
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
                balloonMode === 'single' ? (
                  <div className="space-game-wrapper">
                    <div className="student-name-display">
                      <label>Player Name:</label>
                      <span className="student-name">{balloonNames.student1}</span>
                    </div>
                    <BalloonMathPop userName={balloonNames.student1} />
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
                )
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
          {activeTab === 'roman' && (
            <>
              {!romanStarted ? (
                <div className="games-placeholder">
                  <div className="placeholder-content">
                    <h3>🏛️ Roman Numerals</h3>
                    <p>Ready to start the game?</p>
                    <button onClick={handleStartRoman} className="open-modal-btn">
                      ▶️ Start Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-game-wrapper">
                  <div className="student-name-display">
                    <label>Player Name:</label>
                    <span className="student-name">{romanNames.student1}</span>
                  </div>
                  <RomanNumerals userName={romanNames.student1} />
                </div>
              )}
            </>
          )}
      </div>
    </>
  )
}

export default MathsGamesContent

