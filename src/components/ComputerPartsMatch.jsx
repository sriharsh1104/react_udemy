import { useState, useEffect } from 'react'
import './AnimalQuiz.css'

const ComputerPartsMatch = () => {
  const [parts, setParts] = useState([])
  const [descriptions, setDescriptions] = useState([])
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedDesc, setSelectedDesc] = useState(null)
  const [matchedPairs, setMatchedPairs] = useState([])
  const [score, setScore] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)

  const computerParts = [
    { part: 'Keyboard', description: 'Used to type letters and numbers', emoji: '⌨️' },
    { part: 'Mouse', description: 'Used to click and move cursor', emoji: '🖱️' },
    { part: 'Monitor', description: 'Shows what is on the computer screen', emoji: '🖥️' },
    { part: 'CPU', description: 'The brain of the computer that processes', emoji: '📦' },
    { part: 'Printer', description: 'Prints documents on paper', emoji: '🖨️' },
    { part: 'Speaker', description: 'Makes sound from computer', emoji: '🔊' },
    { part: 'USB', description: 'Used to connect devices to computer', emoji: '🔌' },
    { part: 'RAM', description: 'Memory that stores temporary data', emoji: '💾' },
    { part: 'Hard Drive', description: 'Stores all files permanently', emoji: '💿' },
    { part: 'Webcam', description: 'Camera on computer for video calls', emoji: '📹' },
    { part: 'Microphone', description: 'Records sound on computer', emoji: '🎤' },
    { part: 'Headphones', description: 'Wear to hear sound privately', emoji: '🎧' }
  ]

  useEffect(() => {
    // Shuffle parts and descriptions
    const shuffledParts = [...computerParts].sort(() => Math.random() - 0.5)
    const shuffledDescs = [...computerParts].map(p => p.description).sort(() => Math.random() - 0.5)
    
    setParts(shuffledParts)
    setDescriptions(shuffledDescs)
  }, [])

  const handlePartClick = (index) => {
    if (matchedPairs.includes(index)) return
    
    if (selectedPart === index) {
      setSelectedPart(null)
    } else {
      setSelectedPart(index)
      if (selectedDesc !== null) {
        checkMatch(index, selectedDesc)
      }
    }
  }

  const handleDescClick = (descIndex) => {
    const desc = descriptions[descIndex]
    if (isDescMatched(desc)) return
    
    if (selectedDesc === descIndex) {
      setSelectedDesc(null)
    } else {
      setSelectedDesc(descIndex)
      if (selectedPart !== null) {
        checkMatch(selectedPart, descIndex)
      }
    }
  }

  const checkMatch = (partIndex, descIndex) => {
    const part = parts[partIndex]
    const desc = descriptions[descIndex]
    
    setTotalMatches(totalMatches + 1)
    
    if (part.description === desc) {
      setScore(score + 1)
      setMatchedPairs([...matchedPairs, partIndex])
      setSelectedPart(null)
      setSelectedDesc(null)
    } else {
      setTimeout(() => {
        setSelectedPart(null)
        setSelectedDesc(null)
      }, 1000)
    }
  }

  const isMatched = (index) => {
    return matchedPairs.includes(index)
  }

  const isDescMatched = (desc) => {
    return matchedPairs.some((partIndex) => parts[partIndex]?.description === desc)
  }

  const resetGame = () => {
    const shuffledParts = [...computerParts].sort(() => Math.random() - 0.5)
    const shuffledDescs = [...computerParts].map(p => p.description).sort(() => Math.random() - 0.5)
    
    setParts(shuffledParts)
    setDescriptions(shuffledDescs)
    setSelectedPart(null)
    setSelectedDesc(null)
    setMatchedPairs([])
    setScore(0)
    setTotalMatches(0)
  }

  const allMatched = matchedPairs.length === computerParts.length

  return (
    <div className="animal-quiz-container">
      <div className="animal-quiz-content" style={{ maxWidth: '900px' }}>
        <h1 className="quiz-title">🔗 Computer Parts Match</h1>
        <p className="quiz-subtitle">Match computer parts with their descriptions!</p>
        
        <div className="score-display" style={{ marginBottom: '30px' }}>
          <span>Score: {score} / {totalMatches} | Matched: {matchedPairs.length} / {computerParts.length}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* Parts Column */}
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#667eea' }}>Computer Parts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {parts.map((item, index) => {
                const matched = isMatched(index)
                const selected = selectedPart === index
                return (
                  <button
                    key={index}
                    onClick={() => handlePartClick(index)}
                    disabled={matched}
                    style={{
                      padding: '20px',
                      fontSize: '1.2rem',
                      border: matched 
                        ? '3px solid #28a745' 
                        : selected 
                        ? '3px solid #667eea' 
                        : '3px solid #ddd',
                      borderRadius: '10px',
                      backgroundColor: matched 
                        ? '#d4edda' 
                        : selected 
                        ? '#e7f0ff' 
                        : 'white',
                      cursor: matched ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}
                  >
                    <span style={{ fontSize: '2.5rem' }}>{item.emoji}</span>
                    <span style={{ fontWeight: 'bold' }}>{item.part}</span>
                    {matched && <span style={{ marginLeft: 'auto', fontSize: '1.5rem' }}>✅</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descriptions Column */}
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#667eea' }}>Descriptions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {descriptions.map((desc, index) => {
                const matched = isDescMatched(desc)
                const selected = selectedDesc === index
                return (
                  <button
                    key={index}
                    onClick={() => handleDescClick(index)}
                    disabled={matched}
                    style={{
                      padding: '20px',
                      fontSize: '1.1rem',
                      border: matched 
                        ? '3px solid #28a745' 
                        : selected 
                        ? '3px solid #667eea' 
                        : '3px solid #ddd',
                      borderRadius: '10px',
                      backgroundColor: matched 
                        ? '#d4edda' 
                        : selected 
                        ? '#e7f0ff' 
                        : 'white',
                      cursor: matched ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      textAlign: 'left'
                    }}
                  >
                    {desc}
                    {matched && <span style={{ marginLeft: '10px', fontSize: '1.5rem' }}>✅</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {allMatched && (
          <div style={{
            padding: '30px',
            backgroundColor: '#d4edda',
            border: '3px solid #28a745',
            borderRadius: '15px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ fontSize: '2rem', color: '#155724', marginBottom: '10px' }}>🎉 Congratulations!</h2>
            <p style={{ fontSize: '1.3rem', color: '#155724' }}>You matched all computer parts!</p>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={resetGame}
            style={{
              padding: '15px 30px',
              fontSize: '1.2rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Play Again
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComputerPartsMatch

