import ActionWordsQuiz from './ActionWordsQuiz'
import './MathsGames.css'

const EnglishGamesContent = ({ onExitGameMode }) => {
  return (
    <>
      <div className="games-container">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <ActionWordsQuiz />
        </div>
      </div>
    </>
  )
}

export default EnglishGamesContent
