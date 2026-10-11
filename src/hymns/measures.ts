import type { Duration } from '../data/notes'
import { noteBeats } from '../data/notes'

const EPS = 1e-9

/**
 * As durações fecham os compassos? Nenhuma nota pode atravessar a barra (o motor
 * não tem ligaduras). Com anacruse, o primeiro compasso tem `pickupBeats` tempos e o
 * último tem o complemento (`beatsPerMeasure - pickupBeats`).
 */
export function measuresClose(
  notes: { duration: Duration; dots?: 0 | 1 }[],
  beatsPerMeasure: number,
  pickupBeats = 0,
): boolean {
  if (notes.length === 0 || beatsPerMeasure <= 0) return false
  if (pickupBeats < 0 || pickupBeats >= beatsPerMeasure) return false

  let pos = 0
  let nextBar = pickupBeats > 0 ? pickupBeats : beatsPerMeasure
  for (const n of notes) {
    pos += noteBeats(n)
    if (pos > nextBar + EPS) return false
    if (Math.abs(pos - nextBar) < EPS) nextBar += beatsPerMeasure
  }
  const lastMeasureBeats = pos - (nextBar - beatsPerMeasure)
  const expected = pickupBeats > 0 ? beatsPerMeasure - pickupBeats : 0
  return Math.abs(lastMeasureBeats - expected) < EPS
}
