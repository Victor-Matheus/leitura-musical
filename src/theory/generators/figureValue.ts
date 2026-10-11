// Nome da figura (ou pausa) mostrada, ou quantos tempos ela vale (semínima = 1)

import type { Duration, Step } from '../../data/notes'
import { noteBeats } from '../../data/notes'
import { pick, shuffle } from '../rng'
import type { Generator, ScoreElement } from '../types'

export const FIGURE_NAMES: Record<Duration, string> = {
  w: 'semibreve',
  h: 'mínima',
  q: 'semínima',
  '8': 'colcheia',
}
const ALL: readonly Duration[] = ['w', 'h', 'q', '8']
/** Figuras que podem aparecer pontuadas (colcheia pontuada fica de fora no nível iniciante) */
const DOTTABLE: readonly Duration[] = ['w', 'h', 'q']

const NOTE_LOOK: Record<Duration, string> = {
  w: 'cabeça vazada e não tem haste',
  h: 'cabeça vazada e haste',
  q: 'cabeça cheia e haste',
  '8': 'cabeça cheia, haste e uma bandeirola',
}
const REST_LOOK: Record<Duration, string> = {
  w: 'é um retângulo pendurado abaixo da 4ª linha',
  h: 'é um retângulo apoiado sobre a 3ª linha',
  q: 'tem um traço em zigue-zague',
  '8': 'parece um 7 com uma bolinha',
}
const PITCHES: readonly Step[] = ['G', 'A', 'B', 'C']

/** 0.5 -> "½", 1.5 -> "1½", 3 -> "3" */
export function formatBeats(beats: number): string {
  const whole = Math.floor(beats)
  const half = beats - whole === 0.5
  if (!half) return String(whole)
  return whole === 0 ? '½' : `${whole}½`
}

function tempos(beats: number): string {
  return `${formatBeats(beats)} ${beats > 0 && beats <= 1 ? 'tempo' : 'tempos'}`
}

export const figureValue: Generator = (params, rng) => {
  const include = (params.include as Duration[]).filter((d) => ALL.includes(d))
  if (include.length === 0) throw new Error('figureValue: nenhuma figura incluída')
  const duration = pick(rng, include)
  const isRest = params.rests === true && rng() < 0.5
  const dotted = !isRest && params.dotted === true && DOTTABLE.includes(duration) && rng() < 0.5
  const dots = dotted ? 1 : 0
  const beats = noteBeats({ duration, dots })
  const name = FIGURE_NAMES[duration]

  let element: ScoreElement
  if (isRest) {
    element = { kind: 'rest', duration }
  } else {
    const step = pick(rng, PITCHES)
    element = { kind: 'note', note: { step, octave: step === 'C' ? 5 : 4, duration, ...(dotted ? { dots: 1 as const } : {}) } }
  }
  const score = { clef: 'treble' as const, elements: [element] }
  const scoreLabel = isRest ? 'Uma pausa na pauta' : 'Uma figura musical na pauta'


  const askBeats = rng() < 0.5
  if (askBeats) {
    const values = [0.5, 1, 1.5, 2, 3, 4, ...(params.dotted === true ? [6] : [])].filter((v) => v !== beats)
    const plain = noteBeats({ duration })
    const preferred = dotted ? [plain] : []
    const rest = shuffle(rng, values.filter((v) => !preferred.includes(v)))
    const correct = formatBeats(beats)
    const options = shuffle(rng, [correct, ...[...preferred, ...rest].slice(0, 3).map(formatBeats)])
    let explanation: string
    if (dotted) {
      explanation = `A ${name} vale ${tempos(plain)}. O ponto soma metade disso: ${formatBeats(plain)} + ${formatBeats(plain / 2)} = ${formatBeats(beats)}.`
    } else if (isRest) {
      explanation = `A pausa de ${name} vale ${tempos(beats)}, o mesmo que a ${name}.`
    } else if (duration === 'q') {
      explanation = 'A semínima vale 1 tempo. Ela é a medida das outras figuras.'
    } else {
      explanation = `A ${name} vale ${tempos(beats)}, contando a semínima como 1 tempo.`
    }
    return {
      prompt: `Quantos tempos vale esta ${isRest ? 'pausa' : 'figura'}? (semínima = 1 tempo)`,
      score,
      scoreLabel,
      options,
      answer: options.indexOf(correct),
      explanation,
    }
  }

  let correct: string
  let distractors: string[]
  let explanation: string
  if (isRest) {
    correct = `pausa de ${name}`
    distractors = ALL.filter((d) => d !== duration).map((d) => `pausa de ${FIGURE_NAMES[d]}`)
    explanation = `A pausa de ${name} ${REST_LOOK[duration]}. Ela marca ${tempos(beats)} de silêncio.`
  } else if (dotted) {
    correct = `${name} pontuada`
    const others = DOTTABLE.filter((d) => d !== duration).map((d) => `${FIGURE_NAMES[d]} pontuada`)
    distractors = [name, ...others]
    explanation = `É uma ${name} (${NOTE_LOOK[duration]}) com o ponto de aumento ao lado.`
  } else {
    correct = name
    distractors = ALL.filter((d) => d !== duration).map((d) => FIGURE_NAMES[d])
    explanation = `A ${name} tem ${NOTE_LOOK[duration]}.`
  }
  const options = shuffle(rng, [correct, ...distractors])
  return {
    prompt: `Qual é esta ${isRest ? 'pausa' : 'figura'}?`,
    score,
    scoreLabel,
    options,
    answer: options.indexOf(correct),
    explanation,
  }
}
