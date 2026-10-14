import Link from 'next/link'
import { Suspense } from 'react'
import { DishCard } from '@/components/menu/dish-card'
import { DishPhoto } from '@/components/menu/dish-photo'
import { SpecialsFallback, TodaysSpecials } from '@/components/menu/todays-specials'
import { OpenStatus, OpenStatusFallback } from '@/components/site/open-status'
import { OpeningHours } from '@/components/site/opening-hours'
import { buttonClass } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { getDeliveryAreas, getPopularDishes, getRestaurant } from '@/lib/data'
import { formatNaira } from '@/lib/money'

/*
  THE HOME PAGE: one page, three kinds of rendering.

  - STATIC (in the build's HTML): the hero, the ways to order, the popular
    dishes and the hours. They come from 'use cache' reads, so they are
    computed once at build time.
  - REQUEST TIME, FAST: <OpenStatus>, inside its own <Suspense>, because it
    reads the clock.
  - REQUEST TIME, SLOW: <TodaysSpecials>, inside another <Suspense>, which
    takes 1.5 s. It streams in last and holds nothing else up.

  `next build` marks this route ◐ (Partial Prerender): a static shell with
  two holes that are filled in per request.

  SERVER COMPONENT, and async: it awaits the data layer directly.
*/
export default async function HomePage() {
  const [popular, restaurant, areas] = await Promise.all([getPopularDishes(), getRestaurant(), getDeliveryAreas()])
  const heroDishes = popular.filter((d) => d.photo).slice(0, 3)
  const cheapestFee = Math.min(...areas.map((a) => a.feeKobo))

  const ways: { icon: IconName; title: string; text: string }[] = [
    { icon: 'bike', title: 'Delivery', text: `Across Abuja, from ${formatNaira(cheapestFee)}. Minimum order ${formatNaira(restaurant.minDeliveryOrderKobo)}.` },
    { icon: 'bag', title: 'Pickup', text: 'Choose a time slot and we’ll have it packed and hot at the counter.' },
    { icon: 'table', title: 'At your table', text: 'Scan the QR code on your table and order without waiting for a server.' },
  ]

  return (
    <>
      {/* Hero: the deep forest-green band, dark in both themes, like the leaf the food is served on. */}
      <section className="bg-forest text-forest-ink">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:py-16">
          <div className="flex flex-col items-start gap-5">
            <Suspense fallback={<OpenStatusFallback />}>
              <OpenStatus />
            </Suspense>
            <h1 className="text-4xl leading-[1.05] font-extrabold sm:text-5xl lg:text-6xl">
              Proper Nigerian food, <span className="text-plantain-fill">cooked like home.</span>
            </h1>
            <p className="max-w-prose text-lg text-forest-muted">
              Smoky party jollof, àmàlà with ewédú and gbẹ̀gìrì, suya off the evening fire. From our kitchen in Wuse 2 to your door, the counter or your
              table.
            </p>
            <div className="flex flex-wrap gap-3">
              {/* Chilli red on forest green is dark-on-dark (1.8:1), and red/green is
                  the pair colour-blind visitors confuse most, so on the band the
                  button gets a cream ring that stands out at about 10:1. */}
              <Link href="/menu" className={buttonClass({ size: 'lg', className: 'ring-2 ring-forest-ink' })}>
                Order now <Icon name="arrowRight" />
              </Link>
              <a
                href="#specials"
                className="inline-flex min-h-13 items-center rounded-pill border border-forest-muted/40 px-6 text-lg font-semibold text-forest-ink transition-colors hover:bg-forest-raised"
              >
                Today’s specials
              </a>
            </div>
          </div>
          {heroDishes.length > 0 && (
            <ul className="grid grid-cols-2 gap-3" aria-label="Some of our dishes">
              {heroDishes.map((dish, i) => (
                <li key={dish.id} className={i === 0 ? 'col-span-2' : undefined}>
                  <DishPhoto
                    dish={dish}
                    sizes={i === 0 ? '(min-width: 768px) 34rem, 100vw' : '(min-width: 768px) 17rem, 50vw'}
                    className={i === 0 ? 'aspect-[16/9] rounded-plate' : 'aspect-square rounded-plate'}
                    preload={i === 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-content px-4 sm:px-6">
        <section aria-labelledby="ways-heading" className="py-12">
          <h2 id="ways-heading" className="sr-only">
            Ways to order
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {ways.map((way) => (
              <li key={way.title} className="flex gap-4 rounded-card border border-line bg-raised p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-pill bg-leaf-soft text-leaf">
                  <Icon name={way.icon} className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{way.title}</h3>
                  <p className="mt-1 text-sm text-muted">{way.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="specials" aria-labelledby="specials-heading" className="scroll-mt-24">
          {/* The heading is static, so it's in the shell; only the list streams. */}
          <h2 id="specials-heading" className="flex items-center gap-2 text-3xl font-extrabold">
            <Icon name="sparkle" className="size-7 text-plantain" /> Today’s specials
          </h2>
          <div aria-hidden className="stripe mt-2 mb-5 h-1 w-16 rounded-pill" />
          <Suspense fallback={<SpecialsFallback />}>
            <TodaysSpecials />
          </Suspense>
        </section>

        <section aria-labelledby="popular-heading" className="pt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 id="popular-heading" className="text-3xl font-extrabold">
              Customer favourites
            </h2>
            <Link href="/menu" className="flex items-center gap-1 font-semibold text-leaf hover:underline">
              Full menu <Icon name="chevronRight" className="size-4" />
            </Link>
          </div>
          <div aria-hidden className="stripe mt-2 mb-5 h-1 w-16 rounded-pill" />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((dish) => (
              <li key={dish.id} className="flex">
                <DishCard dish={dish} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="visit-heading" className="mt-14 grid gap-6 rounded-plate border border-line bg-raised p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <h2 id="visit-heading" className="text-2xl font-extrabold">
              Come and eat with us
            </h2>
            <p className="mt-2 flex items-start gap-2 text-muted">
              <Icon name="pin" className="mt-0.5 text-leaf" /> {restaurant.address}
            </p>
            <p className="mt-2 text-sm text-muted">Twelve tables, a fan that works, and the same food we deliver.</p>
          </div>
          <div>
            <h3 className="font-bold">Opening hours</h3>
            <OpeningHours hours={restaurant.hours} className="mt-2" />
            <p className="mt-2 text-xs text-subtle">Lagos time (WAT). Last orders {restaurant.lastOrderMinutesBeforeClose} minutes before closing.</p>
          </div>
        </section>
      </div>
    </>
  )
}
