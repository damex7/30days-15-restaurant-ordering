// CLIENT COMPONENT: the table number lives in the cart (localStorage), set
// when a customer scans the QR code on their table (/table/[number]). Only
// the browser knows it, so only a Client Component can show it.
'use client'

import { Icon } from '@/components/ui/icon'
import { useCart } from '@/components/cart/cart-provider'

/** "Table 7 · Dine-in", shown in the header on every page while you order at a table. */
export function TableChip() {
  const { snapshot } = useCart()
  const orderType = snapshot?.cart.orderType
  if (orderType?.kind !== 'dine-in') return null
  return (
    <p className="flex items-center gap-1.5 rounded-pill bg-leaf-soft px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap text-leaf sm:px-3">
      <Icon name="table" className="size-4" />
      <span>
        {/* On phones the header is tight: the icon and the number say enough, and screen readers still hear the word. */}
        <span className="max-sm:sr-only">Table </span>
        {orderType.table}
        <span className="sr-only"> (dine-in order)</span>
      </span>
    </p>
  )
}
