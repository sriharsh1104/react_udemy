import { useState, useEffect } from 'react'
import './SpellingBee.css'
import { saveGameScore } from '../utils/scoreUtils'

const SpellingBee = ({ userName = null }) => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false)
  const [questionList, setQuestionList] = useState([])
  const [timer, setTimer] = useState(45)
  const [timerActive, setTimerActive] = useState(false)

  // Simple words for class 5 and below
  const spellingWords = [
    'CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BOOK', 'BALL',
    'FISH', 'BIRD', 'LION', 'BEAR', 'DUCK', 'FROG', 'PIG', 'COW',
    'HORSE', 'SHEEP', 'GOAT', 'DEER', 'RABBIT', 'MOUSE', 'SNAKE',
    'APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'MANGO', 'WATER', 'MILK',
    'BREAD', 'RICE', 'CAKE', 'CANDY', 'HONEY', 'SUGAR', 'SALT',
    'HOUSE', 'SCHOOL', 'PARK', 'GARDEN', 'FLOWER', 'GRASS', 'LEAF',
    'CLOUD', 'RAIN', 'SNOW', 'WIND', 'FIRE', 'EARTH', 'WATER'
  ]

  const isValidName = (name) => {
    return name && name.trim() !== '' && !name.startsWith('Student ')
  }

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

  const generateQuestionList = () => {
    const shuffled = [...spellingWords].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 15) // 15 questions
  }

  const generateQuestion = () => {
    if (questionList.length === 0) {
      const newList = generateQuestionList()
      setQuestionList(newList)
      return
    }
    
    const word = questionList[questionNumber]
    if (!word) return

    // Create hint (show first and last letter with blanks)
    const hint = word[0] + '_'.repeat(word.length - 2) + word[word.length - 1]

    setCurrentQuestion({
      word: word,
      hint: hint,
      length: word.length
    })
    setUserInput('')
    setIsAnswered(false)
    setFirstAttempt(true)
    setShowNextQuestionButton(false)
    setTimer(45)
    setTimerActive(true)
  }

  useEffect(() => {
    if (gameActive && questionList.length > 0) {
      generateQuestion()
    }
  }, [questionNumber, gameActive, questionList.length])

  useEffect(() => {
    if (timerActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setTimerActive(false)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timerActive, timer])

  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true)
      setFirstAttempt(false)
      setShowNextQuestionButton(true)
      setTimerActive(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isAnswered || !userInput.trim()) return

    const userAnswer = userInput.trim().toUpperCase()
    setIsAnswered(true)
    setTimerActive(false)

    if (userAnswer === currentQuestion.word) {
      if (firstAttempt) {
        setScore(prev => prev + 10)
      } else {
        setScore(prev => prev + 5)
      }
    } else {
      setFirstAttempt(false)
    }

    setShowNextQuestionButton(true)
  }

  const handleNextQuestion = () => {
    if (questionNumber < questionList.length - 1) {
      setQuestionNumber(prev => prev + 1)
    } else {
      setGameComplete(true)
      if (userName) {
        saveGameScore(userName, score, 'spelling-bee')
      }
    }
  }

  if (!gameActive) {
    return (
      <div className="spelling-bee">
        <div className="game-warning">
          <div className="warning-content">
            <h3>⚠️ Name Required</h3>
            <p>Please enter your name to start playing</p>
          </div>
        </div>
      </div>
    )
  }

  if (gameComplete) {
    return (
      <div className="spelling-bee">
        <div className="game-complete">
          <h2>🎉 Game Complete!</h2>
          <p>Final Score: {score}</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="spelling-bee">
        <div className="game-warning">
          <div className="warning-content">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    )
  }

  const isCorrect = userInput.trim().toUpperCase() === currentQuestion.word

  return (
    <div className="spelling-bee">
      <div className="game-header">
        <h3 className="game-title">🐝 Spelling Bee</h3>
        <div className="score-info">
          <div className="score-display">Score: {score}</div>
          <div className="question-counter">Q: {questionNumber + 1}/{questionList.length}</div>
          {timerActive && (
            <div className={`timer-display ${timer <= 15 ? 'timer-warning' : ''}`}>
              ⏱️ {timer}s
            </div>
          )}
        </div>
      </div>

      <div className="question-container">
        <div className="spelling-hint">
          <div className="hint-display">{currentQuestion.hint}</div>
          <p className="hint-text">Spell the word! ({currentQuestion.length} letters)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="spelling-form">
        <input
          type="text"
          className={`spelling-input ${isAnswered ? (isCorrect ? 'correct' : 'wrong') : ''}`}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          placeholder="Type your answer..."
          disabled={isAnswered}
          autoFocus
          maxLength={currentQuestion.length}
        />
        {!isAnswered && (
          <button type="submit" className="submit-spelling-btn">
            Check Spelling ✓
          </button>
        )}
      </form>

      {isAnswered && (
        <div className="answer-feedback">
          {isCorrect ? (
            <div className="feedback-correct">
              ✅ Correct! {firstAttempt ? '+10 points' : '+5 points'}
            </div>
          ) : (
            <div className="feedback-wrong">
              ❌ Wrong! Correct spelling: <strong>{currentQuestion.word}</strong>
            </div>
          )}
        </div>
      )}

      {showNextQuestionButton && (
        <div className="next-question-container">
          <button className="next-question-btn" onClick={handleNextQuestion}>
            {questionNumber < questionList.length - 1 ? 'Next Question →' : 'Finish Game 🎉'}
          </button>
        </div>
      )}
    </div>
  )
}

export default SpellingBee

