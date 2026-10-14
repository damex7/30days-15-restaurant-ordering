// CLIENT COMPONENT: it reads the cart (localStorage, via context), shows
// errors that come back from the server, and knows when it's submitting.
// The work itself (checking and pricing the order) happens on the server.
'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import type { CheckoutField, CheckoutState } from '@/app/(shop)/checkout/actions'
import { useCart } from '@/components/cart/cart-provider'
import { Totals } from '@/components/cart/totals'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { checkoutBlockers, summariseCart } from '@/lib/cart/summary'
import type { KitchenStatus, PickupSlot } from '@/lib/hours'
import { formatNaira } from '@/lib/money'
import { ORDER_KIND_LABELS, PAYMENT_LABELS, PAYMENT_OPTIONS } from '@/lib/schema/order'
import type { DeliveryArea } from '@/lib/schema/restaurant'
import { cn } from '@/lib/cn'

/*
  A SERVER ACTION, PASSED AS A PROP

  `action` is placeOrder from ./actions.ts, handed down by the checkout page
  (a Server Component). Functions normally can't cross from server to
  client, but a Server Action can: what crosses is a REFERENCE to an
  endpoint, and calling it posts the form to the server.

  useActionState(action, initial) gives back:
    - `state`: whatever the action last returned (here: errors to show),
    - `formAction`: the function to put on <form action={…}>.
  With no JavaScript yet (still loading), the form posts normally and the
  server renders the result; with JavaScript, React posts it in the
  background and updates `state` in place.

  WHAT THE FORM SENDS ABOUT THE CART: IDs, choices and quantities in a hidden
  `items` field, plus the total shown here in `clientTotalKobo`. No prices.
  Change that hidden field in DevTools and the server will price whatever
  you claim from its own menu, and tell you about the difference.
*/

type Props = {
  action: (state: CheckoutState, formData: FormData) => Promise<CheckoutState>
  kitchen: KitchenStatus
  slots: PickupSlot[]
  areas: DeliveryArea[]
  minDeliveryOrderKobo: number
  nowLabel: string
}

const initialState: CheckoutState = { status: 'idle' }

export function CheckoutForm({ action, kitchen, slots, areas, minDeliveryOrderKobo, nowLabel }: Props) {
  const { snapshot, catalog } = useCart()
  const [state, formAction] = useActionState(action, initialState)
  const summaryRef = useRef<HTMLDivElement>(null)

  // After a failed submit, move focus to the error summary so keyboard and
  // screen reader users land on the list of what to fix.
  useEffect(() => {
    if (state.status === 'error') summaryRef.current?.focus()
  }, [state])

  if (!snapshot) return <CheckoutSkeleton />
  const { cart } = snapshot
  const summary = summariseCart(cart, catalog, areas)
  const blockers = checkoutBlockers(summary, cart.orderType, minDeliveryOrderKobo)
  const orderType = cart.orderType

  if (summary.itemCount === 0) {
    return (
      <EmptyState
        icon="cart"
        title="Nothing to check out yet"
        action={
          <Link href="/menu" className={buttonClass()}>
            Browse the menu
          </Link>
        }
      />
    )
  }
  if (blockers.length > 0 || !orderType) {
    return (
      <div className="rounded-card border border-line bg-raised p-6">
        <h2 className="text-xl font-bold">A couple of things first</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {blockers.map((b) => (
            <li key={b} className="flex items-start gap-2 text-pepper">
              <Icon name="alert" className="mt-0.5 size-4" /> {b}
            </li>
          ))}
        </ul>
        <Link href="/cart" className={buttonClass({ className: 'mt-5' })}>
          <Icon name="arrowLeft" /> Back to your cart
        </Link>
      </div>
    )
  }

  const errors = state.status === 'error' ? state : null
  const values = errors?.values ?? {}
  const fieldError = (field: CheckoutField) => errors?.fieldErrors[field]
  const items = cart.lines.map(({ dishId, quantity, choices }) => ({ dishId, quantity, choices }))
  const kitchenClosedForThis = orderType.kind !== 'pickup' && kitchen.kind !== 'open'
  const payments = PAYMENT_OPTIONS[orderType.kind]
  const area = orderType.kind === 'delivery' ? areas.find((a) => a.id === orderType.areaId) : undefined

  return (
    <form action={formAction} noValidate className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-6">
        {errors && (
          <div ref={summaryRef} tabIndex={-1} role="alert" aria-labelledby="error-summary-title" className="rounded-card border-2 border-pepper bg-pepper-soft p-5 outline-none">
            <h2 id="error-summary-title" className="flex items-center gap-2 text-lg font-bold text-pepper">
              <Icon name="alert" /> We couldn’t place your order yet
            </h2>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-6 text-pepper">
              {errors.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {kitchenClosedForThis && (
          <p className="flex items-start gap-2 rounded-card bg-plantain-soft p-4 text-plantain">
            <Icon name="clock" className="mt-0.5" />
            <span>
              It’s {nowLabel} in Abuja and{' '}
              {kitchen.kind === 'closed' ? `we’re closed until ${kitchen.reopens}` : `the kitchen has taken its last orders (we reopen ${kitchen.reopens})`}.{' '}
              {ORDER_KIND_LABELS[orderType.kind]} orders can’t be placed until then, but you can{' '}
              <Link href="/cart" className="font-semibold underline">
                switch to pickup
              </Link>{' '}
              for later.
            </span>
          </p>
        )}

        {/* What the server needs to know about the cart: IDs, not prices. */}
        <input type="hidden" name="orderType" value={orderType.kind} />
        {orderType.kind === 'delivery' && <input type="hidden" name="areaId" value={orderType.areaId ?? ''} />}
        {orderType.kind === 'dine-in' && <input type="hidden" name="table" value={orderType.table} />}
        <input type="hidden" name="items" value={JSON.stringify(items)} />
        <input type="hidden" name="clientTotalKobo" value={summary.totalKobo} />

        <Section title="Your details">
          <Field id="name" label="Name" error={fieldError('name')}>
            <input id="name" name="name" autoComplete="name" defaultValue={values.name} maxLength={60} {...invalid('name', fieldError('name'), false)} className={inputClass} />
          </Field>
          <Field id="phone" label="Phone number" hint="So the kitchen or rider can reach you. 0803 123 4567 or +234 803 123 4567." error={fieldError('phone')}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={values.phone} {...invalid('phone', fieldError('phone'))} className={inputClass} />
          </Field>
        </Section>

        <Section title={ORDER_KIND_LABELS[orderType.kind]} action={<Link href="/cart" className="text-sm font-semibold text-palm hover:underline">Change</Link>}>
          {orderType.kind === 'delivery' && (
            <>
              <p className="text-muted">
                To <strong className="text-ink">{area?.name}</strong>, usually {area?.etaMinutes[0]}–{area?.etaMinutes[1]} minutes after the food leaves the kitchen.
              </p>
              <Field id="address" label="Street address" hint="House number, street, and a landmark the rider can ask for." error={fieldError('address')}>
                <textarea id="address" name="address" rows={2} autoComplete="street-address" defaultValue={values.address} maxLength={200} {...invalid('address', fieldError('address'))} className={inputClass} />
              </Field>
            </>
          )}
          {orderType.kind === 'pickup' &&
            (slots.length === 0 ? (
              <p className="text-pepper">There are no pickup times left today or tomorrow. Please check back later.</p>
            ) : (
              <Field id="slot" label="Pickup time" hint={`Lagos time. It’s ${nowLabel} now; the earliest slot is 30 minutes away.`} error={fieldError('slot')}>
                <select id="slot" name="slot" defaultValue={values.slot ?? slots[0]?.value} {...invalid('slot', fieldError('slot'))} className={inputClass}>
                  {['Today', 'Tomorrow'].map((day) => {
                    const daySlots = slots.filter((s) => s.day === day)
                    return daySlots.length === 0 ? null : (
                      <optgroup key={day} label={day}>
                        {daySlots.map((s) => (
                          <option key={s.value} value={s.value}>
                            {day} {s.time}
                          </option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </Field>
            ))}
          {orderType.kind === 'dine-in' && (
            <p className="flex items-center gap-2 text-lg">
              <Icon name="table" className="text-leaf" /> Table <strong>{orderType.table}</strong>
            </p>
          )}
        </Section>

        <Section title="Payment">
          <fieldset aria-describedby={fieldError('payment') ? 'payment-error' : undefined}>
            <legend className="sr-only">How you’ll pay</legend>
            <div className="flex flex-col gap-2">
              {payments.map((method, i) => (
                <label key={method} className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-3 has-checked:border-palm has-checked:bg-palm-soft">
                  <input type="radio" name="payment" value={method} defaultChecked={values.payment ? values.payment === method : i === 0} className="mt-1 size-5 accent-palm" />
                  <span>
                    <span className="block font-semibold">{PAYMENT_LABELS[method].label}</span>
                    <span className="block text-sm text-muted">{PAYMENT_LABELS[method].hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {fieldError('payment') && (
              <p id="payment-error" className="mt-2 text-sm font-semibold text-pepper">
                {fieldError('payment')}
              </p>
            )}
          </fieldset>
          <p className="text-sm text-muted">No card details online: you pay when the food reaches you.</p>
        </Section>

        <Section title="Anything else?">
          <Field id="note" label="Note for the kitchen (optional)" hint="Allergies, “less pepper”, or where to find your gate. Up to 200 characters." error={fieldError('note')}>
            <textarea id="note" name="note" rows={2} maxLength={200} defaultValue={values.note} {...invalid('note', fieldError('note'))} className={inputClass} />
          </Field>
        </Section>
      </div>

      <aside aria-labelledby="checkout-summary" className="rounded-card border border-line bg-raised p-5 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <h2 id="checkout-summary" className="text-xl font-extrabold">
            Your order
          </h2>
          <Link href="/cart" className="text-sm font-semibold text-palm hover:underline">
            Edit
          </Link>
        </div>
        <ul className="mt-3 flex flex-col gap-2 border-b border-line pb-3 text-sm">
          {summary.lines.map(({ line, dish, priced }) => (
            <li key={line.lineId} className="flex justify-between gap-3">
              <span>
                {line.quantity} × {dish?.name}
                {priced.ok && priced.value.options.length > 0 && <span className="block text-muted">{priced.value.options.join(' · ')}</span>}
              </span>
              <span className="tabular shrink-0">{priced.ok ? formatNaira(priced.value.lineKobo) : '—'}</span>
            </li>
          ))}
        </ul>
        <Totals totals={summary} showDelivery={orderType.kind === 'delivery'} className="mt-3" />
        <SubmitButton total={summary.totalKobo} />
        <p className="mt-3 text-xs text-subtle">The kitchen checks every price and time again when you place the order.</p>
      </aside>
    </form>
  )
}

/** useFormStatus reads the state of the <form> it's inside, so it must be a child component. */
function SubmitButton({ total }: { total: number }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonClass({ size: 'lg', className: 'mt-5 w-full' })}>
      {pending ? (
        <>
          <Icon name="refresh" className="animate-spin" /> Placing your order…
        </>
      ) : (
        <>Place order · {formatNaira(total)}</>
      )}
    </button>
  )
}

const inputClass = 'block min-h-12 w-full rounded-control border border-line-strong bg-raised px-3 py-2 aria-invalid:border-pepper aria-invalid:bg-pepper-soft/40'

/** aria-invalid and aria-describedby wire each input to its hint and error message. */
function invalid(id: string, error: string | undefined, hasHint = true) {
  const describedBy = [error && `${id}-error`, hasHint && `${id}-hint`].filter(Boolean).join(' ')
  return { 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy || undefined }
}

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-sm font-semibold text-pepper">
          <Icon name="alert" className="size-4" /> {error}
        </p>
      )}
    </div>
  )
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn('flex flex-col gap-4 rounded-card border border-line bg-raised p-5')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-extrabold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function CheckoutSkeleton() {
  return (
    <div role="status" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <span className="sr-only">Loading checkout</span>
      <div aria-hidden className="flex flex-col gap-6">
        <div className="skeleton h-48 rounded-card" />
        <div className="skeleton h-40 rounded-card" />
        <div className="skeleton h-32 rounded-card" />
      </div>
      <div aria-hidden className="skeleton h-72 rounded-card" />
    </div>
  )
}
