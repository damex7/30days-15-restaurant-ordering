import { Suspense } from 'react'
import { DishDetail } from '@/components/menu/dish-detail'
import { DishModal } from '@/components/menu/dish-modal'
import { DishDetailSkeleton } from '@/components/ui/skeletons'
import { getDish, listDishSlugs } from '@/lib/data'

/** Prerender every dish's quick view at build time, like the full pages. */
export async function generateStaticParams() {
  return (await listDishSlugs()).map((slug) => ({ slug }))
}

/*
  THE INTERCEPTED DISH: the same <DishDetail> as the full page, inside the
  client <DishModal> shell. A Server Component passing Server Components as
  props to a Client Component: the composition pattern again.

  INSTANT FIRST. This page doesn't await `params` itself. Reading the URL is
  "URL data", and awaiting it outside <Suspense> would make a tap on a dish
  wait for the server before anything appeared (Next.js 16.4's instant
  navigation check flags exactly that in development). Instead the dialog
  opens straight away, and the two parts that need the slug, the title and
  the body, each wait inside their own <Suspense>. All 30 dishes are
  prerendered, so in production their content usually arrives with the
  prefetch and the skeleton is never seen.
*/
export default function DishQuickView({ params }: PageProps<'/menu/[slug]'>) {
  return (
    <DishModal
      title={
        <Suspense fallback={<span className="text-muted">Loading…</span>}>
          <DishName params={params} />
        </Suspense>
      }
    >
      <Suspense fallback={<DishDetailSkeleton />}>
        <DishBody params={params} />
      </Suspense>
    </DishModal>
  )
}

type SlugParams = Pick<PageProps<'/menu/[slug]'>, 'params'>

/*
  WORKAROUND (Next.js 16.4, `next dev` only): when this intercepted route's
  `params` is read inside <Suspense>, the dev server can hand back the slug
  with the interception marker stuck on the front, one more copy after each
  hot reload: "(.)(.)(.)beef-suya". `next build` / `next start` give the
  plain "beef-suya".
  Real slugs can't contain brackets (SlugSchema), so removing leading
  "(.)", "(..)" or "(...)" markers is always safe.
*/
async function slugFrom(params: SlugParams['params']): Promise<string> {
  return (await params).slug.replace(/^(?:\(\.{1,3}\))+/, '')
}

async function DishName({ params }: SlugParams) {
  const dish = await getDish(await slugFrom(params))
  return dish?.name ?? 'Dish not found'
}

async function DishBody({ params }: SlugParams) {
  // getDish is cached ('use cache'), so calling it here and in DishName is
  // one lookup, not two.
  const dish = await getDish(await slugFrom(params))
  if (!dish) return <p className="p-5 text-muted">That dish isn’t on our menu any more.</p>
  return <DishDetail dish={dish} variant="modal" />
}
