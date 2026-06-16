import { useNavigate } from 'react-router-dom'
import { noteName } from '../data/notes'
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
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl px-6 py-3 text-lg font-bold"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Começar uma lição
        </button>
      </div>
    )
  }

  const total = session.results.length
  const correct = session.results.filter((r) => r.correct === true).length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const seconds = Math.round(session.durationMs / 1000)

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-4">
      <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
        Fim da lição! 🎉
      </h1>
      <p className="text-lg" style={{ color: 'var(--muted)' }}>
        {session.pieceTitle} · {seconds}s
      </p>

      {session.voiceEnabled && (
        <div
          className="flex flex-col items-center rounded-3xl px-10 py-6"
          style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
        >
          <span className="text-6xl font-extrabold" style={{ color: 'var(--primary)' }}>
            {pct}%
          </span>
          <span className="text-lg" style={{ color: 'var(--muted)' }}>
            {correct} de {total} notas certas
          </span>
        </div>
      )}

      <div className="w-full">
        <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--text)' }}>
          As notas da lição
        </h2>
        <div className="flex flex-wrap gap-2">
          {session.results.map((r, i) => {
            const wrong = r.correct === false
            const right = r.correct === true
            return (
              <span
                key={i}
                className="rounded-xl px-4 py-2 text-xl font-bold"
                style={{
                  background: wrong ? 'var(--error)' : right ? 'var(--success)' : 'var(--surface)',
                  color: wrong || right ? '#fff' : 'var(--text)',
                  border: '2px solid var(--border)',
                }}
              >
                {noteName(r.note)}
              </span>
            )
          })}
        </div>
        {session.voiceEnabled && (
          <p className="mt-3 text-base" style={{ color: 'var(--muted)' }}>
            🟩 acertou · 🟥 errou ou não falou
          </p>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl px-7 py-4 text-xl font-bold"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Nova lição
        </button>
      </div>
    </div>
  )
}
