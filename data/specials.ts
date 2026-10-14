// TODAY'S SPECIALS: a different line-up for each day of the week, Sunday
// first. Which day it is depends on the clock in Lagos, so this is read at
// request time (see getTodaysSpecials in lib/data.ts), not at build time.

export type SpecialSeed = { slug: string; note: string }

export const specialsByWeekday: SpecialSeed[][] = [
  // Sunday
  [
    { slug: 'party-jollof', note: 'Sunday jollof, straight from the big pot after church.' },
    { slug: 'goat-pepper-soup', note: 'Pepper soup to close the weekend.' },
    { slug: 'chapman', note: 'Jugs are the Sunday table favourite.' },
  ],
  // Monday
  [
    { slug: 'amala', note: 'Àmàlà Monday: fresh gbẹ̀gìrì from 11am.' },
    { slug: 'moi-moi', note: 'Steamed this morning in uma leaves.' },
    { slug: 'zobo', note: 'A new batch brewed with extra ginger.' },
  ],
  // Tuesday
  [
    { slug: 'ofada-rice', note: 'Ofada stew with assorted meat, hot as ever.' },
    { slug: 'dodo', note: 'Very ripe plantain in this week.' },
    { slug: 'kunu', note: 'Fresh tiger nut milk, made today.' },
  ],
  // Wednesday
  [
    { slug: 'pounded-yam', note: 'Midweek iyán with ẹ̀gúsí.' },
    { slug: 'peppered-gizzard', note: 'A crowd favourite with a cold drink.' },
    { slug: 'puff-puff', note: 'Fried every 30 minutes.' },
  ],
  // Thursday
  [
    { slug: 'fried-rice', note: 'Party fried rice, any day of the week.' },
    { slug: 'beef-suya', note: 'The suya fire is lit at 4pm.' },
    { slug: 'ewa-agoyin', note: 'Agoyin sauce fried low and slow.' },
  ],
  // Friday
  [
    { slug: 'small-chops-platter', note: 'Friday small chops for the office.' },
    { slug: 'asun', note: 'Smoked on the suya grill after 4pm.' },
    { slug: 'chapman', note: 'Friday means jugs.' },
  ],
  // Saturday
  [
    { slug: 'grilled-fish', note: 'Saturday croaker, grilled after 4pm.' },
    { slug: 'eba', note: 'Ẹ̀bà with ẹ̀fọ́ rírò for a slow lunch.' },
    { slug: 'akara', note: 'Àkàrà and ògì all morning.' },
  ],
]
