/**
 * Birthday countdown content — edit names, messages, and images here.
 * Photos go in public/birthday/ (hero.jpg, day-01.jpg, etc.)
 * Password: set VITE_BIRTHDAY_PIN in .env or change defaultPassword below.
 */

export const config = {
  herName: 'Jaanu',
  pageTitle: 'Happy birthday baby',
  nickname: 'meri jaan',
  herDob: '24061994',
  myDob: '11031998',
  passwordPlaceholder: 'DDMMYYYY',
  /** Sirf hint UI — asli password nahi */
  hintExampleDob: '07042000',
  hintExampleLabel: '7 April 2000',
  birthday: '2026-06-24',
  calendarStart: '2026-06-01',
  heroImage: '/birthday/hero.jpg',
  subtitle: '24 din, 24 baatein… sab tumhare liye',
  relationshipStart: null,
  relationshipBadge: '7 years 150 days se tum meri duniya ho',
  /** Pehli baar saath game — ISO date; DOB auto: DDMMYYYY */
  firstGameTogether: '2019-01-02',
  firstGameTogetherLabel: '2 January 2019',
  secretPath: '/',
  /** Testing: saare din unlock — prod se pehle false kar dena */
  unlockAllDays: true,
}

export const STORAGE_KEY = 'birthday_unlocked_v1'

/** Env VITE_BIRTHDAY_TEST_MODE=true|false overrides unlockAllDays */
export function isBirthdayTestMode() {
  const env = import.meta.env.VITE_BIRTHDAY_TEST_MODE
  if (env === 'true') return true
  if (env === 'false') return false
  return config.unlockAllDays === true
}

/** Calendar date → DDMMYYYY (e.g. 2019-01-02 → 02012019) */
export function dateToDob(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}${m}${y}`
}

export function getFirstGameDob() {
  return dateToDob(config.firstGameTogether)
}

export function getValidPasswords() {
  const fromEnv = import.meta.env.VITE_BIRTHDAY_PIN
  if (fromEnv) {
    return fromEnv.split(',').map((p) => p.trim()).filter(Boolean)
  }
  const gameDob = getFirstGameDob()
  return [config.herDob, config.myDob, gameDob].filter(Boolean)
}

export function isValidPassword(input) {
  const trimmed = input.trim()
  return getValidPasswords().includes(trimmed)
}

export const dayImagePath = (n) => `/birthday/day-${String(n).padStart(2, '0')}.jpg`

/** All 24 day photos — day 24 collage ke liye */
export const collageImages = Array.from({ length: 24 }, (_, i) => dayImagePath(i + 1))

const day = (n, title, message, extras = {}) => ({
  day: n,
  type: 'gift',
  title,
  message,
  image: extras.image ?? (extras.skipImage ? null : dayImagePath(n)),
  spotifyUrl: extras.spotifyUrl ?? '',
  youtubeUrl: extras.youtubeUrl ?? '',
  reason: extras.reason ?? '',
})

export const days = [
  day(1, 'Shuruwat', 'June shuru hua aur maine socha — har din tumhe kuch chhota sa bataunga jo dil mein hai. Yeh sirf shuruat hai.', {
    reason: 'Tumhari muskurahat se din bright ho jata hai.',
  }),
  day(2, 'Pehli yaad', 'Yaad hai jab pehli baar tumse baat hui thi? Woh pal ab bhi fresh lagta hai.', {
    reason: 'Tum baat karte waqt kitni cute lagti ho.',
  }),
  day(3, 'Chhoti si baat', 'Kabhi kabhi kuch kehne ki zaroorat nahi hoti — bas tum paas ho, bas.', {
    reason: 'Tumhari presence hi kaafi hai.',
  }),
  day(4, 'Tumhari awaaz', 'Phone par tumhari awaaz sunte hi sab tension gayab ho jati hai.', {
    reason: 'Tumhari awaaz mujhe calm karti hai.',
  }),
  day(5, 'Woh smile', 'Jab tum hasti ho na… duniya thodi slow ho jati hai, main bas dekhta reh jata hoon.', {
    reason: 'Tumhari smile meri favourite cheez hai.',
  }),
  day(6, 'Weekend wali feeling', 'Chahe weekday ho ya weekend — tumhare message aate hi din special ban jata hai.', {
    reason: 'Tum message bhejti ho toh dil khush ho jata hai.',
  }),
  day(7, 'Ek hafta', 'Ek hafta ho gaya is journey ka. Abhi bahut kuch baaki hai — aur sab tumhare liye.', {
    reason: 'Har din tumse thoda aur pyaar ho jata hai.',
  }),
  day(8, 'Raat ki baatein', 'Raat ko tumhari baatein… stars se zyada sundar lagti hain.', {
    reason: 'Late night talks tumhare saath best hain.',
  }),
  day(9, 'Khana aur tum', 'Tum jo khana pasand karti ho — main note kar leta hoon. Ek din saath mein banayenge.', {
    reason: 'Tumhari pasand meri pasand ban gayi hai.',
  }),
  day(10, 'Dus din', 'Dus din — dus chhoti si baatein. Abhi chaudah aur hain, sab dil se.', {
    reason: 'Tum patient ho, caring ho — main lucky hoon.',
  }),
  day(11, 'Bina wajah', 'Koi special din nahi — phir bhi tum yaad aa gayi. Bina wajah bhi tum special ho.', {
    reason: 'Tum bina reason ke special ho.',
  }),
  day(12, 'Halfway feel', 'June ka aadha rasta — birthday aur paas aa raha hai, aur dil aur excited.', {
    reason: 'Birthday countdown dekh ke khushi hoti hai.',
  }),
  day(13, 'Lucky number nahi', '13 unlucky nahi jab tum ho — meri life mein yeh din bhi khaas hai.', {
    reason: 'Tum mere saath ho toh har din lucky hai.',
  }),
  day(14, 'Chaudah din', 'Do hafte ho gaye is calendar ke. Har din likhna easy hai jab dil sach ho.', {
    reason: 'Sachai tumhari baaton mein dikhti hai.',
  }),
  day(15, 'Mid-June', 'June ka beech — summer, aur tumhari yaadein dono garm hain dil ke liye.', {
    reason: 'Tum garmi mein bhi cool lagti ho.',
  }),
  day(16, 'Chhoti si gift', 'Aaj koi physical gift nahi — sirf yeh: main hamesha tumhare liye hoon.', {
    reason: 'Tum deserve karti ho sabse best.',
  }),
  day(17, 'Sapne', 'Kabhi sapne mein bhi tum aati ho. Subah uthke pehle tum yaad aati ho.', {
    reason: 'Subah ki pehli thought tum ho.',
  }),
  day(18, 'Almost there', 'Chhe din baaki birthday tak. Excitement badh raha hai.', {
    reason: 'Tumhari birthday celebrate karna chahta hoon duniya se zyada.',
  }),
  day(19, 'Ek reason aur', 'Aaj ka reason simple hai: tum ho, bas. Baaki sab bonus hai.', {
    reason: 'Tum ho — yahi kaafi reason hai.',
  }),
  day(20, 'Chaar din', 'Sirf chaar din. Har ek din tumhare liye count ho raha hai.', {
    reason: 'Countdown tumhare naam ka hai.',
  }),
  day(21, 'Teen din', 'Teen din baaki. Soch raha hoon birthday pe tumhe kaise surprise karoon.', {
    reason: 'Tumhari khushi meri priority hai.',
  }),
  day(22, 'Do din', 'Kal aur parson — phir tumhari special day. Dil fast beat kar raha hai.', {
    reason: 'Tumhari khushi dekhna chahta hoon.',
  }),
  day(23, 'Kal hai', 'Kal tumhara din hai. Aaj raat — bas yeh kehna chahta hoon: thank you for being you.', {
    reason: 'Tum perfect nahi, par mere liye perfect ho.',
  }),
  {
    day: 24,
    type: 'finale',
    title: 'Happy Birthday, meri jaan',
    letter: `My love,

Aaj tumhara din hai — 24 June. Yeh poora June maine socha tha kaise tumhe feel karwaun ki tum kitni special ho. Har din ek chhoti si baat thi, lekin sach yeh hai ki har din tum mere dil mein zyada jagah leti ho.

Tumhari muskurahat, tumhari baatein, tumhara saath — sab kuch priceless hai. Main lucky hoon ki tum meri life mein ho. Aaj aur hamesha — main tumhare saath hoon, tumhare liye hoon.

Happy Birthday! I love you. Ab cake kato, muskurao, aur yeh din apna bana lo — kyunki yeh din sirf tumhara hai.

Hamesha tumhara,
❤️`,
    images: collageImages,
  },
]

export function getDayByNumber(n) {
  return days.find((d) => d.day === n)
}
