import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Missing cookie, expired cookie (after 6 hours), another browser, or a
 * cookie someone edited: all of them end up here, on purpose with the same
 * message. Telling a forger "your signature was wrong" would only help them.
 */
export default function OrderNotFound() {
  return (
    <EmptyState
      icon="receipt"
      title="We can’t find that order"
      action={
        <Link href="/menu" className={buttonClass()}>
          Back to the menu
        </Link>
      }
    >
      <p>Order pages work in the browser you ordered from, for six hours. If you need help with an order, call or WhatsApp us with its number.</p>
    </EmptyState>
  )
}
