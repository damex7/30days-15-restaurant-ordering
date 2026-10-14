import { MenuSkeleton } from '@/components/ui/skeletons'

/**
 * Shown the moment you tap "Menu", before the server has answered. It
 * mirrors the page's layout, so the real page lands in the same places.
 * (Next.js wraps the page in <Suspense fallback={<Loading />}> for us.)
 */
export default function MenuLoading() {
  return (
    <div className="mx-auto max-w-content px-4 pt-8 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Menu</h1>
      <div className="skeleton mt-3 h-5 w-full max-w-xl" aria-hidden />
      <div className="mt-8">
        <MenuSkeleton />
      </div>
    </div>
  )
}
