import React, { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  config,
  days,
  isBirthdayTestMode,
  dayImagePath,
  getRelationshipBadgeText,
} from '../../data/birthdayCalendar'
import BirthdayImageViewer from './BirthdayImageViewer'
import {
  getCountdownToBirthday,
  isDayUnlocked,
  isTodayDay,
  isPastDay,
  getUnlockedDayNumbers,
  getCurrentJuneDay,
} from '../../utils/birthdayDate'
import { useISTDateTick } from '../../hooks/useISTDateTick'
import DayGiftPanel from './DayGiftPanel'
import BirthdayFinale from './BirthdayFinale'

export default function BirthdayCountdown() {
  const dateKey = useISTDateTick()
  const [countdown, setCountdown] = useState(() => getCountdownToBirthday(config.birthday))
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

  const finaleData = days.find((d) => d.day === 24 && d.type === 'finale')
  const relationshipBadge = getRelationshipBadgeText()
  const currentJuneDay = getCurrentJuneDay(config.calendarStart, config.birthday)
  const activeDayData = useMemo(
    () => (heroDay != null && heroDay < 24 ? days.find((d) => d.day === heroDay) : null),
    [heroDay]
  )

  const unlockedSlides = (() => {
    void dateKey
    const dayNums = getUnlockedDayNumbers(config.calendarStart, config.birthday)
    return dayNums.map((day) => ({
      day,
      src: dayImagePath(day),
    }))
  })()

  const openViewerForDay = (dayNum) => {
    if (!isDayUnlocked(dayNum, config.calendarStart, config.birthday)) return
    const idx = unlockedSlides.findIndex((s) => s.day === dayNum)
    if (idx >= 0) setViewerIndex(idx)
  }

  const canFullscreen =
    heroDay != null && isDayUnlocked(heroDay, config.calendarStart, config.birthday)

  useEffect(() => {
    if (heroDay == null) return
    if (!isDayUnlocked(heroDay, config.calendarStart, config.birthday)) {
      setHeroDay(null)
      setViewerIndex(null)
    }
  }, [dateKey, heroDay])

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
      return
    }
  }

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
            onClick={() => canFullscreen && openViewerForDay(heroDay)}
            aria-label="Photo fullscreen dekho"
            disabled={!canFullscreen}
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
            {canFullscreen && (
              <span className="birthday-hero-expand">Tap — poori photo</span>
            )}
          </button>
          <div className="birthday-hero-overlay" aria-hidden="true" />
          <div className="birthday-hero-text">
            <h1 className="birthday-hero-title">{config.pageTitle || 'Happy birthday baby'}</h1>
            <p className="birthday-hero-name">{config.herName}</p>
            {activeDayData ? (
              <>
                <p className="birthday-hero-day-tag">Din {heroDay}</p>
                <p className="birthday-hero-active-title">{activeDayData.title}</p>
              </>
            ) : (
              <p className="birthday-hero-sub">{config.subtitle}</p>
            )}
            <span className="birthday-badge">{relationshipBadge}</span>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {activeDayData && (
          <DayGiftPanel
            dayData={activeDayData}
            onFullscreen={() => openViewerForDay(heroDay)}
          />
        )}
      </AnimatePresence>

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
        <p className="birthday-section-hint">
          Din chuno — photo upar badlegi, neeche message dikhega
        </p>
        {currentJuneDay != null && (
          <p className="birthday-today-unlock" role="status">
            Aaj <strong>Din {currentJuneDay}</strong> unlock — kal agla din khulega (IST)
          </p>
        )}

        {lockedHint && (
          <p className="birthday-locked-toast" role="status">
            Din {lockedHint} abhi lock hai… kal khulega, thoda sabr 💕
          </p>
        )}

        <div className="birthday-calendar-grid">
          {Array.from({ length: 24 }, (_, i) => {
            void dateKey
            const dayNum = i + 1
            const unlocked = isDayUnlocked(dayNum, config.calendarStart, config.birthday)
            const today = isTodayDay(dayNum)
            const passed = isPastDay(dayNum, config.calendarStart, config.birthday)
            const isFinale = dayNum === 24

            let stateClass = 'birthday-cell-locked'
            if (unlocked) stateClass = 'birthday-cell-unlocked'
            if (passed) stateClass += ' birthday-cell-past'
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
                {passed && !today && (
                  <span className="birthday-cell-past-label" aria-hidden="true">
                    ✓
                  </span>
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
        {viewerIndex != null && !showFinale && unlockedSlides.length > 0 && (
          <BirthdayImageViewer
            images={unlockedSlides.map((s) => s.src)}
            startIndex={viewerIndex}
            labelForIndex={(i) =>
              `Din ${unlockedSlides[i].day} · ${i + 1}/${unlockedSlides.length}`
            }
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
