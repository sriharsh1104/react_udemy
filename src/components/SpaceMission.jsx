import { useState, useEffect } from 'react'
import './SpaceMission.css'
import { saveGameScore } from '../utils/scoreUtils'

const SpaceMission = ({ userName }) => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [question, setQuestion] = useState({ num1: 0, num2: 0, operator: '÷', answer: 0 })
  const [asteroids, setAsteroids] = useState([])
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(true)
  const [gameComplete, setGameComplete] = useState(false)
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false)
  const [questionList, setQuestionList] = useState([])
  const [laserBlast, setLaserBlast] = useState(null) // { asteroidId, position, topPosition }
  const [explosions, setExplosions] = useState([]) // Array of explosion effects
  const [showMessage, setShowMessage] = useState(null) // 'won' or 'lose'

  // Generate 20 division questions
  const generateQuestionList = () => {
    const questions = []
    
    for (let i = 0; i < 20; i++) {
      const divisor = Math.floor(Math.random() * 10) + 1
      const quotient = Math.floor(Math.random() * 10) + 1
      const dividend = divisor * quotient
      questions.push({
        num1: dividend,
        num2: divisor,
        operator: '÷',
        answer: quotient
      })
    }
    
    // Shuffle the questions array
    const shuffled = questions.sort(() => Math.random() - 0.5)
    return shuffled
  }

  const generateQuestion = () => {
    if (questionList.length === 0) {
      const newList = generateQuestionList()
      setQuestionList(newList)
      return
    }
    
    const currentQuestion = questionList[questionNumber]
    if (!currentQuestion) return
    
    const { num1, num2, operator, answer } = currentQuestion

    // Generate 3 wrong answers
    const wrongAnswers = []
    let attempts = 0
    while (wrongAnswers.length < 3 && attempts < 100) {
      const wrong = Math.floor(Math.random() * 10) + 1
      if (wrong !== answer && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong)
      }
      attempts++
    }

    // Ensure we have exactly 3 wrong answers
    while (wrongAnswers.length < 3) {
      let wrong = answer + wrongAnswers.length + 1
      if (wrong <= 0) wrong = 1
      if (!wrongAnswers.includes(wrong) && wrong !== answer) {
        wrongAnswers.push(wrong)
      } else {
        wrongAnswers.push(answer + wrongAnswers.length + 10)
      }
    }

    // Combine correct and wrong answers
    const allOptions = [answer, ...wrongAnswers]
    const shuffled = allOptions.sort(() => Math.random() - 0.5)

    // Generate asteroid positions (spread across screen)
    const asteroidOptions = shuffled.map((value, index) => ({
      value,
      isCorrect: value === answer,
      id: index,
      position: (index * 25) + 10 + Math.random() * 5, // Percentage position (10-85%)
      topPosition: -100 - (index * 30), // Start at different heights
      speed: 0.5 + Math.random() * 0.3, // Speed of falling
      destroyed: false,
      wrongClick: false
    }))

    setQuestion({ num1, num2, operator, answer })
    setAsteroids(asteroidOptions)
    setIsAnswered(false)
    setFirstAttempt(true)
    setShowNextQuestionButton(false)
    setLaserBlast(null)
    setExplosions([])
    setShowMessage(null)
  }

  // Initialize question list on mount
  useEffect(() => {
    const newList = generateQuestionList()
    setQuestionList(newList)
  }, [])

  // Generate question when questionNumber changes
  useEffect(() => {
    if (questionList.length === 20 && questionNumber < 20) {
      generateQuestion()
    }
  }, [questionNumber, questionList.length])

  // Save score when game completes
  useEffect(() => {
    if (gameComplete && userName) {
      saveGameScore(userName, score, 'Space Mission')
    }
  }, [gameComplete, score, userName])

  // Animate asteroids falling
  useEffect(() => {
    if (!gameActive || isAnswered || gameComplete) return

    const interval = setInterval(() => {
      setAsteroids(prev => prev.map(asteroid => {
        if (asteroid.destroyed) return asteroid
        return {
          ...asteroid,
          topPosition: asteroid.topPosition + asteroid.speed
        }
      }))
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [gameActive, isAnswered, gameComplete])

  const handleAsteroidClick = (asteroid) => {
    if (!gameActive || isAnswered || asteroid.destroyed) return

    setIsAnswered(true)

    if (asteroid.isCorrect) {
      // Correct answer - laser blast!
      if (firstAttempt) {
        setScore(prev => prev + 1)
      }
      
      // Store asteroid position for explosion
      const asteroidTop = asteroid.topPosition
      
      // Show laser blast
      setLaserBlast({ 
        asteroidId: asteroid.id, 
        position: asteroid.position,
        topPosition: asteroidTop
      })
      
      // Mark asteroid as destroyed
      setAsteroids(prev => prev.map(ast => 
        ast.id === asteroid.id ? { ...ast, destroyed: true } : ast
      ))

      // Create explosion effect at asteroid position
      const explosionId = `explosion-${asteroid.id}-${Date.now()}`
      setExplosions(prev => [...prev, {
        id: explosionId,
        position: asteroid.position,
        topPosition: asteroidTop
      }])

      // Remove explosion after animation
      setTimeout(() => {
        setExplosions(prev => prev.filter(exp => exp.id !== explosionId))
      }, 2000)

      // Show "You Won" message after blast
      setTimeout(() => {
        setShowMessage('won')
      }, 1500)

      // Show next question button after message
      setTimeout(() => {
        setShowNextQuestionButton(true)
      }, 2000)
    } else {
      // Wrong answer - asteroid comes closer (moves down faster)
      setFirstAttempt(false)
      
      setAsteroids(prev => prev.map(ast => 
        ast.id === asteroid.id 
          ? { ...ast, wrongClick: true, speed: ast.speed * 3 } 
          : ast
      ))

      // Show "You Lose" message immediately
      setShowMessage('lose')

      // Show correct answer after wrong attempt
      setTimeout(() => {
        setAsteroids(prev => prev.map(ast => 
          ast.isCorrect ? { ...ast, showCorrect: true } : ast
        ))
        setShowNextQuestionButton(true)
      }, 1000)
    }
  }

  const handleNextQuestion = () => {
    setShowMessage(null)
    setQuestionNumber(prev => {
      const next = prev + 1
      if (next >= 20) {
        setGameComplete(true)
        setGameActive(false)
        return prev
      }
      return next
    })
  }

  const resetGame = () => {
    setScore(0)
    setQuestionNumber(0)
    setGameActive(true)
    setGameComplete(false)
    setShowNextQuestionButton(false)
    setShowMessage(null)
    const newList = generateQuestionList()
    setQuestionList(newList)
  }

  return (
    <div className="space-mission">
      <div className="game-header">
        <h2 className="game-title">🚀 Space Mission – Save the Planet</h2>
        <div className="score-info">
          <div className="score-display">Score: {score}</div>
          <div className="question-counter">Question: {questionNumber + 1}/20</div>
        </div>
      </div>

      {gameComplete ? (
        <div className="game-complete">
          <h2>🎉 Mission Complete!</h2>
          <p>Planet Saved! Final Score: {score} / 20</p>
          <button onClick={resetGame} className="reset-btn">
            🔄 Play Again
          </button>
        </div>
      ) : (
        <div className="game-content-wrapper">
          <div className="game-main">
            <div className="question-container">
              <div className="question">
                Solve {question.num1} {question.operator} {question.num2} and shoot the correct asteroid!
              </div>
            </div>

            <div className="space-scene">
              {/* Stars background */}
              <div className="stars"></div>
              
              {/* Planet at bottom */}
              <div className="planet"></div>
              
              {/* Astronaut ship */}
              <div className="spaceship">🚀</div>

              {/* Asteroids */}
              {asteroids.map((asteroid) => (
                <div
                  key={asteroid.id}
                  className={`asteroid ${asteroid.destroyed ? 'destroyed' : ''} ${asteroid.showCorrect ? 'show-correct' : ''} ${asteroid.wrongClick ? 'wrong-click' : ''}`}
                  style={{
                    left: `${asteroid.position}%`,
                    top: `${asteroid.topPosition}px`,
                    animationDelay: `${asteroid.id * 0.2}s`
                  }}
                  onClick={() => handleAsteroidClick(asteroid)}
                >
                  <div className="asteroid-body">
                    {asteroid.value}
                  </div>
                </div>
              ))}

              {/* Laser blast effect */}
              {laserBlast && (
                <div
                  className="laser-blast"
                  style={{
                    left: `${laserBlast.position}%`,
                    bottom: '150px',
                    height: `${600 - laserBlast.topPosition - 150}px`
                  }}
                >
                  <div className="laser-beam" style={{ height: `${600 - laserBlast.topPosition - 150}px` }}></div>
                </div>
              )}

              {/* Explosion effects */}
              {explosions.map((explosion) => (
                <div
                  key={explosion.id}
                  className="asteroid-explosion"
                  style={{
                    left: `${explosion.position}%`,
                    top: `${explosion.topPosition}px`
                  }}
                >
                  <div className="explosion-main">💥</div>
                  <div className="explosion-particles">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`particle particle-${i}`}
                        style={{
                          '--delay': `${i * 0.05}s`
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="explosion-flash"></div>
                  <div className="explosion-smoke">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`smoke smoke-${i}`}
                        style={{
                          '--delay': `${i * 0.1}s`
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Win/Lose Message */}
              {showMessage && (
                <div className={`result-message ${showMessage === 'won' ? 'won-message' : 'lose-message'}`}>
                  {showMessage === 'won' ? (
                    <>
                      <div className="message-icon">🎉</div>
                      <div className="message-text">You Won!</div>
                    </>
                  ) : (
                    <>
                      <div className="message-icon">💔</div>
                      <div className="message-text">You Lose!</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {showNextQuestionButton && (
              <div className="next-question-container">
                <button onClick={handleNextQuestion} className="next-question-btn">
                  ➡️ Next Mission
                </button>
              </div>
            )}

            <div className="game-controls">
              <button onClick={resetGame} className="reset-btn">
                🔄 Reset Mission
              </button>
            </div>

            <div className="game-instructions">
              <p>Click the asteroid with the correct answer to shoot it!</p>
              <p>Wrong answer makes asteroids come closer to the planet!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpaceMission

