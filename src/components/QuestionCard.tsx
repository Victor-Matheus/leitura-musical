import { useState } from 'react'
import type { Question } from '../theory/types'
import { ScoreView } from './ScoreView'
import { Button, Card } from './ui'

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  highContrast: boolean
  onAnswer: (correct: boolean) => void
  onNext: () => void
}

export function QuestionCard({ question, index, total, highContrast, onAnswer, onNext }: QuestionCardProps) {
  const [chosen, setChosen] = useState<number | null>(null)
  const answered = chosen !== null
  const isLast = index + 1 >= total
  const { score } = question

  const choose = (i: number) => {
    if (answered) return
    setChosen(i)
    onAnswer(i === question.answer)
  }

  return (
    <Card className="flex flex-col gap-5">
      <span className="text-base font-semibold" style={{ color: 'var(--muted)' }}>
        {index + 1} / {total}
      </span>
      <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
        {question.prompt}
      </h2>
      {score && (
        <figure className="flex flex-col gap-2">
          <ScoreView {...score} highContrast={highContrast} />
          {score.caption && (
            <figcaption className="text-center text-lg font-semibold" style={{ color: 'var(--muted)' }}>
              {score.caption}
            </figcaption>
          )}
        </figure>
      )}
      <div className="flex flex-col gap-3">
        {question.options.map((opt, i) => {
          const isAnswer = answered && i === question.answer
          const isWrongChoice = answered && i === chosen && i !== question.answer
          const style = isAnswer
            ? { background: 'var(--success)', color: 'var(--on-primary)', borderColor: 'var(--success)' }
            : isWrongChoice
              ? { background: 'var(--error)', color: 'var(--on-primary)', borderColor: 'var(--error)' }
              : undefined
          return (
            <Button
              key={i}
              variant="secondary"
              size="lg"
              disabled={answered}
              onClick={() => choose(i)}
              style={style}
              className={isAnswer || isWrongChoice ? '!opacity-100' : ''}
            >
              {opt}
            </Button>
          )
        })}
      </div>
      <div aria-live="polite" className="flex flex-col gap-3">
        {answered && (
          <>
            <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {chosen === question.answer ? 'Certo!' : `Resposta: ${question.options[question.answer]}`}
            </p>
            <p className="text-lg" style={{ color: 'var(--muted)' }}>
              {question.explanation}
            </p>
          </>
        )}
      </div>
      {answered && (
        <Button variant="primary" size="lg" onClick={onNext}>
          {isLast ? 'Ver resultado' : 'Próxima'}
        </Button>
      )}
    </Card>
  )
}
