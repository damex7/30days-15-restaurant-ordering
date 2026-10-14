import { DishCard } from '@/components/menu/dish-card'
import type { MenuSection as MenuSectionData } from '@/lib/schema/menu'

/**
 * SERVER COMPONENT: one category of the menu, with its dishes.
 *
 * `data-category` is what the client-side CategoryTabs watches to know which
 * section is on screen. The section doesn't know or care: it's plain HTML
 * with an attribute, rendered on the server and passed to the tabs as
 * children.
 */
export function MenuSection({ section }: { section: MenuSectionData }) {
  const headingId = `${section.id}-heading`
  return (
    <section id={section.id} data-category={section.id} aria-labelledby={headingId} tabIndex={-1} className="pt-8 outline-none first:pt-4">
      <h2 id={headingId} className="text-2xl font-extrabold sm:text-3xl">
        {section.name}
      </h2>
      <div aria-hidden className="stripe mt-2 h-1 w-16 rounded-pill" />
      <p className="mt-3 text-muted">{section.blurb}</p>
      <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.dishes.map((dish) => (
          <li key={dish.id} className="flex">
            <DishCard dish={dish} />
          </li>
        ))}
      </ul>
    </section>
  )
}
