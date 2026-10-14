import type { DayHours, Restaurant } from '@/lib/schema/restaurant'

/*
  OPENING HOURS AND TIME SLOTS, ALWAYS IN LAGOS TIME

  Bùkà is in Abuja, so "open now" means open on Abuja's clock (West Africa
  Time, the Africa/Lagos time zone), whatever clock the visitor's phone or
  the server is set to. A customer in London at 9am is looking at a kitchen
  where it is 10am.

  WHY TIME CAUSES HYDRATION ERRORS: a page is rendered twice, once on the
  server (to HTML) and once in the browser (hydration), and React expects
  the same output both times. Code like `new Date().getHours() < 22 ?
  'Open' : 'Closed'` inside a Client Component breaks that in three ways:
    1. TIME ZONE: Vercel's servers run in UTC; the phone runs in its own
       zone. At 21:30 in Abuja the server says 20:30, the phone 21:30.
    2. TIME PASSES: the browser hydrates seconds (or, for a cached page,
       days) after the server rendered, so "now" is different.
    3. LOCALE: toLocaleTimeString() formats with the machine's language,
       and even ICU versions differ ("2:30 pm" with a plain space vs a narrow
       no-break space, U+202F), so the same instant becomes different text.
  The fix here: these functions take `now` as an ARGUMENT and the time zone
  is fixed. They are only CALLED on the server (via lib/clock.ts), and the
  browser receives finished strings like "Open until 10pm". There is
  nothing left for the two renders to disagree about.

  This module itself is pure (no clock, no secrets), so it's safe anywhere.
*/

export const LAGOS_TIME_ZONE = 'Africa/Lagos'
/**
 * Nigeria has used UTC+1 all year round with no daylight saving time, so a
 * Lagos wall-clock time converts to an instant with a fixed offset. (Zones
 * WITH daylight saving would need a real time-zone library for this step.)
 */
const LAGOS_UTC_OFFSET = '+01:00'

const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: LAGOS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
})
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

/** What a clock on the wall in Lagos shows at a given instant. */
export type LagosParts = {
  /** "2026-10-14" */
  ymd: string
  /** 0 = Sunday … 6 = Saturday */
  weekday: number
  /** Minutes since Lagos midnight, 0–1439. */
  minutes: number
}

export function lagosParts(date: Date): LagosParts {
  const p = Object.fromEntries(partsFormat.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    ymd: `${p.year}-${p.month}-${p.day}`,
    weekday: WEEKDAYS.indexOf(p.weekday as (typeof WEEKDAYS)[number]),
    minutes: Number(p.hour) * 60 + Number(p.minute),
  }
}

/** "HH:MM" → minutes since midnight. */
export const toMinutes = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/** The instant at which a Lagos wall clock shows `minutes` on day `ymd`. */
export function lagosInstant(ymd: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')
  return new Date(`${ymd}T${hh}:${mm}:00${LAGOS_UTC_OFFSET}`)
}

/** The calendar day after `ymd` (UTC arithmetic on a date with no time, so no zone surprises). */
function nextDay(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

const timeFormat = new Intl.DateTimeFormat('en-NG', { timeZone: LAGOS_TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true })

/** "2:30pm" in Lagos time. Server-side only in practice (see the note at the top). */
export function formatLagosTime(date: Date): string {
  return timeFormat
    .format(date)
    .replace(/\s/g, '') // "2:30 pm" (either kind of space) → "2:30pm"
    .toLowerCase()
    .replace(':00', '')
}

/** "22:00" → "10pm" for printed opening hours. */
export function formatClock(hhmm: string): string {
  const minutes = toMinutes(hhmm)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const suffix = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

// ---------------------------------------------------------------------------
// Open or closed?
// ---------------------------------------------------------------------------

export type KitchenStatus =
  | { kind: 'open'; lastOrders: string; closes: string }
  /** The doors are open but the kitchen has taken its last order. */
  | { kind: 'last-orders-passed'; closes: string; reopens: string }
  | { kind: 'closed'; reopens: string }

type HoursConfig = Pick<Restaurant, 'hours' | 'lastOrderMinutesBeforeClose'>

/** The next opening after `now`, as text: "today at 10am", "tomorrow at 12pm", "on Monday at 10am". */
function nextOpening(now: LagosParts, hours: readonly DayHours[]): string {
  const today = hours[now.weekday]
  if (today && now.minutes < toMinutes(today.open)) return `today at ${formatClock(today.open)}`
  for (let ahead = 1; ahead <= 7; ahead++) {
    const weekday = (now.weekday + ahead) % 7
    const day = hours[weekday]
    if (day) return `${ahead === 1 ? 'tomorrow' : `on ${DAY_NAMES[weekday]}`} at ${formatClock(day.open)}`
  }
  return 'soon'
}

export function kitchenStatus(now: Date, config: HoursConfig): KitchenStatus {
  const lagos = lagosParts(now)
  const today = config.hours[lagos.weekday]
  if (!today) return { kind: 'closed', reopens: nextOpening(lagos, config.hours) }
  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  const lastOrder = close - config.lastOrderMinutesBeforeClose
  if (lagos.minutes < open || lagos.minutes >= close) return { kind: 'closed', reopens: nextOpening(lagos, config.hours) }
  const lastOrderText = formatClock(`${String(Math.floor(lastOrder / 60)).padStart(2, '0')}:${String(lastOrder % 60).padStart(2, '0')}`)
  if (lagos.minutes >= lastOrder) return { kind: 'last-orders-passed', closes: formatClock(today.close), reopens: nextOpening({ ...lagos, minutes: 24 * 60 }, config.hours) }
  return { kind: 'open', lastOrders: lastOrderText, closes: formatClock(today.close) }
}

/** Is a dish with `availableFrom: '16:00'` being cooked at this moment? */
export function isAvailableNow(availableFrom: string | undefined, now: Date): boolean {
  return availableFrom === undefined || lagosParts(now).minutes >= toMinutes(availableFrom)
}

// ---------------------------------------------------------------------------
// Pickup slots
// ---------------------------------------------------------------------------

export type PickupSlot = {
  /** The slot as an ISO instant: what the form sends and the server checks. */
  value: string
  /** "Today" or "Tomorrow" */
  day: string
  /** "2:30pm" */
  time: string
}

type SlotConfig = HoursConfig & Pick<Restaurant, 'pickupLeadMinutes' | 'pickupSlotStepMinutes' | 'prepMinutes'>

/**
 * Every pickup time a customer may choose right now: on a 15-minute grid,
 * at least `pickupLeadMinutes` (30) from now, no earlier than the kitchen's
 * first batch of the day (opening + prep time), and no later than last
 * orders. Today and tomorrow only.
 *
 * The server calls this TWICE: once to render the <select>, and again inside
 * the Server Action to check the slot that came back is still allowed (the
 * customer may have left the checkout open for an hour).
 */
export function pickupSlots(now: Date, config: SlotConfig): PickupSlot[] {
  const lagos = lagosParts(now)
  const earliest = lagos.minutes + config.pickupLeadMinutes
  const step = config.pickupSlotStepMinutes
  const days = [
    { ymd: lagos.ymd, weekday: lagos.weekday, label: 'Today', from: earliest },
    { ymd: nextDay(lagos.ymd), weekday: (lagos.weekday + 1) % 7, label: 'Tomorrow', from: earliest - 24 * 60 },
  ]
  const slots: PickupSlot[] = []
  for (const day of days) {
    const hours = config.hours[day.weekday]
    if (!hours) continue
    const first = toMinutes(hours.open) + config.prepMinutes
    const last = toMinutes(hours.close) - config.lastOrderMinutesBeforeClose
    const start = Math.ceil(Math.max(first, day.from) / step) * step
    for (let m = start; m <= last; m += step) {
      const instant = lagosInstant(day.ymd, m)
      slots.push({ value: instant.toISOString(), day: day.label, time: formatLagosTime(instant) })
    }
  }
  return slots
}

/** The printed weekly hours: "Mon–Thu 10am–10pm" style rows. */
export function hoursTable(hours: readonly DayHours[]): { days: string; time: string }[] {
  // Monday-first for reading, grouping consecutive days with the same hours.
  const order = [1, 2, 3, 4, 5, 6, 0]
  const rows: { from: number; to: number; time: string }[] = []
  for (const weekday of order) {
    const day = hours[weekday]
    const time = day ? `${formatClock(day.open)}–${formatClock(day.close)}` : 'Closed'
    const prev = rows.at(-1)
    if (prev && prev.time === time) prev.to = weekday
    else rows.push({ from: weekday, to: weekday, time })
  }
  return rows.map((r) => ({ days: r.from === r.to ? (WEEKDAYS[r.from] ?? '') : `${WEEKDAYS[r.from]}–${WEEKDAYS[r.to]}`, time: r.time }))
}
