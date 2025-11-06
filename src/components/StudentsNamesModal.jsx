import { useState, useEffect } from 'react'
import './StudentsNamesModal.css'

const StudentsNamesModal = ({ onNamesSubmit, onClose, storageKey = 'maths_games_students_names', gameTitle = 'Maths Games' }) => {
  const [names, setNames] = useState({
    student1: '',
    student2: '',
    student3: '',
    student4: ''
  })
  const [errors, setErrors] = useState({})

  // Load saved names if they exist
  useEffect(() => {
    const savedNames = localStorage.getItem(storageKey)
    if (savedNames) {
      try {
        const parsed = JSON.parse(savedNames)
        if (parsed.student1 && parsed.student2 && parsed.student3 && parsed.student4) {
          setNames(parsed)
        }
      } catch (e) {
        console.error('Error loading saved names:', e)
      }
    }
  }, [storageKey])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  const handleClose = () => {
    if (onClose) {
      onClose()
    }
  }

  const handleNameChange = (studentId, value) => {
    setNames(prev => ({
      ...prev,
      [studentId]: value
    }))
    // Clear error when user starts typing
    if (errors[studentId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[studentId]
        return newErrors
      })
    }
  }

  const validateNames = () => {
    const newErrors = {}
    let isValid = true

    Object.keys(names).forEach((studentId) => {
      const name = names[studentId].trim()
      if (!name) {
        newErrors[studentId] = 'कृपया नाम दर्ज करें'
        isValid = false
      } else if (name.length < 2) {
        newErrors[studentId] = 'नाम कम से कम 2 अक्षर का होना चाहिए'
        isValid = false
      } else if (name.startsWith('Student ')) {
        newErrors[studentId] = 'कृपया वास्तविक नाम दर्ज करें'
        isValid = false
      }
    })

    // Check for duplicate names
    const nameValues = Object.values(names).map(n => n.trim().toLowerCase())
    const duplicates = nameValues.filter((name, index) => nameValues.indexOf(name) !== index && name !== '')
    
    if (duplicates.length > 0) {
      Object.keys(names).forEach((studentId) => {
        const name = names[studentId].trim().toLowerCase()
        if (duplicates.includes(name)) {
          newErrors[studentId] = 'नाम unique होना चाहिए'
          isValid = false
        }
      })
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateNames()) {
      return
    }

    // Trim all names
    const trimmedNames = {
      student1: names.student1.trim(),
      student2: names.student2.trim(),
      student3: names.student3.trim(),
      student4: names.student4.trim()
    }

    // Save to localStorage
    localStorage.setItem(storageKey, JSON.stringify(trimmedNames))
    
    // Call parent callback
    onNamesSubmit(trimmedNames)
  }

  return (
    <div className="students-names-modal-overlay" onClick={handleClose}>
      <div className="students-names-modal" onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close-btn"
          onClick={handleClose}
          aria-label="Close modal"
        >
          ✕
        </button>
        <div className="modal-header">
          <h2>🎮 Welcome to {gameTitle}!</h2>
          <p>कृपया 4 छात्रों के नाम दर्ज करें</p>
          <p className="subtitle">सभी नाम mandatory हैं</p>
        </div>
        
        <form onSubmit={handleSubmit} className="students-names-form">
          {[1, 2, 3, 4].map((num) => {
            const studentId = `student${num}`
            return (
              <div key={studentId} className="input-group">
                <label htmlFor={studentId}>
                  Student {num}: <span className="required">*</span>
                </label>
                <input
                  id={studentId}
                  type="text"
                  value={names[studentId]}
                  onChange={(e) => handleNameChange(studentId, e.target.value)}
                  placeholder={`Enter Student ${num} name`}
                  className={errors[studentId] ? 'error' : ''}
                  maxLength={30}
                  autoFocus={num === 1}
                />
                {errors[studentId] && (
                  <span className="error-message">{errors[studentId]}</span>
                )}
              </div>
            )
          })}
          
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              शुरू करें 🚀
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StudentsNamesModal

