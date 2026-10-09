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
})
