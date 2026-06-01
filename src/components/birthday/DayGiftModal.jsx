import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../../data/birthdayCalendar'

function MediaLink({ spotifyUrl, youtubeUrl }) {
  if (!spotifyUrl && !youtubeUrl) return null
  return (
    <div className="birthday-modal-links">
      {spotifyUrl && (
        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="birthday-link-chip">
          🎵 Spotify
        </a>
      )}
      {youtubeUrl && (
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="birthday-link-chip">
          ▶️ YouTube
        </a>
      )}
    </div>
  )
}

export default function DayGiftModal({ dayData, onClose, onImageClick }) {
  if (!dayData || dayData.type === 'finale') return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`day-${dayData.day}`}
        className="birthday-modal-layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="birthday-modal-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
        <motion.div
          className="birthday-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-modal-title"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
          <button type="button" className="birthday-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
          <p className="birthday-modal-day">Din {dayData.day}</p>
          <h2 id="day-modal-title" className="birthday-modal-title">
            {dayData.title}
          </h2>
          {dayData.image && (
            <button
              type="button"
              className="birthday-modal-image-wrap birthday-modal-image-btn"
              onClick={onImageClick}
              aria-label="Fullscreen slider"
            >
              <img
                src={dayData.image}
                alt=""
                className="birthday-modal-image"
                draggable={false}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <span className="birthday-modal-image-hint">Tap — fullscreen & swipe</span>
            </button>
          )}
          <p className="birthday-modal-message">{dayData.message}</p>
          {dayData.reason && (
            <div className="birthday-reason-box">
              <span className="birthday-reason-label">Aaj ka reason</span>
              <p>{dayData.reason}</p>
            </div>
          )}
          <MediaLink spotifyUrl={dayData.spotifyUrl} youtubeUrl={dayData.youtubeUrl} />
          <p className="birthday-modal-footer">
            {config.herName} ke liye, dil se ❤️
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
