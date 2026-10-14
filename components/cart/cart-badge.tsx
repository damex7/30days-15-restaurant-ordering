// CLIENT COMPONENT: it reads the cart from context, which only exists in the
// browser. It's deliberately tiny, a link and a number, so the header around
// it stays a Server Component.
'use client'

import Link from 'next/link'
import { Icon } from '@/components/ui/icon'
import { useCart } from '@/components/cart/cart-provider'

export function CartBadge() {
  const { snapshot } = useCart()
  // null = not read from localStorage yet (server render and hydration).
  // We show NO number then, rather than a wrong "0".
  const count = snapshot ? snapshot.cart.lines.reduce((n, l) => n + l.quantity, 0) : null

  return (
    <Link
      href="/cart"
      className="relative grid size-11 place-items-center rounded-pill text-ink transition-colors hover:bg-sunken"
      aria-label={count === null ? 'Cart' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <Icon name="cart" className="size-6" />
      {count !== null && count > 0 && (
        <span
          // A new key on every change replays the little "bump" animation.
          key={count}
          aria-hidden
          className="tabular absolute -top-0.5 -right-0.5 grid h-5 min-w-5 animate-bump place-items-center rounded-pill bg-chilli px-1 text-xs font-bold text-chilli-ink"
        >
          {count}
        </span>
      )}
    </Link>
  )
}
