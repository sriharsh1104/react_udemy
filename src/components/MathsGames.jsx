import { useState, useEffect } from 'react'
import BalloonMathPop from './BalloonMathPop'
import SpaceMission from './SpaceMission'
import ScoreHistory from './ScoreHistory'
import StudentsNamesModal from './StudentsNamesModal'
import { BACKEND_URL } from '../constants'
import './MathsGames.css'

const MathsGames = ({ onExitGameMode }) => {
  const [activeTab, setActiveTab] = useState('balloon')
  const [showModal, setShowModal] = useState(false)
  const [studentNames, setStudentNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })

  // Check if names are already saved
  useEffect(() => {
    const savedNames = localStorage.getItem('maths_games_students_names')
    if (savedNames) {
      try {
        const parsed = JSON.parse(savedNames)
        // Validate all 4 names exist
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setStudentNames(parsed)
          setShowModal(false)
        } else {
          setShowModal(true)
        }
      } catch (e) {
      setShowModal(true)
      }
    } else {
      setShowModal(true)
    }
  }, [])

  const handleNamesSubmit = (names) => {
    setStudentNames(names)
    setShowModal(false)
    // Save to localStorage (already done in modal, but ensure it's saved)
    localStorage.setItem('maths_games_students_names', JSON.stringify(names))
  }

  const handleNameChange = (studentId, name) => {
    setStudentNames(prev => ({
      ...prev,
      [studentId]: name.trim()
    }))
  }

  // Check if name is valid (not empty and not default placeholder)
  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

  // Check if all names are valid
  const allNamesValid = () => {
    return isValidName(studentNames.student1) &&
           isValidName(studentNames.student2) &&
           isValidName(studentNames.student3) &&
           isValidName(studentNames.student4)
  }

  const handleModalClose = () => {
    setShowModal(false)
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
      localStorage.removeItem('maths_games_students_names')
      localStorage.removeItem('maths_games_scores')
      
      // Reset state
      setStudentNames({
        student1: '',
        student2: '',
        student3: '',
        student4: ''
      })
      
      // Show modal for new names
      setShowModal(true)
      
      // Trigger score update event to refresh leaderboard
      window.dispatchEvent(new CustomEvent('scoreUpdated'))
    }
  }

  return (
    <div className="maths-games">
      {showModal && (
        <StudentsNamesModal 
          onNamesSubmit={handleNamesSubmit} 
          onClose={handleModalClose}
        />
      )}
      
      <div className="maths-games-header">
        <h1 className="maths-games-title">🎮 Maths Games</h1>
        {allNamesValid() && (
          <button onClick={handleResetAll} className="reset-all-btn" title="Reset all games and enter new names">
            🔄 Reset All
          </button>
        )}
      </div>
      
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

      {!allNamesValid() ? (
        <div className="games-placeholder">
          <div className="placeholder-content">
            <h3>⚠️ Names Required</h3>
            <p>कृपया सभी 4 छात्रों के नाम दर्ज करें</p>
            <button onClick={() => setShowModal(true)} className="open-modal-btn">
              Enter Names
            </button>
          </div>
        </div>
      ) : (
      <div className="games-container">
          {activeTab === 'balloon' && (
            <div className="balloon-games-grid">
              <div className="game-instance">
                <div className="student-name-display">
                  <label>Student 1:</label>
                  <span className="student-name">{studentNames.student1}</span>
                </div>
                <BalloonMathPop userName={studentNames.student1} />
              </div>
              <div className="game-instance">
                <div className="student-name-display">
                  <label>Student 2:</label>
                  <span className="student-name">{studentNames.student2}</span>
                </div>
                <BalloonMathPop userName={studentNames.student2} />
              </div>
              <div className="game-instance">
                <div className="student-name-display">
                  <label>Student 3:</label>
                  <span className="student-name">{studentNames.student3}</span>
                </div>
                <BalloonMathPop userName={studentNames.student3} />
              </div>
              <div className="game-instance">
                <div className="student-name-display">
                  <label>Student 4:</label>
                  <span className="student-name">{studentNames.student4}</span>
                </div>
                <BalloonMathPop userName={studentNames.student4} />
              </div>
            </div>
          )}
          {activeTab === 'space' && (
            <div className="space-game-wrapper">
              <div className="student-name-display">
                <label>Player Name:</label>
                <span className="student-name">{studentNames.student1}</span>
                <button onClick={() => setShowModal(true)} className="edit-names-btn">
                  ✏️ Edit Names
                </button>
              </div>
              <SpaceMission userName={studentNames.student1} />
            </div>
          )}
      </div>
      )}
    </div>
  )
}

export default MathsGames


