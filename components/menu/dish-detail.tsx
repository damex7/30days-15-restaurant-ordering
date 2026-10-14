import { DietaryTags } from '@/components/menu/dietary-tags'
import { DishOptionsForm } from '@/components/menu/dish-options-form'
import { DishPhoto } from '@/components/menu/dish-photo'
import { Icon } from '@/components/ui/icon'
import { formatClock } from '@/lib/hours'
import { formatNaira } from '@/lib/money'
import type { PublicDish } from '@/lib/schema/menu'
import { cn } from '@/lib/cn'

/*
  SERVER COMPONENT: everything about one dish, used by BOTH the full page
  (/menu/[slug]) and the quick-view modal.

  Only one small piece inside is client code: <DishOptionsForm>, which gets
  the dish ID and nothing else. The photo, the description, the tags and
  the credit stay server-rendered HTML.

  "Cooked from 4pm" is shown as fixed text, not "available now / not yet":
  that would depend on the clock and stop this page being static. The
  Server Action checks the time when the order is placed.
*/
export function DishDetail({ dish, variant }: { dish: PublicDish; variant: 'page' | 'modal' }) {
  const page = variant === 'page'
  return (
    <div className={cn('grid gap-6', page ? 'md:grid-cols-2 md:gap-10' : 'p-5')}>
      {/* On wide screens the photo stays in view while you scroll the options. */}
      <div className={cn('flex flex-col gap-2', page && 'md:sticky md:top-24 md:self-start')}>
        <DishPhoto
          dish={dish}
          sizes={page ? '(min-width: 768px) 36rem, 100vw' : '(min-width: 768px) 46rem, 100vw'}
          className={cn('rounded-plate', page ? 'aspect-[4/3]' : 'aspect-[16/9]')}
          preload
        />
        {dish.photo && (
          <p className="text-xs text-subtle">
            Photo:{' '}
            <a href={dish.photo.credit.sourceUrl} className="underline hover:text-ink" rel="noopener noreferrer" target="_blank">
              {dish.photo.credit.author}
              <span className="sr-only"> (opens Wikimedia Commons in a new tab)</span>
            </a>
            ,{' '}
            {dish.photo.credit.licenceUrl ? (
              <a href={dish.photo.credit.licenceUrl} className="underline hover:text-ink" rel="noopener noreferrer license" target="_blank">
                {dish.photo.credit.licence}
              </a>
            ) : (
              dish.photo.credit.licence
            )}
            , via Wikimedia Commons
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          {page ? (
            <h1 className="text-4xl font-extrabold sm:text-5xl">{dish.name}</h1>
          ) : (
            // In the modal the dialog's own title already names the dish.
            <p className="sr-only">{dish.name}</p>
          )}
          {dish.localName && (
            <p className="mt-1 font-display text-lg text-muted">
              {dish.localName}
            </p>
          )}
          <p className="tabular mt-2 text-2xl font-bold">
            {dish.choiceGroups.length > 0 && <span className="text-base font-normal text-muted">from </span>}
            {formatNaira(dish.priceKobo)}
          </p>
        </div>
        <p className="text-muted">{dish.description}</p>
        <DietaryTags dietary={dish.dietary} />
        {dish.availableFrom && (
          <p className="flex items-start gap-2 rounded-card bg-plantain-soft p-3 text-sm text-plantain">
            <Icon name="clock" className="mt-0.5 size-4" />
            <span>
              <strong>Cooked from {formatClock(dish.availableFrom)}</strong> each day. You can add it now; we check the time when you place your order.
            </span>
          </p>
        )}
        <DishOptionsForm dishId={dish.id} closeOnAdd={!page} />
      </div>
    </div>
  )
}
