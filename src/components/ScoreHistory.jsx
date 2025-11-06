import { useState, useEffect } from 'react'
import './ScoreHistory.css'
import { BACKEND_URL } from '../constants'

const ScoreHistory = ({ category = 'maths-games' }) => {
  const [scores, setScores] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadScores()
    
    // Listen for score updates
    const handleScoreUpdate = (event) => {
      // Only reload if it's for this category or no category specified
      if (!event.detail || event.detail.category === category) {
        loadScores()
      }
    }
    
    window.addEventListener('scoreUpdated', handleScoreUpdate)
    
    return () => {
      window.removeEventListener('scoreUpdated', handleScoreUpdate)
    }
  }, [category])

  const loadScores = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Try to fetch from API first
      const response = await fetch(`${BACKEND_URL}/api/${category}/scores`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.scores) {
          // Filter scores by game name if needed (for game-specific leaderboards)
          setScores(data.scores)
          setLoading(false)
          return
        }
      }
      
      // Fallback to localStorage if API fails
      throw new Error('API unavailable, using localStorage')
    } catch (error) {
      console.warn('Failed to fetch from API, using localStorage:', error)
      
      // Fallback to localStorage
      const storageKey = `${category}_scores`
      const savedScores = localStorage.getItem(storageKey)
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
          console.error('Error loading scores from localStorage:', e)
          setScores([])
        }
      } else {
        setScores([])
      }
    } finally {
      setLoading(false)
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

  const clearHistory = async () => {
    if (window.confirm('क्या आप सभी score history हटाना चाहते हैं?')) {
      try {
        // Try to clear from API
        const response = await fetch(`${BACKEND_URL}/api/${category}/scores`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          console.log('Scores cleared from API')
        }
      } catch (error) {
        console.warn('Failed to clear from API:', error)
      }
      
      // Clear localStorage
      const storageKey = `${category}_scores`
      localStorage.removeItem(storageKey)
      setScores([])
    }
  }

  const getCategoryTitle = () => {
    return category === 'maths-games' ? 'Maths Games' : 'English Games'
  }

  return (
    <div className="score-history-section">
      <button 
        className="toggle-history-btn"
        onClick={() => setShowHistory(!showHistory)}
      >
        🏆 {getCategoryTitle()} Leaderboard
        <span className="toggle-icon">{showHistory ? '▼' : '▶'}</span>
      </button>

      {showHistory && (
        <div className="score-history-content">
          <div className="history-header">
            <h3>🏆 {getCategoryTitle()} Leaderboard</h3>
            {scores.length > 0 && (
              <button onClick={clearHistory} className="clear-btn">
                🗑️ Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="no-scores">
              <p>Loading scores...</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="no-scores">
              <p>अभी तक कोई score नहीं है</p>
              <p className="hint">खेलें और अपना score देखें!</p>
            </div>
          ) : (
            <div className="scores-list">
              {scores.map((entry, index) => (
                <div key={`${entry.date}-${index}`} className="score-entry">
                  <div className="score-rank">
                    {index === 0 && <span className="rank-icon">🥇</span>}
                    {index === 1 && <span className="rank-icon">🥈</span>}
                    {index === 2 && <span className="rank-icon">🥉</span>}
                    {index > 2 && <span className="rank-number">#{index + 1}</span>}
                  </div>
                  <div className="score-details">
                    <div className="score-name">{entry.playerName}</div>
                    <div className="score-info">
                      <span className="score-value">Score: {entry.score}</span>
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

