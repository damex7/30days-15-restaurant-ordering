// THE ORDER COOKIE: where a placed order lives until Day 16 adds a database.
//
// `server-only`: this file holds the signing secret. Imported from a Client
// Component, it would be a build error, not a leaked key.
import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { err, ok, type Result } from '@/lib/result'
import { PlacedOrderSchema, type OrderId, type PlacedOrder } from '@/lib/schema/order'

/*
  WHY SIGN IT?

  The receipt is stored in the customer's own browser. Anything stored
  there can be edited: someone could open DevTools and change "total" to
  ₦1. So the cookie holds the order AND a signature:

      base64url(order JSON) . base64url(HMAC-SHA256(secret, that text))

  Only the server knows the secret, so only the server can make a matching
  signature. When the order page reads the cookie it recomputes the HMAC;
  if a single character of the order changed, they don't match and the
  page is a 404. (Signed, not encrypted: the customer may read their own
  receipt, they just can't change it.)

  The cookie is also httpOnly (page JavaScript can't read it), sameSite
  'lax' and, in production, secure (HTTPS only).
*/

const MAX_COOKIE_BYTES = 3800 // browsers allow about 4096 per cookie, name included
const MAX_AGE_SECONDS = 6 * 60 * 60 // a receipt is interesting for one evening
const cookieName = (id: OrderId) => `buka-order.${id}`

function secret(): string {
  const value = process.env.ORDER_COOKIE_SECRET
  if (value && value.length >= 32) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ORDER_COOKIE_SECRET must be set (at least 32 characters). See .env.example.')
  }
  // Local development only: a fixed, obviously-not-secret key.
  return 'dev-only-secret-do-not-use-in-production-0123456789'
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

export function encodeOrder(order: PlacedOrder): Result<string, 'too-large'> {
  const payload = Buffer.from(JSON.stringify(order)).toString('base64url')
  const value = `${payload}.${sign(payload)}`
  return value.length + cookieName(order.id).length > MAX_COOKIE_BYTES ? err('too-large') : ok(value)
}

/** Signature check, then schema check. Anything off → null (the page shows a 404). */
export function decodeOrder(value: string, id: OrderId): PlacedOrder | null {
  const [payload, signature, extra] = value.split('.')
  if (!payload || !signature || extra !== undefined) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature)
  // timingSafeEqual takes the same time whether the first or the last
  // character differs, so the signature can't be guessed one byte at a time.
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const parsed = PlacedOrderSchema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')))
    return parsed.success && parsed.data.id === id ? parsed.data : null
  } catch {
    return null
  }
}

/** Called from the Server Action. One cookie per order, so placing a second order keeps the first receipt. */
export async function saveOrderCookie(order: PlacedOrder, value: string) {
  const jar = await cookies()
  jar.set(cookieName(order.id), value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

/** Called from the order page, inside <Suspense>: cookies() is request-time data. */
export async function readOrderCookie(id: OrderId): Promise<PlacedOrder | null> {
  const value = (await cookies()).get(cookieName(id))?.value
  return value ? decodeOrder(value, id) : null
}
