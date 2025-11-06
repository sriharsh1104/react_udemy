import { useState, useEffect, useCallback } from 'react'
import './BalloonMathPop.css'
import { saveGameScore } from '../utils/scoreUtils'

const BalloonMathPop = ({ userName = null }) => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [question, setQuestion] = useState({ num1: 0, num2: 0, operator: '×', answer: 0 })
  const [options, setOptions] = useState([])
  const [shaking, setShaking] = useState([])
  const [selectedBalloon, setSelectedBalloon] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(false) // Start as false, need name to start
  const [gameComplete, setGameComplete] = useState(false)
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false)
  const [questionList, setQuestionList] = useState([])
  const [timer, setTimer] = useState(20)
  const [timerActive, setTimerActive] = useState(false)
  const [answerDisplayTimer, setAnswerDisplayTimer] = useState(15)
  const [answerDisplayActive, setAnswerDisplayActive] = useState(false)

  // Check if userName is valid
  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

  // Initialize game when valid name is provided
  useEffect(() => {
    if (isValidName(userName)) {
      setGameActive(true)
      // Generate question list if not already generated
      if (questionList.length === 0) {
        const newList = generateQuestionList()
        setQuestionList(newList)
      }
    } else {
      setGameActive(false)
    }
  }, [userName])

  // Generate 10 multiplication and 10 division questions, then shuffle
  const generateQuestionList = () => {
    const questions = []
    
    // Generate 10 multiplication questions
    for (let i = 0; i < 10; i++) {
      const num1 = Math.floor(Math.random() * 10) + 1
      const num2 = Math.floor(Math.random() * 10) + 1
      questions.push({
        num1,
        num2,
        operator: '×',
        answer: num1 * num2
      })
    }
    
    // Generate 10 division questions
    for (let i = 0; i < 10; i++) {
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
    // Get question from the pre-generated list
    if (questionList.length === 0) {
      // If list is empty, generate it
      const newList = generateQuestionList()
      setQuestionList(newList)
      return
    }
    
    const currentQuestion = questionList[questionNumber]
    if (!currentQuestion) return
    
    const { num1, num2, operator, answer } = currentQuestion
    const isDivision = operator === '÷'

    // Generate 3 wrong answers - ensure they are different from correct answer
    const wrongAnswers = []
    let attempts = 0
    while (wrongAnswers.length < 3 && attempts < 100) {
      let wrong
      if (isDivision) {
        // For division, generate wrong answers around the quotient
        wrong = Math.floor(Math.random() * 10) + 1
      } else {
        wrong = Math.floor(Math.random() * 100) + 1
      }
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

    setQuestion({ num1, num2, operator, answer })
    setOptions(balloonOptions)
    setShaking([])
    setSelectedBalloon(null)
    setIsAnswered(false)
    setFirstAttempt(true)
    setShowNextQuestionButton(false)
    setTimer(20)
    setTimerActive(true)
  }

  // Define handleNextQuestion before useEffect that uses it
  const handleNextQuestion = useCallback(() => {
    setTimerActive(false) // Stop timer
    setAnswerDisplayActive(false) // Stop answer display timer
    setShowNextQuestionButton(false)
    setQuestionNumber(prev => {
      const next = prev + 1
      if (next >= 20) {
        setGameComplete(true)
        setGameActive(false)
        return prev
      }
      return next
    })
    // useEffect will automatically trigger generateQuestion when questionNumber changes
  }, [])

  // Generate question when questionNumber changes or when questionList is ready
  useEffect(() => {
    if (gameActive && questionList.length === 20 && questionNumber < 20) {
      generateQuestion()
    }
  }, [questionNumber, questionList.length, gameActive])

  // Timer countdown effect (20 seconds for answering)
  useEffect(() => {
    if (!timerActive || isAnswered || !gameActive || gameComplete) return

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setTimerActive(false)
          // Time's up - show answer and start answer display timer
          setIsAnswered(true)
          setFirstAttempt(false)
          // Show correct answer
          setTimeout(() => {
            setOptions(prevOpts => prevOpts.map(opt => 
              opt.isCorrect ? { ...opt, showCorrect: true } : opt
            ))
            setAnswerDisplayTimer(15)
            setAnswerDisplayActive(true)
          }, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerActive, isAnswered, gameActive, gameComplete])

  // Answer display timer (15 seconds) - auto move to next question
  useEffect(() => {
    if (!answerDisplayActive || !isAnswered || !gameActive || gameComplete) return

    const interval = setInterval(() => {
      setAnswerDisplayTimer(prev => {
        if (prev <= 1) {
          setAnswerDisplayActive(false)
          // Automatically move to next question
          handleNextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [answerDisplayActive, isAnswered, gameActive, gameComplete, handleNextQuestion])

  // Save score when game completes
  useEffect(() => {
    if (gameComplete && userName) {
      saveGameScore(userName, score, 'Balloon Math Pop', 'maths-games')
    }
  }, [gameComplete, score, userName])

  const handleBalloonClick = (balloon) => {
    if (!gameActive || isAnswered) return

    setIsAnswered(true)
    setTimerActive(false) // Stop timer when answered
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
      
      // Start answer display timer
      setTimeout(() => {
        setAnswerDisplayTimer(15)
        setAnswerDisplayActive(true)
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
        // Start answer display timer
        setAnswerDisplayTimer(15)
        setAnswerDisplayActive(true)
      }, 800)
    }
  }

  const resetGame = () => {
    setScore(0)
    setQuestionNumber(0)
    setGameActive(true)
    setGameComplete(false)
    setShowNextQuestionButton(false)
    setTimer(20)
    setTimerActive(false)
    setAnswerDisplayTimer(15)
    setAnswerDisplayActive(false)
    // Generate new question list
    const newList = generateQuestionList()
    setQuestionList(newList)
  }

  return (
    <div className="balloon-math-pop">
      <div className="game-header">
        <h2 className="game-title">🎈 Balloon Math Pop</h2>
        <div className="score-info">
          <div className="score-display">Score: {score}</div>
          <div className="question-counter">Question: {questionNumber + 1}/20</div>
          {gameActive && !gameComplete && (
            <>
              {!isAnswered && (
                <div className={`timer-display ${timer <= 5 ? 'timer-warning' : ''}`}>
                  ⏱️ {timer}s
                </div>
              )}
              {isAnswered && answerDisplayActive && (
                <div className="answer-display-timer">
                  Next: {answerDisplayTimer}s
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!isValidName(userName) ? (
        <div className="game-warning">
          <div className="warning-content">
            <h3>⚠️ Name Required</h3>
            <p>कृपया अपना नाम दर्ज करें to start the game</p>
            <p className="warning-subtext">Name is required to save your score on the scoreboard</p>
          </div>
        </div>
      ) : gameComplete ? (
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

            {isAnswered && answerDisplayActive && (
              <div className="next-question-container">
                <div className="auto-next-message">
                  Next question in {answerDisplayTimer}s...
                </div>
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
              {question.operator === '÷' ? (
                <>
                  <h3 className="table-title">Division Method</h3>
                  <div className="division-method">
                    <div className="division-steps">
                      <div className="division-step">
                        <div className="division-question">
                          <span className="dividend">{question.num1}</span>
                          <span className="operator">÷</span>
                          <span className="divisor">{question.num2}</span>
                          <span className="equals">=</span>
                          <span className="quotient highlight">{question.answer}</span>
                        </div>
                      </div>
                      <div className="division-explanation">
                        <p className="explanation-text">
                          <strong>Step 1:</strong> {question.num2} × {question.answer} = {question.num1}
                        </p>
                        <p className="explanation-text">
                          <strong>Step 2:</strong> We check how many times {question.num2} fits into {question.num1}
                        </p>
                        <p className="explanation-text">
                          <strong>Answer:</strong> {question.num2} fits into {question.num1} exactly <strong>{question.answer}</strong> times
                        </p>
                      </div>
                      <div className="division-table">
                        <h4 className="division-table-title">{question.num2} का Division Table</h4>
                        <ul className="multiplication-table">
                          {Array.from({ length: 10 }, (_, i) => {
                            const quotient = i + 1
                            const dividend = question.num2 * quotient
                            return (
                              <li key={quotient} className={quotient === question.answer ? 'highlight' : ''}>
                                {dividend} ÷ {question.num2} = {quotient}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="table-title">{question.num1} का पहाड़ा</h3>
                  <ul className="multiplication-table">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <li key={num} className={num === question.num2 ? 'highlight' : ''}>
                        {question.num1} × {num} = {question.num1 * num}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BalloonMathPop

