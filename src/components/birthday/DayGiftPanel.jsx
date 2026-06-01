import React from 'react'
import { motion } from 'framer-motion'
import { config } from '../../data/birthdayCalendar'

export default function DayGiftPanel({ dayData, onFullscreen }) {
  if (!dayData || dayData.type === 'finale') return null

  return (
    <motion.section
      className="birthday-day-panel"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3 }}
      aria-live="polite"
    >
      <div className="birthday-day-panel-head">
        <span className="birthday-day-panel-num">Din {dayData.day}</span>
        <h2 className="birthday-day-panel-title">{dayData.title}</h2>
      </div>
      <p className="birthday-day-panel-message">{dayData.message}</p>
      {dayData.reason && (
        <div className="birthday-reason-box">
          <span className="birthday-reason-label">Aaj ka reason</span>
          <p>{dayData.reason}</p>
        </div>
      )}
      {(dayData.spotifyUrl || dayData.youtubeUrl) && (
        <div className="birthday-modal-links">
          {dayData.spotifyUrl && (
            <a href={dayData.spotifyUrl} target="_blank" rel="noopener noreferrer" className="birthday-link-chip">
              🎵 Spotify
            </a>
          )}
          {dayData.youtubeUrl && (
            <a href={dayData.youtubeUrl} target="_blank" rel="noopener noreferrer" className="birthday-link-chip">
              ▶️ YouTube
            </a>
          )}
        </div>
      )}
      <button type="button" className="birthday-day-panel-fullscreen" onClick={onFullscreen}>
        Upar wali photo fullscreen dekho — swipe bhi kar sakti ho
      </button>
      <p className="birthday-day-panel-footer">{config.herName} ke liye, dil se ❤️</p>
    </motion.section>
  )
}
