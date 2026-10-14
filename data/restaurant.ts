import type { z } from 'zod'
import type { DeliveryAreaSchema, RestaurantSchema } from '@/lib/schema/restaurant'

// Seed data for the restaurant itself. Like the menu, it is only read through
// lib/data.ts, which parses it with the schemas once per server process.
//
// `satisfies z.input<...>` checks every field at compile time while keeping
// the literal types; the runtime parse in lib/data.ts checks the rest
// (e.g. that an ETA range goes from low to high).

export const restaurant = {
  name: 'Bùkà',
  address: '14 Aminu Kano Crescent, Wuse 2, Abuja',
  // Sunday first. Lagos time (WAT). Friday and Saturday run an hour later.
  hours: [
    { open: '12:00', close: '21:00' }, // Sun
    { open: '10:00', close: '22:00' }, // Mon
    { open: '10:00', close: '22:00' }, // Tue
    { open: '10:00', close: '22:00' }, // Wed
    { open: '10:00', close: '22:00' }, // Thu
    { open: '10:00', close: '23:00' }, // Fri
    { open: '10:00', close: '23:00' }, // Sat
  ],
  lastOrderMinutesBeforeClose: 30,
  minDeliveryOrderKobo: 500000, // ₦5,000
  pickupLeadMinutes: 30,
  pickupSlotStepMinutes: 15,
  prepMinutes: 20,
  tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
} satisfies z.input<typeof RestaurantSchema>

// The kitchen is in Wuse 2, so fees and travel times grow with distance.
export const deliveryAreas = [
  { id: 'wuse-2', name: 'Wuse 2', feeKobo: 100000, etaMinutes: [15, 25] },
  { id: 'maitama', name: 'Maitama', feeKobo: 150000, etaMinutes: [20, 30] },
  { id: 'wuse-zone-5', name: 'Wuse Zone 5', feeKobo: 120000, etaMinutes: [15, 30] },
  { id: 'garki', name: 'Garki', feeKobo: 150000, etaMinutes: [20, 35] },
  { id: 'utako', name: 'Utako', feeKobo: 150000, etaMinutes: [20, 35] },
  { id: 'jabi', name: 'Jabi', feeKobo: 180000, etaMinutes: [25, 40] },
  { id: 'asokoro', name: 'Asokoro', feeKobo: 200000, etaMinutes: [25, 40] },
  { id: 'katampe', name: 'Katampe', feeKobo: 220000, etaMinutes: [30, 45] },
  { id: 'life-camp', name: 'Life Camp', feeKobo: 250000, etaMinutes: [30, 45] },
  { id: 'apo', name: 'Apo', feeKobo: 250000, etaMinutes: [30, 50] },
  { id: 'gwarinpa', name: 'Gwarinpa', feeKobo: 300000, etaMinutes: [35, 55] },
  { id: 'lugbe', name: 'Lugbe', feeKobo: 350000, etaMinutes: [40, 60] },
  { id: 'kubwa', name: 'Kubwa', feeKobo: 400000, etaMinutes: [45, 70] },
] satisfies z.input<typeof DeliveryAreaSchema>[]
