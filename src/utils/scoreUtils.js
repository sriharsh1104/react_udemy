import { BACKEND_URL } from '../constants'

// Utility function to save game scores to API and localStorage
export const saveGameScore = async (playerName, score, gameName, category = 'maths-games') => {
  if (!playerName) return // Don't save if no name
  
  const scoreEntry = {
    playerName,
    score,
    gameName,
    category,
    date: new Date().toISOString()
  }

  // Save to localStorage as backup (separate storage per category)
  const storageKey = `${category}_scores`
  const savedScores = localStorage.getItem(storageKey)
  let scores = []
  
  if (savedScores) {
    try {
      scores = JSON.parse(savedScores)
    } catch (e) {
      console.error('Error parsing scores:', e)
      scores = []
    }
  }

  scores.push(scoreEntry)

  // Keep only last 100 scores to prevent localStorage from getting too large
  if (scores.length > 100) {
    scores = scores.slice(-100)
  }

  localStorage.setItem(storageKey, JSON.stringify(scores))
  
  // Save to API
  try {
    const response = await fetch(`${BACKEND_URL}/api/${category}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName,
        score,
        gameName
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log('Score saved to API:', result)
  } catch (error) {
    console.error('Error saving score to API:', error)
    // Continue even if API save fails - localStorage backup is already saved
  }
  
  // Trigger custom event to refresh score history
  window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { category } }))
}

