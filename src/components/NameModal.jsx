import { useState, useEffect } from 'react'
import './NameModal.css'

const NameModal = ({ onNameSubmit }) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [hasName, setHasName] = useState(false)

  useEffect(() => {
    // Check if name already exists
    const savedName = localStorage.getItem('maths_games_user_name')
    if (savedName) {
      setHasName(true)
      onNameSubmit(savedName)
    }
  }, [onNameSubmit])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('कृपया अपना नाम दर्ज करें')
      return
    }

    if (name.trim().length < 2) {
      setError('नाम कम से कम 2 अक्षर का होना चाहिए')
      return
    }

    const trimmedName = name.trim()
    localStorage.setItem('maths_games_user_name', trimmedName)
    onNameSubmit(trimmedName)
  }

  if (hasName) {
    return null
  }

  return (
    <div className="name-modal-overlay">
      <div className="name-modal">
        <div className="modal-header">
          <h2>🎮 Welcome to Maths Games!</h2>
          <p>खेलने के लिए अपना नाम दर्ज करें</p>
        </div>
        
        <form onSubmit={handleSubmit} className="name-form">
          <div className="input-group">
            <label htmlFor="player-name">आपका नाम:</label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="अपना नाम टाइप करें..."
              className={error ? 'error' : ''}
              autoFocus
              maxLength={30}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
          
          <button type="submit" className="submit-btn">
            शुरू करें 🚀
          </button>
        </form>
      </div>
    </div>
  )
}

export default NameModal

