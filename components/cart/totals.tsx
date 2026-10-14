import { formatNaira } from '@/lib/money'
import type { OrderTotals } from '@/lib/pricing'
import { cn } from '@/lib/cn'

/**
 * Subtotal, delivery and total as a definition list. No hooks and no
 * markers, so it renders anywhere: inside the client cart and checkout
 * (as a preview) and on the server-rendered receipt (as the real thing).
 */
export function Totals({ totals, showDelivery, className }: { totals: OrderTotals; showDelivery: boolean; className?: string }) {
  return (
    <dl className={cn('flex flex-col gap-2', className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular">{formatNaira(totals.subtotalKobo)}</dd>
      </div>
      {showDelivery && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Delivery</dt>
          <dd className="tabular">{totals.deliveryFeeKobo === 0 ? 'Choose an area' : formatNaira(totals.deliveryFeeKobo)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4 border-t border-line pt-2 text-lg font-bold">
        <dt>Total</dt>
        {/* The one number that matters most gets the chilli accent. */}
        <dd className="tabular text-chilli">{formatNaira(totals.totalKobo)}</dd>
      </div>
    </dl>
  )
}
