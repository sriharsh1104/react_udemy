import { useState, useEffect } from 'react'
import './BalloonMathPop.css'

const BalloonMathPop = () => {
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState({ num1: 0, num2: 0, operator: '×', answer: 0 })
  const [options, setOptions] = useState([])
  const [shaking, setShaking] = useState([])
  const [gameActive, setGameActive] = useState(true)

  const generateQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const answer = num1 * num2

    // Generate 3 wrong answers
    const wrongAnswers = []
    while (wrongAnswers.length < 3) {
      const wrong = Math.floor(Math.random() * 100) + 1
      if (wrong !== answer && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong)
      }
    }

    // Combine correct and wrong answers, then shuffle
    const allOptions = [answer, ...wrongAnswers]
    const shuffled = allOptions.sort(() => Math.random() - 0.5)

    // Assign random positions to balloons
    const balloonOptions = shuffled.map((value, index) => ({
      value,
      isCorrect: value === answer,
      id: index,
      position: Math.random() * 60 + 10 // Random horizontal position (10-70%)
    }))

    setQuestion({ num1, num2, operator: '×', answer })
    setOptions(balloonOptions)
    setShaking([])
  }

  useEffect(() => {
    generateQuestion()
  }, [])

  const handleBalloonClick = (balloon) => {
    if (!gameActive) return

    if (balloon.isCorrect) {
      setScore(prev => prev + 1)
      // Remove the popped balloon
      setOptions(prev => prev.filter(opt => opt.id !== balloon.id))
      
      // Generate new question after a short delay
      setTimeout(() => {
        generateQuestion()
      }, 500)
    } else {
      // Wrong answer - shake the balloon
      setShaking(prev => [...prev, balloon.id])
      setTimeout(() => {
        setShaking(prev => prev.filter(id => id !== balloon.id))
      }, 500)
    }
  }

  const resetGame = () => {
    setScore(0)
    setGameActive(true)
    generateQuestion()
  }

  return (
    <div className="balloon-math-pop">
      <div className="game-header">
        <h2 className="game-title">🎈 Balloon Math Pop</h2>
        <div className="score-display">Score: {score}</div>
      </div>

      <div className="question-container">
        <div className="question">
          {question.num1} {question.operator} {question.num2} = ?
        </div>
      </div>

      <div className="balloon-container">
        {options.map((balloon) => (
          <div
            key={balloon.id}
            className={`balloon ${shaking.includes(balloon.id) ? 'shake' : ''} ${balloon.isCorrect ? 'correct' : 'wrong'}`}
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

      <div className="game-controls">
        <button onClick={resetGame} className="reset-btn">
          🔄 Reset Game
        </button>
      </div>

      <div className="game-instructions">
        <p>Click the balloon with the correct answer!</p>
        <p>Wrong answers will shake.</p>
      </div>
    </div>
  )
}

export default BalloonMathPop

