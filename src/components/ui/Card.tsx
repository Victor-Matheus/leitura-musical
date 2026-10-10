import type { HTMLAttributes } from 'react'
import { FOCUS_RING } from './Button'

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: 'light' | 'dark'
  interactive?: boolean
  as?: 'div' | 'section' | 'button'
}

const VARIANTS = {
  light:
    'bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 lg:p-8 shadow-[var(--shadow-card)]',
  dark: 'bg-[var(--surface-dark-2)] border border-white/10 text-white rounded-2xl p-6 lg:p-8',
} as const

const INTERACTIVE =
  'transition-all text-left hover:border-[var(--border)] hover:shadow-[var(--shadow-hover)]'

export function Card({
  variant = 'light',
  interactive = false,
  as = 'div',
  className = '',
  ...rest
}: CardProps) {
  const Tag = as
  const classes = `${VARIANTS[variant]} ${interactive ? INTERACTIVE : ''} ${className}`.trim()
  if (Tag === 'button') {
    return (
      <button
        type="button"
        className={`${classes} w-full ${FOCUS_RING}`}
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
      />
    )
  }
  return <Tag className={classes} {...rest} />
}
