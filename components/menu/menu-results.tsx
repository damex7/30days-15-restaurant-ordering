import Link from 'next/link'
import { CategoryTabs } from '@/components/menu/category-tabs'
import { MenuFilters } from '@/components/menu/menu-filters'
import { MenuSection } from '@/components/menu/menu-section'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { getMenuSections } from '@/lib/data'
import { DIET_FILTER_LABELS, hasMenuFilters, parseMenuQuery, type RawSearchParams } from '@/lib/search-params'

/*
  SERVER COMPONENT that reads the URL.

  `searchParams` is a Promise. Awaiting it is "request-time" work (the static
  shell is built before anyone has typed a search), so under Cache
  Components this component must sit inside <Suspense>, and it does: the
  menu page wraps it with the menu skeleton as the fallback.

  The menu DATA is still cached. getMenuSections() is a 'use cache'
  function, and the parsed query is its argument, so each filter
  combination is worked out once and reused.
*/
export async function MenuResults({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const query = parseMenuQuery(await searchParams)
  const sections = await getMenuSections(query)
  const filtered = hasMenuFilters(query)
  const count = sections.reduce((n, s) => n + s.dishes.length, 0)

  const what = [query.q && `“${query.q}”`, ...query.diet.map((d) => DIET_FILTER_LABELS[d].toLowerCase())].filter(Boolean).join(', ')

  return (
    <>
      <MenuFilters query={query} />
      {/* Announced after each filter change, so screen reader users hear the result. */}
      <p role="status" className="mt-4 text-sm text-muted">
        {filtered ? `${count} ${count === 1 ? 'dish matches' : 'dishes match'} ${what}.` : `${count} dishes, cooked fresh every day.`}
      </p>
      {sections.length === 0 ? (
        <EmptyState
          icon="search"
          title="Nothing matches that"
          action={
            <Link href="/menu" scroll={false} className={buttonClass()}>
              Show the whole menu
            </Link>
          }
        >
          <p>Try a shorter word, or fewer filters. Searching ignores tone marks, so “amala” finds Àmàlà.</p>
        </EmptyState>
      ) : (
        <CategoryTabs tabs={sections.map((s) => ({ id: s.id, name: s.name, count: s.dishes.length }))}>
          {sections.map((section) => (
            <MenuSection key={section.id} section={section} />
          ))}
        </CategoryTabs>
      )}
    </>
  )
}
