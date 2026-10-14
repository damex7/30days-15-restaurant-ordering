// THE DATA ACCESS LAYER. Every page gets menu and restaurant data from here
// and nowhere else; nothing outside this file imports /data.
//
// Today these functions read typed seed data. On Day 16 their BODIES become
// PostgreSQL queries, while their names, arguments and return types stay the
// same. They are already `async` for that reason: pages `await` them as if
// they were database calls.
//
// `server-only` makes it a BUILD ERROR to import this file from a Client
// Component (see "server-only in action" in the README). That matters
// because this module holds things the browser must never receive: the
// kitchen's notes today, a database password on Day 16.
import 'server-only'

import { cacheLife } from 'next/cache'
import { categories as categorySeed, dishes as dishSeed } from '@/data/menu'
import { photos } from '@/data/photos'
import { deliveryAreas as areaSeed, restaurant as restaurantSeed } from '@/data/restaurant'
import { specialsByWeekday } from '@/data/specials'
import { now } from '@/lib/clock'
import { lagosParts } from '@/lib/hours'
import { CategorySchema, DishSchema, PhotoSchema, type Category, type Dish, type MenuSection, type PriceCatalog, type PublicDish } from '@/lib/schema/menu'
import { DeliveryAreaSchema, RestaurantSchema, type DeliveryArea, type Restaurant } from '@/lib/schema/restaurant'
import type { MenuQuery } from '@/lib/search-params'

// ---------------------------------------------------------------------------
// Plumbing: parse the seed once per server process
// ---------------------------------------------------------------------------

type Database = {
  restaurant: Restaurant
  areas: DeliveryArea[]
  categories: Category[]
  dishes: Dish[]
}
let database: Database | null = null

/**
 * Parsing is where plain seed values become checked, branded data, and where
 * a typo in the seed stops the app with a clear message instead of a broken
 * page later. (Day 16: this becomes the database connection.)
 */
function db(): Database {
  if (database) return database
  const dishes = DishSchema.array().parse(dishSeed)
  for (const dish of dishes) {
    if (dish.photoKey !== null && !(dish.photoKey in photos)) throw new Error(`Dish ${dish.id} points at missing photo "${dish.photoKey}"`)
  }
  const slugs = new Set(dishes.map((d) => d.slug))
  if (slugs.size !== dishes.length) throw new Error('Two dishes share a slug')
  for (const day of specialsByWeekday) for (const s of day) if (!slugs.has(s.slug)) throw new Error(`Special points at unknown dish "${s.slug}"`)

  database = {
    restaurant: RestaurantSchema.parse(restaurantSeed),
    areas: DeliveryAreaSchema.array().parse(areaSeed),
    categories: CategorySchema.array().parse(categorySeed),
    dishes,
  }
  return database
}

/**
 * THE PUBLIC FILTER. Builds a NEW object field by field rather than deleting
 * from the old one, so a field added to Dish later stays private until
 * someone decides to list it here. `kitchenNotes` is never copied.
 */
function toPublicDish(dish: Dish): PublicDish {
  const photo = dish.photoKey ? PhotoSchema.parse(photos[dish.photoKey as keyof typeof photos]) : null
  return {
    id: dish.id,
    slug: dish.slug,
    name: dish.name,
    localName: dish.localName,
    categoryId: dish.categoryId,
    description: dish.description,
    priceKobo: dish.priceKobo,
    photo,
    photoAlt: dish.photoAlt,
    dietary: dish.dietary,
    soldOut: dish.soldOut,
    popular: dish.popular,
    availableFrom: dish.availableFrom,
    choiceGroups: dish.choiceGroups,
  }
}

/*
  CACHING. Each read below starts with 'use cache' and cacheLife('max'). The
  seed only changes when the app is rebuilt, so results are computed once and
  pages that use them are prerendered at build time.

  Day 16: when the menu lives in PostgreSQL and the kitchen can mark a dish
  sold out, each function gets a cacheTag('menu'), and the "sold out" button
  calls updateTag('menu') so the next visitor sees it immediately.
*/

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export async function getRestaurant(): Promise<Restaurant> {
  'use cache'
  cacheLife('max')
  return db().restaurant
}

export async function getCategories(): Promise<Category[]> {
  'use cache'
  cacheLife('max')
  return db().categories
}

/** Does a dish pass every filter that is set? */
function matches(dish: PublicDish, query: MenuQuery): boolean {
  if (query.q) {
    const haystack = `${dish.name} ${dish.localName ?? ''} ${dish.description}`.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    const needle = query.q.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  for (const diet of query.diet) {
    if (diet === 'vegetarian' && !dish.dietary.vegetarian) return false
    if (diet === 'no-nuts' && dish.dietary.containsNuts) return false
    if (diet === 'no-fish' && dish.dietary.containsFish) return false
    if (diet === 'mild' && dish.dietary.spice > 1) return false
  }
  return true
}

/**
 * The menu grouped by category, filtered by the URL's search and diet
 * filters. Searching ignores tone marks, so "amala" finds "Àmàlà" and "moi"
 * finds "Mọ́ín-mọ́ín". The query is part of the cache key: each distinct
 * filter combination is computed once.
 */
export async function getMenuSections(query: MenuQuery): Promise<MenuSection[]> {
  'use cache'
  cacheLife('max')
  const dishes = db().dishes.map(toPublicDish).filter((d) => matches(d, query))
  return db()
    .categories.map((category) => ({ ...category, dishes: dishes.filter((d) => d.categoryId === category.id) }))
    .filter((section) => section.dishes.length > 0)
}

export async function getPopularDishes(): Promise<PublicDish[]> {
  'use cache'
  cacheLife('max')
  return db().dishes.filter((d) => d.popular && !d.soldOut).map(toPublicDish)
}

/** One dish for /menu/[slug], or null for an unknown slug (a 404). */
export async function getDish(slug: string): Promise<PublicDish | null> {
  'use cache'
  cacheLife('max')
  const dish = db().dishes.find((d) => d.slug === slug)
  return dish ? toPublicDish(dish) : null
}

export async function listDishSlugs(): Promise<string[]> {
  'use cache'
  cacheLife('max')
  return db().dishes.map((d) => d.slug)
}

/**
 * The price list the CartProvider receives as a prop: ID → name, price,
 * choices and photo. A plain object of plain values, so React can serialize
 * it from the server to the browser. Used by the cart for previews only.
 */
export async function getPriceCatalog(): Promise<PriceCatalog> {
  'use cache'
  cacheLife('max')
  return Object.fromEntries(
    db().dishes.map((d) => [
      d.id,
      {
        id: d.id,
        slug: d.slug,
        name: d.name,
        priceKobo: d.priceKobo,
        soldOut: d.soldOut,
        availableFrom: d.availableFrom,
        choiceGroups: d.choiceGroups,
        photoSrc: d.photoKey ? (photos[d.photoKey as keyof typeof photos]?.src ?? null) : null,
      },
    ]),
  )
}

export type PhotoCreditRow = { dish: string; slug: string; photo: NonNullable<PublicDish['photo']> }

export async function listPhotoCredits(): Promise<PhotoCreditRow[]> {
  'use cache'
  cacheLife('max')
  return db().dishes.flatMap((d) => {
    const pub = toPublicDish(d)
    return pub.photo ? [{ dish: d.name, slug: d.slug, photo: pub.photo }] : []
  })
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export async function getDeliveryAreas(): Promise<DeliveryArea[]> {
  'use cache'
  cacheLife('max')
  return db().areas
}

// ---------------------------------------------------------------------------
// Today's specials: deliberately NOT cached
// ---------------------------------------------------------------------------

export type Special = { dish: PublicDish; note: string }

/**
 * Today's specials, by the day of the week IN LAGOS.
 *
 * Two things make this "request time" data:
 * 1. It depends on the clock: now() awaits io(), which tells Next.js not to
 *    bake the answer into the build.
 * 2. It's slow: the 1.5-second wait stands in for a slow service (a supplier
 *    API, a busy database). The page doesn't wait for it: the call sits in
 *    its own <Suspense>, so the rest of the page is sent first and the
 *    specials stream in when ready.
 *
 * Why NOT 'use cache'? A cached function is run once while prerendering and
 * its result goes into the static HTML. The 1.5 s would be paid once at
 * build time and never seen by a visitor, and "today" would be frozen as
 * the day of the build.
 */
export async function getTodaysSpecials(): Promise<Special[]> {
  const today = lagosParts(await now()).weekday
  await new Promise((resolve) => setTimeout(resolve, 1500))
  const dishes = db().dishes
  return (specialsByWeekday[today] ?? []).flatMap(({ slug, note }) => {
    const dish = dishes.find((d) => d.slug === slug)
    return dish ? [{ dish: toPublicDish(dish), note }] : []
  })
}

// ---------------------------------------------------------------------------
// For the placeOrder Server Action
// ---------------------------------------------------------------------------

/**
 * The kitchen's private notes for some dishes. Only the Server Action calls
 * this, to print the kitchen ticket in the server log. It never reaches a
 * page, a prop or the browser.
 */
export async function getKitchenNotes(dishIds: readonly string[]): Promise<{ name: string; notes: string }[]> {
  const wanted = new Set(dishIds)
  return db()
    .dishes.filter((d) => wanted.has(d.id))
    .map((d) => ({ name: d.name, notes: d.kitchenNotes }))
}
