// CLIENT COMPONENT: it reads the cart (context) and the current URL
// (usePathname), and both only exist in the browser.
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/components/cart/cart-provider'
import { Icon } from '@/components/ui/icon'
import { summariseCart } from '@/lib/cart/summary'
import { formatNaira } from '@/lib/money'

/** Pages where the bar would only repeat what's on screen. */
const HIDDEN_ON = ['/cart', '/checkout', '/order/']

/**
 * The "View cart" bar pinned to the bottom of the screen on phones, where
 * most orders come from. It appears once something is in the cart. On wider
 * screens the header badge does the same job, so it's hidden there.
 *
 * The subtotal here is a PREVIEW, priced from the catalogue the server sent.
 * The checkout's Server Action works the real total out again.
 */
export function StickyCartBar() {
  const pathname = usePathname()
  const { snapshot, catalog } = useCart()
  if (!snapshot || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null
  const summary = summariseCart(snapshot.cart, catalog)
  if (summary.itemCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <Link
        href="/cart"
        className="flex animate-pop items-center gap-3 rounded-card bg-forest px-4 py-3 text-forest-ink shadow-bar"
      >
        <span className="tabular grid size-8 place-items-center rounded-pill bg-chilli text-sm font-bold text-chilli-ink">{summary.itemCount}</span>
        <span className="font-semibold">View cart</span>
        <span className="tabular ml-auto font-semibold">{formatNaira(summary.subtotalKobo)}</span>
        <Icon name="arrowRight" />
      </Link>
    </div>
  )
}
