import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CheckoutForm, CheckoutSkeleton } from '@/components/checkout/checkout-form'
import { now } from '@/lib/clock'
import { getDeliveryAreas, getRestaurant } from '@/lib/data'
import { formatLagosTime, kitchenStatus, pickupSlots } from '@/lib/hours'
import { placeOrder } from './actions'

export const metadata: Metadata = { title: 'Checkout' }

/*
  CHECKOUT. SERVER COMPONENT shell, with the clock-dependent part streamed.

  Pickup slots and "are you open?" depend on the time, so they're worked
  out at request time, inside <Suspense>, by <CheckoutLoader>. The heading
  is in the static shell; the form streams in a moment later.
*/
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-content px-4 pt-8 sm:px-6">
      <h1 className="mb-6 text-4xl font-extrabold sm:text-5xl">Checkout</h1>
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutLoader />
      </Suspense>
    </div>
  )
}

async function CheckoutLoader() {
  const [at, restaurant, areas] = await Promise.all([now(), getRestaurant(), getDeliveryAreas()])
  return (
    <CheckoutForm
      // A Server Action is the ONE kind of function a Server Component can
      // pass to a Client Component as a prop. (Try passing an ordinary
      // arrow function here and Next.js refuses: "Functions cannot be
      // passed directly to Client Components".)
      action={placeOrder}
      kitchen={kitchenStatus(at, restaurant)}
      slots={pickupSlots(at, restaurant)}
      areas={areas}
      minDeliveryOrderKobo={restaurant.minDeliveryOrderKobo}
      // A finished string, not a Date: the browser has nothing to reformat.
      nowLabel={formatLagosTime(at)}
    />
  )
}
