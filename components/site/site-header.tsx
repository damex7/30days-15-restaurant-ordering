import Link from 'next/link'
import { CartBadge } from '@/components/cart/cart-badge'
import { TableChip } from '@/components/cart/table-chip'
import { Logo } from '@/components/site/logo'
import { ThemeToggle } from '@/components/site/theme-toggle'

/*
  SERVER COMPONENT with three small CLIENT "islands" inside it.

  The header itself (logo, links, layout) never changes in response to the
  user, so it renders on the server and costs no JavaScript. The three
  pieces that DO react — the cart count, the table chip and the theme
  button — are Client Components, imported and rendered right here.

  A Server Component may render a Client Component (that's how islands work).
  The reverse, a Client Component IMPORTING a Server Component, isn't
  allowed; for that you pass it in as children (see CategoryTabs).
*/
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <div className="mx-auto flex h-16 max-w-content items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="flex items-center gap-1 sm:ml-4">
          <Link href="/menu" className="rounded-control px-2 py-2 font-semibold text-muted hover:bg-sunken hover:text-ink sm:px-3">
            Menu
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <TableChip />
          <ThemeToggle />
          <CartBadge />
        </div>
      </div>
    </header>
  )
}
