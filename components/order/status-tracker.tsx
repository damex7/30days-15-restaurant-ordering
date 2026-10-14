import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { STAGES, stageLabels, type Stage } from '@/lib/order-status'
import type { Fulfilment } from '@/lib/schema/order'

/**
 * SERVER COMPONENT: the four steps of an order, with the current one marked.
 *
 * The stage was worked out on the server from the server's clock, so the
 * HTML already shows the right step; nothing is computed in the browser.
 * An ordered list with aria-current="step" tells screen readers which step
 * is current, not just sighted users through colour.
 */
export function StatusTracker({ stage, kind, times }: { stage: Stage; kind: Fulfilment['kind']; times: Partial<Record<Stage, string>> }) {
  const labels = stageLabels(kind)
  const current = STAGES.indexOf(stage)
  return (
    <ol className="flex flex-col gap-0">
      {STAGES.map((s, i) => {
        const done = i < current
        const now = i === current
        return (
          <li key={s} aria-current={now ? 'step' : undefined} className="relative flex gap-4 pb-6 last:pb-0">
            {/* The line joining each step to the next. */}
            {i < STAGES.length - 1 && <span aria-hidden className={cn('absolute top-9 bottom-1 left-[1.05rem] w-0.5', done ? 'bg-leaf' : 'bg-line')} />}
            <span
              aria-hidden
              className={cn(
                'relative grid size-9 shrink-0 place-items-center rounded-pill border-2',
                done && 'border-leaf bg-leaf text-white',
                now && 'border-palm bg-palm-soft text-palm',
                !done && !now && 'border-line bg-raised text-subtle',
              )}
            >
              {done ? <Icon name="check" className="size-5" /> : now ? <span className="size-2.5 animate-pulse-dot rounded-pill bg-palm" /> : <span className="text-sm font-bold">{i + 1}</span>}
            </span>
            <div className="pt-1">
              <p className={cn('font-bold', !done && !now && 'text-muted')}>
                {labels[s].title}
                {now && <span className="sr-only"> (current step)</span>}
                {done && <span className="sr-only"> (done)</span>}
              </p>
              {now && <p className="text-sm text-muted">{labels[s].detail}</p>}
              {times[s] && <p className="tabular text-sm text-subtle">{times[s]}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
