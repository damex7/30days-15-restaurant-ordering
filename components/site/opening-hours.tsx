import { hoursTable } from '@/lib/hours'
import type { DayHours } from '@/lib/schema/restaurant'
import { cn } from '@/lib/cn'

/**
 * SERVER COMPONENT: the weekly hours as a definition list. Static: the
 * hours only change with the seed, so this is part of the static shell. What
 * changes by the minute (open now or not) is OpenStatus, which streams.
 */
export function OpeningHours({ hours, className }: { hours: readonly DayHours[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm', className)}>
      {hoursTable(hours).map((row) => (
        <div key={row.days} className="contents">
          <dt className="text-muted">{row.days}</dt>
          <dd className="tabular">{row.time}</dd>
        </div>
      ))}
    </dl>
  )
}
