import { useState, useEffect } from 'react'
import './WordBuilder.css'
import { saveGameScore } from '../utils/scoreUtils'

const WordBuilder = ({ userName = null }) => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedLetters, setSelectedLetters] = useState([])
  const [availableLetters, setAvailableLetters] = useState([])
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false)
  const [questionList, setQuestionList] = useState([])
  const [timer, setTimer] = useState(60)
  const [timerActive, setTimerActive] = useState(false)

  // Simple words for class 5 and below
  const builderWords = [
    'CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BOOK', 'BALL',
    'FISH', 'BIRD', 'LION', 'BEAR', 'DUCK', 'FROG', 'PIG', 'COW',
    'HORSE', 'APPLE', 'BANANA', 'ORANGE', 'GRAPE', 'WATER', 'MILK',
    'BREAD', 'RICE', 'CAKE', 'HOUSE', 'SCHOOL', 'PARK', 'GARDEN',
    'FLOWER', 'CLOUD', 'RAIN', 'SNOW', 'WIND', 'FIRE', 'EARTH'
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
    const shuffled = [...builderWords].sort(() => Math.random() - 0.5)
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

    // Shuffle letters and add some extra wrong letters
    const wordLetters = word.split('')
    const extraLetters = ['A', 'E', 'I', 'O', 'U', 'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z']
    const wrongLetters = extraLetters.filter(l => !wordLetters.includes(l))
    const randomWrong = wrongLetters.sort(() => Math.random() - 0.5).slice(0, Math.max(2, 6 - wordLetters.length))
    
    const allLetters = [...wordLetters, ...randomWrong].sort(() => Math.random() - 0.5)

    setCurrentQuestion({
      word: word,
      hint: word[0] + '_'.repeat(word.length - 2) + word[word.length - 1]
    })
    setAvailableLetters(allLetters)
    setSelectedLetters([])
    setIsAnswered(false)
    setFirstAttempt(true)
    setShowNextQuestionButton(false)
    setTimer(60)
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

  const handleLetterClick = (letter, index) => {
    if (isAnswered) return
    setSelectedLetters(prev => [...prev, { letter, index }])
    setAvailableLetters(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveLetter = (index) => {
    if (isAnswered) return
    const removed = selectedLetters[index]
    setSelectedLetters(prev => prev.filter((_, i) => i !== index))
    setAvailableLetters(prev => [...prev, removed.letter].sort(() => Math.random() - 0.5))
  }

  const handleCheck = () => {
    if (isAnswered || selectedLetters.length === 0) return

    const builtWord = selectedLetters.map(s => s.letter).join('')
    setIsAnswered(true)
    setTimerActive(false)

    if (builtWord === currentQuestion.word) {
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
        saveGameScore(userName, score, 'word-builder')
      }
    }
  }

  if (!gameActive) {
    return (
      <div className="word-builder">
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
      <div className="word-builder">
        <div className="game-complete">
          <h2>🎉 Game Complete!</h2>
          <p>Final Score: {score}</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="word-builder">
        <div className="game-warning">
          <div className="warning-content">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    )
  }

  const builtWord = selectedLetters.map(s => s.letter).join('')
  const isCorrect = builtWord === currentQuestion.word

  return (
    <div className="word-builder">
      <div className="game-header">
        <h3 className="game-title">🔤 Word Builder</h3>
        <div className="score-info">
          <div className="score-display">Score: {score}</div>
          <div className="question-counter">Q: {questionNumber + 1}/{questionList.length}</div>
          {timerActive && (
            <div className={`timer-display ${timer <= 20 ? 'timer-warning' : ''}`}>
              ⏱️ {timer}s
            </div>
          )}
        </div>
      </div>

      <div className="question-container">
        <div className="builder-hint">
          <div className="hint-display">{currentQuestion.hint}</div>
          <p className="hint-text">Build the word by clicking letters!</p>
        </div>
      </div>

      <div className="word-builder-area">
        <div className="built-word-display">
          {selectedLetters.length === 0 ? (
            <div className="empty-slots">
              {currentQuestion.word.split('').map((_, i) => (
                <div key={i} className="empty-slot">_</div>
              ))}
            </div>
          ) : (
            <div className="selected-letters">
              {selectedLetters.map((item, index) => (
                <button
                  key={index}
                  className="selected-letter"
                  onClick={() => handleRemoveLetter(index)}
                  disabled={isAnswered}
                >
                  {item.letter}
                </button>
              ))}
              {selectedLetters.length < currentQuestion.word.length && (
                <div className="remaining-slots">
                  {Array(currentQuestion.word.length - selectedLetters.length).fill('_').map((_, i) => (
                    <div key={i} className="empty-slot">_</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="available-letters">
          {availableLetters.map((letter, index) => (
            <button
              key={index}
              className="letter-button"
              onClick={() => handleLetterClick(letter, index)}
              disabled={isAnswered}
            >
              {letter}
            </button>
          ))}
        </div>

        {selectedLetters.length > 0 && !isAnswered && (
          <button className="check-word-btn" onClick={handleCheck}>
            Check Word ✓
          </button>
        )}
      </div>

      {isAnswered && (
        <div className="answer-feedback">
          {isCorrect ? (
            <div className="feedback-correct">
              ✅ Correct! {firstAttempt ? '+10 points' : '+5 points'}
            </div>
          ) : (
            <div className="feedback-wrong">
              ❌ Wrong! Correct word: <strong>{currentQuestion.word}</strong>
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

export default WordBuilder

