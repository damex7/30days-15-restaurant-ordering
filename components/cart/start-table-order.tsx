// CLIENT COMPONENT: it writes to the cart in localStorage when the page
// opens. Only the browser has localStorage, and only an Effect runs "when
// the page opens" there.
'use client'

import { useEffect } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { Icon } from '@/components/ui/icon'

/**
 * The QR code on table 7 points at /table/7. Opening it switches the cart to
 * dine-in at that table (keeping anything already in it), so the customer
 * goes straight to the menu with nothing to fill in.
 *
 * The table number arrives as a plain prop from the server page, which has
 * already checked that table 7 exists.
 */
export function StartTableOrder({ table }: { table: number }) {
  const { snapshot, setOrderType } = useCart()
  useEffect(() => {
    setOrderType({ kind: 'dine-in', table })
  }, [setOrderType, table])

  const ready = snapshot?.cart.orderType?.kind === 'dine-in' && snapshot.cart.orderType.table === table
  return (
    <p role="status" className="flex min-h-6 items-center gap-2 text-sm font-semibold text-leaf">
      {ready && (
        <>
          <Icon name="checkCircle" className="size-5" /> Your cart is set to dine-in at table {table}.
        </>
      )}
    </p>
  )
}
