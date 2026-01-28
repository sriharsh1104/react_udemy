/**
 * Preposition Quiz (15 images, 15 questions)
 * - Har image sirf ek baar use hoti hai.
 * - Simple prepositions: on, in front of, next to, between.
 * - Chote bacchon ke liye: picture dekho, sahi preposition choose karo.
 */
const BASE = 'https://upload.wikimedia.org/wikipedia/commons'

export const PREPOSITION_QUESTIONS = [
  // ON
  { imageUrl: `${BASE}/b/bd/Happy_kid_on_a_bike%2C_front_view%3B_by_AI%3B_%27There%27s_Joy_in_Having_Wheels%27.jpg`, correct: 'on', wrong: ['in', 'under'] },
  { imageUrl: `${BASE}/2/22/Building_blocks.png`, correct: 'on', wrong: ['in', 'next to'] },
  { imageUrl: `${BASE}/6/6a/Cute_little_girl_sitting.jpg`, correct: 'on', wrong: ['under', 'between'] },
  { imageUrl: `${BASE}/2/26/Preston_Park_Playground.jpg`, correct: 'on', wrong: ['under', 'behind'] },
  { imageUrl: `${BASE}/1/16/Creative_Commons_Birthday_Cake_and_Candles_%284825652728%29.jpg`, correct: 'on', wrong: ['in', 'between'] },

  // IN FRONT OF
  { imageUrl: `${BASE}/b/b3/The_children_at_the_doorstep.jpg`, correct: 'in front of', wrong: ['behind', 'under'] },
  { imageUrl: `${BASE}/8/89/Standing_girl.jpg`, correct: 'in front of', wrong: ['behind', 'between'] },
  { imageUrl: `${BASE}/9/96/Child_looking_at_camera_%28Unsplash%29.jpg`, correct: 'in front of', wrong: ['next to', 'between'] },

  // NEXT TO
  { imageUrl: `${BASE}/7/73/Children_searching_for_minnows.jpg`, correct: 'next to', wrong: ['between', 'behind'] },
  { imageUrl: `${BASE}/c/c3/Waldm%C3%BCller_-_Singende_Kinder.jpeg`, correct: 'next to', wrong: ['between', 'behind'] },
  { imageUrl: `${BASE}/6/63/Girls_dancing.jpg`, correct: 'next to', wrong: ['between', 'under'] },

  // BETWEEN
  { imageUrl: `${BASE}/3/32/Lego_Color_Bricks.jpg`, correct: 'between', wrong: ['next to', 'behind'] },
  { imageUrl: `${BASE}/c/c9/Basesotho_reading_session_01.jpg`, correct: 'between', wrong: ['next to', 'behind'] },
  { imageUrl: `${BASE}/9/9a/Clean_up.jpg`, correct: 'between', wrong: ['next to', 'under'] },
  { imageUrl: `${BASE}/c/ce/Wrapped_gift.jpg`, correct: 'between', wrong: ['next to', 'under'] },
]
