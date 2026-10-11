import { useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { noteName } from '../data/notes'
import { Button, Card } from '../components/ui'
import { usePracticeStore } from '../store/usePracticeStore'

export function Results() {
  const navigate = useNavigate()
  const session = usePracticeStore((s) => s.lastSession)

  if (!session) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <p className="text-xl" style={{ color: 'var(--muted)' }}>
          Nenhum resultado ainda.
        </p>
        <Button variant="cta" size="lg" onClick={() => navigate('/')}>
          Começar uma lição
        </Button>
      </div>
    )
  }

  const total = session.results.length
  const correct = session.results.filter((r) => r.outcome === 'correct').length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const seconds = Math.round(session.durationMs / 1000)
  // Voz ligada mas nada pontuado (motor indisponível): não mostrar "0%".
  const scored = session.voiceEnabled && session.results.some((r) => r.outcome !== null)

  return (
    <div className="flex flex-1 flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
          Fim da lição! 🎉
        </h1>
        <p className="text-lg" style={{ color: 'var(--muted)' }}>
          {session.pieceTitle} · {seconds}s
        </p>
      </div>

      {scored && (
        <Card variant="dark" className="flex flex-col items-center gap-2 text-center">
          <Trophy size={24} strokeWidth={1.75} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <span className="text-6xl font-extrabold" style={{ color: 'var(--on-dark)' }}>
            {pct}%
          </span>
          <span className="text-lg" style={{ color: 'var(--on-dark)' }}>
            {correct} de {total} notas certas
          </span>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--text)' }}>
          As notas da lição
        </h2>
        <div className="flex flex-wrap gap-2">
          {session.results.map((r, i) => {
            const style =
              r.outcome === 'correct'
                ? { background: 'var(--success)', color: 'var(--on-primary)' }
                : r.outcome === 'wrong'
                  ? { background: 'var(--error)', color: 'var(--on-primary)' }
                  : { background: 'var(--border-subtle)', color: 'var(--text)' }
            return (
              <span key={i} className="rounded-full px-4 py-2 text-xl font-bold" style={style}>
                {noteName(r.note)}
              </span>
            )
          })}
        </div>
        {scored && (
          <p className="mt-3 text-base" style={{ color: 'var(--muted)' }}>
            🟩 acertou · 🟥 errou · ⬜ sem resposta
          </p>
        )}
      </Card>

      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="cta" size="lg" onClick={() => navigate('/')}>
          Nova lição
        </Button>
      </div>
    </div>
  )
}
