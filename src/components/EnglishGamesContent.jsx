import { useState, useEffect } from 'react'
import ScoreHistory from './ScoreHistory'
import StudentsNamesModal from './StudentsNamesModal'
import WordMatch from './WordMatch'
import SpellingBee from './SpellingBee'
import WordBuilder from './WordBuilder'
import { BACKEND_URL } from '../constants'
import './MathsGames.css'

const EnglishGamesContent = ({ onExitGameMode }) => {
  const [activeTab, setActiveTab] = useState('wordmatch')
  const [showModal, setShowModal] = useState(false)
  const [wordMatchStarted, setWordMatchStarted] = useState(false)
  const [spellingBeeStarted, setSpellingBeeStarted] = useState(false)
  const [wordBuilderStarted, setWordBuilderStarted] = useState(false)
  const [wordMatchNames, setWordMatchNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [spellingBeeNames, setSpellingBeeNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [wordBuilderNames, setWordBuilderNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [currentGameType, setCurrentGameType] = useState(null) // 'wordmatch', 'spellingbee', 'wordbuilder'

  // Load started games state and names
  useEffect(() => {
    // Load Word Match game state
    const wordMatchStartedState = localStorage.getItem('english_games_wordmatch_started')
    const wordMatchNamesData = localStorage.getItem('word_match_students_names')
    if (wordMatchStartedState === 'true') setWordMatchStarted(true)
    if (wordMatchNamesData) {
      try {
        const parsed = JSON.parse(wordMatchNamesData)
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setWordMatchNames(parsed)
        }
      } catch (e) {
        console.error('Error loading word match names:', e)
      }
    }

    // Load Spelling Bee game state
    const spellingBeeStartedState = localStorage.getItem('english_games_spellingbee_started')
    const spellingBeeNamesData = localStorage.getItem('spelling_bee_students_names')
    if (spellingBeeStartedState === 'true') setSpellingBeeStarted(true)
    if (spellingBeeNamesData) {
      try {
        const parsed = JSON.parse(spellingBeeNamesData)
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setSpellingBeeNames(parsed)
        }
      } catch (e) {
        console.error('Error loading spelling bee names:', e)
      }
    }

    // Load Word Builder game state
    const wordBuilderStartedState = localStorage.getItem('english_games_wordbuilder_started')
    const wordBuilderNamesData = localStorage.getItem('word_builder_students_names')
    if (wordBuilderStartedState === 'true') setWordBuilderStarted(true)
    if (wordBuilderNamesData) {
      try {
        const parsed = JSON.parse(wordBuilderNamesData)
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setWordBuilderNames(parsed)
        }
      } catch (e) {
        console.error('Error loading word builder names:', e)
      }
    }
  }, [])

  const handleNamesSubmit = (names) => {
    if (currentGameType === 'wordmatch') {
      setWordMatchNames(names)
      localStorage.setItem('word_match_students_names', JSON.stringify(names))
      setWordMatchStarted(true)
      localStorage.setItem('english_games_wordmatch_started', 'true')
    } else if (currentGameType === 'spellingbee') {
      setSpellingBeeNames(names)
      localStorage.setItem('spelling_bee_students_names', JSON.stringify(names))
      setSpellingBeeStarted(true)
      localStorage.setItem('english_games_spellingbee_started', 'true')
    } else if (currentGameType === 'wordbuilder') {
      setWordBuilderNames(names)
      localStorage.setItem('word_builder_students_names', JSON.stringify(names))
      setWordBuilderStarted(true)
      localStorage.setItem('english_games_wordbuilder_started', 'true')
    }
    setShowModal(false)
    setCurrentGameType(null)
  }

  // Check if name is valid
  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

  // Check if all names are valid for each game
  const wordMatchNamesValid = () => {
    return isValidName(wordMatchNames.student1) &&
           isValidName(wordMatchNames.student2) &&
           isValidName(wordMatchNames.student3) &&
           isValidName(wordMatchNames.student4)
  }

  const spellingBeeNamesValid = () => {
    return isValidName(spellingBeeNames.student1) &&
           isValidName(spellingBeeNames.student2) &&
           isValidName(spellingBeeNames.student3) &&
           isValidName(spellingBeeNames.student4)
  }

  const wordBuilderNamesValid = () => {
    return isValidName(wordBuilderNames.student1) &&
           isValidName(wordBuilderNames.student2) &&
           isValidName(wordBuilderNames.student3) &&
           isValidName(wordBuilderNames.student4)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setCurrentGameType(null)
    if (onExitGameMode) {
      onExitGameMode()
    }
  }

  const handleResetAll = async () => {
    const confirmMessage = 'क्या आप सभी games reset करना चाहते हैं?\n\nयह करने से:\n• सभी student names हट जाएंगे\n• सभी scores हट जाएंगे\n• आपको नए names enter करने होंगे'
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/english-games/scores`, {
          method: 'DELETE'
        })
        if (response.ok) {
          console.log('Scores cleared from API')
        }
      } catch (error) {
        console.warn('Failed to clear from API:', error)
      }
      
      // Clear localStorage
      localStorage.removeItem('word_match_students_names')
      localStorage.removeItem('spelling_bee_students_names')
      localStorage.removeItem('word_builder_students_names')
      localStorage.removeItem('english_games_scores')
      localStorage.removeItem('english_games_wordmatch_started')
      localStorage.removeItem('english_games_spellingbee_started')
      localStorage.removeItem('english_games_wordbuilder_started')
      
      // Reset state
      setWordMatchNames({ student1: '', student2: '', student3: '', student4: '' })
      setSpellingBeeNames({ student1: '', student2: '', student3: '', student4: '' })
      setWordBuilderNames({ student1: '', student2: '', student3: '', student4: '' })
      setWordMatchStarted(false)
      setSpellingBeeStarted(false)
      setWordBuilderStarted(false)
      
      window.dispatchEvent(new CustomEvent('scoreUpdated'))
    }
  }

  const handleStartWordMatch = () => {
    setCurrentGameType('wordmatch')
    setShowModal(true)
  }

  const handleStartSpellingBee = () => {
    setCurrentGameType('spellingbee')
    setShowModal(true)
  }

  const handleStartWordBuilder = () => {
    setCurrentGameType('wordbuilder')
    setShowModal(true)
  }

  return (
    <>
      {showModal && (
        <StudentsNamesModal 
          onNamesSubmit={handleNamesSubmit} 
          onClose={handleModalClose}
          storageKey={
            currentGameType === 'wordmatch' ? 'word_match_students_names' :
            currentGameType === 'spellingbee' ? 'spelling_bee_students_names' :
            'word_builder_students_names'
          }
          gameTitle={
            currentGameType === 'wordmatch' ? 'Word Match' :
            currentGameType === 'spellingbee' ? 'Spelling Bee' :
            'Word Builder'
          }
        />
      )}
      
      <div className="maths-games-header" style={{ justifyContent: 'flex-end' }}>
        {(wordMatchStarted && wordMatchNamesValid()) || 
         (spellingBeeStarted && spellingBeeNamesValid()) || 
         (wordBuilderStarted && wordBuilderNamesValid()) ? (
          <button onClick={handleResetAll} className="reset-all-btn" title="Reset all games and enter new names">
            🔄 Reset All
          </button>
        ) : null}
      </div>
      
      <ScoreHistory category="english-games" />
      
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'wordmatch' ? 'active' : ''}`}
          onClick={() => setActiveTab('wordmatch')}
        >
          🎯 Word Match
        </button>
        <button
          className={`tab-button ${activeTab === 'spellingbee' ? 'active' : ''}`}
          onClick={() => setActiveTab('spellingbee')}
        >
          🐝 Spelling Bee
        </button>
        <button
          className={`tab-button ${activeTab === 'wordbuilder' ? 'active' : ''}`}
          onClick={() => setActiveTab('wordbuilder')}
        >
          🔤 Word Builder
        </button>
      </div>

      <div className="games-container">
          {activeTab === 'wordmatch' && (
            <>
              {!wordMatchStarted ? (
                <div className="games-placeholder">
                  <div className="placeholder-content">
                    <h3>🎯 Word Match</h3>
                    <p>Match words with pictures and learn vocabulary!</p>
                    <button onClick={handleStartWordMatch} className="open-modal-btn">
                      ▶️ Start Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="balloon-games-grid">
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 1:</label>
                      <span className="student-name">{wordMatchNames.student1}</span>
                    </div>
                    <WordMatch userName={wordMatchNames.student1} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 2:</label>
                      <span className="student-name">{wordMatchNames.student2}</span>
                    </div>
                    <WordMatch userName={wordMatchNames.student2} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 3:</label>
                      <span className="student-name">{wordMatchNames.student3}</span>
                    </div>
                    <WordMatch userName={wordMatchNames.student3} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 4:</label>
                      <span className="student-name">{wordMatchNames.student4}</span>
                    </div>
                    <WordMatch userName={wordMatchNames.student4} />
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'spellingbee' && (
            <>
              {!spellingBeeStarted ? (
                <div className="games-placeholder">
                  <div className="placeholder-content">
                    <h3>🐝 Spelling Bee</h3>
                    <p>Spell words correctly and improve your spelling!</p>
                    <button onClick={handleStartSpellingBee} className="open-modal-btn">
                      ▶️ Start Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="balloon-games-grid">
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 1:</label>
                      <span className="student-name">{spellingBeeNames.student1}</span>
                    </div>
                    <SpellingBee userName={spellingBeeNames.student1} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 2:</label>
                      <span className="student-name">{spellingBeeNames.student2}</span>
                    </div>
                    <SpellingBee userName={spellingBeeNames.student2} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 3:</label>
                      <span className="student-name">{spellingBeeNames.student3}</span>
                    </div>
                    <SpellingBee userName={spellingBeeNames.student3} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 4:</label>
                      <span className="student-name">{spellingBeeNames.student4}</span>
                    </div>
                    <SpellingBee userName={spellingBeeNames.student4} />
                  </div>
                </div>
              )}
            </>
          )}
          {activeTab === 'wordbuilder' && (
            <>
              {!wordBuilderStarted ? (
                <div className="games-placeholder">
                  <div className="placeholder-content">
                    <h3>🔤 Word Builder</h3>
                    <p>Build words by arranging letters correctly!</p>
                    <button onClick={handleStartWordBuilder} className="open-modal-btn">
                      ▶️ Start Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="balloon-games-grid">
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 1:</label>
                      <span className="student-name">{wordBuilderNames.student1}</span>
                    </div>
                    <WordBuilder userName={wordBuilderNames.student1} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 2:</label>
                      <span className="student-name">{wordBuilderNames.student2}</span>
                    </div>
                    <WordBuilder userName={wordBuilderNames.student2} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 3:</label>
                      <span className="student-name">{wordBuilderNames.student3}</span>
                    </div>
                    <WordBuilder userName={wordBuilderNames.student3} />
                  </div>
                  <div className="game-instance">
                    <div className="student-name-display">
                      <label>Student 4:</label>
                      <span className="student-name">{wordBuilderNames.student4}</span>
                    </div>
                    <WordBuilder userName={wordBuilderNames.student4} />
                  </div>
                </div>
              )}
            </>
          )}
      </div>
    </>
  )
}

export default EnglishGamesContent

