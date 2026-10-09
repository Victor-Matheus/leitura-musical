import { expect, test, vi } from 'vitest'
import { audioClock, performanceClock } from './clock'

test('audioClock lê currentTime do contexto', () => {
  const ctx = { currentTime: 12.5 } as AudioContext
  expect(audioClock(ctx).now()).toBe(12.5)
})

test('performanceClock retorna segundos', () => {
  vi.spyOn(performance, 'now').mockReturnValue(2500)
  expect(performanceClock.now()).toBe(2.5)
})
