import { useState, useEffect } from 'react'
import { getISTDateKey } from '../utils/birthdayDate'

/** Har minute IST date check — naya din (2 June…) unlock apne aap dikhe */
export function useISTDateTick() {
  const [dateKey, setDateKey] = useState(() => getISTDateKey())

  useEffect(() => {
    const tick = () => {
      const next = getISTDateKey()
      setDateKey((prev) => (prev === next ? prev : next))
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  return dateKey
}
