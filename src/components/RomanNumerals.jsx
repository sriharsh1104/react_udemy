import { useState, useEffect, useCallback } from 'react'
import './RomanNumerals.css'
import { saveGameScore } from '../utils/scoreUtils'

// Helper functions for Roman numeral conversion
const toRoman = (num) => {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1]
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
  let result = ''
  
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i]
      num -= values[i]
    }
  }
  return result
}

const fromRoman = (roman) => {
  const romanMap = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50,
    'C': 100, 'D': 500, 'M': 1000
  }
  
  let result = 0
  for (let i = 0; i < roman.length; i++) {
    const current = romanMap[roman[i]]
    const next = romanMap[roman[i + 1]]
    
    if (next && current < next) {
      result += next - current
      i++
    } else {
      result += current
    }
  }
  return result
}

const RomanNumerals = ({ userName = null }) => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [question, setQuestion] = useState({ type: 'toRoman', value: 0, answer: '' })
  const [options, setOptions] = useState([])
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [questionList, setQuestionList] = useState([])
  const [timer, setTimer] = useState(20)
  const [timerActive, setTimerActive] = useState(false)
  const [answerDisplayTimer, setAnswerDisplayTimer] = useState(15)
  const [answerDisplayActive, setAnswerDisplayActive] = useState(false)
  const [shakeWrong, setShakeWrong] = useState(false)

  // Check if userName is valid
  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

  // Initialize game when valid name is provided
  useEffect(() => {
    if (isValidName(userName)) {
      setGameActive(true)
      if (questionList.length === 0) {
        const newList = generateQuestionList()
        setQuestionList(newList)
      }
    } else {
      setGameActive(false)
    }
  }, [userName])

  // Generate 20 questions (mix of toRoman and fromRoman)
  const generateQuestionList = () => {
    const questions = []
    
    // Generate 10 "number to Roman" questions
    for (let i = 0; i < 10; i++) {
      const num = Math.floor(Math.random() * 100) + 1 // 1 to 100
      questions.push({
        type: 'toRoman',
        value: num,
        answer: toRoman(num)
      })
    }
    
    // Generate 10 "Roman to number" questions
    for (let i = 0; i < 10; i++) {
      const num = Math.floor(Math.random() * 100) + 1
      const roman = toRoman(num)
      questions.push({
        type: 'fromRoman',
        value: roman,
        answer: num
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
    
    const { type, value, answer } = currentQuestion

    // Generate 3 wrong answers
    const wrongAnswers = []
    let attempts = 0
    
    if (type === 'toRoman') {
      // Wrong Roman numerals
      while (wrongAnswers.length < 3 && attempts < 100) {
        const wrongNum = Math.floor(Math.random() * 100) + 1
        const wrongRoman = toRoman(wrongNum)
        if (wrongRoman !== answer && !wrongAnswers.includes(wrongRoman)) {
          wrongAnswers.push(wrongRoman)
        }
        attempts++
      }
    } else {
      // Wrong numbers
      while (wrongAnswers.length < 3 && attempts < 100) {
        const wrongNum = Math.floor(Math.random() * 100) + 1
        if (wrongNum !== answer && !wrongAnswers.includes(wrongNum)) {
          wrongAnswers.push(wrongNum)
        }
        attempts++
      }
    }

    // Ensure we have exactly 3 wrong answers
    while (wrongAnswers.length < 3) {
      if (type === 'toRoman') {
        wrongAnswers.push(toRoman(Math.floor(Math.random() * 100) + 1))
      } else {
        wrongAnswers.push(Math.floor(Math.random() * 100) + 1)
      }
    }

    // Combine correct and wrong answers
    const allOptions = [answer, ...wrongAnswers]
    const shuffled = allOptions.sort(() => Math.random() - 0.5)

    const optionElements = shuffled.map((opt, index) => ({
      value: opt,
      isCorrect: opt === answer,
      id: index
    }))

    setQuestion({ type, value, answer })
    setOptions(optionElements)
    setSelectedOption(null)
    setIsAnswered(false)
    setFirstAttempt(true)
    setTimer(20)
    setTimerActive(true)
    setShakeWrong(false)
  }

  // Define handleNextQuestion before useEffect that uses it
  const handleNextQuestion = useCallback(() => {
    setTimerActive(false)
    setAnswerDisplayActive(false)
    setQuestionNumber(prev => {
      const next = prev + 1
      if (next >= 20) {
        setGameComplete(true)
        setGameActive(false)
        return prev
      }
      return next
    })
  }, [])

  // Generate question when questionNumber changes
  useEffect(() => {
    if (gameActive && questionList.length === 20 && questionNumber < 20) {
      generateQuestion()
    }
  }, [questionNumber, questionList.length, gameActive])

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || isAnswered || !gameActive || gameComplete) return

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setTimerActive(false)
          setIsAnswered(true)
          setFirstAttempt(false)
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

  // Answer display timer
  useEffect(() => {
    if (!answerDisplayActive || !isAnswered || !gameActive || gameComplete) return

    const interval = setInterval(() => {
      setAnswerDisplayTimer(prev => {
        if (prev <= 1) {
          setAnswerDisplayActive(false)
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
      saveGameScore(userName, score, 'Roman Numerals', 'maths-games')
    }
  }, [gameComplete, score, userName])

  const handleOptionClick = (option) => {
    if (!gameActive || isAnswered) return

    setIsAnswered(true)
    setTimerActive(false)
    setSelectedOption(option.id)

    if (option.isCorrect) {
      if (firstAttempt) {
        setScore(prev => prev + 1)
      }
      
      setOptions(prev => prev.map(opt => 
        opt.id === option.id ? { ...opt, isCorrect: true, showCorrect: true } : opt
      ))
      
      setTimeout(() => {
        setAnswerDisplayTimer(15)
        setAnswerDisplayActive(true)
      }, 800)
    } else {
      setShakeWrong(true)
      setFirstAttempt(false)
      
      setOptions(prev => prev.map(opt => 
        opt.id === option.id ? { ...opt, isWrong: true } : opt
      ))
      
      setTimeout(() => {
        setOptions(prev => prev.map(opt => 
          opt.isCorrect ? { ...opt, showCorrect: true } : opt
        ))
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
    setTimer(20)
    setTimerActive(false)
    setAnswerDisplayTimer(15)
    setAnswerDisplayActive(false)
    const newList = generateQuestionList()
    setQuestionList(newList)
  }

  return (
    <div className="roman-numerals">
      <div className="game-header">
        <h2 className="game-title">🏛️ Roman Numerals</h2>
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
                {question.type === 'toRoman' ? (
                  <>
                    What is <span className="highlight-number">{question.value}</span> in Roman numerals?
                  </>
                ) : (
                  <>
                    What is <span className="highlight-roman">{question.value}</span> in numbers?
                  </>
                )}
              </div>
            </div>

            <div className={`options-container ${shakeWrong ? 'shake' : ''}`}>
              {options.map((option) => (
                <button
                  key={option.id}
                  className={`option-button ${
                    option.showCorrect ? 'show-correct' : ''
                  } ${
                    option.isWrong ? 'wrong' : ''
                  } ${
                    option.isCorrect && selectedOption === option.id ? 'correct-selected' : ''
                  }`}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                >
                  {option.value}
                </button>
              ))}
            </div>

            {isAnswered && answerDisplayActive && (
              <div className="next-question-container">
                <div className="auto-next-message">
                  Next question in {answerDisplayTimer}s...
                </div>
                <button 
                  onClick={handleNextQuestion} 
                  className="next-question-btn"
                >
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
              <p>Click the correct answer!</p>
              <p>Score only increases on first attempt correct answer.</p>
            </div>
          </div>

          {isAnswered && (
            <div className="roman-guide-container">
              <h3 className="guide-title">Roman Numerals Guide</h3>
              <div className="roman-guide">
                <div className="guide-section">
                  <h4>Basic Symbols:</h4>
                  <ul className="guide-list">
                    <li>I = 1</li>
                    <li>V = 5</li>
                    <li>X = 10</li>
                    <li>L = 50</li>
                    <li>C = 100</li>
                    <li>D = 500</li>
                    <li>M = 1000</li>
                  </ul>
                </div>
                <div className="guide-section">
                  <h4>Subtraction Rule:</h4>
                  <ul className="guide-list">
                    <li>IV = 4 (5 - 1)</li>
                    <li>IX = 9 (10 - 1)</li>
                    <li>XL = 40 (50 - 10)</li>
                    <li>XC = 90 (100 - 10)</li>
                    <li>CD = 400 (500 - 100)</li>
                    <li>CM = 900 (1000 - 100)</li>
                  </ul>
                </div>
                {question.type === 'toRoman' && (
                  <div className="guide-section">
                    <h4>Answer:</h4>
                    <p className="answer-explanation">
                      {question.value} = <strong>{question.answer}</strong>
                    </p>
                  </div>
                )}
                {question.type === 'fromRoman' && (
                  <div className="guide-section">
                    <h4>Answer:</h4>
                    <p className="answer-explanation">
                      {question.value} = <strong>{question.answer}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default RomanNumerals

