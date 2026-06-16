import { usePracticeStore } from '../store/usePracticeStore'
import type { FontSize } from '../store/usePracticeStore'

const SIZES: { value: FontSize; label: string }[] = [
  { value: 'normal', label: 'A' },
  { value: 'grande', label: 'A+' },
  { value: 'enorme', label: 'A++' },
]

export function AccessibilityBar() {
  const { fontSize, highContrast } = usePracticeStore((s) => s.settings)
  const setSettings = usePracticeStore((s) => s.setSettings)

  return (
    <div className="flex items-center gap-2">
      <div className="flex overflow-hidden rounded-xl" style={{ border: '2px solid var(--border)' }}>
        {SIZES.map((s) => (
          <button
            key={s.value}
            onClick={() => setSettings({ fontSize: s.value })}
            aria-pressed={fontSize === s.value}
            className="px-3 py-2 font-bold transition"
            style={{
              background: fontSize === s.value ? 'var(--primary)' : 'var(--surface)',
              color: fontSize === s.value ? '#fff' : 'var(--text)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setSettings({ highContrast: !highContrast })}
        aria-pressed={highContrast}
        title="Alto contraste"
        className="rounded-xl px-3 py-2 font-bold transition"
        style={{
          background: highContrast ? 'var(--primary)' : 'var(--surface)',
          color: highContrast ? '#fff' : 'var(--text)',
          border: '2px solid var(--border)',
        }}
      >
        ◑
      </button>
    </div>
  )
}
