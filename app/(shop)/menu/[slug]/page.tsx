import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DishDetail } from '@/components/menu/dish-detail'
import { Icon } from '@/components/ui/icon'
import { getCategories, getDish, listDishSlugs } from '@/lib/data'

/*
  THE FULL DISH PAGE. SERVER COMPONENT, FULLY STATIC.

  generateStaticParams lists every slug, so `next build` renders one HTML
  page per dish ahead of time. Everything this page reads is cached, so
  there's no Suspense hole in it at all.

  An unknown slug (/menu/pizza) isn't in that list. With Cache Components
  Next.js still tries to render it on request, getDish() returns null, and
  notFound() shows ./not-found.tsx.
*/
export async function generateStaticParams() {
  return (await listDishSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/menu/[slug]'>): Promise<Metadata> {
  const dish = await getDish((await params).slug)
  if (!dish) return { title: 'Dish not found' }
  return { title: dish.name, description: dish.description }
}

export default async function DishPage({ params }: PageProps<'/menu/[slug]'>) {
  const { slug } = await params
  const [dish, categories] = await Promise.all([getDish(slug), getCategories()])
  if (!dish) notFound()
  const category = categories.find((c) => c.id === dish.categoryId)

  return (
    <div className="mx-auto max-w-content px-4 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted">
          <li>
            <Link href="/menu" className="flex items-center gap-1 font-semibold hover:text-ink hover:underline">
              <Icon name="chevronLeft" className="size-4" /> Menu
            </Link>
          </li>
          {category && (
            <li className="flex items-center gap-1">
              <span aria-hidden>/</span>
              <Link href={`/menu#${category.id}`} className="hover:text-ink hover:underline">
                {category.name}
              </Link>
            </li>
          )}
        </ol>
      </nav>
      <DishDetail dish={dish} variant="page" />
    </div>
  )
}
