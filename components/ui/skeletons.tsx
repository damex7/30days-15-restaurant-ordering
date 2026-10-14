import { cn } from '@/lib/cn'

/*
  SERVER COMPONENTS: the grey shapes shown while something streams in.

  Under Cache Components these fallbacks are part of the STATIC SHELL: they
  are rendered at build time, sent first, and replaced in place when the
  real content arrives. Each one has roughly the size of what it stands
  for, so nothing jumps when the swap happens.

  The wrapper is announced once ("Loading today's specials") and the shapes
  themselves are hidden from screen readers.
*/

export function DishCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-raised" aria-hidden>
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex justify-between gap-3">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton h-5 w-16" />
        </div>
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-4/5" />
        <div className="mt-2 flex justify-end">
          <div className="skeleton h-9 w-24 rounded-pill" />
        </div>
      </div>
    </div>
  )
}

export function DishGridSkeleton({ count, label, className }: { count: number; label: string; className?: string }) {
  return (
    <div role="status" className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <DishCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** The filters, the category strip and a couple of sections. */
export function MenuSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading the menu</span>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="skeleton h-12 w-full rounded-pill" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton h-9 w-28 rounded-pill" />
          ))}
        </div>
        <div className="mt-4 flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-10 w-32 shrink-0 rounded-pill" />
          ))}
        </div>
        <div className="skeleton mt-6 h-8 w-56" />
      </div>
      <div aria-hidden className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <DishCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/** A line of text that hasn't arrived yet (the open/closed pill, an ETA). */
export function TextSkeleton({ className, label }: { className?: string; label: string }) {
  return (
    <span role="status" className={cn('inline-block', className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="skeleton block h-full w-full" />
    </span>
  )
}
