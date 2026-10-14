import { z } from 'zod'
import { KoboSchema } from '@/lib/money'
import { DishIdSchema, SlugSchema } from '@/lib/schema/menu'

/*
  WHAT THE BROWSER IS ALLOWED TO SEND, AND WHAT THE SERVER KEEPS

  NEVER TRUST THE CLIENT'S PRICES. An order arrives as a list of
  { dishId, quantity, choices } and nothing else: no names, no prices, no
  totals the server would believe. Zod's z.object() STRIPS keys it doesn't
  know, so if someone edits the request to add `"priceKobo": 1`, that key is
  silently dropped before any code sees it. The Server Action then looks
  every price up itself (lib/pricing.ts).

  The one number the browser does send, `clientTotalKobo`, is only there so
  the server can notice "you were shown a different total" and say so.
*/

export const CART_LIMITS = { maxLines: 12, maxQuantity: 20 } as const

/** groupId → chosen option IDs. `{ protein: ['chicken'], extras: ['dodo', 'egg'] }` */
export const ChoicesSchema = z.record(SlugSchema, z.array(SlugSchema).max(10))
export type Choices = z.infer<typeof ChoicesSchema>

export const CartItemInputSchema = z.object({
  dishId: DishIdSchema,
  quantity: z.number().int().min(1).max(CART_LIMITS.maxQuantity),
  choices: ChoicesSchema,
})
export type CartItemInput = z.infer<typeof CartItemInputSchema>

// ---------------------------------------------------------------------------
// Order types and payment
// ---------------------------------------------------------------------------

export const ORDER_KINDS = ['delivery', 'pickup', 'dine-in'] as const
export const OrderKindSchema = z.enum(ORDER_KINDS)
export type OrderKind = z.infer<typeof OrderKindSchema>

export const ORDER_KIND_LABELS: Record<OrderKind, string> = {
  delivery: 'Delivery',
  pickup: 'Pickup',
  'dine-in': 'Dine-in',
}

/** No online payments today: you pay when the food reaches you. */
export const PAYMENT_METHODS = ['pay-on-delivery', 'pay-at-counter', 'pay-at-table'] as const
export const PaymentMethodSchema = z.enum(PAYMENT_METHODS)
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const PAYMENT_LABELS: Record<PaymentMethod, { label: string; hint: string }> = {
  'pay-on-delivery': { label: 'Pay on delivery', hint: 'Cash, card (POS) or transfer to the rider.' },
  'pay-at-counter': { label: 'Pay at the counter', hint: 'Cash, card or transfer when you collect.' },
  'pay-at-table': { label: 'Pay at the table', hint: 'Your server brings the POS to you.' },
}

/** Which payment methods make sense for each order type. The server enforces this too. */
export const PAYMENT_OPTIONS: Record<OrderKind, readonly PaymentMethod[]> = {
  delivery: ['pay-on-delivery'],
  pickup: ['pay-at-counter'],
  'dine-in': ['pay-at-table', 'pay-at-counter'],
}

// ---------------------------------------------------------------------------
// The checkout form, as the Server Action reads it
// ---------------------------------------------------------------------------

/**
 * Nigerian mobile numbers, typed any common way:
 *   0803 123 4567 · 08031234567 · +234 803 123 4567 · 234-803-123-4567
 * Spaces, dashes and brackets are removed, the prefix must be a mobile
 * range (070, 080, 081, 090, 091 …), and the result is stored in one
 * format: +2348031234567.
 */
export const NigerianPhoneSchema = z
  .string()
  .trim()
  .transform((raw) => raw.replace(/[\s\-().]/g, ''))
  .pipe(z.string().regex(/^(?:\+?234|0)[789][01]\d{8}$/, { error: 'Enter a Nigerian mobile number, like 0803 123 4567.' }))
  .transform((digits) => `+234${digits.slice(-10)}`)

/** The cart arrives as one JSON string in a hidden input. Parse it, then check it. */
const ItemsJsonSchema = z
  .string()
  .transform((text, ctx) => {
    try {
      return JSON.parse(text) as unknown
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Your cart could not be read. Refresh the page and try again.' })
      return z.NEVER
    }
  })
  .pipe(
    z
      .array(CartItemInputSchema)
      .min(1, { error: 'Your cart is empty.' })
      .max(CART_LIMITS.maxLines, { error: `Orders can have up to ${CART_LIMITS.maxLines} different items.` }),
  )

const CheckoutBase = {
  name: z.string().trim().min(2, { error: 'Tell us your name.' }).max(60, { error: 'Use 60 characters or fewer.' }),
  phone: NigerianPhoneSchema,
  note: z.string().trim().max(200, { error: 'Keep notes to 200 characters.' }).optional(),
  items: ItemsJsonSchema,
  /** The total the customer was shown, for comparison only. Never used to charge. */
  clientTotalKobo: z.coerce.number().pipe(KoboSchema).optional().catch(undefined),
}

export const CheckoutSchema = z.discriminatedUnion(
  'orderType',
  [
    z.object({
      orderType: z.literal('delivery'),
      areaId: z.string().min(1, { error: 'Choose your area.' }).pipe(SlugSchema),
      address: z.string().trim().min(8, { error: 'Enter a street address the rider can find.' }).max(200),
      payment: z.literal('pay-on-delivery', { error: 'Delivery orders are paid on delivery.' }),
      ...CheckoutBase,
    }),
    z.object({
      orderType: z.literal('pickup'),
      slot: z.iso.datetime({ error: 'Choose a pickup time.' }),
      payment: z.literal('pay-at-counter', { error: 'Pickup orders are paid at the counter.' }),
      ...CheckoutBase,
    }),
    z.object({
      orderType: z.literal('dine-in'),
      table: z.coerce.number({ error: 'Enter your table number.' }).int().positive({ error: 'Enter your table number.' }),
      payment: z.enum(['pay-at-table', 'pay-at-counter'], { error: 'Choose how you’ll pay.' }),
      ...CheckoutBase,
    }),
  ],
  { error: 'Choose delivery, pickup or dine-in.' },
)
export type CheckoutInput = z.infer<typeof CheckoutSchema>

// ---------------------------------------------------------------------------
// The placed order: the receipt, frozen at the moment of ordering
// ---------------------------------------------------------------------------

/** "BK-7F3K2Q": short enough to read out on the phone. */
export const OrderIdSchema = z.string().regex(/^BK-[A-HJ-NP-Z2-9]{6}$/)
export type OrderId = z.infer<typeof OrderIdSchema>

/**
 * One receipt line. Names, option labels and prices are COPIED here when the
 * order is placed (the Day 9 lesson): if jollof goes up to ₦5,000 tomorrow,
 * today's receipt must still say ₦4,500.
 */
export const PlacedLineSchema = z.object({
  dishId: z.string(),
  name: z.string(),
  options: z.array(z.string()),
  quantity: z.number().int().positive(),
  unitKobo: KoboSchema,
  lineKobo: KoboSchema,
})
export type PlacedLine = z.infer<typeof PlacedLineSchema>

export const FulfilmentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('delivery'), areaName: z.string(), address: z.string(), etaMinutes: z.tuple([z.number(), z.number()]) }),
  z.object({ kind: z.literal('pickup'), slot: z.iso.datetime() }),
  z.object({ kind: z.literal('dine-in'), table: z.number().int().positive() }),
])
export type Fulfilment = z.infer<typeof FulfilmentSchema>

export const PlacedOrderSchema = z.object({
  /** Cookie format version, for the day the shape changes. */
  v: z.literal(1),
  id: OrderIdSchema,
  placedAt: z.iso.datetime(),
  customer: z.object({ name: z.string(), phone: z.string() }),
  fulfilment: FulfilmentSchema,
  payment: PaymentMethodSchema,
  note: z.string().optional(),
  lines: z.array(PlacedLineSchema).min(1),
  subtotalKobo: KoboSchema,
  deliveryFeeKobo: KoboSchema,
  totalKobo: KoboSchema,
  /** Set when the browser showed a different total from the one charged. */
  priceCheck: z.object({ shownKobo: KoboSchema, chargedKobo: KoboSchema }).nullable(),
  /** When each stage starts. Worked out once, on the server, at order time. */
  timeline: z.object({ preparingAt: z.iso.datetime(), readyAt: z.iso.datetime(), completedAt: z.iso.datetime() }),
})
export type PlacedOrder = z.infer<typeof PlacedOrderSchema>
