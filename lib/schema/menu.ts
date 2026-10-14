import { z } from 'zod'
import { KoboSchema } from '@/lib/money'

/*
  THE MENU MODEL. Every type is z.infer'd from a schema (as on Day 14), so the
  seed data, the cart in localStorage and the order form all get checked
  against the same definition at runtime, not just at compile time.

  Shared module: no 'use client', no 'server-only'. The SCHEMAS are needed on
  both sides (the server checks the seed and the order, the browser checks
  its saved cart), but the DATA they describe only reaches the browser
  through lib/data.ts, which decides what is public.
*/

export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words joined by hyphens')

/** Branded IDs: a DishId can't be passed where any old string is expected. */
export const DishIdSchema = z.string().regex(/^dsh_[a-z0-9-]+$/, 'Dish IDs look like dsh_party-jollof').brand<'DishId'>()
export type DishId = z.infer<typeof DishIdSchema>

export const CATEGORY_IDS = ['rice', 'swallow', 'grills', 'small-chops', 'sides', 'drinks'] as const
export const CategoryIdSchema = z.enum(CATEGORY_IDS)
export type CategoryId = z.infer<typeof CategoryIdSchema>

export const CategorySchema = z.object({
  id: CategoryIdSchema,
  name: z.string().min(1),
  blurb: z.string().min(1),
})
export type Category = z.infer<typeof CategorySchema>

/** "HH:MM" on a 24-hour clock, Lagos time. */
export const ClockTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')

/*
  CHOICES THAT CHANGE THE PRICE

  A dish has zero or more choice groups. Each group is one of two kinds, a
  DISCRIMINATED UNION on `kind`:
    single: pick one (radio buttons). `required` means you must pick.
            e.g. jollof: Protein → Chicken / Beef / Turkey (+₦1,500) / Fish
    multi:  pick up to `max` (checkboxes), always optional.
            e.g. amala: Extra meat → Assorted / Goat meat / Ponmo / Shaki
  An option's priceDeltaKobo is added to the dish price (0 for no change).
*/
export const ChoiceOptionSchema = z.object({
  id: SlugSchema,
  label: z.string().min(1),
  priceDeltaKobo: KoboSchema,
  soldOut: z.boolean().default(false),
})
export type ChoiceOption = z.infer<typeof ChoiceOptionSchema>

const GroupBase = {
  id: SlugSchema,
  label: z.string().min(1),
  options: z.array(ChoiceOptionSchema).min(1),
}
export const ChoiceGroupSchema = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('single'), required: z.boolean(), ...GroupBase }),
    z.object({ kind: z.literal('multi'), max: z.number().int().min(1), ...GroupBase }),
  ])
  .refine((g) => new Set(g.options.map((o) => o.id)).size === g.options.length, 'Option IDs must be unique within a group')
export type ChoiceGroup = z.infer<typeof ChoiceGroupSchema>

/** What the restaurant tells you before you order. */
export const DietarySchema = z.object({
  vegetarian: z.boolean().default(false),
  containsNuts: z.boolean().default(false),
  containsFish: z.boolean().default(false),
  /** 0 = not spicy, 3 = ata rodo hot. */
  spice: z.number().int().min(0).max(3).default(0),
})
export type Dietary = z.infer<typeof DietarySchema>

/** A photo's credit, copied from its Wikimedia Commons file page. */
export const PhotoCreditSchema = z.object({
  title: z.string(),
  author: z.string(),
  licence: z.string(),
  licenceUrl: z.url().nullable(),
  sourceUrl: z.url(),
})
export const PhotoSchema = z.object({
  src: z.string().startsWith('/dishes/'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  credit: PhotoCreditSchema,
})
export type Photo = z.infer<typeof PhotoSchema>

/**
 * A dish as it is stored (the seed today, a database row from Day 16).
 * `kitchenNotes` is for the kitchen only. It never leaves the server: see
 * PublicDish below and toPublicDish() in lib/data.ts.
 */
export const DishSchema = z
  .object({
    id: DishIdSchema,
    slug: SlugSchema,
    name: z.string().min(1),
    /** The Yoruba, Igbo or Hausa name, with tone marks, when it differs. */
    localName: z.string().min(1).optional(),
    categoryId: CategoryIdSchema,
    description: z.string().min(1),
    priceKobo: KoboSchema.positive(),
    /** Key into data/photos.ts, or null for the illustrated placeholder. */
    photoKey: z.string().nullable(),
    /** Required even when there's no photo: the placeholder is labelled too. */
    photoAlt: z.string().min(8),
    dietary: DietarySchema,
    soldOut: z.boolean().default(false),
    popular: z.boolean().default(false),
    /** Some things are only cooked later in the day (suya fires are lit at 4pm). */
    availableFrom: ClockTimeSchema.optional(),
    choiceGroups: z.array(ChoiceGroupSchema).default([]),
    kitchenNotes: z.string().min(1),
  })
  .refine((d) => new Set(d.choiceGroups.map((g) => g.id)).size === d.choiceGroups.length, 'Choice group IDs must be unique within a dish')
export type Dish = z.infer<typeof DishSchema>

/*
  THE PUBLIC SHAPE. Omit<> removes kitchenNotes from the TYPE, and
  toPublicDish() removes it from the VALUE. Every function in lib/data.ts
  returns PublicDish, so a Client Component can't even be handed the notes
  by mistake: TypeScript would reject the prop.
*/
export type PublicDish = Omit<Dish, 'kitchenNotes' | 'photoKey'> & { photo: Photo | null }

/** Just what pricing needs: the cart and the Server Action share this. */
export type PricingDish = Pick<PublicDish, 'id' | 'slug' | 'name' | 'priceKobo' | 'soldOut' | 'availableFrom' | 'choiceGroups'> & {
  photoSrc: string | null
}

/** A dish ID → pricing info lookup, passed from the server to the cart. Plain object, so it serializes. */
export type PriceCatalog = Record<string, PricingDish>

export type MenuSection = Category & { dishes: PublicDish[] }
