import { useState, useEffect } from 'react'
import './AnimalQuiz.css'

const ComputerQuiz = () => {
  // Computer-related terms for class 5 or lower - 30+ questions
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
    { name: 'Browser', image: '🌍', hint: 'Used to visit websites (Chrome, Firefox, Edge)' },
    { name: 'File', image: '📄', hint: 'Stores information on computer' },
    { name: 'Folder', image: '📁', hint: 'Keeps files organized' },
    { name: 'Password', image: '🔒', hint: 'Secret code to protect account' },
    { name: 'Download', image: '⬇️', hint: 'Get files from internet' },
    { name: 'Upload', image: '⬆️', hint: 'Send files to internet' },
    { name: 'Software', image: '💿', hint: 'Programs that run on computer' },
    { name: 'Hardware', image: '🔧', hint: 'Physical parts of computer' },
    { name: 'Desktop', image: '🖼️', hint: 'Main screen of computer' },
    { name: 'Icon', image: '🖼️', hint: 'Small picture that opens program' },
    { name: 'Window', image: '🪟', hint: 'Box that shows program on screen' },
    { name: 'Laptop', image: '💻', hint: 'Portable computer that you can carry' },
    { name: 'Desktop Computer', image: '🖥️', hint: 'Computer that stays on desk (not portable)' },
    { name: 'Start Button', image: '🪟', hint: 'Button to open menu in Windows' },
    { name: 'Power Off', image: '⏻', hint: 'To turn off the computer' },
    { name: 'Restart', image: '🔄', hint: 'To turn off and on computer again' },
    { name: 'Windows', image: '🪟', hint: 'Operating system by Microsoft' },
    { name: 'Oldest Window', image: '🪟', hint: 'First version of Windows (Windows 1.0)' },
    { name: 'Latest Window', image: '🪟', hint: 'Newest version of Windows (Windows 11)' },
    { name: 'Chrome', image: '🌐', hint: 'Google browser (most popular)' },
    { name: 'Firefox', image: '🦊', hint: 'Mozilla browser' },
    { name: 'Edge', image: '🌐', hint: 'Microsoft browser' },
    { name: 'Safari', image: '🌐', hint: 'Apple browser' },
    { name: 'RAM', image: '💾', hint: 'Memory that stores temporary data' },
    { name: 'Hard Drive', image: '💿', hint: 'Stores all files permanently' },
    { name: 'Motherboard', image: '🔌', hint: 'Main circuit board of computer' },
    { name: 'Graphics Card', image: '🎮', hint: 'Makes pictures and videos look good' },
    { name: 'Webcam', image: '📹', hint: 'Camera on computer for video calls' },
    { name: 'Microphone', image: '🎤', hint: 'Records sound on computer' },
    { name: 'Headphones', image: '🎧', hint: 'Wear to hear sound privately' },
    { name: 'WiFi', image: '📶', hint: 'Wireless internet connection' },
    { name: 'Bluetooth', image: '📱', hint: 'Wireless connection for devices' },
    { name: 'Touchscreen', image: '👆', hint: 'Screen you can touch to control' },
    { name: 'Tablet', image: '📱', hint: 'Flat computer with touchscreen' },
    { name: 'Smartphone', image: '📱', hint: 'Phone that works like computer' }
  ]

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('computer_quiz_index')
    return saved ? parseInt(saved, 10) : 0
  })
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('computer_quiz_score')
    return saved ? parseInt(saved, 10) : 0
  })
  const [totalQuestions, setTotalQuestions] = useState(() => {
    const saved = localStorage.getItem('computer_quiz_total')
    return saved ? parseInt(saved, 10) : 0
  })
  const [showHint, setShowHint] = useState(false)
  const [answeredQuestions, setAnsweredQuestions] = useState(() => {
    const saved = localStorage.getItem('computer_quiz_answered')
    return saved ? JSON.parse(saved) : {}
  })

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('computer_quiz_index', currentIndex.toString())
    localStorage.setItem('computer_quiz_score', score.toString())
    localStorage.setItem('computer_quiz_total', totalQuestions.toString())
    localStorage.setItem('computer_quiz_answered', JSON.stringify(answeredQuestions))
  }, [currentIndex, score, totalQuestions, answeredQuestions])

  const currentTerm = computerTerms[currentIndex]

  const handleSubmit = (e) => {
    e.preventDefault()
    const newTotal = totalQuestions + 1
    setTotalQuestions(newTotal)
    
    const isCorrect = userAnswer.trim().toLowerCase() === currentTerm.name.toLowerCase()
    const newScore = isCorrect ? score + 1 : score
    
    // Save answer
    setAnsweredQuestions({
      ...answeredQuestions,
      [currentIndex]: {
        answer: userAnswer.trim(),
        correct: isCorrect,
        correctAnswer: currentTerm.name
      }
    })
    
    setScore(newScore)
    setShowResult(true)
    setTimeout(() => {
      nextQuestion()
    }, 2000)
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

  const handleReset = () => {
    if (window.confirm('क्या आप game reset करना चाहते हैं? सभी progress हट जाएगी।')) {
      setCurrentIndex(0)
      setUserAnswer('')
      setShowResult(false)
      setScore(0)
      setTotalQuestions(0)
      setShowHint(false)
      setAnsweredQuestions({})
      localStorage.removeItem('computer_quiz_index')
      localStorage.removeItem('computer_quiz_score')
      localStorage.removeItem('computer_quiz_total')
      localStorage.removeItem('computer_quiz_answered')
    }
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
            <button 
              type="button" 
              onClick={handleReset}
              className="skip-button"
              style={{ fontSize: '1.1rem', padding: '14px 28px', minWidth: '140px', backgroundColor: '#dc3545' }}
            >
              🔄 Reset
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

