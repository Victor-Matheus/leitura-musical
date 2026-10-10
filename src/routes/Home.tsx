import { useNavigate } from 'react-router-dom'
import { Music, Play, Shuffle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge, Button, Card, IconBox } from '../components/ui'
import { DRILL_LEVELS, PIECES, makeRandomDrill } from '../data/repertoire'
import type { Piece } from '../data/notes'
import { usePracticeStore } from '../store/usePracticeStore'

function LessonCard({
  icon,
  title,
  subtitle,
  badge,
  onClick,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  badge?: string
  onClick: () => void
}) {
  return (
    <Card as="button" interactive onClick={onClick} className="flex flex-col gap-4 active:scale-[0.99]">
      <div className="flex w-full items-start justify-between gap-3">
        <IconBox icon={icon} />
        {badge && <Badge>{badge}</Badge>}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xl font-bold text-[var(--text)]">{title}</span>
        <span className="text-base text-[var(--muted)]">{subtitle}</span>
      </div>
    </Card>
  )
}

function levelLabel(level: number) {
  return level === 1 ? 'Iniciante' : level === 4 ? 'Avançado' : 'Intermediário'
}

export function Home() {
  const navigate = useNavigate()
  const voiceEnabled = usePracticeStore((s) => s.settings.voiceEnabled)

  const play = (piece: Piece) => navigate('/praticar', { state: { piece } })
  const scale = PIECES[0]

  return (
    <div className="flex flex-col gap-10 py-2">
      <Card variant="dark" as="section" className="flex flex-col items-start gap-6">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--on-dark)] sm:text-4xl">
            Treine sua leitura de notas
          </h1>
          <p className="text-lg text-[var(--on-dark)] opacity-85">
            As notas passam no seu ritmo e você as identifica.{' '}
            {voiceEnabled
              ? 'O modo voz está ligado: fale o nome da nota (dó, ré, mi…).'
              : 'O modo voz está desligado: os nomes aparecem no final.'}
          </p>
        </div>
        {/* Pílula clara sobre o card escuro: accent nos dois temas mantém o contraste. */}
        <Button
          variant="cta"
          size="lg"
          icon={Play}
          onClick={() => play(scale)}
          className="bg-[var(--accent)]! text-[var(--surface-dark-2)]! hover:opacity-90"
        >
          Começar pela escala
        </Button>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-[var(--text)]">Melodias conhecidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PIECES.map((p) => (
            <LessonCard
              key={p.id}
              icon={Music}
              title={p.title}
              subtitle={`${p.notes.length} notas`}
              badge={`Nível ${p.level}`}
              onClick={() => play(p)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-[var(--text)]">Notas aleatórias</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DRILL_LEVELS.map((lvl) => (
            <LessonCard
              key={lvl}
              icon={Shuffle}
              title={`Nível ${lvl}`}
              subtitle={levelLabel(lvl)}
              onClick={() => play(makeRandomDrill(lvl))}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
