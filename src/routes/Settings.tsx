import { useNavigate } from 'react-router-dom'
import { SpeedControl } from '../components/SpeedControl'
import { speechSupported } from '../engine/useSpeechNotes'
import { usePracticeStore } from '../store/usePracticeStore'
import type { DisplayMode } from '../store/usePracticeStore'

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex w-full items-center justify-between gap-4 rounded-2xl p-4 text-left"
      style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
    >
      <span>
        <span className="block text-lg font-bold" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        {description && (
          <span className="block text-sm" style={{ color: 'var(--muted)' }}>
            {description}
          </span>
        )}
      </span>
      <span
        className="relative h-8 w-14 shrink-0 rounded-full transition"
        style={{ background: checked ? 'var(--success)' : 'var(--border)' }}
      >
        <span
          className="absolute top-1 h-6 w-6 rounded-full bg-white transition-all"
          style={{ left: checked ? '1.75rem' : '0.25rem' }}
        />
      </span>
    </button>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const settings = usePracticeStore((s) => s.settings)
  const setSettings = usePracticeStore((s) => s.setSettings)

  const modes: { value: DisplayMode; label: string; desc: string }[] = [
    { value: 'flashcard', label: 'Uma nota', desc: 'Nota grande, uma por vez (recomendado)' },
    { value: 'partitura', label: 'Partitura', desc: 'Pauta completa com cursor' },
  ]

  return (
    <div className="flex flex-col gap-6 py-2">
      <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
        Configurações
      </h1>

      <Toggle
        label="Identificação por voz"
        description={
          speechSupported
            ? 'Fale o nome da nota e receba feedback na hora'
            : 'Seu navegador não suporta voz — use o Chrome'
        }
        checked={settings.voiceEnabled}
        onChange={(v) => setSettings({ voiceEnabled: v })}
      />

      <Toggle
        label="Mostrar dica"
        description="Exibe o nome da nota durante a prática"
        checked={settings.showHint}
        onChange={(v) => setSettings({ showHint: v })}
      />

      <div>
        <h2 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
          Modo de exibição
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {modes.map((m) => (
            <button
              key={m.value}
              onClick={() => setSettings({ displayMode: m.value })}
              aria-pressed={settings.displayMode === m.value}
              className="rounded-2xl p-4 text-left"
              style={{
                background: settings.displayMode === m.value ? 'var(--primary)' : 'var(--surface)',
                color: settings.displayMode === m.value ? '#fff' : 'var(--text)',
                border: '2px solid var(--border)',
              }}
            >
              <span className="block text-lg font-bold">{m.label}</span>
              <span
                className="block text-sm"
                style={{ color: settings.displayMode === m.value ? '#fff' : 'var(--muted)' }}
              >
                {m.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <SpeedControl bpm={settings.bpm} onChange={(bpm) => setSettings({ bpm })} />
      </div>

      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Tamanho da fonte e alto contraste ficam no topo da tela, em qualquer página.
      </p>

      <button
        onClick={() => navigate('/')}
        className="self-start rounded-2xl px-6 py-3 text-lg font-bold"
        style={{ background: 'var(--primary)', color: '#fff' }}
      >
        ← Voltar
      </button>
    </div>
  )
}
