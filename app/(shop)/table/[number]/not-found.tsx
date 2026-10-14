import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/** /table/99, /table/abc: a table we don't have. */
export default function TableNotFound() {
  return (
    <EmptyState
      icon="table"
      title="We don’t have that table"
      action={
        <Link href="/menu" className={buttonClass()}>
          Order from the menu
        </Link>
      }
    >
      <p>Our tables are numbered 1 to 12. Check the number on the stand, or ask any of our staff.</p>
    </EmptyState>
  )
}
