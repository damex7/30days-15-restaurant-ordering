import Link from 'next/link'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/** Shown by notFound() in ./page.tsx for a slug that isn't on the menu. */
export default function DishNotFound() {
  return (
    <EmptyState
      icon="utensils"
      title="That dish isn’t on our menu"
      action={
        <Link href="/menu" className={buttonClass()}>
          See the menu
        </Link>
      }
    >
      <p>It may have been renamed, or the link has a typo.</p>
    </EmptyState>
  )
}
