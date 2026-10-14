/** The dish page's shape, while a dish that wasn't prerendered is looked up. */
export default function DishLoading() {
  return (
    <div role="status" className="mx-auto max-w-content px-4 pt-6 sm:px-6">
      <span className="sr-only">Loading the dish</span>
      <div aria-hidden className="mb-6 h-5 w-40 skeleton" />
      <div aria-hidden className="grid gap-6 md:grid-cols-2 md:gap-10">
        <div className="skeleton aspect-[4/3] rounded-plate" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-12 w-3/4" />
          <div className="skeleton h-7 w-28" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-48 w-full rounded-card" />
          <div className="skeleton h-13 w-full rounded-pill" />
        </div>
      </div>
    </div>
  )
}
