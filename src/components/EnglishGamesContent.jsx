import { useState } from 'react'
import PrepositionQuiz from './PrepositionQuiz'
import VerbQuiz from './VerbQuiz'
import './MathsGames.css'
import './EnglishGamesContent.css'

const EnglishGamesContent = ({ onExitGameMode }) => {
  const [selectedGame, setSelectedGame] = useState(null)

  if (selectedGame === 'preposition') {
    return (
      <>
        <button type="button" className="english-game-back" onClick={() => setSelectedGame(null)}>
          ← Back to games
        </button>
        <div className="games-container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <PrepositionQuiz />
          </div>
        </div>
      </>
    )
  }

  if (selectedGame === 'verb') {
    return (
      <>
        <button type="button" className="english-game-back" onClick={() => setSelectedGame(null)}>
          ← Back to games
        </button>
        <div className="games-container">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <VerbQuiz />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="games-container">
      <h2 className="english-games-heading">English Games – Choose a game</h2>
      <div className="english-game-cards">
        <button
          type="button"
          className="english-game-card"
          onClick={() => setSelectedGame('preposition')}
        >
          <span className="english-game-card-title">Preposition Game</span>
          <span className="english-game-card-desc">50 pictures – sahi preposition choose karo</span>
        </button>
        <button
          type="button"
          className="english-game-card"
          onClick={() => setSelectedGame('verb')}
        >
          <span className="english-game-card-title">Verb Game</span>
          <span className="english-game-card-desc">50 pictures – sahi verb choose karo</span>
        </button>
      </div>
    </div>
  )
}

export default EnglishGamesContent
