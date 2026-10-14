import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'
import { getDeliveryAreas, getRestaurant } from '@/lib/data'

export const metadata: Metadata = { title: 'Your cart' }

/*
  THE CART PAGE: a SERVER shell around a CLIENT view.

  The server knows the delivery areas, fees, minimum order and tables
  (cached reads, so this page is fully static, ○). It doesn't know what's
  in your cart: that's in your browser. So it renders the heading and hands
  the plain data to <CartView>, which reads localStorage after hydration.

  The same split, in one sentence: the server knows the RESTAURANT, the
  browser knows the CUSTOMER.
*/
export default async function CartPage() {
  const [areas, restaurant] = await Promise.all([getDeliveryAreas(), getRestaurant()])
  return (
    <div className="mx-auto max-w-content px-4 pt-8 sm:px-6">
      <h1 className="mb-6 text-4xl font-extrabold sm:text-5xl">Your cart</h1>
      <CartView areas={areas} minDeliveryOrderKobo={restaurant.minDeliveryOrderKobo} tables={restaurant.tables} />
    </div>
  )
}
