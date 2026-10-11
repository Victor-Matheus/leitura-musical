import { Link } from 'react-router-dom'
import { Badge, Card } from '../components/ui'
import { CURRICULUM } from '../theory/curriculum'
import { useProgressStore } from '../store/useProgressStore'

export function Theory() {
  // assina `best` para a lista atualizar quando a nota mudar
  useProgressStore((s) => s.best)
  const lessonStatus = useProgressStore((s) => s.lessonStatus)

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
          Teoria musical
        </h1>
        <p className="text-lg" style={{ color: 'var(--muted)' }}>
          Lições seguindo a progressão de tópicos do MSA, com textos próprios do app.
        </p>
      </header>
      <ul className="flex flex-col gap-4">
        {CURRICULUM.map((lesson) => {
          const status = lessonStatus(lesson)
          return (
            <li key={lesson.id}>
              <Link to={`/teoria/${lesson.id}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
                <Card interactive className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold" style={{ color: 'var(--muted)' }}>
                      Lição {lesson.order}
                    </span>
                    {status === 'concluida' && <Badge>Concluída</Badge>}
                    {status === 'andamento' && <Badge>Em andamento</Badge>}
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                    {lesson.title}
                  </h2>
                  <p className="text-base" style={{ color: 'var(--muted)' }}>
                    {lesson.summary}
                  </p>
                </Card>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
