import type { Note } from '../data/notes'
import { noteBeats } from '../data/notes'

export interface Segment {
  fromIndex: number
  /** Início da nota fromIndex, em segundos no relógio único. */
  t0: number
  endedAt?: number
}
export interface NoteWindow {
  index: number
  start: number
  end: number
}

export function beatSeconds(bpm: number): number {
  return 60 / bpm
}

export function anticipation(bpm: number): number {
  return Math.min(0.15, 0.25 * beatSeconds(bpm))
}

export function buildWindows(notes: Note[], bpm: number, segments: Segment[]): (NoteWindow | null)[] {
  const windows: (NoteWindow | null)[] = notes.map(() => null)
  const beat = beatSeconds(bpm)
  segments.forEach((segment, s) => {
    const limit = s + 1 < segments.length ? segments[s + 1].fromIndex : notes.length
    let t = segment.t0
    for (let i = segment.fromIndex; i < limit && i < notes.length; i++) {
      const end = t + noteBeats(notes[i]) * beat
      if (segment.endedAt !== undefined && segment.endedAt >= t && segment.endedAt < end) break
      windows[i] = { index: i, start: t, end }
      t = end
    }
  })
  return windows
}

export function playheadAt(windows: (NoteWindow | null)[], t: number): number | null {
  for (const w of windows) {
    if (w && w.start <= t && t < w.end) return w.index
  }
  return null
}

export function endTime(windows: (NoteWindow | null)[]): number {
  for (let i = windows.length - 1; i >= 0; i--) {
    const w = windows[i]
    if (w) return w.end
  }
  return 0
}
