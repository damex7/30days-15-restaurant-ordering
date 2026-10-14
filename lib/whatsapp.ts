// The "Message us on WhatsApp" link on the order page.
//
// `server-only` because it reads RESTAURANT_WHATSAPP, a server-only
// variable. (Not a deep secret, but a good example: the number reaches the
// page inside a finished link, and the variable itself never reaches the
// browser bundle.)
import 'server-only'

import { formatNaira } from '@/lib/money'
import type { PlacedOrder } from '@/lib/schema/order'

/** wa.me wants digits only: country code, no "+", no spaces. */
function restaurantNumber(): string {
  return (process.env.RESTAURANT_WHATSAPP ?? '2348000000000').replace(/\D/g, '')
}

export function whatsappLink(order: PlacedOrder): string {
  const lines = order.lines.map((l) => `${l.quantity} × ${l.name}${l.options.length ? ` (${l.options.join(', ')})` : ''}`)
  const text = [`Hello Bùkà! About my order ${order.id}:`, ...lines, `Total ${formatNaira(order.totalKobo)}`].join('\n')
  return `https://wa.me/${restaurantNumber()}?text=${encodeURIComponent(text)}`
}
