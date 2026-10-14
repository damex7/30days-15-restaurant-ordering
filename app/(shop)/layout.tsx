import { Suspense } from 'react'
import { CartProvider } from '@/components/cart/cart-provider'
import { StickyCartBar } from '@/components/cart/sticky-cart-bar'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { getPriceCatalog } from '@/lib/data'

/*
  THE SHOP LAYOUT (route group "(shop)", so it adds nothing to the URL).

  SERVER COMPONENT. It does three server-side jobs:
  1. loads the price catalogue (an async, cached read from lib/data.ts),
  2. hands it to <CartProvider>, a Client Component, as a plain-data prop,
  3. renders the header, the page and the footer as `children` of that
     provider.

  Point 3 is the COMPOSITION PATTERN: the provider is client code, but
  everything passed to it as children was already rendered here, on the
  server. Pages under this layout stay Server Components.
*/
export default async function ShopLayout({ children }: LayoutProps<'/'>) {
  const catalog = await getPriceCatalog()
  return (
    <CartProvider catalog={catalog}>
      <SiteHeader />
      {/* Bottom padding on phones leaves room for the sticky cart bar. */}
      <main id="main" className="pb-24 md:pb-0">
        {children}
      </main>
      <SiteFooter />
      {/* usePathname() inside the bar needs a Suspense boundary under Cache
          Components (it can't be known while prerendering /order/[id]). */}
      <Suspense fallback={null}>
        <StickyCartBar />
      </Suspense>
    </CartProvider>
  )
}
