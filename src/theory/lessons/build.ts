// Atalhos para escrever notas e pausas no conteúdo das lições

import type { Accidental, Duration, Note, Step } from '../../data/notes'
import type { ScoreElement } from '../types'

/** "C4", "F#5", "Bb4" + figura -> Note (sem acidente = natural) */
export function pitch(spec: string, duration: Duration, dots?: 1): Note {
  const m = /^([A-G])([#b]?)(\d)$/.exec(spec)
  if (!m) throw new Error(`nota inválida "${spec}"`)
  const n: Note = { step: m[1] as Step, octave: Number(m[3]), duration }
  if (m[2]) n.accidental = m[2] as Accidental
  if (dots) n.dots = dots
  return n
}

export function note(spec: string, duration: Duration, dots?: 1): ScoreElement {
  return { kind: 'note', note: pitch(spec, duration, dots) }
}

export function rest(duration: Duration, dots?: 1): ScoreElement {
  return dots ? { kind: 'rest', duration, dots } : { kind: 'rest', duration }
}

export const bar: ScoreElement = { kind: 'bar' }
