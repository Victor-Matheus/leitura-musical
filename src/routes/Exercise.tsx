import { useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { QuestionCard } from '../components/QuestionCard'
import { Button, Card } from '../components/ui'
import { getExercise, getLesson } from '../theory/curriculum'
import { generateRound } from '../theory/generators'
import { mulberry32, randomSeed } from '../theory/rng'
import { usePracticeStore } from '../store/usePracticeStore'
import { useProgressStore, PASS_SCORE } from '../store/useProgressStore'

const TOTAL = 10

/** `seed` fixa a sequência de perguntas (para testes); sem ela, cada abertura sorteia uma. */
export function Exercise({ seed: seedProp }: { seed?: number }) {
  const { lessonId = '', exerciseId = '' } = useParams()
  const navigate = useNavigate()
  const highContrast = usePracticeStore((s) => s.settings.highContrast)
  const recordScore = useProgressStore((s) => s.recordScore)
  const lesson = getLesson(lessonId)
  const spec = getExercise(lessonId, exerciseId)

  const [seed, setSeed] = useState(() => seedProp ?? randomSeed())
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  // acertos da rodada atual, lido no onNext sem depender do render
  const correctRef = useRef(0)

  const questions = useMemo(() => {
    if (!spec) return []
    return generateRound(spec, mulberry32(seed), TOTAL)
  }, [spec, seed])

  if (!lesson || !spec) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <p className="text-xl text-[var(--muted)]">Exercício não encontrado</p>
        <Button variant="primary" size="lg" onClick={() => navigate('/teoria')}>
          Ver todas as lições
        </Button>
      </div>
    )
  }

  const backToLesson = () => navigate(`/teoria/${lesson.id}`)

  const retry = () => {
    correctRef.current = 0
    setCorrect(0)
    setIndex(0)
    setFinished(false)
    setSeed(randomSeed())
  }

  if (finished) {
    const passed = correct >= PASS_SCORE
    return (
      <div className="flex flex-col gap-6 py-2">
        <Card className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {spec.title}
          </h1>
          <p className="text-5xl font-bold" style={{ color: 'var(--primary)' }}>
            {correct} / {TOTAL}
          </p>
          <p className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
            {passed ? 'Muito bem!' : 'Revise a lição e tente de novo'}
          </p>
        </Card>
        <Button variant="primary" size="lg" onClick={retry}>
          Refazer
        </Button>
        <Button variant="secondary" size="lg" onClick={backToLesson}>
          Voltar à lição
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-2">
      <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
        {spec.title}
      </h1>
      <QuestionCard
        key={`${seed}-${index}`}
        question={questions[index]}
        index={index}
        total={TOTAL}
        highContrast={highContrast}
        onAnswer={(ok) => {
          if (ok) {
            correctRef.current += 1
            setCorrect(correctRef.current)
          }
        }}
        onNext={() => {
          if (index + 1 >= TOTAL) {
            recordScore(lesson.id, spec.id, correctRef.current)
            setFinished(true)
          } else {
            setIndex(index + 1)
          }
        }}
      />
    </div>
  )
}
