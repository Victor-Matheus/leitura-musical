// Registro dos geradores por tipo de exercício

import type { Rng } from '../rng'
import type { ExerciseSpec, ExerciseType, Generator, Question } from '../types'
import { concept } from './concept'
import { figureValue } from './figureValue'
import { interval } from './interval'
import { keySignature } from './keySignature'
import { measureFill } from './measureFill'
import { noteName } from './noteName'
import { scale } from './scale'

export const GENERATORS: Record<ExerciseType, Generator> = {
  concept,
  noteName,
  figureValue,
  measureFill,
  interval,
  scale,
  keySignature,
}

/** Tentativas de sortear uma pergunta conceitual nova antes de aceitar repetida */
const MAX_REDRAWS = 50

/**
 * As perguntas de uma rodada. Nas conceituais (banco fixo) o sorteio é sem reposição:
 * pergunta já sorteada é descartada, até MAX_REDRAWS descartes.
 */
export function generateRound(spec: Pick<ExerciseSpec, 'type' | 'params'>, rng: Rng, total: number): Question[] {
  const gen = GENERATORS[spec.type]
  if (spec.type !== 'concept') return Array.from({ length: total }, () => gen(spec.params, rng))
  const out: Question[] = []
  const seen = new Set<string>()
  let redraws = 0
  while (out.length < total) {
    const q = gen(spec.params, rng)
    if (seen.has(q.prompt) && redraws < MAX_REDRAWS) {
      redraws++
      continue
    }
    seen.add(q.prompt)
    out.push(q)
  }
  return out
}
