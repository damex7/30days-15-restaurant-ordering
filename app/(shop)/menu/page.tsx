import type { Metadata } from 'next'
import { Suspense } from 'react'
import { MenuResults } from '@/components/menu/menu-results'
import { SpecialsFallback, TodaysSpecials } from '@/components/menu/todays-specials'
import { Icon } from '@/components/ui/icon'
import { MenuSkeleton } from '@/components/ui/skeletons'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'The full Bùkà menu: jollof and rice, swallow and soups, grills and suya, small chops, sides and drinks.',
}

/*
  THE MENU PAGE. SERVER COMPONENT, and not async: it doesn't await anything
  itself. It hands the `searchParams` PROMISE down to <MenuResults>,
  unopened, and that component awaits it inside <Suspense>.

  Why not `await searchParams` here? Then the whole page would depend on the
  URL and nothing could be prerendered. Passing the promise down keeps the
  page heading and both fallbacks in the static shell, and only the part
  that really depends on the URL waits for it.
*/
export default function MenuPage({ searchParams }: PageProps<'/menu'>) {
  return (
    <div className="mx-auto max-w-content px-4 pt-8 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Menu</h1>
      <p className="mt-2 max-w-prose text-muted">
        Everything is cooked in our kitchen in Wuse 2. Prices are per plate and include the stew. Dishes marked with a time are cooked from then.
      </p>

      <details className="group mt-6 rounded-card border border-plantain-soft bg-plantain-soft/50 p-4 open:pb-5" open>
        <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-xl font-extrabold [&::-webkit-details-marker]:hidden">
          <Icon name="sparkle" className="text-plantain" /> Today’s specials
          <Icon name="chevronDown" className="ml-auto size-5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-4">
          <Suspense fallback={<SpecialsFallback />}>
            <TodaysSpecials />
          </Suspense>
        </div>
      </details>

      <div className="mt-8">
        <Suspense fallback={<MenuSkeleton />}>
          <MenuResults searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  )
}
