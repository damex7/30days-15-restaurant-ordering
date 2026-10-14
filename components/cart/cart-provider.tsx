// CLIENT COMPONENT: React context, state that changes as you shop, and
// localStorage. None of those exist in a Server Component, so the cart has to
// live on the client.
'use client'

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { cartActions, getServerSnapshot, getSnapshot, subscribe, type CartSnapshot } from '@/lib/cart/store'
import type { OrderTypeDraft } from '@/lib/schema/cart'
import type { DishId, PriceCatalog } from '@/lib/schema/menu'
import type { Choices } from '@/lib/schema/order'

/*
  WHERE THIS PROVIDER SITS, AND WHY THAT'S FINE

  It wraps the (shop) layout's children, so every shop page can reach the
  cart. Wrapping pages in a Client Component does NOT turn them into Client
  Components. `children` arrive already rendered on the server; the provider
  just passes them through. Only components that call useCart() (the badge,
  the add buttons, the cart page) are client code. The menu itself, every
  dish card and photo, stays on the server.

  It is NOT in the root layout: the root layout (<html>, fonts, theme) has
  no use for a cart, and keeping providers "as deep as possible" is the
  docs' advice, so less of the tree depends on them.

  THE CATALOGUE PROP. The (shop) layout, a Server Component, loads the price
  list with getPriceCatalog() and passes it here as a prop. Props that cross
  from server to client must be SERIALIZABLE (plain objects, arrays,
  strings, numbers, booleans, null), because React sends them over the
  network as data. The catalogue is exactly that. It has no kitchen notes:
  lib/data.ts never puts them in.
*/

type CartContextValue = {
  /** null until the browser has read localStorage (during SSR and hydration). */
  snapshot: CartSnapshot | null
  catalog: PriceCatalog
  add: (dishId: DishId, choices: Choices, quantity: number) => boolean
  setQuantity: (lineId: string, quantity: number) => void
  remove: (lineId: string) => void
  setOrderType: (orderType: OrderTypeDraft | null) => void
  clearAfterOrder: () => void
  dismissNotice: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const subscribeToNothing = () => () => {}

export function useCart(): CartContextValue {
  const value = use(CartContext)
  if (!value) throw new Error('useCart() must be used inside <CartProvider>')
  /*
    A SECOND HYDRATION GUARD, PER COMPONENT. The provider's null server
    snapshot covers components that hydrate together with it. But a
    component inside its own <Suspense> (the sticky cart bar) can hydrate
    LATER, after the provider has already switched to the real cart. It
    would then render "3 items" over server HTML that said nothing: a
    hydration error (found in testing).

    This tiny store returns false during that component's own hydration
    and true afterwards, so every consumer starts from "cart not known
    yet", wherever it sits in the tree.
  */
  const hydrated = useSyncExternalStore(subscribeToNothing, () => true, () => false)
  return hydrated ? value : { ...value, snapshot: null }
}

export function CartProvider({ catalog, children }: { catalog: PriceCatalog; children: ReactNode }) {
  /*
    NO WRONG NUMBER ON FIRST LOAD. useSyncExternalStore takes three functions:
    subscribe, getSnapshot (browser) and getServerSnapshot. The server
    snapshot is null, so the server renders the cart badge with no number.
    In the browser, React HYDRATES with the server snapshot first (so the
    HTML matches exactly and there's no hydration error), then immediately
    re-renders with the real cart from localStorage. The badge goes from
    "no number" to "3", never from "0" to "3".
  */
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Screen readers hear every cart change through the live region below.
  const [announcement, setAnnouncement] = useState('')
  const announce = useCallback((message: string) => {
    // Clearing first makes a repeated message ("Added Zobo" twice) be read again.
    setAnnouncement('')
    requestAnimationFrame(() => setAnnouncement(message))
  }, [])

  const value = useMemo<CartContextValue>(() => {
    const nameOf = (dishId: string) => catalog[dishId]?.name ?? 'Item'
    const lineName = (lineId: string) => {
      const line = getSnapshot().cart.lines.find((l) => l.lineId === lineId)
      return line ? nameOf(line.dishId) : 'Item'
    }
    return {
      snapshot,
      catalog,
      add(dishId, choices, quantity) {
        const outcome = cartActions.add(dishId, choices, quantity)
        switch (outcome.kind) {
          case 'added':
            announce(`Added ${quantity} × ${nameOf(dishId)} to your cart.`)
            return true
          case 'merged':
            announce(`${nameOf(dishId)}: you now have ${outcome.quantity} in your cart.`)
            return true
          case 'cart-full':
            announce('Your cart is full. Remove something before adding more.')
            return false
        }
      },
      setQuantity(lineId, quantity) {
        const name = lineName(lineId)
        cartActions.setQuantity(lineId, quantity)
        announce(quantity <= 0 ? `Removed ${name} from your cart.` : `${name}: quantity ${quantity}.`)
      },
      remove(lineId) {
        const name = lineName(lineId)
        cartActions.remove(lineId)
        announce(`Removed ${name} from your cart.`)
      },
      setOrderType: cartActions.setOrderType,
      clearAfterOrder: cartActions.clearAfterOrder,
      dismissNotice: cartActions.dismissNotice,
    }
  }, [snapshot, catalog, announce])

  return (
    <CartContext value={value}>
      {children}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </CartContext>
  )
}
