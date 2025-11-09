import { useState } from 'react'
import './AnimalQuiz.css'

const AnimalQuiz = () => {
  // Simple animals for class 5 or lower
  const animals = [
    { name: 'Lion', image: '🦁', hint: 'King of the jungle' },
    { name: 'Tiger', image: '🐯', hint: 'Big cat with stripes' },
    { name: 'Elephant', image: '🐘', hint: 'Has a long trunk' },
    { name: 'Dog', image: '🐶', hint: 'Man\'s best friend' },
    { name: 'Cat', image: '🐱', hint: 'Likes to meow' },
    { name: 'Cow', image: '🐄', hint: 'Gives us milk' },
    { name: 'Horse', image: '🐴', hint: 'People ride on it' },
    { name: 'Rabbit', image: '🐰', hint: 'Has long ears' },
    { name: 'Monkey', image: '🐵', hint: 'Loves bananas' },
    { name: 'Bear', image: '🐻', hint: 'Big and furry' },
    { name: 'Panda', image: '🐼', hint: 'Black and white' },
    { name: 'Pig', image: '🐷', hint: 'Likes mud' },
    { name: 'Sheep', image: '🐑', hint: 'Gives us wool' },
    { name: 'Goat', image: '🐐', hint: 'Has horns' },
    { name: 'Duck', image: '🦆', hint: 'Likes water' },
    { name: 'Chicken', image: '🐔', hint: 'Lays eggs' },
    { name: 'Frog', image: '🐸', hint: 'Lives in water' },
    { name: 'Fish', image: '🐟', hint: 'Lives in water' },
    { name: 'Bird', image: '🐦', hint: 'Can fly' },
    { name: 'Butterfly', image: '🦋', hint: 'Has colorful wings' }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [showHint, setShowHint] = useState(false)

  const currentAnimal = animals[currentIndex]

  const handleSubmit = (e) => {
    e.preventDefault()
    setTotalQuestions(totalQuestions + 1)
    
    if (userAnswer.trim().toLowerCase() === currentAnimal.name.toLowerCase()) {
      setScore(score + 1)
      setShowResult(true)
      setTimeout(() => {
        nextQuestion()
      }, 2000)
    } else {
      setShowResult(true)
      setTimeout(() => {
        nextQuestion()
      }, 2000)
    }
  }

  const nextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % animals.length)
    setUserAnswer('')
    setShowResult(false)
    setShowHint(false)
  }

  const handleSkip = () => {
    setTotalQuestions(totalQuestions + 1)
    nextQuestion()
  }

  return (
    <div className="animal-quiz-container">
      <div className="animal-quiz-content">
        <h1 className="quiz-title">🖥️ Animal Quiz</h1>
        <p className="quiz-subtitle">Class 5 or Lower Standard</p>
        
        <div className="score-display">
          <span>Score: {score} / {totalQuestions}</span>
        </div>

        <div className="animal-display">
          <div className="animal-image">
            <span className="animal-emoji">{currentAnimal.image}</span>
          </div>
          <h2 className="question-text">Kaunsa Animal Hai? (Which Animal is This?)</h2>
        </div>

        {showHint && (
          <div className="hint-box">
            <p>💡 Hint: {currentAnimal.hint}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="quiz-form">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Animal ka naam likho (Write animal name)"
            className="answer-input"
            disabled={showResult}
            autoFocus
          />
          
          <div className="button-group">
            <button 
              type="button" 
              onClick={() => setShowHint(!showHint)}
              className="hint-button"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            <button 
              type="button" 
              onClick={handleSkip}
              className="skip-button"
              disabled={showResult}
            >
              Skip
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={showResult || !userAnswer.trim()}
            >
              Submit
            </button>
          </div>
        </form>

        {showResult && (
          <div className={`result-message ${userAnswer.trim().toLowerCase() === currentAnimal.name.toLowerCase() ? 'correct' : 'incorrect'}`}>
            {userAnswer.trim().toLowerCase() === currentAnimal.name.toLowerCase() ? (
              <>
                <span className="result-icon">✅</span>
                <p>Correct! It's a {currentAnimal.name}!</p>
              </>
            ) : (
              <>
                <span className="result-icon">❌</span>
                <p>Incorrect. The correct answer is: {currentAnimal.name}</p>
              </>
            )}
          </div>
        )}

        <div className="progress-info">
          <p>Question {currentIndex + 1} of {animals.length}</p>
        </div>
      </div>
    </div>
  )
}

export default AnimalQuiz

