import { useState } from 'react'
import './AnimalQuiz.css'

const ComputerQuiz = () => {
  // Computer-related terms for class 5 or lower
  const computerTerms = [
    { name: 'Keyboard', image: '⌨️', hint: 'Used to type letters and numbers' },
    { name: 'Mouse', image: '🖱️', hint: 'Used to click and move cursor' },
    { name: 'Monitor', image: '🖥️', hint: 'Shows what is on the computer (screen/display)' },
    { name: 'CPU', image: '📦', hint: 'The brain of the computer (computer tower/box)' },
    { name: 'Printer', image: '🖨️', hint: 'Prints documents on paper' },
    { name: 'Speaker', image: '🔊', hint: 'Makes sound from computer' },
    { name: 'USB', image: '🔌', hint: 'Used to connect devices (USB port/cable)' },
    { name: 'Internet', image: '🌐', hint: 'Connects computers worldwide' },
    { name: 'Email', image: '📧', hint: 'Send messages through computer' },
    { name: 'Browser', image: '🌍', hint: 'Used to visit websites' },
    { name: 'File', image: '📄', hint: 'Stores information on computer' },
    { name: 'Folder', image: '📁', hint: 'Keeps files organized' },
    { name: 'Password', image: '🔒', hint: 'Secret code to protect account' },
    { name: 'Download', image: '⬇️', hint: 'Get files from internet' },
    { name: 'Upload', image: '⬆️', hint: 'Send files to internet' },
    { name: 'Software', image: '💿', hint: 'Programs that run on computer' },
    { name: 'Hardware', image: '🔧', hint: 'Physical parts of computer' },
    { name: 'Desktop', image: '🖼️', hint: 'Main screen of computer' },
    { name: 'Icon', image: '🖼️', hint: 'Small picture that opens program' },
    { name: 'Window', image: '🪟', hint: 'Box that shows program on screen' }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const currentTerm = computerTerms[currentIndex]

  const handleSubmit = (e) => {
    e.preventDefault()
    setTotalQuestions(totalQuestions + 1)
    
    if (userAnswer.trim().toLowerCase() === currentTerm.name.toLowerCase()) {
      setScore(score + 1)
      setShowResult(true)
      setTimeout(() => {
        nextQuestion()
      }, 2000)
    } else {
      setShowResult(true)
      setTimeout(() => {
        nextQuestion()
      }, 2000)
    }
  }

  const nextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % computerTerms.length)
    setUserAnswer('')
    setShowResult(false)
    setShowHint(false)
  }

  const handleSkip = () => {
    setTotalQuestions(totalQuestions + 1)
    nextQuestion()
  }

  return (
    <div className="animal-quiz-container">
      <div className="animal-quiz-content">
        <h1 className="quiz-title">🖥️ Computer Quiz</h1>
        <p className="quiz-subtitle">Class 5 or Lower Standard</p>
        
        <div className="score-display">
          <span>Score: {score} / {totalQuestions}</span>
        </div>

        <div className="animal-display">
          <div className="animal-image">
            <span className="animal-emoji" style={{ fontSize: '10rem', display: 'block', marginBottom: '20px' }}>
              {currentTerm.image}
            </span>
          </div>
          <h2 className="question-text" style={{ fontSize: '1.8rem', marginTop: '10px', marginBottom: '20px' }}>
            Kaunsa Computer Term Hai?<br />
            <span style={{ fontSize: '1.2rem', color: '#666', fontWeight: 'normal' }}>
              (Which Computer Term is This?)
            </span>
          </h2>
        </div>

        {showHint && (
          <div className="hint-box" style={{ marginBottom: '25px', fontSize: '1.2rem', padding: '20px' }}>
            <p style={{ margin: 0 }}>💡 <strong>Hint:</strong> {currentTerm.hint}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="quiz-form">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Computer term ka naam likho (Write computer term name)"
            className="answer-input"
            disabled={showResult}
            autoFocus
            style={{ fontSize: '1.4rem', padding: '18px', marginBottom: '25px' }}
          />
          
          <div className="button-group" style={{ gap: '15px', marginTop: '10px' }}>
            <button 
              type="button" 
              onClick={() => setShowHint(!showHint)}
              className="hint-button"
              style={{ fontSize: '1.1rem', padding: '14px 28px', minWidth: '140px' }}
            >
              {showHint ? '🙈 Hide Hint' : '💡 Show Hint'}
            </button>
            <button 
              type="button" 
              onClick={handleSkip}
              className="skip-button"
              disabled={showResult}
              style={{ fontSize: '1.1rem', padding: '14px 28px', minWidth: '140px' }}
            >
              ⏭️ Skip
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={showResult || !userAnswer.trim()}
              style={{ fontSize: '1.1rem', padding: '14px 28px', minWidth: '140px' }}
            >
              ✓ Submit
            </button>
          </div>
        </form>

        {showResult && (
          <div className={`result-message ${userAnswer.trim().toLowerCase() === currentTerm.name.toLowerCase() ? 'correct' : 'incorrect'}`}>
            {userAnswer.trim().toLowerCase() === currentTerm.name.toLowerCase() ? (
              <>
                <span className="result-icon">✅</span>
                <p>Correct! It's {currentTerm.name}!</p>
              </>
            ) : (
              <>
                <span className="result-icon">❌</span>
                <p>Incorrect. The correct answer is: {currentTerm.name}</p>
              </>
            )}
          </div>
        )}

        <div className="progress-info">
          <p>Question {currentIndex + 1} of {computerTerms.length}</p>
        </div>
      </div>
    </div>
  )
}

export default ComputerQuiz

