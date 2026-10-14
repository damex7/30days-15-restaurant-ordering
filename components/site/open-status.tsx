import { TextSkeleton } from '@/components/ui/skeletons'
import { now } from '@/lib/clock'
import { getRestaurant } from '@/lib/data'
import { formatLagosTime, kitchenStatus } from '@/lib/hours'
import { cn } from '@/lib/cn'

/*
  SERVER COMPONENT, rendered at REQUEST TIME.

  "Are you open?" depends on the clock, so this can't be part of the static
  shell: now() awaits io(), which suspends while the page is prerendered.
  The page wraps this in <Suspense fallback={<OpenStatusFallback />}>: the
  fallback is what goes into the static HTML, and this component streams in
  for each visitor.

  The browser receives finished words ("Open now · last orders 9:30pm"), not
  a Date to format. Nothing here can disagree between server and browser,
  so there is no hydration mismatch to worry about (see lib/hours.ts).
*/
export async function OpenStatus({ tone = 'grill' }: { tone?: 'grill' | 'paper' }) {
  const [restaurant, at] = await Promise.all([getRestaurant(), now()])
  const status = kitchenStatus(at, restaurant)
  const open = status.kind === 'open'

  const headline =
    status.kind === 'open' ? 'Open now' : status.kind === 'last-orders-passed' ? 'Kitchen closed for orders' : 'Closed right now'
  const detail =
    status.kind === 'open'
      ? `Last orders ${status.lastOrders}`
      : status.kind === 'last-orders-passed'
        ? `Reopens ${status.reopens}`
        : `Opens ${status.reopens}`

  return (
    <p
      className={cn(
        'inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-pill px-4 py-2 text-sm',
        tone === 'grill' ? 'bg-grill-raised text-grill-ink' : 'bg-sunken text-ink',
      )}
    >
      <span aria-hidden className={cn('size-2.5 rounded-pill', open ? 'animate-pulse-dot bg-leaf' : 'bg-pepper')} />
      <span className="font-bold">{headline}</span>
      <span className={tone === 'grill' ? 'text-grill-muted' : 'text-muted'}>
        · {detail} · It’s {formatLagosTime(at)} in Abuja
      </span>
    </p>
  )
}

export function OpenStatusFallback() {
  return <TextSkeleton className="h-9 w-72 max-w-full rounded-pill" label="Checking whether the kitchen is open" />
}
