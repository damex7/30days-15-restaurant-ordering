import type { Fulfilment, PlacedOrder } from '@/lib/schema/order'

/*
  WHERE IS MY ORDER? Pure functions: an order and a moment in, a stage out.

  There's no kitchen screen yet (that needs a database, Day 16), so the
  stages follow a timetable worked out when the order is placed. The order
  page asks "which stage is it at NOW?", with "now" being the server's clock,
  and refreshes every 20 seconds to ask again.
*/

export const STAGES = ['received', 'preparing', 'ready', 'completed'] as const
export type Stage = (typeof STAGES)[number]

const MINUTE = 60_000

/**
 * The timetable, fixed at order time. `scale` (BUKA_TIME_SCALE) shrinks it
 * for demos: 0.1 turns a 20-minute kitchen into 2 minutes.
 */
export function buildTimeline(fulfilment: Fulfilment, placedAt: Date, prepMinutes: number, scale: number): PlacedOrder['timeline'] {
  const at = (base: Date, minutes: number) => new Date(base.getTime() + minutes * MINUTE * scale)
  let preparingAt: Date
  let readyAt: Date
  let completedAt: Date
  switch (fulfilment.kind) {
    case 'delivery':
      preparingAt = at(placedAt, 2)
      readyAt = at(placedAt, prepMinutes) // handed to the rider
      completedAt = at(readyAt, fulfilment.etaMinutes[1]) // the slow end of the ETA range
      break
    case 'pickup': {
      // Cooked so it's hot at the slot, not as soon as it's ordered.
      const slot = new Date(fulfilment.slot)
      readyAt = new Date(Math.max(slot.getTime(), at(placedAt, prepMinutes).getTime()))
      preparingAt = new Date(Math.max(placedAt.getTime() + 2 * MINUTE * scale, readyAt.getTime() - prepMinutes * MINUTE * scale))
      completedAt = at(readyAt, 30) // collected, or we call you
      break
    }
    case 'dine-in':
      preparingAt = at(placedAt, 1)
      readyAt = at(placedAt, Math.round(prepMinutes * 0.75)) // the plates come out
      completedAt = at(readyAt, 30)
      break
  }
  return { preparingAt: preparingAt.toISOString(), readyAt: readyAt.toISOString(), completedAt: completedAt.toISOString() }
}

export function stageAt(order: Pick<PlacedOrder, 'timeline'>, now: Date): Stage {
  const t = now.getTime()
  if (t >= Date.parse(order.timeline.completedAt)) return 'completed'
  if (t >= Date.parse(order.timeline.readyAt)) return 'ready'
  if (t >= Date.parse(order.timeline.preparingAt)) return 'preparing'
  return 'received'
}

/** The words for each stage depend on how the food reaches you. */
export function stageLabels(kind: Fulfilment['kind']): Record<Stage, { title: string; detail: string }> {
  return {
    received: { title: 'Order received', detail: 'The kitchen has your ticket.' },
    preparing: { title: 'Preparing', detail: 'Your food is on the fire.' },
    ready:
      kind === 'delivery'
        ? { title: 'Out for delivery', detail: 'A rider is on the way to you.' }
        : kind === 'pickup'
          ? { title: 'Ready for pickup', detail: 'Packed and waiting at the counter.' }
          : { title: 'Served', detail: 'Enjoy! Call us over if you need anything.' },
    completed:
      kind === 'delivery'
        ? { title: 'Delivered', detail: 'Thank you for ordering from Bùkà.' }
        : kind === 'pickup'
          ? { title: 'Collected', detail: 'Thank you for ordering from Bùkà.' }
          : { title: 'Completed', detail: 'Thank you for eating with us.' },
  }
}
