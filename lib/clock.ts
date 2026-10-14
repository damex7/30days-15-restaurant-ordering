// THE SERVER'S CLOCK. Every "what time is it?" in Bùkà comes from here.
//
// `server-only`: the answer to "is the kitchen open?" must be the server's
// answer, worked out in Lagos time (lib/hours.ts), never a phone's. Importing
// this file from a Client Component is a build error, so nobody can
// accidentally compute opening status in the browser.
import 'server-only'

import { io } from 'next/cache'
import { lagosParts, toMinutes } from '@/lib/hours'

/*
  WHY `await io()` FIRST

  With Cache Components, Next.js prerenders every page at build time and asks
  of each value: "same for every visitor, or fresh per request?". The
  current time is fresh per request, but `new Date()` is synchronous, so
  Next.js can't tell by itself. Reading it without saying so fails the build
  with a "blocking-prerender-current-time" error.

  `await io()` is how we say "real input/output follows: don't bake this into
  the static HTML". During the build it suspends, so the nearest <Suspense>
  fallback goes into the static shell instead; during a real request it
  resolves immediately. Every component that calls now() is therefore
  rendered inside <Suspense> and streams in per request.
*/

/**
 * TESTING AT NIGHT: set BUKA_CLOCK=13:00 in .env.local and the server's
 * clock is moved so that Lagos time reads 13:00 when the server starts, then
 * keeps ticking from there. Without it, the real time is used. (This is
 * read from a normal env var, so it only exists on the server.)
 */
let offsetMs: number | null = null
function clockOffsetMs(): number {
  if (offsetMs !== null) return offsetMs
  const target = process.env.BUKA_CLOCK
  if (!target || !/^([01]\d|2[0-3]):[0-5]\d$/.test(target)) return (offsetMs = 0)
  const nowMinutes = lagosParts(new Date()).minutes
  offsetMs = (toMinutes(target) - nowMinutes) * 60_000
  console.info(`[clock] BUKA_CLOCK=${target}: Lagos time shifted by ${Math.round(offsetMs / 60_000)} minutes`)
  return offsetMs
}

/** The current instant, as far as the restaurant is concerned. */
export async function now(): Promise<Date> {
  await io()
  return new Date(Date.now() + clockOffsetMs())
}

/**
 * Speeds up the order timeline for demos: BUKA_TIME_SCALE=0.1 turns a
 * 20-minute kitchen into 2 minutes, so you can watch the status tracker move
 * without waiting. Defaults to 1 (real time).
 */
export function orderTimeScale(): number {
  const scale = Number(process.env.BUKA_TIME_SCALE)
  return Number.isFinite(scale) && scale >= 0.01 && scale <= 1 ? scale : 1
}
