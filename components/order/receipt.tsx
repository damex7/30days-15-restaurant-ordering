import { Totals } from '@/components/cart/totals'
import { Icon } from '@/components/ui/icon'
import { formatLagosTime } from '@/lib/hours'
import { formatNaira } from '@/lib/money'
import { PAYMENT_LABELS, type PlacedOrder } from '@/lib/schema/order'

/**
 * SERVER COMPONENT: the receipt, printed from the SNAPSHOT in the signed
 * cookie: the names and prices as they were when you ordered. If jollof goes
 * up tomorrow, this receipt still says what you paid today.
 */
export function Receipt({ order }: { order: PlacedOrder }) {
  const f = order.fulfilment
  return (
    <section aria-labelledby="receipt-heading" className="rounded-card border border-line bg-raised p-5">
      <h2 id="receipt-heading" className="flex items-center gap-2 text-xl font-extrabold">
        <Icon name="receipt" className="text-leaf" /> Receipt
      </h2>

      {order.priceCheck && (
        <p role="note" className="mt-4 flex items-start gap-2 rounded-control bg-plantain-soft p-3 text-sm text-plantain">
          <Icon name="info" className="mt-0.5 size-4" />
          <span>
            <strong>We used today’s prices.</strong> Your cart showed {formatNaira(order.priceCheck.shownKobo)}, and the kitchen’s total is{' '}
            {formatNaira(order.priceCheck.chargedKobo)}. Prices are always checked when an order is placed.
          </span>
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-3 border-b border-line pb-4">
        {order.lines.map((line, i) => (
          <li key={`${line.dishId}-${i}`} className="flex justify-between gap-4">
            <div>
              <p className="font-semibold">
                {line.quantity} × {line.name}
              </p>
              {line.options.length > 0 && <p className="text-sm text-muted">{line.options.join(' · ')}</p>}
              {line.quantity > 1 && <p className="tabular text-sm text-subtle">{formatNaira(line.unitKobo)} each</p>}
            </div>
            <p className="tabular shrink-0">{formatNaira(line.lineKobo)}</p>
          </li>
        ))}
      </ul>
      <Totals totals={order} showDelivery={f.kind === 'delivery'} className="mt-4" />

      <dl className="mt-5 grid gap-x-4 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">Name</dt>
        <dd>{order.customer.name}</dd>
        <dt className="text-muted">Phone</dt>
        <dd className="tabular">{order.customer.phone}</dd>
        {f.kind === 'delivery' && (
          <>
            <dt className="text-muted">Deliver to</dt>
            <dd>
              {f.address}, {f.areaName}
            </dd>
          </>
        )}
        {f.kind === 'pickup' && (
          <>
            <dt className="text-muted">Pickup at</dt>
            <dd>{formatLagosTime(new Date(f.slot))}, at the counter</dd>
          </>
        )}
        {f.kind === 'dine-in' && (
          <>
            <dt className="text-muted">Table</dt>
            <dd>{f.table}</dd>
          </>
        )}
        <dt className="text-muted">Payment</dt>
        <dd>{PAYMENT_LABELS[order.payment].label}</dd>
        {order.note && (
          <>
            <dt className="text-muted">Note</dt>
            <dd>{order.note}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
