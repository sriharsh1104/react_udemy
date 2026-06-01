import { isBirthdayTestMode } from '../data/birthdayCalendar'

const TZ = 'Asia/Kolkata'

/** YYYY-MM-DD in IST — re-render trigger ke liye */
export function getISTDateKey() {
  const t = getTodayIST()
  const m = String(t.month).padStart(2, '0')
  const d = String(t.day).padStart(2, '0')
  return `${t.year}-${m}-${d}`
}

/** Today's calendar date parts in IST */
export function getTodayIST() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type) => parts.find((p) => p.type === type)?.value
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
  }
}

export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m, day: d }
}

/** June day number (1–24) from calendar start, or null if outside range */
export function getCurrentJuneDay(calendarStart, birthday) {
  const today = getTodayIST()
  const start = parseISODate(calendarStart)
  const end = parseISODate(birthday)

  if (today.year !== start.year) return null
  if (today.month < start.month || today.month > end.month) return null
  if (today.month === start.month && today.day < start.day) return null
  if (today.month === end.month && today.day > end.day) return null

  if (today.month === 6) return today.day
  return null
}

/** Day N (1–24) is unlocked if today (IST) >= June N in same year as birthday */
export function isDayUnlocked(dayNum, calendarStart, birthday) {
  if (isBirthdayTestMode()) return true

  const today = getTodayIST()
  const start = parseISODate(calendarStart)
  const end = parseISODate(birthday)

  if (today.year < end.year) return false
  if (today.year > end.year) return dayNum <= 24

  if (today.month < 6 || (today.month === 6 && today.day < dayNum)) return false
  if (today.month === 6 && today.day >= dayNum) return true
  if (today.month > 6) return true

  return today.month === start.month && today.day >= dayNum
}

export function isTodayDay(dayNum) {
  const today = getTodayIST()
  return today.month === 6 && today.day === dayNum
}

/** Din guzar chuka (IST) — aaj wala nahi; test mode unlock par bhi date se */
export function isPastDay(dayNum, calendarStart, birthday) {
  if (isTodayDay(dayNum)) return false

  const current = getCurrentJuneDay(calendarStart, birthday)
  if (current != null) return dayNum < current

  const today = getTodayIST()
  const end = parseISODate(birthday)

  if (today.year > end.year) return dayNum <= 24
  if (today.year === end.year && today.month > end.month) return true
  if (today.year === end.year && today.month === 6 && today.day > dayNum) return true

  return false
}

export function getCountdownToBirthday(birthdayISO) {
  const startIST = new Date(`${birthdayISO}T00:00:00+05:30`)
  const now = new Date()
  let diff = startIST.getTime() - now.getTime()
  const isPast = diff <= 0
  if (diff < 0) diff = 0

  const totalSec = Math.floor(diff / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  return { days, hours, minutes, seconds, isPast }
}

export function getRelationshipDays(startISO) {
  if (!startISO) return null
  const start = new Date(`${startISO}T00:00:00+05:30`)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff >= 0 ? diff : null
}

/** Day numbers 1–24 that are unlocked today (IST) */
export function getUnlockedDayNumbers(calendarStart, birthday) {
  return Array.from({ length: 24 }, (_, i) => i + 1).filter((dayNum) =>
    isDayUnlocked(dayNum, calendarStart, birthday)
  )
}
