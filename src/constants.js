// Backend API Configuration
// Priority: .env.local > .env > default production URL
// For Vercel: Set VITE_BACKEND_URL environment variable in Vercel dashboard
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://react-udemy-r43h.onrender.com'

export const platforms = [
    { name: 'Netflix', url: 'https://www.netflix.com/', icon: 'svg' },
    { name: 'Amazon Prime', url: 'https://www.primevideo.com/', icon: 'svg' },
    { name: 'Hotstar', url: 'https://www.hotstar.com/', icon: 'svg' },
    { name: 'Sony LIV', url: 'https://www.sonyliv.com/', icon: 'svg' },
    { name: 'ZEE5', url: 'https://www.zee5.com/', icon: 'svg' },
    { name: 'FanCode', url: 'https://www.fancode.com/', icon: 'svg' },
    { name: 'YouTube', url: 'https://www.youtube.com/', icon: 'svg' },
    { name: 'Ottplay', url: 'https://ottplay.com/', icon: '🎬' },
    
  ]

export const pSites = [
  { name: 'HdHub4u', url: 'https://hdhub4u.gd/' },
  { name: 'WorldFree4u', url: 'https://worldfree4u.prof/' },
  { name: 'FilmyZillaMoviez', url: 'https://filmyzillamoviez.com/' },
  { name: 'IndexMovies', url: 'http://103.145.232.246/Data/movies/' },
  { name: 'Movies4u', url: 'https://movies4u.sx/' },
]

export const sportsLinks = [
  { name: 'CricBuzz', url: 'https://www.cricbuzz.com/', icon: '🏏' },
  { name: 'LiveScore', url: 'https://www.livescore.com/en/', icon: '⚽' },
  { name: 'Football', url: 'https://onefootball.com/en/competition/premier-league-9/fixtures', icon: '⚽' },
  { name: 'Champions League', url: 'https://www.uefa.com/uefachampionsleague/standings/', icon: '🏆' }
]

export const esportsOfficialLinks = [
  { name: 'BGMI Esports (Official)', url: 'https://esports.battlegroundsmobileindia.com/', icon: '🎮' },
  { name: 'KRAFTON India Esports', url: 'https://www.youtube.com/@KraftonIndiaEsports', icon: '🇮🇳' },
  { name: 'Free Fire (Official)', url: 'https://ff.garena.com/en', icon: '🔥' },
  { name: 'Free Fire India Official', url: 'https://www.youtube.com/@FreeFireIndiaOfficial', icon: '🔥' },
  { name: 'BGMI', url: 'https://www.instagram.com/battlegroundsmobilein_official/?hl=en', icon: '📸' },
  { name: 'Free Fire India', url: 'https://www.instagram.com/freefireindiaofficial/', icon: '📸' },
  // Clash of Clans
  { name: 'Clash of Clans (Official)', url: 'https://supercell.com/en/games/clashofclans/', icon: '🛡️' },
  { name: 'Clash of Clans YouTube', url: 'https://www.youtube.com/@ClashOfClans', icon: '▶️' },
  { name: 'Clash of Clans Instagram', url: 'https://www.instagram.com/clashofclans/?hl=en', icon: '📸' },
  // Call of Duty Mobile
  { name: 'Call of Duty: Mobile (Official)', url: 'https://www.callofduty.com/mobile', icon: '🪖' },
  { name: 'Call of Duty: Mobile YouTube', url: 'https://www.youtube.com/@callofdutymobile', icon: '▶️' },
  { name: 'Call of Duty: Mobile Instagram', url: 'https://www.instagram.com/callofdutymobile/?hl=en', icon: '📸' }
]

export const esportsThirdPartyLinks = [
  {
    name: 'NODWIN Gaming',
    icon: '🏟️',
    games: ['BGMI'],
    links: [
      { type: 'Website', url: 'https://nodwingaming.com/' },
      { type: 'YouTube', url: 'https://www.youtube.com/@NODWINGaming' },
      { type: 'Instagram', url: 'https://www.instagram.com/nodwingaming/?hl=en' }
    ]
  },
  {
    name: 'Skyesports',
    icon: '🎮',
    games: ['BGMI'],
    links: [
      { type: 'Website', url: 'https://skyesports.in/' },
      { type: 'YouTube', url: 'http://youtube.com/@skyesportsgaming' },
      { type: 'Instagram', url: 'https://www.instagram.com/skyesportsgaming/?hl=en' }
    ]
  },
  {
    name: 'Upthrust Esports',
    icon: '🚀',
    games: ['BGMI'],
    links: [
      { type: 'Website', url: 'https://www.upthrustesports.com/' },
      { type: 'YouTube', url: 'https://www.youtube.com/@upthrustesports' },
      { type: 'Instagram', url: 'https://www.instagram.com/upthrust_esports/?hl=en' }
    ]
  },
  {
    name: 'Lidoma Esports',
    icon: '🎯',
    games: ['Free Fire'],
    links: [
      { type: 'Website', url: 'https://lidoma.com/' },
      { type: 'YouTube', url: 'https://www.youtube.com/@LidomaAsia' },
      { type: 'Instagram', url: 'https://www.instagram.com/lidoma.asia/?hl=en' }
    ]
  }
]

export const esportsCasters = [
  // BGMI Casters
  {
    name: 'Ocean Sharma',
    game: 'BGMI',
    category: 'Play-by-Play Caster',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@OceanUnplugged',
    deserveReason: 'Known for energetic commentary and deep game knowledge. One of the most recognized voices in BGMI esports with years of experience.'
  },
  {
    name: 'Piyush "Spero" Bathla',
    game: 'BGMI',
    category: 'Color Commentary',
    language: 'English',
    youtubeUrl: 'https://www.youtube.com/@SpeRocasts',
    deserveReason: 'Exceptional analytical skills and ability to break down complex gameplay moments. Brings strategic insights that enhance viewer understanding.'
  },
  {
    name: 'Mazy',
    game: 'BGMI',
    category: 'Play-by-Play Caster',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@MazyisLive',
    deserveReason: 'High-energy play-by-play with clear fight callouts and timing; keeps pacing tight in late circles.'
  },
  {
    name: 'Ankibot',
    game: 'BGMI',
    category: 'Color Commentary',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@AnkiiiBOT',
    deserveReason: 'Strong mid-round analysis and rotation reads; simplifies complex macro for viewers without losing depth.'
  },
  {
    name: 'Nekro',
    game: 'BGMI',
    category: 'Host & Analyst',
    language: 'English',
    youtubeUrl: 'https://www.youtube.com/@Nekrouu',
    deserveReason: 'Smooth hosting with concise desk analysis; connects storylines between matches and day segments.'
  },
  {
    name: 'Fyxs',
    game: 'BGMI',
    category: 'Play-by-Play / Hybrid',
    language: 'English',
    youtubeUrl: 'https://www.youtube.com/@PAiNFyXs',
    deserveReason: 'Flexible voice who can swap between hype casting and key-fight breakdowns; consistent clarity under pressure.'
  },
  // Free Fire Casters
  {
    name: 'Evil',
    game: 'Free Fire',
    category: 'Play-by-Play Caster',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@Evil_official',
    deserveReason: 'Pure caster who actually narrates fights - explains how and why teams are fighting, the patterns and why certain strategies are necessary. Possesses deep knowledge of game mechanics and team tactics that helps viewers understand the strategic depth of competitive Free Fire.'
  },
  {
    name: 'Rocky Raichan',
    game: 'Free Fire',
    category: 'Color Commentary',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@ROCKYRDX',
    deserveReason: 'Best because good at linking big YouTuber and Esports creators. Does not know casting much - too much shouting. Always shows what he has done for the community and consistently demonstrates efforts to contribute something meaningful to the esports community.'
  },
  {
    name: 'Aura Gaming',
    game: 'Free Fire',
    category: 'Host & Play-by-Play',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@GamingAura',
    deserveReason: 'Versatile talent combining hosting skills with quality play-by-play commentary. Known for professional delivery and ability to guide viewers through tournament narratives.'
  },
  {
    name: 'Gaming with AB',
    game: 'Free Fire',
    category: 'Play-by-Play Caster',
    language: 'Hindi',
    youtubeUrl: 'https://www.youtube.com/@ArrowGaming',
    deserveReason: 'Passionate caster with clear communication style and strong game knowledge. Brings enthusiasm and clarity to Free Fire tournament broadcasts.'
  }
]