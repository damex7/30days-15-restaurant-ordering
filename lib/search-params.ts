import { z } from 'zod'

/*
  THE URL IS USER INPUT (the Day 14 lesson, again)

  /menu?q=jollof&diet=vegetarian&diet=no-nuts

  Filters live in the URL so a filtered menu can be shared on WhatsApp,
  bookmarked, and survives a refresh. But anyone can type anything into a
  URL, so it's PARSED with Zod, field by field. Each field has .catch():
  if one value is junk it falls back to its default instead of failing the
  whole parse. /menu?diet=banana&q=suya still searches for suya.

  Shared module: the menu page (server) parses the URL, and the filter form
  (client) uses the same option list.
*/

export const DIET_FILTERS = ['vegetarian', 'no-nuts', 'no-fish', 'mild'] as const
export type DietFilter = (typeof DIET_FILTERS)[number]

export const DIET_FILTER_LABELS: Record<DietFilter, string> = {
  vegetarian: 'Vegetarian',
  'no-nuts': 'No nuts',
  'no-fish': 'No fish',
  mild: 'Mild (little or no pepper)',
}

/** `?diet=a&diet=b` arrives as ['a', 'b'] and `?diet=a` as 'a'. Make both a list. */
const asList = (value: unknown): unknown[] => (Array.isArray(value) ? value : value === undefined ? [] : [value])

export const MenuQuerySchema = z.object({
  q: z
    .preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().trim().max(60).optional())
    .transform((v) => v || undefined)
    .catch(undefined),
  // Unknown diet values are dropped one by one; the valid ones still apply.
  diet: z
    .preprocess(asList, z.array(z.unknown()))
    .transform((values) => [...new Set(values.filter((v): v is DietFilter => DIET_FILTERS.includes(v as DietFilter)))].sort())
    .catch([]),
})
export type MenuQuery = z.infer<typeof MenuQuerySchema>

export type RawSearchParams = Record<string, string | string[] | undefined>

/** Never throws: every field has a fallback. */
export function parseMenuQuery(raw: RawSearchParams): MenuQuery {
  return MenuQuerySchema.parse(raw)
}

export const hasMenuFilters = (query: MenuQuery) => Boolean(query.q) || query.diet.length > 0
