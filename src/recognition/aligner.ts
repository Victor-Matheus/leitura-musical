import type { Step } from '../data/notes'
import type { SyllableEvent } from './types'

export interface Aligner {
  pushOnset(t: number): void
  /** Consome o onset pendente mais antigo; null se não há nenhum. */
  pushStep(step: Step, arrivedAt: number): SyllableEvent | null
  reset(): void
}

export function createAligner(opts: { maxPendingSeconds?: number } = {}): Aligner {
  const maxPending = opts.maxPendingSeconds ?? 3
  let onsets: number[] = []

  return {
    pushOnset(t) {
      onsets.push(t)
    },
    pushStep(step, arrivedAt) {
      const limit = arrivedAt - maxPending
      const firstValid = onsets.findIndex((o) => o >= limit)
      if (firstValid === -1) {
        onsets = []
        return null
      }
      const onset = onsets[firstValid]
      onsets = onsets.slice(firstValid + 1)
      return { step, onset, arrivedAt }
    },
    reset() {
      onsets = []
    },
  }
}
