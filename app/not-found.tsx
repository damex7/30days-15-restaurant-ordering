import Link from 'next/link'
import { Logo } from '@/components/site/logo'
import { buttonClass } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * For URLs that match no route at all (/pizza, /admin). It renders inside
 * the root layout only, outside the (shop) group, so it brings its own
 * small header. SERVER COMPONENT: static markup.
 */
export default function NotFound() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-content items-center px-4 sm:px-6">
          <Logo />
        </div>
      </header>
      <main id="main">
        <EmptyState
          icon="utensils"
          title="This page isn’t on the menu"
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/menu" className={buttonClass()}>
                See the menu
              </Link>
              <Link href="/" className={buttonClass({ variant: 'secondary' })}>
                Home
              </Link>
            </div>
          }
        >
          <p>The link may be old, or there’s a typo in it.</p>
        </EmptyState>
      </main>
    </>
  )
}
