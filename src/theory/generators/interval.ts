// Gerador de intervalos melódicos ascendentes (número, qualidade ou tom/semitom)

import type { Accidental, Note, Step } from '../../data/notes'
import { NATURAL_STEPS } from '../../data/notes'
import { intervalBetween, intervalName, semitones, solfege } from '../music'
import type { IntervalInfo } from '../music'
import type { Rng } from '../rng'
import { pick, shuffle } from '../rng'
import type { Generator, Question } from '../types'

/** Faixa de letras (índice oitava*7 + grau) por clave, dentro ou perto da pauta */
const RANGE = {
  treble: { low: 4 * 7 + 0, high: 5 * 7 + 5 }, // Dó4 a Lá5
  bass: { low: 2 * 7 + 2, high: 4 * 7 + 0 }, // Mi2 a Dó4
} as const

const NUMBER_QUALITIES: Record<number, IntervalInfo['quality'][]> = {
  2: ['maior', 'menor'],
  3: ['maior', 'menor'],
  4: ['justa'],
  5: ['justa'],
  6: ['maior', 'menor'],
  7: ['maior', 'menor'],
  8: ['justa'],
}

const TOM = 'Tom'
const SEMITOM = 'Semitom'
const TOM_E_MEIO = 'Tom e meio'

function noteAt(index: number, accidental?: Accidental): Note {
  const note: Note = { step: NATURAL_STEPS[index % 7], octave: Math.floor(index / 7), duration: 'w' }
  if (accidental) note.accidental = accidental
  return note
}

function finish(prompt: string, clef: 'treble' | 'bass', a: Note, b: Note, correct: string, distractors: string[], rng: Rng, explanation: string): Question {
  const options = shuffle(rng, [correct, ...distractors])
  return {
    prompt,
    score: { clef, elements: [{ kind: 'note', note: a }, { kind: 'note', note: b }] },
    options,
    answer: options.indexOf(correct),
    explanation,
  }
}

/** Lista "a, b e c" */
function joinPt(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`
}

function toneOrSemitone(clef: 'treble' | 'bass', rng: Rng): Question {
  const { low, high } = RANGE[clef]
  // 2ª maior ou menor, com acidentes simples na nota de cima para variar
  for (;;) {
    const index = low + Math.floor(rng() * (high - low))
    const a = noteAt(index)
    const b = noteAt(index + 1, pick<Accidental | undefined>(rng, [undefined, undefined, '#', 'b']))
    const quality = intervalBetween(a, b).quality
    if (quality !== 'maior' && quality !== 'menor') continue
    const st = semitones(a, b)
    const correct = st === 2 ? TOM : SEMITOM
    const explanation =
      st === 2
        ? `De ${solfege(a)} a ${solfege(b)} há 2 semitons, ou seja, 1 tom.`
        : `De ${solfege(a)} a ${solfege(b)} há só 1 semitom, a menor distância entre duas notas.`
    const others = [TOM, SEMITOM, TOM_E_MEIO].filter((o) => o !== correct)
    return finish('Da primeira para a segunda nota, temos tom ou semitom?', clef, a, b, correct, others, rng, explanation)
  }
}

export const interval: Generator = (params, rng) => {
  const clef = params.clef === 'bass' ? 'bass' : 'treble'
  const withQuality = params.withQuality === true
  const maxNumber = Math.min(8, Math.max(2, typeof params.maxNumber === 'number' ? params.maxNumber : 8))
  if (maxNumber === 2) return toneOrSemitone(clef, rng)
  if (!withQuality && maxNumber < 4) throw new Error('interval: maxNumber pequeno demais para 3 opções')

  const { low, high } = RANGE[clef]
  for (;;) {
    const number = 2 + Math.floor(rng() * (maxNumber - 1))
    const index = low + Math.floor(rng() * (high - low - (number - 1) + 1))
    const a = noteAt(index)
    const b = noteAt(index + number - 1)
    const info = intervalBetween(a, b)
    // Só maior, menor e justa (descarta Fá–Si e Si–Fá)
    if (!NUMBER_QUALITIES[info.number].includes(info.quality)) continue

    const correct = intervalName(info, withQuality)
    const sameNumber: string[] = []
    const nearby: string[] = []
    const far: string[] = []
    for (let n = 2; n <= maxNumber; n++) {
      const names = withQuality ? NUMBER_QUALITIES[n].map((quality) => intervalName({ number: n, quality }, true)) : [`${n}ª`]
      for (const name of names) {
        if (name === correct) continue
        if (n === info.number) sameNumber.push(name)
        else if (Math.abs(n - info.number) <= 2) nearby.push(name)
        else far.push(name)
      }
    }
    const distractors = [...sameNumber, ...shuffle(rng, nearby), ...shuffle(rng, far)].slice(0, 3)

    const steps: Step[] = []
    for (let i = index; i < index + number; i++) steps.push(NATURAL_STEPS[i % 7])
    const names = steps.map((step) => solfege({ step }))
    let explanation = `De ${solfege(a)} a ${solfege(b)} contamos ${number} notas (${joinPt(names)}): é uma ${info.number}ª.`
    if (withQuality) explanation += ` Com ${semitones(a, b)} semitons, é ${correct}.`
    return finish('Qual é o intervalo entre as duas notas?', clef, a, b, correct, distractors, rng, explanation)
  }
}
