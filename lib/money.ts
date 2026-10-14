import { z } from 'zod'

/*
  MONEY RULE (the same as Days 9, 12 and 14): every amount in Bùkà is a whole
  number of KOBO (₦1 = 100 kobo). Kobo only become "₦4,500" when printed, and
  that happens in exactly one place: formatNaira().

  Why not naira with decimals? JavaScript numbers are binary floating point:
      0.1 + 0.2   → 0.30000000000000004
  Integers don't drift. Party jollof at 450000 kobo is exact, and so is the
  total of any number of plates.

  This module has no "use client" and no "server-only": it is SHARED code.
  The menu (a Server Component) and the cart (a Client Component) both import
  it, and each side gets its own copy. Plain functions with no secrets and
  no browser APIs can live on both sides of the boundary.
*/

/** A whole, non-negative number of kobo. */
export const KoboSchema = z.number().int({ error: 'Money is stored in whole kobo' }).nonnegative()
export type Kobo = z.infer<typeof KoboSchema>

/** Add up amounts. Integers in, integer out. */
export const sumKobo = (amounts: readonly Kobo[]): Kobo => amounts.reduce((total, k) => total + k, 0)

const whole = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol', // "₦", not "NGN"
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const withKobo = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * THE place kobo becomes text. Whole-naira amounts drop the ".00" (₦4,500);
 * anything with kobo shows two decimals (₦4,500.50).
 *
 * The locale ('en-NG') is fixed, never the browser's default. If the server
 * formatted with one locale and the browser with another, the same price
 * would render as two different strings and React would report a hydration
 * mismatch. Fixed inputs → identical output on both sides.
 */
export function formatNaira(kobo: Kobo): string {
  if (!Number.isFinite(kobo)) return '₦—'
  const abs = Math.abs(kobo)
  const text = (abs % 100 === 0 ? whole : withKobo).format(abs / 100)
  return kobo < 0 ? `−${text}` : text
}

/** "+₦500" for a choice that changes the price, "" for a free one. */
export const formatDelta = (kobo: Kobo): string => (kobo === 0 ? '' : `+${formatNaira(kobo)}`)
