import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Gauge, LayoutGrid, Mic } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button, Card, IconBox } from '../components/ui'
import { SpeedControl } from '../components/SpeedControl'
import { ModelDownload } from '../components/ModelDownload'
import { isVoiceSupported } from '../audio/micInput'
import { usePracticeStore } from '../store/usePracticeStore'
import type { DisplayMode } from '../store/usePracticeStore'

function Toggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Card
      as="button"
      interactive
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className="flex items-center gap-4 !p-4"
    >
      <IconBox icon={icon} />
      <span className="min-w-0 flex-1">
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
        style={{ background: checked ? 'var(--primary)' : 'var(--border)' }}
      >
        <span
          className="absolute top-1 h-6 w-6 rounded-full transition-all"
          style={{
            left: checked ? '1.75rem' : '0.25rem',
            background: checked ? 'var(--on-primary)' : 'var(--surface)',
            boxShadow: 'var(--shadow-card)',
          }}
        />
      </span>
    </Card>
  )
}

export function Settings() {
  const navigate = useNavigate()
  const voiceSupported = isVoiceSupported()
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
        icon={Mic}
        label="Identificação por voz"
        description={
          voiceSupported
            ? 'Fale o nome da nota e receba feedback na hora'
            : 'Seu navegador não suporta voz — use o Chrome ou o Safari atualizado'
        }
        checked={settings.voiceEnabled}
        onChange={(v) => setSettings({ voiceEnabled: v })}
      />

      {settings.voiceEnabled && voiceSupported && <ModelDownload />}

      <Toggle
        icon={Eye}
        label="Mostrar dica"
        description="Exibe o nome da nota durante a prática"
        checked={settings.showHint}
        onChange={(v) => setSettings({ showHint: v })}
      />

      <Card className="flex flex-col gap-3 !p-4">
        <div className="flex items-center gap-3">
          <IconBox icon={LayoutGrid} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Modo de exibição
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modes.map((m) => {
            const active = settings.displayMode === m.value
            return (
              <button
                key={m.value}
                onClick={() => setSettings({ displayMode: m.value })}
                aria-pressed={active}
                className="rounded-xl p-4 text-left transition-all"
                style={{
                  background: active ? 'var(--primary)' : 'var(--surface)',
                  color: active ? 'var(--on-primary)' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                <span className="block text-lg font-bold">{m.label}</span>
                <span
                  className="block text-sm"
                  style={{ color: active ? 'var(--on-primary)' : 'var(--muted)' }}
                >
                  {m.desc}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="flex items-center gap-4 !p-4">
        <IconBox icon={Gauge} />
        <div className="min-w-0 flex-1">
          <SpeedControl bpm={settings.bpm} onChange={(bpm) => setSettings({ bpm })} />
        </div>
      </Card>

      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Tamanho da fonte e alto contraste ficam no topo da tela, em qualquer página.
      </p>

      <Button variant="secondary" icon={ArrowLeft} className="self-start" onClick={() => navigate('/')}>
        Voltar
      </Button>
    </div>
  )
}
