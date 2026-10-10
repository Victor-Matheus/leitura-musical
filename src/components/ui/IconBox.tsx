import type { LucideIcon } from 'lucide-react'

const TONES = {
  soft: 'bg-[var(--accent-soft)] text-[var(--primary)]',
  dark: 'bg-[var(--surface-dark)] text-white',
} as const

export function IconBox({
  icon: Icon,
  tone = 'soft',
}: {
  icon: LucideIcon
  tone?: 'soft' | 'dark'
}) {
  return (
    <span
      className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${TONES[tone]}`}
    >
      <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}
