import { describe, expect, test } from 'vitest'
import { createAligner } from './aligner'

describe('createAligner', () => {
  test('casa pela ordem', () => {
    const a = createAligner()
    a.pushOnset(1)
    a.pushOnset(2)
    expect(a.pushStep('C', 2.5)).toEqual({ step: 'C', onset: 1, arrivedAt: 2.5 })
    expect(a.pushStep('D', 2.6)?.onset).toBe(2)
  })

  test('sem onset retorna null', () => expect(createAligner().pushStep('C', 1)).toBeNull())

  test('descarta onset mais velho que 3 s', () => {
    const a = createAligner()
    a.pushOnset(1)
    a.pushOnset(4.5)
    expect(a.pushStep('C', 5)?.onset).toBe(4.5)
  })

  test('onset órfão seguido de fluxo contínuo a 120 BPM: cada rótulo casa com o seu onset', () => {
    const a = createAligner({ maxPendingSeconds: 1 })
    a.pushOnset(0) // ruído, nunca rotulado
    const paired: Array<[number, number]> = []
    for (let k = 0; k < 8; k++) {
      const onset = 1 + k * 0.5
      a.pushOnset(onset)
      const e = a.pushStep('C', onset + 0.3)
      paired.push([onset, e!.onset])
    }
    for (const [own, got] of paired) expect(got).toBe(own)
  })

  test('com a janela do Web Speech (2,5 s) o órfão ainda é consumido primeiro', () => {
    const a = createAligner({ maxPendingSeconds: 2.5 })
    a.pushOnset(0)
    a.pushOnset(1)
    expect(a.pushStep('C', 1.3)?.onset).toBe(0)
  })

  test('dropBefore descarta só os onsets anteriores ao corte', () => {
    const a = createAligner()
    a.pushOnset(1)
    a.pushOnset(2)
    a.dropBefore(1.5)
    expect(a.pushStep('C', 2.2)?.onset).toBe(2)
    expect(a.pushStep('D', 2.3)).toBeNull()
  })
})
