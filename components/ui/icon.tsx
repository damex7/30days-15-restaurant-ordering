import type { ReactElement } from 'react'
import { cn } from '@/lib/cn'

/*
  A tiny inline-SVG icon set (no icon library today). Each entry is the inside
  of a 24×24 stroked SVG.

  SERVER COMPONENT: it has no state and no event handlers, so it renders on
  the server and ships as plain SVG markup. It is also safe to use INSIDE
  Client Components: a component with no server-only imports can be
  imported from either side, and then it is bundled for the browser too.

  `satisfies Record<string, ReactElement>` checks every value is an element,
  while `keyof typeof ICONS` turns the keys into the IconName union, so
  <Icon name="flmae" /> is a compile error.
*/
const ICONS = {
  cart: (
    <>
      <path d="M5 7h14l-1.2 10.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z" />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: (
    <>
      <path d="M4.5 7h15M10 11v6m4-6v6" />
      <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7M9.5 7V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronLeft: <path d="m14.5 6-6 6 6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  arrowRight: <path d="M5 12h14m-5-5 5 5-5 5" />,
  arrowLeft: <path d="M19 12H5m5-5-5 5 5 5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16.5" r="3" />
      <circle cx="18" cy="16.5" r="3" />
      <path d="M6 16.5 9.5 9h5l3.5 7.5M9.5 9 8 6.5H5.5m9 2.5 1-3h2.5M11 16.5h3.5" />
    </>
  ),
  bag: (
    <>
      <path d="M4.5 8.5h15l-1 11h-13l-1-11Z" />
      <path d="M8.5 8.5a3.5 3.5 0 0 1 7 0" />
    </>
  ),
  table: (
    <>
      <path d="M3.5 9h17M6 9v10m12-10v10M8 13h8" />
      <path d="M7 5.5h10" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.5 2.5 4.5-5" />
    </>
  ),
  x: <path d="M6.5 6.5l11 11m0-11-11 11" />,
  flame: <path d="M12 21a6 6 0 0 0 6-6c0-3.5-2.5-5.5-3.5-8.5-.8 2-2 3-3 3.5.2-2.2-.6-4.6-2.5-6.5 0 3.5-3 5.5-3 9.5a6 6 0 0 0 6 8Z" />,
  leaf: (
    <>
      <path d="M5 19C5 10 10 5 20 4c-.5 10-5.5 15-14 15H5Z" />
      <path d="M5 19c3-4 6-7 10-9.5" />
    </>
  ),
  nut: (
    <>
      <path d="M9.5 4.5c2.5-1 5 .5 5.5 3 .3 1.5-.5 2.5.5 4s2.5 2 2.5 4.5a4.5 4.5 0 0 1-8.8 1.3c-.4-1.5.3-2.8-.7-4.1-1-1.3-2.5-1.6-2.5-4.2 0-2 1.3-3.8 3.5-4.5Z" />
      <path d="M11 8h.01M13.5 15h.01M10.5 12h.01" />
    </>
  ),
  fish: (
    <>
      <path d="M3 12c2.5-4 6-5.5 9.5-5.5 3.5 0 6.5 2.5 8.5 5.5-2 3-5 5.5-8.5 5.5S5.5 16 3 12Z" />
      <path d="M3 12 1.5 9m1.5 3-1.5 3M16 11h.01" />
    </>
  ),
  chat: (
    <>
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 19.5l1.1-3.9A8 8 0 1 1 20 11.5Z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.4-1.8-1.2-2.3-2.3l.8-1-1-2L9 9.5Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4.5M12 17h.01" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3.5" />
    </>
  ),
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  star: <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 4Z" />,
  utensils: (
    <>
      <path d="M7 3.5v17M4.5 3.5v5a2.5 2.5 0 0 0 5 0v-5" />
      <path d="M17 20.5v-17c-2.2 1-3.5 3.5-3.5 7v3H17" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4.5v4h-4" />
    </>
  ),
  sparkle: <path d="M12 3.5c.6 4 2.5 6.5 7.5 8.5-5 2-6.9 4.5-7.5 8.5-.6-4-2.5-6.5-7.5-8.5 5-2 6.9-4.5 7.5-8.5Z" />,
} satisfies Record<string, ReactElement>

export type IconName = keyof typeof ICONS

/**
 * Decorative by default (aria-hidden): an icon next to a word adds nothing for
 * a screen reader. Pass `label` when the icon is the only content.
 */
export function Icon({ name, className, label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-5 shrink-0', className)}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  )
}
