// Qual figura completa o compasso mostrado

import type { Duration, Note, Step } from '../../data/notes'
import { durationBeats } from '../../data/notes'
import { pick, shuffle } from '../rng'
import type { Generator, ScoreElement } from '../types'
import { FIGURE_NAMES, formatBeats } from './figureValue'

const TOTAL_BEATS = { '2/4': 2, '3/4': 3, '4/4': 4 } as const
type TimeSignature = keyof typeof TOTAL_BEATS

/** Figuras que podem ser a resposta, pelo valor que falta */
const BY_MISSING: Record<number, string> = {
  0.5: FIGURE_NAMES['8'],
  1: FIGURE_NAMES.q,
  1.5: `${FIGURE_NAMES.q} pontuada`,
  2: FIGURE_NAMES.h,
}
/** Opções possíveis com o valor de cada uma (valores distintos: só uma completa o compasso) */
const CHOICES: readonly { name: string; beats: number }[] = [
  { name: FIGURE_NAMES['8'], beats: 0.5 },
  { name: FIGURE_NAMES.q, beats: 1 },
  { name: `${FIGURE_NAMES.q} pontuada`, beats: 1.5 },
  { name: FIGURE_NAMES.h, beats: 2 },
  { name: FIGURE_NAMES.w, beats: 4 },
]
/** Figuras para preencher a parte mostrada (mais semínimas que as outras) */
const FILLERS: readonly Duration[] = ['h', 'q', 'q', '8']
const PITCHES: readonly { step: Step; octave: number }[] = [
  { step: 'G', octave: 4 },
  { step: 'A', octave: 4 },
  { step: 'B', octave: 4 },
  { step: 'C', octave: 5 },
  { step: 'D', octave: 5 },
]

function tempos(beats: number): string {
  return `${formatBeats(beats)} ${beats <= 1 ? 'tempo' : 'tempos'}`
}

export const measureFill: Generator = (params, rng) => {
  const timeSignature = params.timeSignature as TimeSignature
  const total = TOTAL_BEATS[timeSignature]
  if (!total) throw new Error(`measureFill: compasso não suportado "${String(params.timeSignature)}"`)

  // dotted: false deixa a semínima pontuada de fora (antes da lição do ponto)
  const dotted = params.dotted !== false
  const missing = pick(
    rng,
    [0.5, 1, 1.5, 2].filter((m) => m < total && (dotted || m !== 1.5)),
  )
  let remaining = total - missing
  const notes: Note[] = []
  while (remaining > 0) {
    const fits = FILLERS.filter((d) => durationBeats(d) <= remaining)
    const duration = pick(rng, fits)
    notes.push({ ...pick(rng, PITCHES), duration })
    remaining -= durationBeats(duration)
  }
  const elements: ScoreElement[] = notes.map((note) => ({ kind: 'note', note }))

  const correct = BY_MISSING[missing]
  const distractors = shuffle(
    rng,
    CHOICES.filter((c) => c.beats !== missing && (dotted || c.beats !== 1.5)),
  )
    .slice(0, 3)
    .map((c) => c.name)
  const options = shuffle(rng, [correct, ...distractors])
  const shown = total - missing

  return {
    prompt: `Qual figura completa este compasso de ${timeSignature}?`,
    score: { clef: 'treble', timeSignature, elements },
    options,
    answer: options.indexOf(correct),
    explanation: `O compasso ${timeSignature} tem ${tempos(total)}. As figuras mostradas somam ${tempos(shown)}. ${missing <= 1 ? 'Falta' : 'Faltam'} ${tempos(missing)}, que é o valor da ${correct}.`,
  }
}
