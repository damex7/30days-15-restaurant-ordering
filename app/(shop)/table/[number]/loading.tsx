/*
  The table page's shape while the table number from the URL is checked.

  This file is also what keeps navigation instant: Next.js wraps the page in
  <Suspense fallback={<TableLoading />}>, so the page's `await params` (URL
  data) happens inside a boundary and something can show at once. All 12
  tables are prerendered, so in practice the real page is already there.
*/
export default function TableLoading() {
  return (
    <div role="status" className="mx-auto flex max-w-reading flex-col items-center px-4 pt-12 sm:px-6">
      <span className="sr-only">Loading your table</span>
      <div aria-hidden className="skeleton size-20 rounded-pill" />
      <div aria-hidden className="skeleton mt-5 h-12 w-72 max-w-full" />
      <div aria-hidden className="skeleton mt-3 h-5 w-96 max-w-full" />
      <div aria-hidden className="skeleton mt-8 h-13 w-44 rounded-pill" />
    </div>
  )
}
