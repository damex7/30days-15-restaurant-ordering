// CLIENT COMPONENT: radio buttons and checkboxes that change a live price,
// a quantity stepper, and an "Add to cart" that writes to the cart. All of it
// reacts to clicks, so it runs in the browser.
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useCart } from '@/components/cart/cart-provider'
import { buttonClass } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { cn } from '@/lib/cn'
import { formatDelta, formatNaira } from '@/lib/money'
import { describeProblem, priceLine } from '@/lib/pricing'
import type { ChoiceGroup, DishId, PricingDish } from '@/lib/schema/menu'
import { CART_LIMITS, type Choices } from '@/lib/schema/order'

/*
  WHERE THE DISH DATA COMES FROM

  This form receives only the dish ID. Everything it needs to price the
  dish (base price, choice groups, which options are sold out) is already
  in the browser: the (shop) layout sent the price catalogue to
  <CartProvider> once, as a prop. Sending it again here would only make
  the page heavier.

  THE PRICE SHOWN IS A PREVIEW. priceLine() from lib/pricing.ts runs here
  for instant feedback, and the placeOrder Server Action runs the same
  function again over the menu IT loaded. That's the price you pay.
*/

/** Start with the house choice ticked in each required group: the first option that isn't sold out. */
function initialChoices(dish: PricingDish): Choices {
  return Object.fromEntries(
    dish.choiceGroups.map((g) => {
      const first = g.kind === 'single' && g.required ? g.options.find((o) => !o.soldOut) : undefined
      return [g.id, first ? [first.id] : []]
    }),
  )
}

function groupHint(group: ChoiceGroup): string {
  if (group.kind === 'single') return group.required ? 'Required, choose 1' : 'Optional, choose 1'
  return `Optional, choose up to ${group.max}`
}

export function DishOptionsForm({ dishId, closeOnAdd = false }: { dishId: DishId; closeOnAdd?: boolean }) {
  const { catalog, add } = useCart()
  const router = useRouter()
  const dish = catalog[dishId]
  const [choices, setChoices] = useState<Choices>(() => (dish ? initialChoices(dish) : {}))
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const formId = useId()

  if (!dish) return null
  if (dish.soldOut) {
    return <p className="rounded-card bg-pepper-soft p-4 font-semibold text-pepper">Sold out today. Please check back tomorrow.</p>
  }

  const priced = priceLine(dish, choices, quantity)

  function toggle(group: ChoiceGroup, optionId: string, checked: boolean) {
    setError(null)
    setAdded(false)
    setChoices((current) => {
      const picked = current[group.id] ?? []
      const next = group.kind === 'single' ? [optionId] : checked ? [...picked, optionId] : picked.filter((id) => id !== optionId)
      return { ...current, [group.id]: next }
    })
  }

  function changeQuantity(next: number) {
    setAdded(false)
    setQuantity(Math.min(Math.max(next, 1), CART_LIMITS.maxQuantity))
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!priced.ok) {
      setError(describeProblem(priced.error))
      // Move focus to the message so screen reader users hear it straight away.
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    if (!add(dishId, choices, quantity)) {
      setError('Your cart is full. Remove something before adding more.')
      return
    }
    if (closeOnAdd) {
      router.back()
      return
    }
    setAdded(true)
    setQuantity(1)
  }

  return (
    <form onSubmit={submit} aria-describedby={error ? `${formId}-error` : undefined} className="flex flex-col gap-5">
      {dish.choiceGroups.map((group) => {
        const picked = choices[group.id] ?? []
        const full = group.kind === 'multi' && picked.length >= group.max
        return (
          <fieldset key={group.id} className="rounded-card border border-line p-4">
            <legend className="px-1 font-display text-lg font-bold">
              {group.label} <span className="ml-1 font-sans text-sm font-normal text-muted">{groupHint(group)}</span>
            </legend>
            <ul className="mt-1 flex flex-col gap-1">
              {group.options.map((option) => {
                const checked = picked.includes(option.id)
                const disabled = option.soldOut || (full && !checked)
                return (
                  <li key={option.id}>
                    <label
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-control px-3 py-2',
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-sunken',
                        checked && 'bg-palm-soft',
                      )}
                    >
                      <input
                        type={group.kind === 'single' ? 'radio' : 'checkbox'}
                        name={`${formId}-${group.id}`}
                        value={option.id}
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => toggle(group, option.id, e.target.checked)}
                        className="size-5 shrink-0 accent-palm"
                      />
                      <span className="flex-1">
                        {option.label}
                        {option.soldOut && <span className="ml-2 text-sm font-semibold text-pepper">Sold out</span>}
                      </span>
                      <span className="tabular text-sm text-muted">{formatDelta(option.priceDeltaKobo)}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
            {full && <p className="mt-2 text-sm text-muted">That’s the most you can add. Untick one to choose another.</p>}
          </fieldset>
        )
      })}

      {error && (
        <p
          ref={errorRef}
          id={`${formId}-error`}
          role="alert"
          tabIndex={-1}
          className="flex items-start gap-2 rounded-card bg-pepper-soft p-3 font-semibold text-pepper"
        >
          <Icon name="alert" className="mt-0.5" /> {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={quantity} onChange={changeQuantity} label={dish.name} />
        <button type="submit" className={buttonClass({ size: 'lg', className: 'flex-1 justify-between' })}>
          <span>Add {quantity > 1 ? `${quantity} ` : ''}to cart</span>
          <span className="tabular">{priced.ok ? formatNaira(priced.value.lineKobo) : formatNaira(dish.priceKobo * quantity)}</span>
        </button>
      </div>

      {added && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card bg-leaf-soft p-3 font-semibold text-leaf">
          <Icon name="checkCircle" /> Added to your cart.
          <Link href="/cart" className="underline">
            View cart
          </Link>
          <Link href="/menu" className="underline">
            Keep ordering
          </Link>
        </p>
      )}
    </form>
  )
}
