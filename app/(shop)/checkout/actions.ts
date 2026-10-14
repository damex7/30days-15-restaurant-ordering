'use server'

import { randomInt } from 'node:crypto'
import { redirect } from 'next/navigation'
import { now, orderTimeScale } from '@/lib/clock'
import { getDeliveryAreas, getKitchenNotes, getPriceCatalog, getRestaurant } from '@/lib/data'
import { formatClock, formatLagosTime, isAvailableNow, kitchenStatus, pickupSlots } from '@/lib/hours'
import { formatNaira } from '@/lib/money'
import { encodeOrder, saveOrderCookie } from '@/lib/order-cookie'
import { buildTimeline } from '@/lib/order-status'
import { describeProblem, orderTotals, priceLine, type PricedLine } from '@/lib/pricing'
import { CheckoutSchema, PAYMENT_OPTIONS, type Fulfilment, type OrderId, type PlacedOrder } from '@/lib/schema/order'

/*
  THE SERVER ACTION: placeOrder. NEVER TRUST THE CLIENT.

  'use server' at the top of this file turns every exported async function
  into an endpoint the browser can call, by posting the form. Next.js
  wires that up; we never write a fetch() or an API route.

  Everything the browser sends is treated as a claim to check, not a fact:
    1. The form is PARSED with Zod. Unknown keys (a smuggled `priceKobo`)
       are stripped, and bad values become friendly field errors.
    2. Prices come from the SERVER'S menu. The browser only says "2 × jollof
       with goat": we look up what that costs, with the same priceLine()
       the cart used for its preview.
    3. Time comes from the SERVER'S clock: is the kitchen open, is that
       pickup slot still in the future, is suya being grilled yet?
    4. The browser's total is only compared, never charged. If it differs,
       the order still goes through at the real price, and the receipt
       says so.
*/

export type CheckoutField = 'name' | 'phone' | 'address' | 'areaId' | 'slot' | 'table' | 'payment' | 'note' | 'orderType' | 'items'

export type CheckoutState =
  | { status: 'idle' }
  | {
      status: 'error'
      /** Every problem, for the summary at the top of the form. */
      errors: string[]
      /** The first problem per field, shown under that field. */
      fieldErrors: Partial<Record<CheckoutField, string>>
      /** What was typed, so the form can be filled in again. */
      values: Partial<Record<'name' | 'phone' | 'address' | 'slot' | 'note' | 'payment', string>>
    }

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/1 or O/0 to misread over the phone
const newOrderId = (): OrderId => `BK-${Array.from({ length: 6 }, () => ID_ALPHABET[randomInt(ID_ALPHABET.length)]).join('')}`

const KNOWN_FIELDS = new Set<string>(['name', 'phone', 'address', 'areaId', 'slot', 'table', 'payment', 'note', 'orderType', 'items'])

function failure(raw: Record<string, string>, errors: { field?: CheckoutField; message: string }[]): CheckoutState {
  const fieldErrors: Partial<Record<CheckoutField, string>> = {}
  for (const e of errors) if (e.field && !fieldErrors[e.field]) fieldErrors[e.field] = e.message
  return {
    status: 'error',
    errors: [...new Set(errors.map((e) => e.message))],
    fieldErrors,
    values: { name: raw.name, phone: raw.phone, address: raw.address, slot: raw.slot, note: raw.note, payment: raw.payment },
  }
}

export async function placeOrder(_previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  // FormData values can be strings or Files; this form only has strings.
  const raw = Object.fromEntries([...formData.entries()].flatMap(([k, v]) => (typeof v === 'string' ? [[k, v]] : []))) as Record<string, string>

  // 1. PARSE --------------------------------------------------------------
  const parsed = CheckoutSchema.safeParse(raw)
  if (!parsed.success) {
    return failure(
      raw,
      parsed.error.issues.map((issue) => {
        const key = String(issue.path[0] ?? '')
        return { field: KNOWN_FIELDS.has(key) ? (key as CheckoutField) : undefined, message: issue.message }
      }),
    )
  }
  const input = parsed.data

  // 2. LOAD the server's own facts (cached reads) and READ THE CLOCK -------
  const [at, restaurant, areas, catalog] = await Promise.all([now(), getRestaurant(), getDeliveryAreas(), getPriceCatalog()])
  const problems: { field?: CheckoutField; message: string }[] = []

  // 3. WHEN and WHERE -----------------------------------------------------
  let fulfilment: Fulfilment
  let deliveryFeeKobo = 0
  let cookedAt = at // the moment the food must be available (pickup: the slot)
  const kitchen = kitchenStatus(at, restaurant)
  switch (input.orderType) {
    case 'delivery': {
      const area = areas.find((a) => a.id === input.areaId)
      if (!area) problems.push({ field: 'areaId', message: 'We don’t deliver to that area. Choose one from the list.' })
      deliveryFeeKobo = area?.feeKobo ?? 0
      fulfilment = { kind: 'delivery', areaName: area?.name ?? '', address: input.address, etaMinutes: area?.etaMinutes ?? [0, 0] }
      break
    }
    case 'pickup': {
      // The slot list is worked out again, from the server's clock: a slot
      // that was fine when the page loaded may have passed since.
      if (!pickupSlots(at, restaurant).some((s) => s.value === new Date(input.slot).toISOString())) {
        problems.push({ field: 'slot', message: 'That pickup time is no longer available. Choose another.' })
      }
      cookedAt = new Date(input.slot)
      fulfilment = { kind: 'pickup', slot: new Date(input.slot).toISOString() }
      break
    }
    case 'dine-in':
      if (!restaurant.tables.includes(input.table)) problems.push({ field: 'table', message: `We don’t have a table ${input.table}. Check the number on your table.` })
      fulfilment = { kind: 'dine-in', table: input.table }
      break
  }
  if (input.orderType !== 'pickup' && kitchen.kind !== 'open') {
    problems.push({
      field: 'orderType',
      message:
        kitchen.kind === 'closed'
          ? `We’re closed right now and open ${kitchen.reopens}. You can still order pickup for later.`
          : `The kitchen has taken its last orders for today. We reopen ${kitchen.reopens}. You can order pickup for then.`,
    })
  }
  // The schema already limits payment per type; this is the same rule, stated once in PAYMENT_OPTIONS.
  if (!PAYMENT_OPTIONS[input.orderType].includes(input.payment)) problems.push({ field: 'payment', message: 'Choose a payment method for this order type.' })

  // 4. PRICE every line from the server's menu -----------------------------
  const lines: PricedLine[] = []
  for (const item of input.items) {
    const dish = catalog[item.dishId]
    const priced = priceLine(dish, item.choices, item.quantity)
    if (!priced.ok) {
      problems.push({ field: 'items', message: describeProblem(priced.error) })
      continue
    }
    if (dish && !isAvailableNow(dish.availableFrom, cookedAt)) {
      const from = formatClock(dish.availableFrom ?? '00:00')
      problems.push({
        field: 'items',
        message: input.orderType === 'pickup' ? `${dish.name} is cooked from ${from}. Choose a pickup time after ${from}.` : `${dish.name} is cooked from ${from}. Remove it to order now.`,
      })
    }
    lines.push(priced.value)
  }
  const totals = orderTotals(lines, deliveryFeeKobo)
  if (input.orderType === 'delivery' && totals.subtotalKobo < restaurant.minDeliveryOrderKobo) {
    problems.push({ field: 'items', message: `Delivery orders start at ${formatNaira(restaurant.minDeliveryOrderKobo)} before the delivery fee.` })
  }

  if (problems.length > 0) return failure(raw, problems)

  // 5. BUILD the receipt with the SERVER'S numbers -------------------------
  const order: PlacedOrder = {
    v: 1,
    id: newOrderId(),
    placedAt: at.toISOString(),
    customer: { name: input.name, phone: input.phone },
    fulfilment,
    payment: input.payment,
    note: input.note || undefined,
    lines: lines.map(({ dishId, name, options, quantity, unitKobo, lineKobo }) => ({ dishId, name, options, quantity, unitKobo, lineKobo })),
    ...totals,
    // The browser's total is compared, never charged.
    priceCheck:
      input.clientTotalKobo !== undefined && input.clientTotalKobo !== totals.totalKobo ? { shownKobo: input.clientTotalKobo, chargedKobo: totals.totalKobo } : null,
    timeline: buildTimeline(fulfilment, at, restaurant.prepMinutes, orderTimeScale()),
  }

  const encoded = encodeOrder(order)
  if (!encoded.ok) return failure(raw, [{ field: 'items', message: 'This order is too big to save in one go. Please split it into two orders.' }])

  // 6. THE KITCHEN TICKET: printed in the server log, with the private notes.
  // This is the only place kitchenNotes are ever read. They never reach a page.
  const notes = await getKitchenNotes(order.lines.map((l) => l.dishId))
  console.info(
    [
      `\n🧾 KITCHEN TICKET ${order.id}  ${formatLagosTime(at)}  ${order.fulfilment.kind.toUpperCase()}`,
      ...order.lines.map((l) => `   ${l.quantity} × ${l.name}${l.options.length ? ` [${l.options.join(', ')}]` : ''}`),
      ...notes.map((n) => `   note (${n.name}): ${n.notes}`),
      order.note ? `   customer note: ${order.note}` : null,
      order.priceCheck ? `   ⚠ client showed ${formatNaira(order.priceCheck.shownKobo)}, charged ${formatNaira(order.priceCheck.chargedKobo)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
  )

  await saveOrderCookie(order, encoded.value)

  // redirect() works by throwing a special error, so it's called outside
  // any try/catch, as the very last step.
  redirect(`/order/${order.id}?placed=1`)
}
