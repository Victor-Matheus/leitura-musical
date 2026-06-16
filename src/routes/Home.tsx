import { useNavigate } from 'react-router-dom'
import { DRILL_LEVELS, PIECES, makeRandomDrill } from '../data/repertoire'
import type { Piece } from '../data/notes'
import { usePracticeStore } from '../store/usePracticeStore'

function Card({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-1 rounded-2xl p-5 text-left transition hover:scale-[1.02] active:scale-[0.99]"
      style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
    >
      <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </span>
      <span className="text-base" style={{ color: 'var(--muted)' }}>
        {subtitle}
      </span>
    </button>
  )
}

export function Home() {
  const navigate = useNavigate()
  const voiceEnabled = usePracticeStore((s) => s.settings.voiceEnabled)

  const play = (piece: Piece) => navigate('/praticar', { state: { piece } })

  return (
    <div className="flex flex-col gap-8 py-2">
      <section
        className="rounded-3xl p-6"
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <h1 className="mb-2 text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
          Treine sua leitura de notas
        </h1>
        <p className="text-lg" style={{ color: 'var(--muted)' }}>
          As notas passam no seu ritmo e você as identifica.{' '}
          {voiceEnabled
            ? 'O modo voz está ligado: fale o nome da nota (dó, ré, mi…).'
            : 'O modo voz está desligado: os nomes aparecem no final.'}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold" style={{ color: 'var(--text)' }}>
          🎵 Notas aleatórias
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DRILL_LEVELS.map((lvl) => (
            <Card
              key={lvl}
              title={`Nível ${lvl}`}
              subtitle={lvl === 1 ? 'Iniciante' : lvl === 4 ? 'Avançado' : 'Intermediário'}
              onClick={() => play(makeRandomDrill(lvl))}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl font-bold" style={{ color: 'var(--text)' }}>
          🎼 Melodias conhecidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PIECES.map((p) => (
            <Card
              key={p.id}
              title={p.title}
              subtitle={`Nível ${p.level} · ${p.notes.length} notas`}
              onClick={() => play(p)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
