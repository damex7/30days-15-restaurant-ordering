import Link from 'next/link'
import { cn } from '@/lib/cn'

/** A clay pot of stew (the mark) and the wordmark. Server Component: pure markup. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-8 shrink-0', className)}>
      <ellipse cx="16" cy="12" rx="12" ry="3.4" fill="var(--color-pepper)" />
      <path d="M4 12h24c0 8.5-5 14-12 14S4 20.5 4 12Z" fill="var(--color-palm)" />
      <path d="M8 16.5c2.4 1.4 5 2 8 2s5.6-.6 8-2" stroke="var(--color-plantain-fill)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M12 6.5c0-1.5 1.2-1.8 1.2-3.2M17 6.5c0-1.5 1.2-1.8 1.2-3.2" stroke="var(--color-muted)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-control">
      <LogoMark />
      <span className="font-display text-2xl leading-none font-extrabold tracking-tight">Bùkà</span>
      <span className="sr-only">, home</span>
    </Link>
  )
}
