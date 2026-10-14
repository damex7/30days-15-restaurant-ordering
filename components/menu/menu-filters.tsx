import Form from 'next/form'
import Link from 'next/link'
import { AutoSubmit } from '@/components/menu/auto-submit'
import { buttonClass } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { DIET_FILTERS, DIET_FILTER_LABELS, hasMenuFilters, type MenuQuery } from '@/lib/search-params'

/**
 * SERVER COMPONENT: the search box and diet filters, as a GET form.
 *
 * The filters live in the URL (/menu?q=suya&diet=mild), so a filtered menu
 * can be shared or bookmarked. The server reads the URL, so the boxes come
 * back already ticked: `defaultChecked` from the parsed query.
 */
export function MenuFilters({ query }: { query: MenuQuery }) {
  const filtered = hasMenuFilters(query)
  return (
    // replace: typing "jollof" shouldn't leave six history entries.
    // scroll={false}: stay where you are while the results change.
    <Form action="/menu" replace scroll={false} className="flex flex-col gap-3" role="search" aria-label="Search and filter the menu">
      <AutoSubmit syncKey={JSON.stringify(query)}>
        <div className="flex gap-2">
          <label htmlFor="menu-q" className="sr-only">
            Search the menu
          </label>
          <div className="relative flex-1">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle" />
            <input
              id="menu-q"
              name="q"
              type="search"
              defaultValue={query.q ?? ''}
              placeholder="Search: jollof, suya, ẹ̀gúsí…"
              maxLength={60}
              autoComplete="off"
              enterKeyHint="search"
              className="min-h-12 w-full rounded-pill border border-line-strong bg-raised pr-4 pl-11 text-base placeholder:text-subtle"
            />
          </div>
          <button type="submit" className={buttonClass({ variant: 'secondary', className: 'min-h-12' })}>
            Search
          </button>
        </div>
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Dietary filters</legend>
          {DIET_FILTERS.map((diet) => (
            <label
              key={diet}
              className="flex cursor-pointer items-center gap-2 rounded-pill border border-line-strong bg-raised px-3 py-1.5 text-sm font-semibold text-muted has-checked:border-leaf has-checked:bg-leaf-soft has-checked:text-leaf has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus"
            >
              <input type="checkbox" name="diet" value={diet} defaultChecked={query.diet.includes(diet)} className="peer sr-only" />
              <Icon name="check" className="hidden size-4 peer-checked:block" />
              {DIET_FILTER_LABELS[diet]}
            </label>
          ))}
          {filtered && (
            <Link href="/menu" scroll={false} replace className={buttonClass({ variant: 'ghost', size: 'sm' })}>
              <Icon name="x" className="size-4" /> Clear filters
            </Link>
          )}
        </fieldset>
      </AutoSubmit>
    </Form>
  )
}
