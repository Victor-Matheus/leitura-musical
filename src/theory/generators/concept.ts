// Pergunta conceitual sorteada de um banco fixo

import { pick, shuffle } from '../rng'
import type { Generator } from '../types'
import { CONCEPT_BANKS, type ConceptBank } from './conceptBanks'

export const concept: Generator = (params, rng) => {
  const bank = params.bank as ConceptBank
  const items = CONCEPT_BANKS[bank]
  if (!items) throw new Error(`concept: banco desconhecido "${String(params.bank)}"`)
  const item = pick(rng, items)
  const options = shuffle(rng, [item.correct, ...item.distractors])
  return {
    prompt: item.prompt,
    options,
    answer: options.indexOf(item.correct),
    explanation: item.explanation,
  }
}
