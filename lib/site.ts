/*
  PUBLIC SITE SETTINGS, and the two kinds of environment variable.

  NEXT_PUBLIC_RESTAURANT_PHONE is PUBLIC: any variable whose name starts
  with NEXT_PUBLIC_ is copied into the JavaScript bundle at build time, so
  Client Components can read it (the error screens show it). Anyone can see
  it with View Source, which is fine for a number printed on the shop sign.

  Variables WITHOUT the prefix (RESTAURANT_WHATSAPP, ORDER_COOKIE_SECRET)
  exist only on the server. If a Client Component reads one, Next.js
  replaces it with an empty string in the bundle: it can't leak by
  accident. They're read in server-only files (lib/whatsapp.ts,
  lib/order-cookie.ts).

  The fallbacks below are placeholders for running the demo without a
  .env.local file.
*/

export const site = {
  name: 'Bùkà',
  tagline: 'Abuja’s home-style kitchen',
  description: 'Order jollof, swallow and soups, suya and small chops from Bùkà in Wuse 2, Abuja, for delivery, pickup or at your table.',
  publicPhone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+234 800 000 0000',
} as const
