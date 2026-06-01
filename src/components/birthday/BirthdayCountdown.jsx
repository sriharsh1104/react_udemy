import React, { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { config, days, isBirthdayTestMode, dayImagePath, collageImages } from '../../data/birthdayCalendar'
import BirthdayImageViewer from './BirthdayImageViewer'
import {
  getCountdownToBirthday,
  isDayUnlocked,
  isTodayDay,
  getRelationshipDays,
} from '../../utils/birthdayDate'
import DayGiftModal from './DayGiftModal'
import BirthdayFinale from './BirthdayFinale'

export default function BirthdayCountdown() {
  const [countdown, setCountdown] = useState(() => getCountdownToBirthday(config.birthday))
  const [selectedDay, setSelectedDay] = useState(null)
  const [heroDay, setHeroDay] = useState(null)
  const [showFinale, setShowFinale] = useState(false)
  const [lockedHint, setLockedHint] = useState(null)
  const [viewerIndex, setViewerIndex] = useState(null)

  const heroImageSrc = useMemo(() => {
    if (heroDay == null) return config.heroImage
    const entry = days.find((d) => d.day === heroDay)
    if (entry?.image) return entry.image
    return dayImagePath(heroDay)
  }, [heroDay])

  const relationshipDays = getRelationshipDays(config.relationshipStart)
  const finaleData = days.find((d) => d.day === 24 && d.type === 'finale')

  useEffect(() => {
    const tick = () => setCountdown(getCountdownToBirthday(config.birthday))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const handleDayClick = (dayNum) => {
    const unlocked = isDayUnlocked(dayNum, config.calendarStart, config.birthday)

    if (!unlocked) {
      setLockedHint(dayNum)
      setTimeout(() => setLockedHint(null), 2500)
      return
    }

    setHeroDay(dayNum)

    if (dayNum === 24) {
      setShowFinale(true)
      setSelectedDay(null)
      return
    }

    const data = days.find((d) => d.day === dayNum)
    if (data) setSelectedDay(data)
  }

  const closeModal = () => setSelectedDay(null)

  const testMode = isBirthdayTestMode()

  return (
    <div className="birthday-app">
      <div className="birthday-hearts" aria-hidden="true" />

      {testMode && (
        <div className="birthday-test-banner" role="status">
          Testing mode — saare din unlock hain
        </div>
      )}

      <header className="birthday-hero">
        <div className="birthday-hero-image-wrap">
          <button
            type="button"
            className="birthday-hero-image-btn"
            onClick={() => setViewerIndex(heroDay != null ? heroDay - 1 : 0)}
            aria-label="Photo fullscreen dekho"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={heroImageSrc}
                src={heroImageSrc}
                alt={heroDay ? `Din ${heroDay}` : config.herName}
                className="birthday-hero-image"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                draggable={false}
                onError={(e) => {
                  e.target.classList.add('birthday-hero-placeholder')
                  e.target.alt = ''
                }}
              />
            </AnimatePresence>
            <span className="birthday-hero-expand">Tap — poori photo</span>
          </button>
          <div className="birthday-hero-overlay" aria-hidden="true" />
          <div className="birthday-hero-text">
            <h1 className="birthday-hero-title">{config.pageTitle || 'Happy birthday baby'}</h1>
            <p className="birthday-hero-name">{config.herName}</p>
            {heroDay != null && (
              <p className="birthday-hero-day-tag">Din {heroDay}</p>
            )}
            <p className="birthday-hero-sub">{config.subtitle}</p>
            {(config.relationshipBadge || relationshipDays != null) && (
              <span className="birthday-badge">
                {config.relationshipBadge ||
                  `${relationshipDays} din se tum meri duniya ho`}
              </span>
            )}
          </div>
        </div>
      </header>

      <section className="birthday-countdown-section">
        {countdown.isPast ? (
          <p className="birthday-countdown-label">Aaj tumhara din hai! 🎉</p>
        ) : (
          <>
            <p className="birthday-countdown-label">Birthday tak baaki</p>
            <div className="birthday-countdown-grid">
              <div className="birthday-countdown-unit">
                <span className="birthday-countdown-num">{countdown.days}</span>
                <span className="birthday-countdown-unit-label">din</span>
              </div>
              <div className="birthday-countdown-unit">
                <span className="birthday-countdown-num">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="birthday-countdown-unit-label">ghante</span>
              </div>
              <div className="birthday-countdown-unit">
                <span className="birthday-countdown-num">
                  {String(countdown.minutes).padStart(2, '0')}
                </span>
                <span className="birthday-countdown-unit-label">min</span>
              </div>
              <div className="birthday-countdown-unit">
                <span className="birthday-countdown-num">
                  {String(countdown.seconds).padStart(2, '0')}
                </span>
                <span className="birthday-countdown-unit-label">sec</span>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="birthday-calendar-section">
        <h2 className="birthday-section-title">Har din ek gift</h2>
        <p className="birthday-section-hint">Jo din unlock ho chuka ho, us par tap karo</p>

        {lockedHint && (
          <p className="birthday-locked-toast" role="status">
            Din {lockedHint} abhi lock hai… kal khulega, thoda sabr 💕
          </p>
        )}

        <div className="birthday-calendar-grid">
          {Array.from({ length: 24 }, (_, i) => {
            const dayNum = i + 1
            const unlocked = isDayUnlocked(dayNum, config.calendarStart, config.birthday)
            const today = isTodayDay(dayNum)
            const isFinale = dayNum === 24

            let stateClass = 'birthday-cell-locked'
            if (unlocked) stateClass = 'birthday-cell-unlocked'
            if (today) stateClass += ' birthday-cell-today'
            if (heroDay === dayNum) stateClass += ' birthday-cell-active'

            return (
              <button
                key={dayNum}
                type="button"
                className={`birthday-cell ${stateClass}`}
                onClick={() => handleDayClick(dayNum)}
                aria-label={
                  unlocked
                    ? `Din ${dayNum} kholo`
                    : `Din ${dayNum} locked`
                }
              >
                <span className="birthday-cell-num">{dayNum}</span>
                {unlocked ? (
                  <span className="birthday-cell-icon">{isFinale ? '🎂' : '💝'}</span>
                ) : (
                  <span className="birthday-cell-icon birthday-cell-lock">🔒</span>
                )}
                {today && <span className="birthday-cell-today-label">Aaj</span>}
              </button>
            )
          })}
        </div>
      </section>

      <footer className="birthday-footer">
        <p>Har din tumhare liye likha hai — dil se ❤️</p>
      </footer>

      <AnimatePresence>
        {selectedDay && (
          <DayGiftModal
            dayData={selectedDay}
            onClose={closeModal}
            onImageClick={() => setViewerIndex(selectedDay.day - 1)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewerIndex != null && !showFinale && (
          <BirthdayImageViewer
            images={collageImages}
            startIndex={viewerIndex}
            labelForIndex={(i) => `Din ${i + 1} · ${i + 1}/24`}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </AnimatePresence>

      {showFinale && (
        <BirthdayFinale finaleData={finaleData} onClose={() => setShowFinale(false)} />
      )}
    </div>
  )
}
