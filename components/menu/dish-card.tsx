import Link from 'next/link'
import { AddToCartButton } from '@/components/menu/add-to-cart-button'
import { DietaryTags } from '@/components/menu/dietary-tags'
import { DishPhoto } from '@/components/menu/dish-photo'
import { buttonClass } from '@/components/ui/button'
import { formatClock } from '@/lib/hours'
import { formatNaira } from '@/lib/money'
import type { PublicDish } from '@/lib/schema/menu'

/** Can this dish go straight into the cart, or must the customer choose something first? */
export const needsChoices = (dish: Pick<PublicDish, 'choiceGroups'>) => dish.choiceGroups.some((g) => g.kind === 'single' && g.required)

/*
  SERVER COMPONENT: everything here is decided once, on the server: the
  photo, the formatted price, the tags, which button to show. The only
  client code inside is the small AddToCartButton, for dishes that need no
  choices. Dishes with required choices link to their page (or its modal).
*/
export function DishCard({ dish, note, preloadPhoto }: { dish: PublicDish; note?: string; preloadPhoto?: boolean }) {
  const href = `/menu/${dish.slug}`
  const hasChoices = needsChoices(dish)
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-raised shadow-card transition-shadow hover:shadow-raised">
      <DishPhoto dish={dish} sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 100vw" className="aspect-[4/3]" preload={preloadPhoto} />
      {dish.soldOut && (
        <span className="absolute top-3 left-3 rounded-pill bg-danger px-3 py-1 text-xs font-bold tracking-wide text-danger-ink uppercase">Sold out today</span>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-tight font-bold">
            {/* The heading link covers the whole card (the ::after), so the
                card is one big tap target, but the Add button stays a
                separate control on top of it. */}
            <Link href={href} className="rounded-control after:absolute after:inset-0 after:content-['']">
              {dish.name}
            </Link>
          </h3>
          <p className="tabular shrink-0 font-bold text-chilli">{formatNaira(dish.priceKobo)}</p>
        </div>
        {note && <p className="text-sm font-semibold text-plantain">{note}</p>}
        <p className="line-clamp-2 text-sm text-muted">{dish.description}</p>
        <DietaryTags dietary={dish.dietary} />
        <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-xs text-subtle">
            {dish.availableFrom ? `Cooked from ${formatClock(dish.availableFrom)}` : hasChoices ? 'Choices available' : ' '}
          </p>
          {dish.soldOut ? (
            <span className="rounded-pill px-3 py-1.5 text-sm font-semibold text-subtle">Sold out</span>
          ) : hasChoices ? (
            <Link href={href} className={buttonClass({ size: 'sm', variant: 'secondary' })}>
              Choose<span className="sr-only"> options for {dish.name}</span>
            </Link>
          ) : (
            <AddToCartButton dishId={dish.id} dishName={dish.name} />
          )}
        </div>
      </div>
    </article>
  )
}
