import { cn } from '@/lib/cn'

// Button styles as a plain function (not a component), so the same look works
// on <button>, <a> and <Link>, in Server and Client Components alike.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55'

const variants: Record<Variant, string> = {
  primary: 'bg-chilli text-chilli-ink hover:bg-chilli-hover',
  secondary: 'border border-line-strong bg-raised text-ink hover:bg-sunken',
  ghost: 'text-muted hover:bg-sunken hover:text-ink',
  danger: 'text-danger hover:bg-danger-soft',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3.5 text-sm',
  md: 'min-h-11 px-5',
  lg: 'min-h-13 px-6 text-lg',
}

export function buttonClass({ variant = 'primary', size = 'md', className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className)
}
