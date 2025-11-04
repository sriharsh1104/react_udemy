import { useState, useEffect } from 'react'
import './ScoreHistory.css'

const ScoreHistory = () => {
  const [scores, setScores] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadScores()
    
    // Listen for score updates
    const handleScoreUpdate = () => {
      loadScores()
    }
    
    window.addEventListener('scoreUpdated', handleScoreUpdate)
    
    return () => {
      window.removeEventListener('scoreUpdated', handleScoreUpdate)
    }
  }, [])

  const loadScores = () => {
    const savedScores = localStorage.getItem('maths_games_scores')
    if (savedScores) {
      try {
        const parsed = JSON.parse(savedScores)
        // Sort by score (descending) then by date (descending)
        const sorted = parsed.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return new Date(b.date) - new Date(a.date)
        })
        setScores(sorted)
      } catch (e) {
        console.error('Error loading scores:', e)
      }
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('hi-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const clearHistory = () => {
    if (window.confirm('क्या आप सभी score history हटाना चाहते हैं?')) {
      localStorage.removeItem('maths_games_scores')
      setScores([])
    }
  }

  return (
    <div className="score-history-section">
      <button 
        className="toggle-history-btn"
        onClick={() => setShowHistory(!showHistory)}
      >
        {showHistory ? '📊 Score History' : '📊 Score History'}
        <span className="toggle-icon">{showHistory ? '▼' : '▶'}</span>
      </button>

      {showHistory && (
        <div className="score-history-content">
          <div className="history-header">
            <h3>🏆 Score History</h3>
            {scores.length > 0 && (
              <button onClick={clearHistory} className="clear-btn">
                🗑️ Clear
              </button>
            )}
          </div>

          {scores.length === 0 ? (
            <div className="no-scores">
              <p>अभी तक कोई score नहीं है</p>
              <p className="hint">खेलें और अपना score देखें!</p>
            </div>
          ) : (
            <div className="scores-list">
              {scores.map((entry, index) => (
                <div key={index} className="score-entry">
                  <div className="score-rank">
                    {index === 0 && <span className="rank-icon">🥇</span>}
                    {index === 1 && <span className="rank-icon">🥈</span>}
                    {index === 2 && <span className="rank-icon">🥉</span>}
                    {index > 2 && <span className="rank-number">#{index + 1}</span>}
                  </div>
                  <div className="score-details">
                    <div className="score-name">{entry.playerName}</div>
                    <div className="score-info">
                      <span className="score-value">Score: {entry.score}/20</span>
                      <span className="score-game">Game: {entry.gameName}</span>
                    </div>
                    <div className="score-date">{formatDate(entry.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ScoreHistory

