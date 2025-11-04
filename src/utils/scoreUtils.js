// Utility function to save game scores
export const saveGameScore = (playerName, score, gameName) => {
  if (!playerName) return // Don't save if no name
  
  const scoreEntry = {
    playerName,
    score,
    gameName,
    date: new Date().toISOString()
  }

  // Get existing scores
  const savedScores = localStorage.getItem('maths_games_scores')
  let scores = []
  
  if (savedScores) {
    try {
      scores = JSON.parse(savedScores)
    } catch (e) {
      console.error('Error parsing scores:', e)
      scores = []
    }
  }

  // Add new score
  scores.push(scoreEntry)

  // Keep only last 100 scores to prevent localStorage from getting too large
  if (scores.length > 100) {
    scores = scores.slice(-100)
  }

  // Save back to localStorage
  localStorage.setItem('maths_games_scores', JSON.stringify(scores))
  
  // Trigger custom event to refresh score history
  window.dispatchEvent(new CustomEvent('scoreUpdated'))
}

