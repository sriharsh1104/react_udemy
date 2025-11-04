import { useState, useEffect } from 'react'
import './BalloonMathPop.css'

const BalloonMathPop = () => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [question, setQuestion] = useState({ num1: 0, num2: 0, operator: '×', answer: 0 })
  const [options, setOptions] = useState([])
  const [shaking, setShaking] = useState([])
  const [selectedBalloon, setSelectedBalloon] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(true)
  const [gameComplete, setGameComplete] = useState(false)
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false)

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const answer = num1 * num2

    // Generate 3 wrong answers - ensure they are different from correct answer
    const wrongAnswers = []
    let attempts = 0
    while (wrongAnswers.length < 3 && attempts < 100) {
      const wrong = Math.floor(Math.random() * 100) + 1
      if (wrong !== answer && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong)
      }
      attempts++
    }

    // Ensure we have exactly 3 wrong answers
    while (wrongAnswers.length < 3) {
      // Fallback: generate sequential wrong answers if needed
      let wrong = answer + wrongAnswers.length + 1
      if (wrong <= 0) wrong = 1
      if (!wrongAnswers.includes(wrong) && wrong !== answer) {
        wrongAnswers.push(wrong)
      } else {
        wrongAnswers.push(answer + wrongAnswers.length + 10)
      }
    }

    // ALWAYS include correct answer first, then add wrong answers
    const allOptions = [answer, ...wrongAnswers]
    
    // Shuffle to randomize positions
    const shuffled = allOptions.sort(() => Math.random() - 0.5)

    // Assign positions to balloons to prevent overlap
    // Balloon width is ~80px, container max-width is 800px
    // We need to space balloons with at least 20px gap between them
    const numBalloons = shuffled.length
    const containerWidth = 800 // max-width from CSS
    const balloonWidth = 80
    const minGap = 20 // minimum gap between balloons (in pixels)
    
    // Calculate total width needed for all balloons
    // Total = (numBalloons * balloonWidth) + ((numBalloons - 1) * minGap)
    const totalWidthNeeded = (numBalloons * balloonWidth) + ((numBalloons - 1) * minGap)
    
    // Calculate starting position to center the balloons
    const startPosition = Math.max(0, (containerWidth - totalWidthNeeded) / 2)
    
    // Generate evenly spaced positions (left edge of each balloon)
    let positions = []
    for (let i = 0; i < numBalloons; i++) {
      positions.push(startPosition + i * (balloonWidth + minGap))
    }
    
    // Shuffle positions to randomize balloon placement
    const shuffledPositions = positions.sort(() => Math.random() - 0.5)
    
    const balloonOptions = shuffled.map((value, index) => ({
      value,
      isCorrect: value === answer,
      id: index,
      position: (shuffledPositions[index] / containerWidth) * 100 // Convert to percentage
    }))

    // Verify that correct answer exists in options
    const hasCorrectAnswer = balloonOptions.some(opt => opt.isCorrect)
    if (!hasCorrectAnswer) {
      // Fallback: force include correct answer
      balloonOptions[0] = {
        value: answer,
        isCorrect: true,
        id: 0,
        position: balloonOptions[0].position
      }
    }

    setQuestion({ num1, num2, operator: '×', answer })
    setOptions(balloonOptions)
    setShaking([])
    setSelectedBalloon(null)
    setIsAnswered(false)
    setFirstAttempt(true)
    setShowNextQuestionButton(false)
  }

  useEffect(() => {
    generateQuestion()
  }, [])

  const handleBalloonClick = (balloon) => {
    if (!gameActive || isAnswered) return

    setIsAnswered(true)
    setSelectedBalloon(balloon.id)

    if (balloon.isCorrect) {
      // Correct answer - only score on first attempt
      if (firstAttempt) {
        setScore(prev => prev + 1)
      }
      
      // Highlight correct answer
      setOptions(prev => prev.map(opt => 
        opt.id === balloon.id ? { ...opt, isCorrect: true, showCorrect: true } : opt
      ))
      
      // Show next question button after highlighting correct answer
      setTimeout(() => {
        setShowNextQuestionButton(true)
      }, 800)
    } else {
      // Wrong answer - shake and mark as wrong
      setShaking(prev => [...prev, balloon.id])
      setFirstAttempt(false)
      
      setOptions(prev => prev.map(opt => 
        opt.id === balloon.id ? { ...opt, isWrong: true } : opt
      ))
      
      // Show correct answer after wrong attempt
      setTimeout(() => {
        setOptions(prev => prev.map(opt => 
          opt.isCorrect ? { ...opt, showCorrect: true } : opt
        ))
        // Show next question button after showing correct answer
        setShowNextQuestionButton(true)
      }, 800)
    }
  }

  const handleNextQuestion = () => {
    setQuestionNumber(prev => {
      const next = prev + 1
      if (next >= 20) {
        setGameComplete(true)
        setGameActive(false)
        return prev
      }
      // Generate next question
      setTimeout(() => {
        generateQuestion()
      }, 100)
      return next
    })
  }

  const resetGame = () => {
    setScore(0)
    setQuestionNumber(0)
    setGameActive(true)
    setGameComplete(false)
    setShowNextQuestionButton(false)
    generateQuestion()
  }

  return (
    <div className="balloon-math-pop">
      <div className="game-header">
        <h2 className="game-title">🎈 Balloon Math Pop</h2>
        <div className="score-info">
          <div className="score-display">Score: {score}</div>
          <div className="question-counter">Question: {questionNumber + 1}/20</div>
        </div>
      </div>

      {gameComplete ? (
        <div className="game-complete">
          <h2>🎉 Game Complete!</h2>
          <p>Final Score: {score} / 20</p>
          <button onClick={resetGame} className="reset-btn">
            🔄 Play Again
          </button>
        </div>
      ) : (
        <div className="game-content-wrapper">
          <div className="game-main">
            <div className="question-container">
              <div className="question">
                {question.num1} {question.operator} {question.num2} = ?
              </div>
            </div>

            <div className="balloon-container">
              {options.map((balloon) => (
                <div
                  key={balloon.id}
                  className={`balloon ${shaking.includes(balloon.id) ? 'shake' : ''} ${balloon.showCorrect ? 'showCorrect' : ''} ${balloon.isWrong ? 'wrong' : ''} ${balloon.isCorrect && selectedBalloon === balloon.id ? 'correct-selected' : ''}`}
                  style={{
                    left: `${balloon.position}%`,
                    animationDelay: `${balloon.id * 0.2}s`
                  }}
                  onClick={() => handleBalloonClick(balloon)}
                >
                  <div className="balloon-body">
                    {balloon.value}
                  </div>
                  <div className="balloon-string"></div>
                </div>
              ))}
            </div>

            {showNextQuestionButton && (
              <div className="next-question-container">
                <button onClick={handleNextQuestion} className="next-question-btn">
                  ➡️ Next Question
                </button>
              </div>
            )}

            <div className="game-controls">
              <button onClick={resetGame} className="reset-btn">
                🔄 Reset Game
              </button>
            </div>

            <div className="game-instructions">
              <p>Click the balloon with the correct answer!</p>
              <p>Score only increases on first attempt correct answer.</p>
            </div>
          </div>

          {isAnswered && (
            <div className="multiplication-table-container">
              <h3 className="table-title">{question.num1} का पहाड़ा</h3>
              <ul className="multiplication-table">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <li key={num} className={num === question.num2 ? 'highlight' : ''}>
                    {question.num1} × {num} = {question.num1 * num}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BalloonMathPop

