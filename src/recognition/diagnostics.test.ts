import { describe, expect, it } from 'vitest'
import type { Step } from '../data/notes'
import { accuracy, latencyStats } from './diagnostics'
import type { SyllableEvent } from './types'

function ev(latency: number): SyllableEvent {
  return { step: 'C', onset: 10, arrivedAt: 10 + latency }
}

describe('latencyStats', () => {
  it('calcula média e p90 de arrivedAt − onset', () => {
    const events = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map(ev)
    const s = latencyStats(events)
    expect(s.count).toBe(10)
    expect(s.mean).toBeCloseTo(0.55, 6)
    expect(s.p90).toBeCloseTo(0.9, 6)
  })

  it('devolve zeros sem eventos', () => {
    expect(latencyStats([])).toEqual({ count: 0, mean: 0, p90: 0 })
  })
})

describe('accuracy', () => {
  it('conta acertos posição a posição', () => {
    const expected: Step[] = ['C', 'D', 'E']
    expect(accuracy(expected, ['C', null, 'F'])).toBeCloseTo(1 / 3, 6)
  })

  it('devolve 0 para sequência vazia', () => {
    expect(accuracy([], [])).toBe(0)
  })
})
