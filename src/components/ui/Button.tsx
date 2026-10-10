import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'cta' | 'ghost'
  icon?: LucideIcon
  size?: 'md' | 'lg'
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold transition-all'

const VARIANTS = {
  primary:
    'bg-[var(--primary)] text-[var(--on-primary)] px-6 py-3.5 rounded-xl shadow-sm',
  secondary:
    'bg-[var(--secondary)] text-[var(--on-secondary)] border border-[var(--border)] px-6 py-3.5 rounded-xl',
  cta: 'bg-[var(--primary)] text-[var(--on-primary)] px-8 py-4 rounded-full shadow-sm',
  ghost: 'bg-transparent text-[var(--text)] px-4 py-2.5 rounded-xl',
} as const

const HOVER = {
  primary: 'hover:bg-[var(--primary-strong)] hover:shadow-md active:scale-[0.98]',
  secondary: 'hover:border-[var(--primary)] active:scale-[0.98]',
  cta: 'hover:bg-[var(--primary-strong)] hover:shadow-md active:scale-[0.98]',
  ghost: 'hover:bg-[var(--accent-soft)] active:scale-[0.98]',
} as const

const SIZES = { md: '', lg: 'text-lg min-h-14' } as const

export function Button({
  variant = 'primary',
  icon: Icon,
  size = 'md',
  className = '',
  type = 'button',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const state = disabled ? 'opacity-50 cursor-not-allowed' : HOVER[variant]
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${state} ${className}`.trim()}
      {...rest}
    >
      {Icon && <Icon size={22} strokeWidth={1.75} aria-hidden="true" />}
      {children}
    </button>
  )
}
