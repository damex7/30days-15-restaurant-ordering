// CLIENT COMPONENT: the cart lives in this browser's localStorage, so only
// the browser can show it. The server sends this page as an empty shell and
// this component fills it in after hydration.
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/components/cart/cart-provider'
import { Totals } from '@/components/cart/totals'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon, type IconName } from '@/components/ui/icon'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { checkoutBlockers, summariseCart, type CartLineView } from '@/lib/cart/summary'
import { cn } from '@/lib/cn'
import { formatNaira } from '@/lib/money'
import { describeProblem } from '@/lib/pricing'
import type { OrderTypeDraft } from '@/lib/schema/cart'
import type { DeliveryArea } from '@/lib/schema/restaurant'

/*
  PROPS FROM THE SERVER: plain data only.

  The cart page (a Server Component) loads the delivery areas, the minimum
  order and the table list, and passes them here. Arrays of plain objects
  and numbers serialize fine. What it CAN'T pass is behaviour (an onChange
  from the server), and it doesn't need to: the actions come from useCart().
*/
type Props = {
  areas: DeliveryArea[]
  minDeliveryOrderKobo: number
  tables: number[]
}

export function CartView({ areas, minDeliveryOrderKobo, tables }: Props) {
  const { snapshot, catalog, setQuantity, remove, setOrderType, dismissNotice } = useCart()

  // null = localStorage not read yet (server render and hydration).
  if (!snapshot) return <CartSkeleton />

  const { cart, notice } = snapshot
  const summary = summariseCart(cart, catalog, areas)
  const blockers = checkoutBlockers(summary, cart.orderType, minDeliveryOrderKobo)

  return (
    <>
      {notice && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-card bg-plantain-soft p-4 text-plantain">
          <Icon name="info" className="mt-0.5" />
          <p className="flex-1">
            {notice.kind === 'migrated'
              ? 'We updated your saved cart to work with the new menu. Everything you added is still here.'
              : 'Your saved cart couldn’t be read, so we started a fresh one. Sorry about that!'}
          </p>
          <button type="button" onClick={dismissNotice} className="-m-1 grid size-9 place-items-center rounded-pill hover:bg-plantain-soft">
            <Icon name="x" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}

      {cart.lines.length === 0 ? (
        <EmptyState
          icon="cart"
          title="Your cart is empty"
          action={
            <Link href="/menu" className={buttonClass()}>
              Browse the menu
            </Link>
          }
        >
          <p>Jollof, swallow, suya, small chops: it all starts on the menu.</p>
        </EmptyState>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <div className="flex flex-col gap-8">
            <section aria-labelledby="items-heading">
              <h2 id="items-heading" className="sr-only">
                Items
              </h2>
              <ul className="divide-y divide-line rounded-card border border-line bg-raised">
                {summary.lines.map((view) => (
                  <CartLineRow key={view.line.lineId} view={view} onQuantity={(q) => setQuantity(view.line.lineId, q)} onRemove={() => remove(view.line.lineId)} />
                ))}
              </ul>
              <Link href="/menu" className="mt-3 inline-flex items-center gap-1 font-semibold text-leaf hover:underline">
                <Icon name="plus" className="size-4" /> Add more from the menu
              </Link>
            </section>

            <OrderTypePicker orderType={cart.orderType} onChange={setOrderType} areas={areas} tables={tables} />
          </div>

          <aside aria-labelledby="summary-heading" className="rounded-card border border-line bg-raised p-5 lg:sticky lg:top-24">
            <h2 id="summary-heading" className="text-xl font-extrabold">
              Order summary
            </h2>
            <Totals totals={summary} showDelivery={cart.orderType?.kind === 'delivery'} className="mt-4" />
            <p className="mt-3 text-xs text-subtle">Prices are checked again by the kitchen when you place your order.</p>
            {blockers.length > 0 && (
              <ul id="checkout-blockers" className="mt-4 flex flex-col gap-2 text-sm">
                {blockers.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-danger">
                    <Icon name="alert" className="mt-0.5 size-4" /> {b}
                  </li>
                ))}
              </ul>
            )}
            {blockers.length === 0 ? (
              <Link href="/checkout" className={buttonClass({ size: 'lg', className: 'mt-5 w-full' })}>
                Go to checkout <Icon name="arrowRight" />
              </Link>
            ) : (
              // A link can't be disabled, so this is a disabled-looking
              // element that explains itself instead of silently doing nothing.
              <span role="link" aria-disabled="true" aria-describedby="checkout-blockers" className={buttonClass({ size: 'lg', className: 'mt-5 w-full' })}>
                Go to checkout <Icon name="arrowRight" />
              </span>
            )}
          </aside>
        </div>
      )}
    </>
  )
}

function CartLineRow({ view, onQuantity, onRemove }: { view: CartLineView; onQuantity: (q: number) => void; onRemove: () => void }) {
  const { line, dish, priced } = view
  const name = dish?.name ?? 'Item no longer on the menu'
  return (
    <li className="flex gap-3 p-4 sm:gap-4">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-control bg-sunken sm:size-20">
        {dish?.photoSrc && <Image src={dish.photoSrc} alt="" fill sizes="5rem" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="leading-tight font-bold">{dish ? <Link href={`/menu/${dish.slug}`}>{name}</Link> : name}</h3>
            {priced.ok && priced.value.options.length > 0 && <p className="mt-0.5 text-sm text-muted">{priced.value.options.join(' · ')}</p>}
            {priced.ok && <p className="tabular mt-0.5 text-sm text-subtle">{formatNaira(priced.value.unitKobo)} each</p>}
          </div>
          <p className={cn('tabular shrink-0 font-bold', priced.ok ? 'text-chilli' : 'text-subtle')}>{priced.ok ? formatNaira(priced.value.lineKobo) : '—'}</p>
        </div>
        {!priced.ok && (
          <p className="flex items-start gap-2 text-sm font-semibold text-danger">
            <Icon name="alert" className="mt-0.5 size-4" /> {describeProblem(priced.error)}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <QuantityStepper value={line.quantity} onChange={onQuantity} label={name} size="sm" />
          <button type="button" onClick={onRemove} className={buttonClass({ variant: 'danger', size: 'sm' })}>
            <Icon name="trash" className="size-4" /> Remove<span className="sr-only"> {name}</span>
          </button>
        </div>
      </div>
    </li>
  )
}

const KINDS: { kind: OrderTypeDraft['kind']; icon: IconName; label: string; hint: string }[] = [
  { kind: 'delivery', icon: 'bike', label: 'Delivery', hint: 'To your door in Abuja' },
  { kind: 'pickup', icon: 'bag', label: 'Pickup', hint: 'Collect at the counter' },
  { kind: 'dine-in', icon: 'table', label: 'Dine-in', hint: 'Eat at a table here' },
]

function OrderTypePicker({
  orderType,
  onChange,
  areas,
  tables,
}: {
  orderType: OrderTypeDraft | null
  onChange: (next: OrderTypeDraft) => void
  areas: DeliveryArea[]
  tables: number[]
}) {
  function choose(kind: OrderTypeDraft['kind']) {
    if (orderType?.kind === kind) return
    if (kind === 'delivery') onChange({ kind, areaId: null })
    else if (kind === 'pickup') onChange({ kind })
    else onChange({ kind, table: tables[0] ?? 1 })
  }

  return (
    <section aria-labelledby="type-heading">
      <h2 id="type-heading" className="text-2xl font-extrabold">
        How would you like it?
      </h2>
      <fieldset className="mt-4">
        <legend className="sr-only">Order type</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {KINDS.map((k) => (
            <label
              key={k.kind}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-card border-2 bg-raised p-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus',
                orderType?.kind === k.kind ? 'border-leaf bg-leaf-soft' : 'border-line hover:border-line-strong',
              )}
            >
              <input type="radio" name="order-kind" value={k.kind} checked={orderType?.kind === k.kind} onChange={() => choose(k.kind)} className="sr-only" />
              <Icon name={k.icon} className="size-6 text-leaf" />
              <span>
                <span className="block font-bold">{k.label}</span>
                <span className="block text-sm text-muted">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {orderType?.kind === 'delivery' && (
        <div className="mt-4">
          <label htmlFor="area" className="font-semibold">
            Delivery area
          </label>
          <select
            id="area"
            value={orderType.areaId ?? ''}
            onChange={(e) => onChange({ kind: 'delivery', areaId: e.target.value || null })}
            className="mt-1 block min-h-12 w-full rounded-control border border-line-strong bg-raised px-3 sm:max-w-sm"
          >
            <option value="">Choose your area…</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}: {formatNaira(a.feeKobo)}, {a.etaMinutes[0]}–{a.etaMinutes[1]} min
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-muted">You’ll add your street address at checkout.</p>
        </div>
      )}
      {orderType?.kind === 'pickup' && <p className="mt-4 text-muted">You’ll pick a collection time at checkout. Slots start 30 minutes from now.</p>}
      {orderType?.kind === 'dine-in' && (
        <div className="mt-4">
          <label htmlFor="table" className="font-semibold">
            Your table
          </label>
          <select
            id="table"
            value={orderType.table}
            onChange={(e) => onChange({ kind: 'dine-in', table: Number(e.target.value) })}
            className="mt-1 block min-h-12 w-full rounded-control border border-line-strong bg-raised px-3 sm:max-w-40"
          >
            {tables.map((t) => (
              <option key={t} value={t}>
                Table {t}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-muted">The number is on the stand on your table. Scanning its QR code fills this in.</p>
        </div>
      )}
    </section>
  )
}

function CartSkeleton() {
  return (
    <div role="status" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <span className="sr-only">Loading your cart</span>
      <div aria-hidden className="flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-4 rounded-card border border-line bg-raised p-4">
            <div className="skeleton size-20" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton mt-2 h-9 w-28 rounded-pill" />
            </div>
          </div>
        ))}
      </div>
      <div aria-hidden className="skeleton h-64 rounded-card" />
    </div>
  )
}
