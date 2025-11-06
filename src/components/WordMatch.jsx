import { useState, useEffect } from 'react'
import './WordMatch.css'
import { saveGameScore } from '../utils/scoreUtils'

const WordMatch = ({ userName = null }) => {
  const [score, setScore] = useState(0)
  const [questionNumber, setQuestionNumber] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedWord, setSelectedWord] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [firstAttempt, setFirstAttempt] = useState(true)
  const [gameActive, setGameActive] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [showNextQuestionButton, setShowNextQuestionButton] = useState(false)
  const [questionList, setQuestionList] = useState([])
  const [timer, setTimer] = useState(30)
  const [timerActive, setTimerActive] = useState(false)

  // Vocabulary words with emojis for class 5 and below
  const vocabulary = [
    { word: 'Apple', emoji: '🍎' },
    { word: 'Ball', emoji: '⚽' },
    { word: 'Cat', emoji: '🐱' },
    { word: 'Dog', emoji: '🐶' },
    { word: 'Elephant', emoji: '🐘' },
    { word: 'Fish', emoji: '🐟' },
    { word: 'Guitar', emoji: '🎸' },
    { word: 'House', emoji: '🏠' },
    { word: 'Ice', emoji: '🧊' },
    { word: 'Jelly', emoji: '🍮' },
    { word: 'Key', emoji: '🔑' },
    { word: 'Lion', emoji: '🦁' },
    { word: 'Moon', emoji: '🌙' },
    { word: 'Nose', emoji: '👃' },
    { word: 'Orange', emoji: '🍊' },
    { word: 'Pencil', emoji: '✏️' },
    { word: 'Queen', emoji: '👑' },
    { word: 'Rainbow', emoji: '🌈' },
    { word: 'Sun', emoji: '☀️' },
    { word: 'Tree', emoji: '🌳' }
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
    const shuffled = [...vocabulary].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 15) // 15 questions
  }

  const generateQuestion = () => {
    if (questionList.length === 0) {
      const newList = generateQuestionList()
      setQuestionList(newList)
      return
    }
    
    const question = questionList[questionNumber]
    if (!question) return

    // Generate 3 wrong words
    const wrongWords = []
    while (wrongWords.length < 3) {
      const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)]
      if (randomWord.word !== question.word && !wrongWords.includes(randomWord.word)) {
        wrongWords.push(randomWord.word)
      }
    }

    // Shuffle options
    const allOptions = [question.word, ...wrongWords]
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)

    setCurrentQuestion({
      emoji: question.emoji,
      correctWord: question.word,
      options: shuffledOptions
    })
    setSelectedWord(null)
    setIsAnswered(false)
    setFirstAttempt(true)
    setShowNextQuestionButton(false)
    setTimer(30)
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

  const handleWordSelect = (word) => {
    if (isAnswered) return
    
    setSelectedWord(word)
    setIsAnswered(true)
    setTimerActive(false)

    if (word === currentQuestion.correctWord) {
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
        saveGameScore(userName, score, 'word-match')
      }
    }
  }

  if (!gameActive) {
    return (
      <div className="word-match">
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
      <div className="word-match">
        <div className="game-complete">
          <h2>🎉 Game Complete!</h2>
          <p>Final Score: {score}</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="word-match">
        <div className="game-warning">
          <div className="warning-content">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="word-match">
      <div className="game-header">
        <h3 className="game-title">🎯 Word Match</h3>
        <div className="score-info">
          <div className="score-display">Score: {score}</div>
          <div className="question-counter">Q: {questionNumber + 1}/{questionList.length}</div>
          {timerActive && (
            <div className={`timer-display ${timer <= 10 ? 'timer-warning' : ''}`}>
              ⏱️ {timer}s
            </div>
          )}
        </div>
      </div>

      <div className="question-container">
        <div className="emoji-display">
          <div className="emoji-large">{currentQuestion.emoji}</div>
          <p className="emoji-hint">Match the word with this picture!</p>
        </div>
      </div>

      <div className="word-options">
        {currentQuestion.options.map((word, index) => {
          const isCorrect = word === currentQuestion.correctWord
          const isSelected = selectedWord === word
          let className = 'word-option'
          
          if (isAnswered) {
            if (isCorrect) {
              className += ' correct'
            } else if (isSelected && !isCorrect) {
              className += ' wrong'
            }
          } else if (isSelected) {
            className += ' selected'
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleWordSelect(word)}
              disabled={isAnswered}
            >
              {word}
            </button>
          )
        })}
      </div>

      {isAnswered && (
        <div className="answer-feedback">
          {selectedWord === currentQuestion.correctWord ? (
            <div className="feedback-correct">
              ✅ Correct! {firstAttempt ? '+10 points' : '+5 points'}
            </div>
          ) : (
            <div className="feedback-wrong">
              ❌ Wrong! Correct answer: <strong>{currentQuestion.correctWord}</strong>
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

export default WordMatch

