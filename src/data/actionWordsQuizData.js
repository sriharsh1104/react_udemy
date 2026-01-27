/**
 * Action Words Quiz: har question = ek image URL + us image ke mutabiq sahi preposition verb + 2 galat options.
 * Images Wikimedia Commons se (CC0 / CC BY-SA). Image jo dikhata hai, wahi correct answer hai.
 */
const BASE = 'https://upload.wikimedia.org/wikipedia/commons'

export const ACTION_WORDS_QUESTIONS = [
  { imageUrl: `${BASE}/4/43/Draw_Wake_up.png`, correct: 'wake up', wrong: ['brush off', 'run away'] },
  { imageUrl: `${BASE}/4/49/Toothpasteonbrush.jpg`, correct: 'brush off', wrong: ['wake up', 'eat up'] },
  { imageUrl: `${BASE}/0/02/Children_bathing_in_a_river.jpg`, correct: 'take a bath', wrong: ['wake up', 'fall asleep'] },
  { imageUrl: `${BASE}/d/d6/Girl_eating_a_heart_shaped_cookie_%2815117104341%29.jpg`, correct: 'eat up', wrong: ['drink up', 'run away'] },
  { imageUrl: `${BASE}/7/71/Quench_the_thirst.jpg`, correct: 'drink up', wrong: ['eat up', 'write down'] },
  { imageUrl: `${BASE}/d/d9/Children_walking_in_the_village.jpg`, correct: 'walk away', wrong: ['run away', 'sit down'] },
  { imageUrl: `${BASE}/a/a8/Boy_run.jpg`, correct: 'run away', wrong: ['walk away', 'wake up'] },
  { imageUrl: `${BASE}/c/c9/Basesotho_reading_session_01.jpg`, correct: 'read through', wrong: ['write down', 'think over'] },
  { imageUrl: `${BASE}/7/77/A-kid-drawing-or-writing.jpg`, correct: 'write down', wrong: ['read through', 'sing along'] },
  { imageUrl: `${BASE}/d/d2/The_Thinker_Musee_Rodin.jpg`, correct: 'think over', wrong: ['write down', 'wake up'] },
  { imageUrl: `${BASE}/6/63/Girls_dancing.jpg`, correct: 'dance to', wrong: ['sing along', 'play with'] },
  { imageUrl: `${BASE}/c/c3/Waldm%C3%BCller_-_Singende_Kinder.jpeg`, correct: 'sing along', wrong: ['dance to', 'ride on'] },
  { imageUrl: `${BASE}/b/bd/Happy_kid_on_a_bike%2C_front_view%3B_by_AI%3B_%27There%27s_Joy_in_Having_Wheels%27.jpg`, correct: 'ride on', wrong: ['run away', 'play with'] },
  { imageUrl: `${BASE}/c/c2/Child_Playing.jpg`, correct: 'play with', wrong: ['ride on', 'think over'] },
  { imageUrl: `${BASE}/3/38/Sleeping.png`, correct: 'fall asleep', wrong: ['wake up', 'run away'] },
  { imageUrl: `${BASE}/6/6a/Cute_little_girl_sitting.jpg`, correct: 'sit down', wrong: ['stand up', 'run away'] },
  { imageUrl: `${BASE}/2/20/A_child_jumping.jpg`, correct: 'jump up', wrong: ['sit down', 'fall asleep'] },
  { imageUrl: `${BASE}/5/5f/Girl_listening_to_radio.gif`, correct: 'listen to', wrong: ['sing along', 'write down'] },
  { imageUrl: `${BASE}/9/9a/Clean_up.jpg`, correct: 'clean up', wrong: ['eat up', 'wake up'] },
  { imageUrl: `${BASE}/8/89/Standing_girl.jpg`, correct: 'stand up', wrong: ['sit down', 'fall asleep'] },
  { imageUrl: `${BASE}/e/ea/Hold_my_hand.jpg`, correct: 'hold on to', wrong: ['let go of', 'run away'] },
  // New batch (~40 total)
  { imageUrl: `${BASE}/d/da/Crying_boy.jpg`, correct: 'cry out', wrong: ['laugh at', 'wake up'] },
  { imageUrl: `${BASE}/c/c9/Boy_swimming_in_lake.jpg`, correct: 'swim', wrong: ['run away', 'sit down'] },
  { imageUrl: `${BASE}/9/96/Child_looking_at_camera_%28Unsplash%29.jpg`, correct: 'look at', wrong: ['look for', 'turn away'] },
  { imageUrl: `${BASE}/c/cb/Family_Waiting_For_a_Flight_at_the_Airport.jpg`, correct: 'wait for', wrong: ['run away', 'give up'] },
  { imageUrl: `${BASE}/0/00/Boy_waving.gif`, correct: 'wave at', wrong: ['point at', 'hold on to'] },
  { imageUrl: `${BASE}/f/f2/Cute_girl_in_bed.jpg`, correct: 'lie down', wrong: ['stand up', 'wake up'] },
  { imageUrl: `${BASE}/b/b6/Child_playing_in_sand.jpg`, correct: 'play in', wrong: ['clean up', 'run away'] },
  { imageUrl: `${BASE}/1/16/Creative_Commons_Birthday_Cake_and_Candles_%284825652728%29.jpg`, correct: 'blow out', wrong: ['eat up', 'turn on'] },
  { imageUrl: `${BASE}/6/64/Pointing-finger.png`, correct: 'point at', wrong: ['wave at', 'hold on to'] },
  { imageUrl: `${BASE}/2/22/Building_blocks.png`, correct: 'build up', wrong: ['knock down', 'throw away'] },
  { imageUrl: `${BASE}/e/e7/Giving_a_gift.jpg`, correct: 'give back', wrong: ['take away', 'throw away'] },
  { imageUrl: `${BASE}/3/32/Lego_Color_Bricks.jpg`, correct: 'pile up', wrong: ['clean up', 'throw away'] },
  { imageUrl: `${BASE}/7/73/Children_searching_for_minnows.jpg`, correct: 'look for', wrong: ['run away', 'give up'] },
  { imageUrl: `${BASE}/2/26/Preston_Park_Playground.jpg`, correct: 'climb up', wrong: ['sit down', 'fall asleep'] },
  { imageUrl: `${BASE}/c/ce/Wrapped_gift.jpg`, correct: 'wrap up', wrong: ['throw away', 'take off'] },
  { imageUrl: `${BASE}/0/02/Illuminated_light_switch.jpg`, correct: 'turn on', wrong: ['turn off', 'blow out'] },
  { imageUrl: `${BASE}/b/b3/The_children_at_the_doorstep.jpg`, correct: 'knock on', wrong: ['run away', 'give up'] },
  { imageUrl: `${BASE}/f/f6/A_double_toggle_light_switch.jpg`, correct: 'turn off', wrong: ['turn on', 'blow out'] }
]
