import { z } from 'zod'
import { DishIdSchema, SlugSchema } from '@/lib/schema/menu'
import { CART_LIMITS, ChoicesSchema } from '@/lib/schema/order'

/*
  THE SAVED CART (localStorage), version 2.

  A cart line holds IDs only: which dish, which options, how many. No names
  and no prices: those are looked up in the price catalogue the server
  hands to the CartProvider, so a stale or edited localStorage can never
  change what anything costs.
*/

export const CartLineSchema = z.object({
  /** Stable key for React lists and for "remove this line". */
  lineId: z.string().min(1).max(40),
  dishId: DishIdSchema,
  quantity: z.number().int().min(1).max(CART_LIMITS.maxQuantity),
  choices: ChoicesSchema,
})
export type CartLine = z.infer<typeof CartLineSchema>

/**
 * How the customer wants their food. The pickup TIME isn't saved here: slots
 * depend on the server's clock, so they're chosen on the checkout page.
 */
export const OrderTypeDraftSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('delivery'), areaId: SlugSchema.nullable() }),
  z.object({ kind: z.literal('pickup') }),
  z.object({ kind: z.literal('dine-in'), table: z.number().int().positive() }),
])
export type OrderTypeDraft = z.infer<typeof OrderTypeDraftSchema>

export const CartV2Schema = z.object({
  version: z.literal(2),
  lines: z.array(CartLineSchema).max(CART_LIMITS.maxLines),
  orderType: OrderTypeDraftSchema.nullable(),
})
export type CartState = z.infer<typeof CartV2Schema>

/**
 * VERSION 1, as an earlier release saved it: `items` with `qty`, and options
 * as flat "group:option" strings. No order type. We never write this shape
 * any more, but a returning customer may still have one saved.
 */
export const CartV1Schema = z.object({
  version: z.literal(1),
  items: z.array(
    z.object({
      id: z.string(),
      qty: z.number().int().positive(),
      options: z.array(z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/)),
    }),
  ),
})
export type CartV1 = z.infer<typeof CartV1Schema>

export const StoredCartSchema = z.discriminatedUnion('version', [CartV1Schema, CartV2Schema])

export const CURRENT_CART_VERSION = 2

export const emptyCart = (): CartState => ({ version: 2, lines: [], orderType: null })
