import type { Step } from '../data/notes'
import type { SyllableEvent } from './types'

export interface Aligner {
  pushOnset(t: number): void
  /** Consome o onset pendente mais antigo; null se não há nenhum. */
  pushStep(step: Step, arrivedAt: number): SyllableEvent | null
  /** Descarta onsets pendentes anteriores a `t` (fim de uma fala no Vosk). */
  dropBefore(t: number): void
  reset(): void
}

/**
 * Casa cada sílaba reconhecida com o onset pendente mais antigo. Um onset órfão
 * (ruído, fala não reconhecida) deslocaria todas as atribuições seguintes; ele
 * expira após `maxPendingSeconds`, que cada motor ajusta à sua latência.
 */
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
    dropBefore(t) {
      onsets = onsets.filter((o) => o >= t)
    },
    reset() {
      onsets = []
    },
  }
}
