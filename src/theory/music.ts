// Teoria pura: alturas, intervalos, escalas maiores e armaduras

import type { Accidental, Step } from '../data/notes'
import { SOLFEGE } from '../data/notes'

export interface Pitch {
  step: Step
  accidental?: Accidental
  octave: number
}

type PitchClass = Pick<Pitch, 'step' | 'accidental'>

const STEPS: readonly Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const STEP_SEMITONES: Record<Step, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
/** Semitons de cada grau da escala maior (também a referência maior/justa dos intervalos simples) */
const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const

function accidentalOffset(acc?: Accidental): number {
  return acc === '#' ? 1 : acc === 'b' ? -1 : 0
}

/** MIDI: Dó4 = 60 */
export function pitchToMidi(p: Pitch): number {
  return 12 * (p.octave + 1) + STEP_SEMITONES[p.step] + accidentalOffset(p.accidental)
}

/** Semitons de a até b (negativo se b for mais grave) */
export function semitones(a: Pitch, b: Pitch): number {
  return pitchToMidi(b) - pitchToMidi(a)
}

/** Nome em solfejo com acidente exibível, ex.: "Fá♯", "Si♭", "Dó" */
export function solfege(p: PitchClass): string {
  const acc = p.accidental === '#' ? '♯' : p.accidental === 'b' ? '♭' : ''
  return SOLFEGE[p.step] + acc
}

export interface IntervalInfo {
  number: number
  quality: 'maior' | 'menor' | 'justa' | 'aumentada' | 'diminuta'
}

function letterIndex(p: Pitch): number {
  return p.octave * 7 + STEPS.indexOf(p.step)
}

/** Número pela distância entre as letras; qualidade pelos semitons em relação à referência maior/justa */
export function intervalBetween(low: Pitch, high: Pitch): IntervalInfo {
  if (letterIndex(high) < letterIndex(low)) [low, high] = [high, low]
  const steps = letterIndex(high) - letterIndex(low)
  const number = steps + 1
  const degree = steps % 7
  const reference = MAJOR_SEMITONES[degree] + 12 * Math.floor(steps / 7)
  const diff = semitones(low, high) - reference
  const perfect = degree === 0 || degree === 3 || degree === 4
  let quality: IntervalInfo['quality'] | undefined
  if (perfect) {
    quality = diff === 0 ? 'justa' : diff === 1 ? 'aumentada' : diff === -1 ? 'diminuta' : undefined
  } else {
    quality = diff === 0 ? 'maior' : diff === -1 ? 'menor' : diff === 1 ? 'aumentada' : diff === -2 ? 'diminuta' : undefined
  }
  if (!quality) throw new Error(`intervalo não suportado (${number}ª, desvio ${diff})`)
  return { number, quality }
}

/** Ex.: "3ª maior", "5ª justa"; sem qualidade, só "2ª" */
export function intervalName(i: IntervalInfo, withQuality: boolean): string {
  return withQuality ? `${i.number}ª ${i.quality}` : `${i.number}ª`
}

/** Os 7 graus da escala maior a partir da tônica (acidentes simples apenas) */
export function majorScale(tonic: PitchClass): PitchClass[] {
  const start = STEPS.indexOf(tonic.step)
  const tonicPc = STEP_SEMITONES[tonic.step] + accidentalOffset(tonic.accidental)
  return MAJOR_SEMITONES.map((interval, i) => {
    const step = STEPS[(start + i) % 7]
    const target = tonicPc + interval
    const offset = ((((target - STEP_SEMITONES[step]) % 12) + 18) % 12) - 6
    if (offset === 0) return { step }
    if (offset === 1) return { step, accidental: '#' as const }
    if (offset === -1) return { step, accidental: 'b' as const }
    throw new Error(`escala de ${solfege(tonic)} exige acidente duplo`)
  })
}

export const MAJOR_KEYS: {
  name: string
  tonic: PitchClass
  sharps: number
  flats: number
  vexKey: string
}[] = [
  { name: 'Dó maior', tonic: { step: 'C' }, sharps: 0, flats: 0, vexKey: 'C' },
  { name: 'Sol maior', tonic: { step: 'G' }, sharps: 1, flats: 0, vexKey: 'G' },
  { name: 'Ré maior', tonic: { step: 'D' }, sharps: 2, flats: 0, vexKey: 'D' },
  { name: 'Lá maior', tonic: { step: 'A' }, sharps: 3, flats: 0, vexKey: 'A' },
  { name: 'Mi maior', tonic: { step: 'E' }, sharps: 4, flats: 0, vexKey: 'E' },
  { name: 'Fá maior', tonic: { step: 'F' }, sharps: 0, flats: 1, vexKey: 'F' },
  { name: 'Si♭ maior', tonic: { step: 'B', accidental: 'b' }, sharps: 0, flats: 2, vexKey: 'Bb' },
  { name: 'Mi♭ maior', tonic: { step: 'E', accidental: 'b' }, sharps: 0, flats: 3, vexKey: 'Eb' },
  { name: 'Lá♭ maior', tonic: { step: 'A', accidental: 'b' }, sharps: 0, flats: 4, vexKey: 'Ab' },
]
