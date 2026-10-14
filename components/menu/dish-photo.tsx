import Image from 'next/image'
import { cn } from '@/lib/cn'
import type { PublicDish } from '@/lib/schema/menu'

/*
  SERVER COMPONENT. next/image picks the right size for each screen and
  serves modern formats; we just say how wide the image is at each
  breakpoint (`sizes`), so a phone downloads a phone-sized photo.

  Every photo has alt text from the seed data, written to describe the food
  for someone who can't see it, not just "jollof rice". A dish without a
  photo gets an illustrated plate, also labelled.
*/

type Props = {
  dish: Pick<PublicDish, 'photo' | 'photoAlt' | 'name'>
  sizes: string
  className?: string
  /** Above-the-fold images load straight away instead of lazily. */
  preload?: boolean
}

export function DishPhoto({ dish, sizes, className, preload }: Props) {
  return (
    <div className={cn('relative overflow-hidden bg-sunken', className)}>
      {dish.photo ? (
        <Image
          src={dish.photo.src}
          alt={dish.photoAlt}
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03] dark:brightness-[0.92]"
        />
      ) : (
        <PlatePlaceholder label={dish.photoAlt} />
      )}
    </div>
  )
}

/** An enamel plate with a bottle on it: the fallback for dishes without a photo. */
function PlatePlaceholder({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 200 150" role="img" aria-label={label} className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="150" fill="var(--color-leaf-soft)" />
      <circle cx="100" cy="78" r="58" fill="var(--color-raised)" stroke="var(--color-line-strong)" strokeWidth="3" />
      <circle cx="100" cy="78" r="46" fill="none" stroke="var(--color-chilli)" strokeWidth="2" strokeDasharray="4 6" opacity="0.6" />
      <rect x="88" y="38" width="24" height="72" rx="9" fill="var(--color-leaf)" opacity="0.25" stroke="var(--color-leaf)" strokeWidth="2" />
      <rect x="93" y="28" width="14" height="12" rx="3" fill="var(--color-leaf)" opacity="0.8" />
      <path d="M90 64h20" stroke="var(--color-raised)" strokeWidth="6" opacity="0.8" />
    </svg>
  )
}
