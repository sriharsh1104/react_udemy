import React, { useEffect } from 'react'
import BirthdayGate from './BirthdayGate'
import BirthdayCountdown from './BirthdayCountdown'
import { config } from '../../data/birthdayCalendar'
import './Birthday.css'

export default function BirthdayPage() {
  useEffect(() => {
    const title = config.pageTitle || 'Happy birthday baby'
    document.title = title
    return () => {
      document.title = title
    }
  }, [])

  return (
    <BirthdayGate>
      <BirthdayCountdown />
    </BirthdayGate>
  )
}
