import type { ReactNode } from 'react'

const TONES = {
  status: 'bg-[var(--badge-bg)] text-[var(--badge-text)]',
  neutral: 'bg-[var(--border-subtle)] text-[var(--muted)]',
} as const

export function Badge({
  children,
  tone = 'status',
}: {
  children: ReactNode
  tone?: 'status' | 'neutral'
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}
