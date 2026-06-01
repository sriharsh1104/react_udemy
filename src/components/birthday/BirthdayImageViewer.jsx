import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BirthdayImageViewer({
  images,
  startIndex = 0,
  labelForIndex,
  onClose,
}) {
  const [index, setIndex] = useState(startIndex)
  const [touchStart, setTouchStart] = useState(null)

  const total = images.length
  const current = images[index]

  const go = useCallback(
    (delta) => {
      if (total <= 1) return
      setIndex((i) => (i + delta + total) % total)
    },
    [total]
  )

  useEffect(() => {
    setIndex(startIndex)
  }, [startIndex])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, go])

  const onTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const onTouchEnd = (e) => {
    if (touchStart == null) return
    const diff = e.changedTouches[0].clientX - touchStart
    if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1)
    setTouchStart(null)
  }

  if (!current) return null

  const label = labelForIndex ? labelForIndex(index) : `${index + 1} / ${total}`

  return (
    <motion.div
      className="birthday-viewer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="birthday-viewer-header">
        <span className="birthday-viewer-counter">{label}</span>
        <button type="button" className="birthday-viewer-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div
        className="birthday-viewer-stage"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {total > 1 && (
          <button
            type="button"
            className="birthday-viewer-nav birthday-viewer-prev"
            onClick={() => go(-1)}
            aria-label="Previous"
          >
            ‹
          </button>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={current}
            src={current}
            alt=""
            className="birthday-viewer-img"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            draggable={false}
          />
        </AnimatePresence>

        {total > 1 && (
          <button
            type="button"
            className="birthday-viewer-nav birthday-viewer-next"
            onClick={() => go(1)}
            aria-label="Next"
          >
            ›
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="birthday-viewer-dots">
          {images.map((src, i) => (
            <button
              key={`dot-${i}-${src}`}
              type="button"
              className={`birthday-viewer-dot ${i === index ? 'birthday-viewer-dot-active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      <p className="birthday-viewer-hint">Swipe karo ya ‹ › dabao — poori photo</p>
    </motion.div>
  )
}
