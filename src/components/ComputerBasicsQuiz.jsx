import { useState, useEffect } from 'react'
import './AnimalQuiz.css'

const ComputerBasicsQuiz = () => {
  const questions = [
    {
      question: 'What is the brain of the computer?',
      options: ['Monitor', 'CPU', 'Keyboard', 'Mouse'],
      correct: 1,
      emoji: '📦'
    },
    {
      question: 'Which button opens the menu in Windows?',
      options: ['Power Button', 'Start Button', 'Close Button', 'Minimize Button'],
      correct: 1,
      emoji: '🪟'
    },
    {
      question: 'What do you use to visit websites?',
      options: ['Email', 'Browser', 'File', 'Folder'],
      correct: 1,
      emoji: '🌐'
    },
    {
      question: 'Which is the oldest version of Windows?',
      options: ['Windows 10', 'Windows 11', 'Windows 1.0', 'Windows 7'],
      correct: 2,
      emoji: '🪟'
    },
    {
      question: 'Which is the latest version of Windows?',
      options: ['Windows 10', 'Windows 11', 'Windows 8', 'Windows 7'],
      correct: 1,
      emoji: '🪟'
    },
    {
      question: 'What is a portable computer called?',
      options: ['Desktop', 'Laptop', 'Tablet', 'Monitor'],
      correct: 1,
      emoji: '💻'
    },
    {
      question: 'What is used to turn off the computer?',
      options: ['Start Button', 'Power Off', 'Restart', 'Sleep'],
      correct: 1,
      emoji: '⏻'
    },
    {
      question: 'Which browser is made by Google?',
      options: ['Firefox', 'Edge', 'Chrome', 'Safari'],
      correct: 2,
      emoji: '🌐'
    },
    {
      question: 'What stores files permanently?',
      options: ['RAM', 'Hard Drive', 'USB', 'Browser'],
      correct: 1,
      emoji: '💿'
    },
    {
      question: 'What is used for wireless internet?',
      options: ['USB', 'WiFi', 'Bluetooth', 'Cable'],
      correct: 1,
      emoji: '📶'
    },
    {
      question: 'What is the main screen of computer called?',
      options: ['Window', 'Icon', 'Desktop', 'Browser'],
      correct: 2,
      emoji: '🖼️'
    },
    {
      question: 'What is used to type on computer?',
      options: ['Mouse', 'Monitor', 'Keyboard', 'Speaker'],
      correct: 2,
      emoji: '⌨️'
    },
    {
      question: 'What is used to click on computer?',
      options: ['Keyboard', 'Mouse', 'Monitor', 'CPU'],
      correct: 1,
      emoji: '🖱️'
    },
    {
      question: 'What shows what is on the computer?',
      options: ['CPU', 'Keyboard', 'Monitor', 'Mouse'],
      correct: 2,
      emoji: '🖥️'
    },
    {
      question: 'What is used to print documents?',
      options: ['Monitor', 'Printer', 'Speaker', 'Webcam'],
      correct: 1,
      emoji: '🖨️'
    },
    {
      question: 'What is used to connect devices?',
      options: ['WiFi', 'USB', 'Bluetooth', 'Cable'],
      correct: 1,
      emoji: '🔌'
    },
    {
      question: 'What is used to send messages?',
      options: ['Browser', 'Email', 'File', 'Folder'],
      correct: 1,
      emoji: '📧'
    },
    {
      question: 'What keeps files organized?',
      options: ['File', 'Folder', 'Desktop', 'Icon'],
      correct: 1,
      emoji: '📁'
    },
    {
      question: 'What protects your account?',
      options: ['Email', 'Password', 'Browser', 'File'],
      correct: 1,
      emoji: '🔒'
    },
    {
      question: 'What is used to restart computer?',
      options: ['Power Off', 'Start', 'Restart', 'Sleep'],
      correct: 2,
      emoji: '🔄'
    }
  ]

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('computer_basics_quiz_index')
    return saved ? parseInt(saved, 10) : 0
  })
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('computer_basics_quiz_score')
    return saved ? parseInt(saved, 10) : 0
  })
  const [totalQuestions, setTotalQuestions] = useState(() => {
    const saved = localStorage.getItem('computer_basics_quiz_total')
    return saved ? parseInt(saved, 10) : 0
  })
  const [answeredQuestions, setAnsweredQuestions] = useState(() => {
    const saved = localStorage.getItem('computer_basics_quiz_answered')
    return saved ? JSON.parse(saved) : {}
  })

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('computer_basics_quiz_index', currentIndex.toString())
    localStorage.setItem('computer_basics_quiz_score', score.toString())
    localStorage.setItem('computer_basics_quiz_total', totalQuestions.toString())
    localStorage.setItem('computer_basics_quiz_answered', JSON.stringify(answeredQuestions))
  }, [currentIndex, score, totalQuestions, answeredQuestions])

  const currentQuestion = questions[currentIndex]

  const handleOptionClick = (optionIndex) => {
    if (showResult) return
    
    const newTotal = totalQuestions + 1
    const isCorrect = optionIndex === currentQuestion.correct
    const newScore = isCorrect ? score + 1 : score
    
    setSelectedOption(optionIndex)
    setTotalQuestions(newTotal)
    setScore(newScore)
    setShowResult(true)
    
    // Save answer
    setAnsweredQuestions({
      ...answeredQuestions,
      [currentIndex]: {
        selected: optionIndex,
        correct: isCorrect,
        correctAnswer: currentQuestion.correct
      }
    })
    
    setTimeout(() => {
      nextQuestion()
    }, 2000)
  }

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      // Quiz completed, restart
      setCurrentIndex(0)
    }
    setSelectedOption(null)
    setShowResult(false)
  }

  const handleSkip = () => {
    setTotalQuestions(totalQuestions + 1)
    nextQuestion()
  }

  const resetQuiz = () => {
    if (window.confirm('क्या आप quiz reset करना चाहते हैं? सभी progress हट जाएगी।')) {
      setCurrentIndex(0)
      setSelectedOption(null)
      setShowResult(false)
      setScore(0)
      setTotalQuestions(0)
      setAnsweredQuestions({})
      localStorage.removeItem('computer_basics_quiz_index')
      localStorage.removeItem('computer_basics_quiz_score')
      localStorage.removeItem('computer_basics_quiz_total')
      localStorage.removeItem('computer_basics_quiz_answered')
    }
  }

  const isCorrect = selectedOption === currentQuestion.correct
  const quizComplete = currentIndex === questions.length - 1 && showResult

  return (
    <div className="animal-quiz-container">
      <div className="animal-quiz-content" style={{ maxWidth: '700px' }}>
        <h1 className="quiz-title">❓ Computer Basics Quiz</h1>
        <p className="quiz-subtitle">Test your computer knowledge!</p>
        
        <div className="score-display">
          <span>Score: {score} / {totalQuestions}</span>
        </div>

        {!quizComplete ? (
          <>
            <div className="animal-display">
              <div className="animal-image">
                <span className="animal-emoji" style={{ fontSize: '8rem', display: 'block', marginBottom: '20px' }}>
                  {currentQuestion.emoji}
                </span>
              </div>
              <h2 className="question-text" style={{ fontSize: '1.8rem', marginTop: '10px', marginBottom: '30px' }}>
                {currentQuestion.question}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              {currentQuestion.options.map((option, index) => {
                let buttonStyle = {
                  padding: '18px',
                  fontSize: '1.3rem',
                  border: '3px solid #ddd',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  cursor: showResult ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  fontWeight: '600',
                  textAlign: 'left'
                }

                if (showResult) {
                  if (index === currentQuestion.correct) {
                    buttonStyle = {
                      ...buttonStyle,
                      border: '3px solid #28a745',
                      backgroundColor: '#d4edda',
                      color: '#155724'
                    }
                  } else if (index === selectedOption && index !== currentQuestion.correct) {
                    buttonStyle = {
                      ...buttonStyle,
                      border: '3px solid #dc3545',
                      backgroundColor: '#f8d7da',
                      color: '#721c24'
                    }
                  }
                } else if (selectedOption === index) {
                  buttonStyle = {
                    ...buttonStyle,
                    border: '3px solid #667eea',
                    backgroundColor: '#e7f0ff'
                  }
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleOptionClick(index)}
                    disabled={showResult}
                    style={buttonStyle}
                  >
                    {String.fromCharCode(65 + index)}. {option}
                    {showResult && index === currentQuestion.correct && (
                      <span style={{ marginLeft: '10px', fontSize: '1.5rem' }}>✅</span>
                    )}
                    {showResult && index === selectedOption && index !== currentQuestion.correct && (
                      <span style={{ marginLeft: '10px', fontSize: '1.5rem' }}>❌</span>
                    )}
                  </button>
                )
              })}
            </div>

            {showResult && (
              <div className={`result-message ${isCorrect ? 'correct' : 'incorrect'}`} style={{ marginBottom: '20px' }}>
                {isCorrect ? (
                  <>
                    <span className="result-icon">✅</span>
                    <p>Correct! Well done!</p>
                  </>
                ) : (
                  <>
                    <span className="result-icon">❌</span>
                    <p>Incorrect. The correct answer is: {currentQuestion.options[currentQuestion.correct]}</p>
                  </>
                )}
              </div>
            )}

            <div className="button-group" style={{ gap: '15px', marginTop: '10px' }}>
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
                type="button" 
                onClick={resetQuiz}
                className="hint-button"
                style={{ fontSize: '1.1rem', padding: '14px 28px', minWidth: '140px' }}
              >
                🔄 Reset
              </button>
            </div>

            <div className="progress-info">
              <p>Question {currentIndex + 1} of {questions.length}</p>
            </div>
          </>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '5rem',
              marginBottom: '20px'
            }}>🎉</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px', color: '#667eea' }}>
              Quiz Complete!
            </h2>
            <p style={{ fontSize: '1.5rem', marginBottom: '30px' }}>
              Your Score: {score} / {totalQuestions}
            </p>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '30px' }}>
              {score === totalQuestions ? 'Perfect Score! 🌟' : 
               score >= totalQuestions * 0.7 ? 'Great Job! 👍' : 
               'Keep Learning! 📚'}
            </p>
            <button
              onClick={resetQuiz}
              style={{
                padding: '15px 30px',
                fontSize: '1.2rem',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComputerBasicsQuiz

