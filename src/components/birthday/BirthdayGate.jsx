import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { config, isValidPassword, STORAGE_KEY } from '../../data/birthdayCalendar'

export function isBirthdayUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setBirthdayUnlocked() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

function getHintMessage() {
  const example = config.hintExampleDob
  const label = config.hintExampleLabel
  return {
    lead: 'Password kisi special date ka hai — tumhe pata hona chahiye 😉',
    format:
      'Format: pehle din (2 digit), phir mahina (2 digit), phir saal (4 digit). Sab ek saath, bina / ya space.',
    example: example
      ? `Sirf format samjho — example: ${label} → ${example} (yeh random hai, asli password nahi)`
      : 'Date DDMMYYYY format mein likho.',
  }
}

export default function BirthdayGate({ onUnlock, children }) {
  const [unlocked, setUnlocked] = useState(() => isBirthdayUnlocked())
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const hint = getHintMessage()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValidPassword(password)) {
      setBirthdayUnlocked()
      setUnlocked(true)
      setError('')
      onUnlock?.()
    } else {
      setError('Galat password… dubara try karo 💕')
    }
  }

  if (unlocked) return children

  return (
    <div className="birthday-app">
      <div className="birthday-hearts" aria-hidden="true" />
      <motion.div
        className="birthday-gate"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="birthday-gate-icon">💝</div>
        <h1 className="birthday-gate-title">Sirf tumhare liye hai yeh</h1>
        <p className="birthday-gate-sub">
          {config.herName}, yeh chhoti si duniya sirf tumhare liye banayi hai. Password daalo.
        </p>
        <form onSubmit={handleSubmit} className="birthday-gate-form">
          <div className="birthday-input-wrap">
            <input
              type={showPassword ? 'text' : 'password'}
              className="birthday-input birthday-input-with-toggle"
              placeholder={config.passwordPlaceholder || 'Password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
            />
            <button
              type="button"
              className="birthday-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Password chhupao' : 'Password dikhao'}
              title={showPassword ? 'Chhupao' : 'Dikhao'}
            >
              {showPassword ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l18 18M10.58 10.58a2 2 0 002.84 2.84M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.8 11.8 0 01-4.12 4.77M6.61 6.61A11.63 11.63 0 001 12c1.73 3.89 6 7 11 7 1.39 0 2.72-.24 3.95-.68"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              )}
            </button>
          </div>
          {error && <p className="birthday-gate-error">{error}</p>}
          <button type="submit" className="birthday-btn birthday-btn-primary">
            Andar aao
          </button>

          <button
            type="button"
            className="birthday-btn birthday-btn-hint"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
          >
            {showHint ? 'Hint chhupa do' : 'Hint chahiye?'}
          </button>

          <AnimatePresence>
            {showHint && (
              <motion.div
                className="birthday-hint-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <p className="birthday-hint-lead">{hint.lead}</p>
                <p>{hint.format}</p>
                <p className="birthday-hint-example">{hint.example}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </div>
  )
}
