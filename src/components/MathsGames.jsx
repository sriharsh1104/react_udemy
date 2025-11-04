import BalloonMathPop from './BalloonMathPop'
import './MathsGames.css'

const MathsGames = () => {
  return (
    <div className="maths-games">
      <h1 className="maths-games-title">🎮 Maths Games</h1>
      <div className="games-container">
        <BalloonMathPop />
      </div>
    </div>
  )
}

export default MathsGames

