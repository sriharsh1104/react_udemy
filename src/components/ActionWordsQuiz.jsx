import { useState, useMemo } from 'react'
import { ACTION_WORDS_QUESTIONS } from '../data/actionWordsQuizData'
import './ActionWordsQuiz.css'

const QUESTIONS = ACTION_WORDS_QUESTIONS

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ActionWordsQuiz = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)

  const question = QUESTIONS[currentIndex]
  const options = useMemo(
    () => shuffle([question.correct, ...question.wrong]),
    [currentIndex]
  )

  const handleOptionClick = (option) => {
    if (showResult) return
    setSelectedOption(option)
    setShowResult(true)
    setTotalAttempts((t) => t + 1)
    if (option.toLowerCase() === question.correct.toLowerCase()) {
      setScore((s) => s + 1)
    }
  }

  const nextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % QUESTIONS.length)
    setSelectedOption(null)
    setShowResult(false)
  }

  const pictureNumber = currentIndex + 1

  return (
    <div className="action-words-quiz">
      <div className="action-words-quiz-content">
        <h1 className="action-words-title">Action Words – Preposition Verbs</h1>
        <p className="action-words-subtitle">Picture dekho, sahi verb + preposition choose karo</p>

        <div className="action-words-score">
          Score: {score} / {totalAttempts}
        </div>

        <div className="action-words-image-wrap">
          <img
            src={question.imageUrl}
            alt={`Picture ${pictureNumber} – ${question.correct}`}
            className="action-words-cell"
          />
          <p className="action-words-picture-label">Picture {pictureNumber}</p>
        </div>

        <h2 className="action-words-question">
          Is image mein bache kya ho raha hai? bato bacho
        </h2>

        <div className="action-words-options">
          {options.map((opt) => {
            const isCorrect = opt.toLowerCase() === question.correct.toLowerCase()
            const isChosen = selectedOption === opt
            let btnClass = 'action-words-opt'
            if (showResult) {
              if (isCorrect) btnClass += ' correct'
              else if (isChosen && !isCorrect) btnClass += ' incorrect'
            }
            return (
              <button
                key={opt}
                type="button"
                className={btnClass}
                onClick={() => handleOptionClick(opt)}
                disabled={showResult}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className={`action-words-feedback ${selectedOption?.toLowerCase() === question.correct.toLowerCase() ? 'correct' : 'incorrect'}`}>
            {selectedOption?.toLowerCase() === question.correct.toLowerCase() ? (
              <>✅ Sahi! Correct: {question.correct}</>
            ) : (
              <>❌ Galat. Sahi answer: {question.correct}</>
            )}
          </div>
        )}

        {showResult && (
          <button type="button" className="action-words-next" onClick={nextQuestion}>
            Agla picture →
          </button>
        )}

        <p className="action-words-progress">
          Picture {pictureNumber} of {QUESTIONS.length}
        </p>
      </div>
    </div>
  )
}

export default ActionWordsQuiz
