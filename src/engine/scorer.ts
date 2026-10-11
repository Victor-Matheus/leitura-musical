import type { Note } from '../data/notes'
import type { SyllableEvent } from '../recognition/types'
import { anticipation, type NoteWindow } from './timeline'

export type NoteOutcome = 'correct' | 'wrong' | 'missed'

export function attribute(windows: (NoteWindow | null)[], bpm: number, onset: number): number | null {
  const lead = anticipation(bpm)
  for (const w of windows) {
    if (w && w.start - lead <= onset && onset < w.end - lead) return w.index
  }
  return null
}

export function score(
  notes: Note[],
  windows: (NoteWindow | null)[],
  bpm: number,
  events: SyllableEvent[],
): NoteOutcome[] {
  const outcomes: NoteOutcome[] = notes.map(() => 'missed')
  const decided = new Set<number>()
  for (const e of [...events].sort((a, b) => a.onset - b.onset)) {
    const i = attribute(windows, bpm, e.onset)
    if (i === null || decided.has(i)) continue
    decided.add(i)
    outcomes[i] = e.step === notes[i].step ? 'correct' : 'wrong'
  }
  return outcomes
}
