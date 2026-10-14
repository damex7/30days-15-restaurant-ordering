// CLIENT COMPONENT: the cart is in localStorage, so emptying it has to happen
// in the browser. The server can't reach in and clear it.
'use client'

import { useEffect } from 'react'
import { useCart } from '@/components/cart/cart-provider'

/**
 * Rendered by the order page only when the URL says `?placed=1`, i.e. right
 * after the Server Action redirected here. It empties the cart (keeping a
 * dine-in table, for a second round), then drops `?placed=1` from the
 * address bar so a refresh or a shared link doesn't run it again.
 *
 * window.history.replaceState only changes the URL; it doesn't ask the
 * server for the page again (router.replace would, and the "Thank you"
 * line would vanish at once). Next.js keeps its router in sync with it.
 */
export function ClearCartOnPlaced({ orderId }: { orderId: string }) {
  const { clearAfterOrder } = useCart()
  useEffect(() => {
    clearAfterOrder()
    window.history.replaceState(null, '', `/order/${orderId}`)
  }, [clearAfterOrder, orderId])
  return null
}
