/** The order page's shape while the cookie is checked and the status worked out. */
export default function OrderLoading() {
  return (
    <div role="status">
      <span className="sr-only">Loading your order</span>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="skeleton h-12 w-72 max-w-full" />
        <div className="skeleton h-5 w-96 max-w-full" />
      </div>
      <div aria-hidden className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="skeleton h-80 rounded-card" />
        <div className="skeleton h-96 rounded-card" />
      </div>
    </div>
  )
}
