import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { config } from '../../data/birthdayCalendar'
import BirthdayImageViewer from './BirthdayImageViewer'

function ConfettiPiece({ i }) {
  const colors = ['#ff6b9d', '#c77dff', '#ffd6e0', '#ffb3c6', '#e0aaff']
  const left = `${(i * 17) % 100}%`
  const delay = (i % 20) * 0.05
  const color = colors[i % colors.length]
  return (
    <span
      className="birthday-confetti"
      style={{
        left,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        transform: `rotate(${i * 37}deg)`,
      }}
    />
  )
}

const MOSAIC_SPANS = [
  { c: 2, r: 2 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 2, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 2, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 2, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 2, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 2, r: 2 },
]

export default function BirthdayFinale({ finaleData, onClose }) {
  const [phase, setPhase] = useState('collage')
  const [viewerIndex, setViewerIndex] = useState(null)
  const images = finaleData?.images?.filter(Boolean) ?? []

  if (!finaleData) return null

  return (
    <div className="birthday-finale">
      <div className="birthday-confetti-layer" aria-hidden="true">
        {Array.from({ length: 50 }, (_, i) => (
          <ConfettiPiece key={i} i={i} />
        ))}
      </div>

      {viewerIndex == null && (
        <button
          type="button"
          className="birthday-finale-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'collage' && (
          <motion.div
            key="collage"
            className="birthday-finale-collage-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.45 }}
          >
            <div className="birthday-mosaic-fullscreen">
              {images.map((src, i) => {
                const span = MOSAIC_SPANS[i] || { c: 1, r: 1 }
                const tilt = (i % 5) - 2
                return (
                  <motion.button
                    key={`${src}-${i}`}
                    type="button"
                    className="birthday-mosaic-item"
                    style={{
                      gridColumn: span.c > 1 ? `span ${span.c}` : undefined,
                      gridRow: span.r > 1 ? `span ${span.r}` : undefined,
                      rotate: `${tilt}deg`,
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 + i * 0.025, duration: 0.4, type: 'spring' }}
                    onClick={() => setViewerIndex(i)}
                    aria-label={`Din ${i + 1} photo fullscreen`}
                  >
                    <img
                      src={src}
                      alt=""
                      loading="eager"
                      draggable={false}
                      onError={(e) => {
                        e.target.parentElement.style.display = 'none'
                      }}
                    />
                    <span className="birthday-mosaic-day">{i + 1}</span>
                    <span className="birthday-mosaic-tap">Tap</span>
                  </motion.button>
                )
              })}
            </div>

            <div className="birthday-finale-cinema">
              <motion.div
                className="birthday-finale-cinema-content"
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <p className="birthday-finale-badge">🎂 24 June 🎂</p>
                <h1 className="birthday-finale-cinema-title">{finaleData.title}</h1>
                <p className="birthday-finale-cinema-sub">
                  24 din, 24 yaadein — kisi photo par tap karo poori dekhne ke liye
                </p>
                <button
                  type="button"
                  className="birthday-btn birthday-btn-primary birthday-btn-glow"
                  onClick={() => setPhase('letter')}
                >
                  Mera letter padho 💕
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {phase === 'letter' && (
          <motion.div
            key="letter"
            className="birthday-finale-letter-screen"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="birthday-finale-badge">🎂 Happy Birthday 🎂</p>
            <h1 className="birthday-finale-title">{finaleData.title}</h1>
            <p className="birthday-finale-wish">
              Happy Birthday, {config.herName}! {config.nickname && `(${config.nickname})`}
            </p>

            <div className="birthday-letter">
              {finaleData.letter.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="birthday-finale-actions">
              <button
                type="button"
                className="birthday-btn birthday-btn-hint"
                onClick={() => setPhase('collage')}
              >
                Collage dubara dekho
              </button>
              <button type="button" className="birthday-btn birthday-btn-primary" onClick={onClose}>
                Wapas calendar par
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewerIndex != null && (
          <BirthdayImageViewer
            images={images}
            startIndex={viewerIndex}
            labelForIndex={(i) => `Din ${i + 1} · ${i + 1}/${images.length}`}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
