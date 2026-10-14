import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ClearCartOnPlaced } from '@/components/order/clear-cart-on-placed'
import { OrderAutoRefresh } from '@/components/order/order-auto-refresh'
import { Receipt } from '@/components/order/receipt'
import { StatusTracker } from '@/components/order/status-tracker'
import { buttonClass } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { now } from '@/lib/clock'
import { formatLagosTime } from '@/lib/hours'
import { readOrderCookie } from '@/lib/order-cookie'
import { stageAt, type Stage } from '@/lib/order-status'
import { OrderIdSchema, type PlacedOrder } from '@/lib/schema/order'
import { whatsappLink } from '@/lib/whatsapp'
import OrderLoading from './loading'

export const metadata: Metadata = { title: 'Your order', robots: { index: false } }

/*
  THE ORDER PAGE. Everything on it depends on THIS request: which cookie
  the browser sent, and what time it is now. So the page is a thin static
  shell and all the real work happens in <OrderDetails>, inside <Suspense>.

  Order of checks, cheapest first:
    1. Is the ID in the URL even shaped like an order ID? (Zod)
    2. Is there a cookie for it, and is its signature valid? (HMAC)
    3. Does the decoded order match the schema? (Zod again)
  Any "no" → notFound(). A forged or edited cookie looks exactly like a
  missing one: no hint about what was wrong.
*/
export default function OrderPage({ params, searchParams }: PageProps<'/order/[id]'>) {
  return (
    <div className="mx-auto max-w-content px-4 pt-8 sm:px-6">
      <Suspense fallback={<OrderLoading />}>
        <OrderDetails params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function OrderDetails({ params, searchParams }: Pick<PageProps<'/order/[id]'>, 'params' | 'searchParams'>) {
  const id = OrderIdSchema.safeParse((await params).id)
  if (!id.success) notFound()
  const order = await readOrderCookie(id.data)
  if (!order) notFound()
  const justPlaced = (await searchParams).placed === '1'

  const at = await now()
  const stage = stageAt(order, at)

  /*
    DATES ACROSS THE BOUNDARY. React could send a Date to a Client
    Component (it serializes them), but the browser would then format it
    with the PHONE's time zone and locale, and the text could differ from
    the server's HTML: a hydration mismatch. So every time on this page is
    formatted HERE, in Lagos time, and only finished strings travel.
  */
  const times = timesFor(order)

  return (
    <>
      {justPlaced && <ClearCartOnPlaced orderId={order.id} />}
      <OrderAutoRefresh active={stage !== 'completed'} />

      <div className="flex flex-col gap-2">
        {justPlaced && (
          <p className="flex items-center gap-2 font-semibold text-leaf">
            <Icon name="checkCircle" /> Order placed. Thank you!
          </p>
        )}
        <h1 className="text-4xl font-extrabold sm:text-5xl">
          Order <span className="tabular">{order.id}</span>
        </h1>
        <p className="text-muted">
          Placed at {formatLagosTime(new Date(order.placedAt))}. {headline(order)}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="status-heading" className="rounded-card border border-line bg-raised p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="status-heading" className="text-xl font-extrabold">
                Where’s my order?
              </h2>
              <p className="text-sm text-subtle">
                {stage === 'completed' ? 'Final status' : `Checked at ${formatLagosTime(at)} · updates every 20 seconds`}
              </p>
            </div>
            <div className="mt-5">
              <StatusTracker stage={stage} kind={order.fulfilment.kind} times={times} />
            </div>
          </section>

          <section aria-labelledby="help-heading" className="flex flex-col gap-3 rounded-card border border-line bg-raised p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 id="help-heading" className="font-bold">
                Need to change something?
              </h2>
              <p className="text-sm text-muted">Message the kitchen with your order number already filled in.</p>
            </div>
            <a href={whatsappLink(order)} target="_blank" rel="noopener noreferrer" className={buttonClass({ variant: 'secondary' })}>
              <Icon name="chat" className="text-leaf" /> WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </section>

          <Link href="/menu" className="inline-flex items-center gap-1 font-semibold text-palm hover:underline">
            <Icon name="plus" className="size-4" /> {order.fulfilment.kind === 'dine-in' ? 'Order another round' : 'Start a new order'}
          </Link>
        </div>

        <Receipt order={order} />
      </div>
    </>
  )
}

/** The one-line promise under the heading. */
function headline(order: PlacedOrder): string {
  const f = order.fulfilment
  const ready = formatLagosTime(new Date(order.timeline.readyAt))
  switch (f.kind) {
    case 'delivery':
      return `Expected at your door by about ${formatLagosTime(new Date(order.timeline.completedAt))}.`
    case 'pickup':
      return `Ready for pickup at ${ready}.`
    case 'dine-in':
      return `Food to table ${f.table} at about ${ready}.`
  }
}

function timesFor(order: PlacedOrder): Partial<Record<Stage, string>> {
  const t = (iso: string) => formatLagosTime(new Date(iso))
  return {
    received: t(order.placedAt),
    preparing: t(order.timeline.preparingAt),
    ready: `${order.fulfilment.kind === 'delivery' ? 'Leaves the kitchen' : 'From'} ${t(order.timeline.readyAt)}`,
    completed: `${order.fulfilment.kind === 'delivery' ? 'By about' : 'Around'} ${t(order.timeline.completedAt)}`,
  }
}
