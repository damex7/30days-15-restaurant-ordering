// CLIENT COMPONENT: two buttons with click handlers. It holds no state of its
// own: the parent owns the number (a "controlled" component), so the dish
// form and the cart can each decide what a change means.
'use client'

import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { CART_LIMITS } from '@/lib/schema/order'

type Props = {
  value: number
  onChange: (next: number) => void
  /** Names the thing being counted, for screen readers: "Party jollof rice". */
  label: string
  size?: 'sm' | 'md'
}

export function QuantityStepper({ value, onChange, label, size = 'md' }: Props) {
  const button = cn('grid place-items-center rounded-pill hover:bg-sunken disabled:opacity-40', size === 'md' ? 'size-11' : 'size-9')
  return (
    <div className="flex items-center rounded-pill border border-line-strong bg-raised" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= 1} className={button}>
        <Icon name="minus" className={size === 'sm' ? 'size-4' : undefined} />
        <span className="sr-only">One fewer</span>
      </button>
      <output className={cn('tabular text-center font-bold', size === 'md' ? 'w-8 text-lg' : 'w-6')} aria-live="polite">
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= CART_LIMITS.maxQuantity} className={button}>
        <Icon name="plus" className={size === 'sm' ? 'size-4' : undefined} />
        <span className="sr-only">One more</span>
      </button>
    </div>
  )
}
