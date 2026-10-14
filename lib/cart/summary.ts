import { formatNaira } from '@/lib/money'
import { describeProblem, orderTotals, priceLine, type LineProblem, type OrderTotals, type PricedLine } from '@/lib/pricing'
import type { Result } from '@/lib/result'
import type { CartLine, CartState, OrderTypeDraft } from '@/lib/schema/cart'
import type { PriceCatalog, PricingDish } from '@/lib/schema/menu'
import type { DeliveryArea } from '@/lib/schema/restaurant'

// Turns the saved cart (IDs only) into something to display, by pricing each
// line against the catalogue the server sent. Shared and pure, like
// lib/pricing.ts: the cart page uses it in the browser for a PREVIEW.

export type CartLineView = {
  line: CartLine
  dish: PricingDish | undefined
  priced: Result<PricedLine, LineProblem>
}

export type CartSummary = OrderTotals & {
  lines: CartLineView[]
  /** Total number of plates/items, for the badge: 2 jollof + 1 zobo = 3. */
  itemCount: number
  /** Sentences for lines that can't be ordered as they are (sold out, changed). */
  problems: string[]
}

export function deliveryFeeFor(orderType: OrderTypeDraft | null, areas: readonly DeliveryArea[]): number {
  if (orderType?.kind !== 'delivery' || !orderType.areaId) return 0
  return areas.find((a) => a.id === orderType.areaId)?.feeKobo ?? 0
}

/**
 * What still stands between this cart and the checkout, as sentences.
 * Empty list = ready. The cart page shows these next to a disabled button;
 * the Server Action checks the same rules again for real.
 */
export function checkoutBlockers(summary: CartSummary, orderType: OrderTypeDraft | null, minDeliveryOrderKobo: number): string[] {
  const blockers: string[] = []
  if (summary.itemCount === 0) return ['Your cart is empty.']
  blockers.push(...summary.problems)
  if (!orderType) blockers.push('Choose delivery, pickup or dine-in.')
  else if (orderType.kind === 'delivery') {
    if (!orderType.areaId) blockers.push('Choose the area we’re delivering to.')
    if (summary.subtotalKobo < minDeliveryOrderKobo) blockers.push(`Delivery orders start at ${formatNaira(minDeliveryOrderKobo)}. Add ${formatNaira(minDeliveryOrderKobo - summary.subtotalKobo)} more, or choose pickup.`)
  }
  return blockers
}

export function summariseCart(cart: CartState, catalog: PriceCatalog, areas: readonly DeliveryArea[] = []): CartSummary {
  const lines = cart.lines.map((line) => {
    const dish = catalog[line.dishId]
    return { line, dish, priced: priceLine(dish, line.choices, line.quantity) }
  })
  const okLines = lines.flatMap((l) => (l.priced.ok ? [l.priced.value] : []))
  return {
    lines,
    itemCount: cart.lines.reduce((n, l) => n + l.quantity, 0),
    problems: lines.flatMap((l) => (l.priced.ok ? [] : [describeProblem(l.priced.error)])),
    ...orderTotals(okLines, deliveryFeeFor(cart.orderType, areas)),
  }
}
