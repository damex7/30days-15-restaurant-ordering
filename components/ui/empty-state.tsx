import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/icon'

/** SERVER COMPONENT: the "nothing here" panel (empty cart, no search results, 404s). */
export function EmptyState({ icon, title, children, action }: { icon: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-pill bg-leaf-soft text-leaf">
        <Icon name={icon} className="size-8" />
      </span>
      <h2 className="mt-4 text-2xl font-bold">{title}</h2>
      {children && <div className="mt-2 text-muted">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
