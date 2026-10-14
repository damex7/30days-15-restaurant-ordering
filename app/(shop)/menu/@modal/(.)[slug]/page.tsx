import { DishDetail } from '@/components/menu/dish-detail'
import { DishModal } from '@/components/menu/dish-modal'
import { getDish, listDishSlugs } from '@/lib/data'

/** Prerender every dish's quick view at build time, like the full pages. */
export async function generateStaticParams() {
  return (await listDishSlugs()).map((slug) => ({ slug }))
}

/**
 * THE INTERCEPTED DISH: the same <DishDetail> as the full page, inside the
 * client <DishModal> shell. A Server Component passing a Server Component
 * as children to a Client Component: the composition pattern again.
 */
export default async function DishQuickView({ params }: PageProps<'/menu/[slug]'>) {
  const { slug } = await params
  const dish = await getDish(slug)
  // An unknown dish in the modal slot shows no modal; the full page under
  // it handles the 404.
  if (!dish) return null
  return (
    <DishModal title={dish.name}>
      <DishDetail dish={dish} variant="modal" />
    </DishModal>
  )
}
