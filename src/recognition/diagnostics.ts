import type { Step } from '../data/notes'
import type { SyllableEvent } from './types'

export interface LatencyStats {
  count: number
  mean: number
  p90: number
}

/** Latência = arrivedAt − onset, em segundos. p90 pelo método do posto mais próximo. */
export function latencyStats(events: SyllableEvent[]): LatencyStats {
  if (events.length === 0) return { count: 0, mean: 0, p90: 0 }
  const values = events.map((e) => e.arrivedAt - e.onset).sort((a, b) => a - b)
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length
  const p90 = values[Math.ceil(0.9 * values.length) - 1]
  return { count: values.length, mean, p90 }
}

/** Fração de posições em que o reconhecido bate com o esperado. */
export function accuracy(expected: Step[], got: (Step | null)[]): number {
  if (expected.length === 0) return 0
  const hits = expected.filter((step, i) => got[i] === step).length
  return hits / expected.length
}
