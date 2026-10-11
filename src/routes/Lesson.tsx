import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { LessonBlocks } from '../components/LessonBlocks'
import { Button } from '../components/ui'
import { CURRICULUM, getLesson } from '../theory/curriculum'
import { usePracticeStore } from '../store/usePracticeStore'
import { useProgressStore } from '../store/useProgressStore'

const LINK_CLASS =
  'inline-flex items-center gap-2 rounded-xl px-2 py-2 text-lg font-semibold text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]'

export function Lesson() {
  const { lessonId = '' } = useParams()
  const navigate = useNavigate()
  const highContrast = usePracticeStore((s) => s.settings.highContrast)
  const best = useProgressStore((s) => s.best)
  const lesson = getLesson(lessonId)

  if (!lesson) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <p className="text-xl text-[var(--muted)]">Lição não encontrada</p>
        <Button variant="primary" size="lg" onClick={() => navigate('/teoria')}>
          Ver todas as lições
        </Button>
      </div>
    )
  }

  const index = CURRICULUM.findIndex((l) => l.id === lesson.id)
  const prev = CURRICULUM[index - 1]
  const next = CURRICULUM[index + 1]

  return (
    <div className="flex flex-col gap-6 py-2">
      <Link to="/teoria" className={LINK_CLASS}>
        <ArrowLeft size={22} strokeWidth={1.75} aria-hidden="true" />
        Teoria musical
      </Link>
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
        {lesson.title}
      </h1>
      <LessonBlocks blocks={lesson.blocks} highContrast={highContrast} />
      <section className="flex flex-col gap-3" aria-labelledby="exercicios">
        <h2 id="exercicios" className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Exercícios
        </h2>
        {lesson.exercises.map((ex) => {
          const score = best[`${lesson.id}/${ex.id}`]
          return (
            <Button
              key={ex.id}
              variant="secondary"
              size="lg"
              className="flex-wrap justify-between"
              onClick={() => navigate(`/teoria/${lesson.id}/${ex.id}`)}
            >
              <span>{ex.title}</span>
              {score !== undefined && <span style={{ color: 'var(--muted)' }}>Melhor: {score}/10</span>}
            </Button>
          )
        })}
        {lesson.reading && (
          <Button
            variant="primary"
            size="lg"
            onClick={() =>
              navigate('/praticar', { state: { piece: lesson.reading, returnTo: `/teoria/${lesson.id}` } })
            }
          >
            Leitura métrica
          </Button>
        )}
      </section>
      <nav aria-label="Outras lições" className="flex flex-wrap items-center justify-between gap-3">
        {prev ? (
          <Link to={`/teoria/${prev.id}`} className={LINK_CLASS}>
            <ArrowLeft size={22} strokeWidth={1.75} aria-hidden="true" />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link to={`/teoria/${next.id}`} className={LINK_CLASS}>
            {next.title}
            <ArrowRight size={22} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        )}
      </nav>
    </div>
  )
}
