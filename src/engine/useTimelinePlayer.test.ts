import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { Note } from '../data/notes'
import { performanceClock } from './clock'
import { useTimelinePlayer } from './useTimelinePlayer'

const notes: Note[] = [
  { step: 'C', octave: 4, duration: 'q' },
  { step: 'D', octave: 4, duration: 'q' },
]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
})
afterEach(() => {
  vi.useRealTimers()
})

// Margem de 20 ms: o rAF falso dispara em quadros de ~16 ms.
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms + 20))

function setup(bpm = 60) {
  const onFinish = vi.fn()
  const hook = renderHook((props: { bpm: number }) => useTimelinePlayer({ notes, bpm: props.bpm, onFinish }), {
    initialProps: { bpm },
  })
  return { ...hook, onFinish }
}

test('countIn 4..1 e depois toca a nota 0', () => {
  const { result } = setup()
  act(() => result.current.start(performanceClock))
  expect(result.current.phase).toBe('countIn')
  expect(result.current.countIn).toBe(4)
  advance(1000)
  expect(result.current.countIn).toBe(3)
  advance(3000)
  expect(result.current.phase).toBe('playing')
  expect(result.current.countIn).toBe(0)
  expect(result.current.index).toBe(0)
})

test('avança no ritmo (60 BPM)', () => {
  const { result } = setup()
  act(() => result.current.start(performanceClock))
  advance(4000)
  advance(1000)
  expect(result.current.index).toBe(1)
})

test('chama onFinish uma vez no fim', () => {
  const { result, onFinish } = setup()
  act(() => result.current.start(performanceClock))
  advance(4000 + 2000 + 100)
  advance(1000)
  expect(onFinish).toHaveBeenCalledTimes(1)
  expect(result.current.phase).toBe('finished')
})

test('pause congela e resume refaz o countIn da mesma nota', () => {
  const { result } = setup()
  act(() => result.current.start(performanceClock))
  advance(4000)
  advance(1000)
  expect(result.current.index).toBe(1)
  act(() => result.current.pause())
  expect(result.current.phase).toBe('paused')
  advance(5000)
  expect(result.current.index).toBe(1)
  act(() => result.current.resume())
  expect(result.current.phase).toBe('countIn')
  expect(result.current.countIn).toBe(4)
  advance(4000)
  expect(result.current.phase).toBe('playing')
  expect(result.current.index).toBe(1)
})

test('mudar bpm durante a execução não altera as janelas', () => {
  const { result, rerender } = setup(60)
  act(() => result.current.start(performanceClock))
  advance(4000)
  const before = result.current.windows
  rerender({ bpm: 120 })
  advance(500)
  expect(result.current.windows).toEqual(before)
})
