import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import type { Dietary } from '@/lib/schema/menu'

const SPICE_WORDS = ['Not spicy', 'Mild', 'Medium hot', 'Very hot'] as const

/**
 * SERVER COMPONENT: badges for what's in a dish. Every badge has a word as
 * well as a colour and an icon, so colour is never the only signal.
 */
export function DietaryTags({ dietary, className }: { dietary: Dietary; className?: string }) {
  const tags: { key: string; icon: 'leaf' | 'nut' | 'fish' | 'flame'; text: string; tone: string }[] = []
  if (dietary.vegetarian) tags.push({ key: 'veg', icon: 'leaf', text: 'Vegetarian', tone: 'bg-leaf-soft text-leaf' })
  if (dietary.containsNuts) tags.push({ key: 'nuts', icon: 'nut', text: 'Contains nuts', tone: 'bg-plantain-soft text-plantain' })
  if (dietary.containsFish) tags.push({ key: 'fish', icon: 'fish', text: 'Contains fish', tone: 'bg-sunken text-muted' })

  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Dietary information">
      {dietary.spice > 0 && (
        <li className="flex items-center gap-1 rounded-pill bg-pepper-soft py-0.5 pr-2 pl-1.5 text-xs font-semibold text-pepper">
          <span className="flex" aria-hidden>
            {Array.from({ length: dietary.spice }, (_, i) => (
              <Icon key={i} name="flame" className="-mx-0.5 size-3.5" />
            ))}
          </span>
          {SPICE_WORDS[dietary.spice]}
        </li>
      )}
      {tags.map((t) => (
        <li key={t.key} className={cn('flex items-center gap-1 rounded-pill py-0.5 pr-2 pl-1.5 text-xs font-semibold', t.tone)}>
          <Icon name={t.icon} className="size-3.5" />
          {t.text}
        </li>
      ))}
    </ul>
  )
}
