import Link from 'next/link'
import { LogoMark } from '@/components/site/logo'
import { getRestaurant } from '@/lib/data'
import { hoursTable } from '@/lib/hours'
import { site } from '@/lib/site'

/**
 * SERVER COMPONENT, and an async one: it awaits the restaurant's details
 * straight from the data layer. Only Server Components can be async like
 * this; a Client Component would need an effect or a prop.
 * The read is cached ('use cache'), so the footer is part of every page's
 * static shell.
 */
export async function SiteFooter() {
  const restaurant = await getRestaurant()
  return (
    <footer className="mt-16 border-t border-line bg-sunken">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-extrabold">
            <LogoMark className="size-7" /> {site.name}
          </p>
          <p className="mt-2 text-sm text-muted">{restaurant.address}</p>
          <p className="mt-1 text-sm text-muted">
            Call <a href={`tel:${site.publicPhone.replace(/\s/g, '')}`} className="font-semibold text-ink underline">{site.publicPhone}</a>
          </p>
        </div>
        <div>
          <h2 className="text-base font-bold">Opening hours</h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {hoursTable(restaurant.hours).map((row) => (
              <div key={row.days} className="contents">
                <dt className="text-muted">{row.days}</dt>
                <dd className="tabular">{row.time}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-subtle">Lagos time (WAT). Last orders 30 minutes before closing.</p>
        </div>
        <div>
          <h2 className="text-base font-bold">Ordering</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>Delivery across Abuja, pickup, or at your table</li>
            <li>Pay on delivery, at the counter or at the table</li>
            <li>
              <Link href="/credits" className="underline hover:text-ink">
                Photo credits
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
