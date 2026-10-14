// THE CART STORE: localStorage plus a tiny subscription system for React.
//
// `client-only` makes importing this from a Server Component a build error:
// localStorage only exists in the browser, so this code has no business on
// the server. (It's the mirror image of `server-only` in lib/data.ts.)
import 'client-only'

import { z } from 'zod'
import { normaliseChoices, sameSelection } from '@/lib/pricing'
import { err, ok, type Result } from '@/lib/result'
import {
  CURRENT_CART_VERSION,
  CartLineSchema,
  StoredCartSchema,
  emptyCart,
  type CartState,
  type CartV1,
  type OrderTypeDraft,
} from '@/lib/schema/cart'
import type { DishId } from '@/lib/schema/menu'
import { CART_LIMITS, type Choices } from '@/lib/schema/order'

/*
  WHY A SAVED CART NEEDS A SCHEMA (the Day 14 lesson)

  It's tempting to trust localStorage: "we wrote it, so we know its shape".
  But what you read back may have been written by an OLDER release (before a
  field was renamed), edited by hand in DevTools, or half-written when a tab
  crashed. From the code's point of view it's input from outside, so it's
  PARSED with Zod, and each outcome (missing, corrupt, old, too new) has a
  planned answer instead of a crash.

  The saved object carries a `version`. Version 1 stored options as flat
  "group:option" strings and had no order type; version 2 is the current
  shape. migrateV1() upgrades old carts so nobody loses their order.
*/

export const STORAGE_KEY = 'buka-cart'

/** Pure: old shape in, new shape out. */
export function migrateV1(v1: CartV1): CartState {
  const lines = v1.items.slice(0, CART_LIMITS.maxLines).flatMap((item, index) => {
    const choices: Choices = {}
    for (const pair of item.options) {
      const [group, option] = pair.split(':') as [string, string]
      choices[group] = [...(choices[group] ?? []), option]
    }
    const candidate = { lineId: `v1-${index}`, dishId: item.id, quantity: Math.min(item.qty, CART_LIMITS.maxQuantity), choices }
    // Each line is checked on its own, so one bad line doesn't throw away the rest.
    const parsed = CartLineSchema.safeParse(candidate)
    return parsed.success ? [parsed.data] : []
  })
  return { version: 2, lines, orderType: null }
}

export type LoadProblem = { kind: 'corrupt-json' } | { kind: 'invalid' } | { kind: 'unsupported-version'; version: number }
export type LoadOutcome = { cart: CartState; migratedFrom: 1 | null }

/** Raw string from storage → current cart. Pure: never throws, never touches storage. */
export function parseStoredCart(raw: string | null): Result<LoadOutcome | null, LoadProblem> {
  if (raw === null) return ok(null)
  let data: unknown // JSON.parse returns `any`; `unknown` forces a check before use
  try {
    data = JSON.parse(raw)
  } catch {
    return err({ kind: 'corrupt-json' })
  }
  const probe = z.object({ version: z.number() }).safeParse(data)
  if (probe.success && probe.data.version > CURRENT_CART_VERSION) return err({ kind: 'unsupported-version', version: probe.data.version })
  const parsed = StoredCartSchema.safeParse(data)
  if (!parsed.success) return err({ kind: 'invalid' })
  const stored = parsed.data
  return stored.version === 1 ? ok({ cart: migrateV1(stored), migratedFrom: 1 }) : ok({ cart: stored, migratedFrom: null })
}

// ---------------------------------------------------------------------------
// The store
// ---------------------------------------------------------------------------

export type StorageNotice = { kind: 'migrated' } | { kind: 'recovered' }
export type CartSnapshot = { cart: CartState; notice: StorageNotice | null }

let snapshot: CartSnapshot | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null // blocked storage (some private modes): start with an empty cart
  }
}

function writeRaw(value: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Full or blocked storage: the cart still works for this visit.
  }
}

function load(): CartSnapshot {
  const raw = readRaw()
  const result = parseStoredCart(raw)
  if (result.ok) {
    if (result.value === null) return { cart: emptyCart(), notice: null }
    if (result.value.migratedFrom !== null) {
      writeRaw(JSON.stringify(result.value.cart))
      return { cart: result.value.cart, notice: { kind: 'migrated' } }
    }
    return { cart: result.value.cart, notice: null }
  }
  console.warn('[cart] Saved cart could not be read and was reset.', result.error)
  const cart = emptyCart()
  writeRaw(JSON.stringify(cart))
  return { cart, notice: { kind: 'recovered' } }
}

/** For useSyncExternalStore: must return the SAME object until something changes. */
export function getSnapshot(): CartSnapshot {
  snapshot ??= load()
  return snapshot
}

/**
 * On the server there is no localStorage, so the server "snapshot" is null:
 * "the cart isn't known yet". React uses this for the server render AND for
 * the first render in the browser (hydration), so both produce the same
 * HTML. Then it re-renders with getSnapshot(), the real cart.
 */
export const getServerSnapshot = (): CartSnapshot | null => null

export function subscribe(listener: () => void) {
  listeners.add(listener)
  // The `storage` event fires when ANOTHER tab changes localStorage, so two
  // open tabs keep the same cart.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    snapshot = null
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function commit(update: (cart: CartState) => CartState) {
  const current = getSnapshot()
  const next = update(current.cart)
  if (next === current.cart) return
  snapshot = { cart: next, notice: current.notice }
  writeRaw(JSON.stringify(next))
  emit()
}

const newLineId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export type AddOutcome = { kind: 'added' } | { kind: 'merged'; quantity: number } | { kind: 'cart-full' }

export const cartActions = {
  /** Adds a dish. The same dish with the same choices adds to that line's quantity. */
  add(dishId: DishId, choices: Choices, quantity: number): AddOutcome {
    let outcome: AddOutcome = { kind: 'added' }
    commit((cart) => {
      const same = cart.lines.find((l) => l.dishId === dishId && sameSelection(l.choices, choices))
      if (same) {
        const merged = Math.min(same.quantity + quantity, CART_LIMITS.maxQuantity)
        outcome = { kind: 'merged', quantity: merged }
        return { ...cart, lines: cart.lines.map((l) => (l === same ? { ...l, quantity: merged } : l)) }
      }
      if (cart.lines.length >= CART_LIMITS.maxLines) {
        outcome = { kind: 'cart-full' }
        return cart
      }
      const line = { lineId: newLineId(), dishId, quantity: Math.min(quantity, CART_LIMITS.maxQuantity), choices: normaliseChoices(choices) }
      return { ...cart, lines: [...cart.lines, line] }
    })
    return outcome
  },

  /** Quantity 0 removes the line. */
  setQuantity(lineId: string, quantity: number) {
    commit((cart) => ({
      ...cart,
      lines:
        quantity <= 0
          ? cart.lines.filter((l) => l.lineId !== lineId)
          : cart.lines.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.min(quantity, CART_LIMITS.maxQuantity) } : l)),
    }))
  },

  remove(lineId: string) {
    commit((cart) => ({ ...cart, lines: cart.lines.filter((l) => l.lineId !== lineId) }))
  },

  setOrderType(orderType: OrderTypeDraft | null) {
    commit((cart) => ({ ...cart, orderType }))
  },

  /** After an order is placed: empty the cart but keep a dine-in table, so a second round is one tap. */
  clearAfterOrder() {
    commit((cart) => (cart.lines.length === 0 ? cart : { ...cart, lines: [], orderType: cart.orderType?.kind === 'dine-in' ? cart.orderType : null }))
  },

  dismissNotice() {
    const current = getSnapshot()
    snapshot = { cart: current.cart, notice: null }
    emit()
  },
}
