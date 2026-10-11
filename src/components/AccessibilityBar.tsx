import { Contrast } from 'lucide-react'
import { usePracticeStore } from '../store/usePracticeStore'
import type { FontSize } from '../store/usePracticeStore'

const SIZES: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'grande', label: 'A+' },
  { value: 'enorme', label: 'A++' },
]

const ACTIVE = 'bg-[var(--primary)] text-[var(--on-primary)]'
const INACTIVE = 'bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--bg)]'

export function AccessibilityBar() {
  const { fontSize, highContrast } = usePracticeStore((s) => s.settings)
  const setSettings = usePracticeStore((s) => s.setSettings)

  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-xl border border-[var(--border)]">
        {SIZES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSettings({ fontSize: s.value })}
            aria-pressed={fontSize === s.value}
            className={`h-11 min-w-10 px-2.5 font-bold transition-colors ${
              fontSize === s.value ? ACTIVE : INACTIVE
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setSettings({ highContrast: !highContrast })}
        aria-pressed={highContrast}
        aria-label="Alto contraste"
        title="Alto contraste"
        className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] transition-colors ${
          highContrast ? ACTIVE : INACTIVE
        }`}
      >
        <Contrast size={22} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}
