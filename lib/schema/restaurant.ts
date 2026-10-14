import { z } from 'zod'
import { KoboSchema } from '@/lib/money'
import { ClockTimeSchema, SlugSchema } from '@/lib/schema/menu'

/** One Abuja area we deliver to, with its own fee and travel time. */
export const DeliveryAreaSchema = z
  .object({
    id: SlugSchema,
    name: z.string().min(1),
    feeKobo: KoboSchema,
    /** Minutes on the road, as a range: "25–40 min". */
    etaMinutes: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  })
  .refine((a) => a.etaMinutes[0] <= a.etaMinutes[1], 'ETA range must go from low to high')
export type DeliveryArea = z.infer<typeof DeliveryAreaSchema>

/** Opening hours for one weekday, Lagos time. null = closed all day. */
export const DayHoursSchema = z.object({ open: ClockTimeSchema, close: ClockTimeSchema }).nullable()
export type DayHours = z.infer<typeof DayHoursSchema>

/** Sunday first, the same order as Date.getDay() and Intl's weekday. */
export const WeekHoursSchema = z.tuple([DayHoursSchema, DayHoursSchema, DayHoursSchema, DayHoursSchema, DayHoursSchema, DayHoursSchema, DayHoursSchema])
export type WeekHours = z.infer<typeof WeekHoursSchema>

export const RestaurantSchema = z.object({
  name: z.string(),
  address: z.string(),
  hours: WeekHoursSchema,
  /** The kitchen stops taking orders this many minutes before closing. */
  lastOrderMinutesBeforeClose: z.number().int().nonnegative(),
  minDeliveryOrderKobo: KoboSchema,
  /** Pickup slots start at least this far ahead (the brief: 30 minutes). */
  pickupLeadMinutes: z.number().int().positive(),
  pickupSlotStepMinutes: z.number().int().positive(),
  /** How long a normal order takes the kitchen. */
  prepMinutes: z.number().int().positive(),
  tables: z.array(z.number().int().positive()).min(1),
})
export type Restaurant = z.infer<typeof RestaurantSchema>
