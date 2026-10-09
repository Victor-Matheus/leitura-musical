import { expect, test } from 'vitest'
import type { Note } from '../data/notes'
import { anticipation, buildWindows, endTime, playheadAt } from './timeline'

const q: Note = { step: 'C', octave: 4, duration: 'q' }
const h: Note = { step: 'C', octave: 4, duration: 'h' }

test('janelas sequenciais a 60 BPM', () => {
  expect(buildWindows([q, q, h], 60, [{ fromIndex: 0, t0: 10 }])).toEqual([
    { index: 0, start: 10, end: 11 },
    { index: 1, start: 11, end: 12 },
    { index: 2, start: 12, end: 14 },
  ])
})
test('120 BPM divide as durações', () =>
  expect(buildWindows([q, q], 120, [{ fromIndex: 0, t0: 0 }])[1]).toEqual({ index: 1, start: 0.5, end: 1 }))
test('pausa no meio da nota 1 faz ela recomeçar no novo segmento', () => {
  const w = buildWindows([q, q, q], 60, [{ fromIndex: 0, t0: 0, endedAt: 1.4 }, { fromIndex: 1, t0: 20 }])
  expect(w).toEqual([
    { index: 0, start: 0, end: 1 },
    { index: 1, start: 20, end: 21 },
    { index: 2, start: 21, end: 22 },
  ])
})
test('índice sem janela é null', () => {
  const w = buildWindows([q, q, q], 60, [{ fromIndex: 1, t0: 0 }])
  expect(w[0]).toBeNull()
})
test('anticipation', () => {
  expect(anticipation(60)).toBe(0.15)
  expect(anticipation(120)).toBe(0.125)
})
test('playheadAt', () => {
  const w = buildWindows([q, q], 60, [{ fromIndex: 0, t0: 0 }])
  expect(playheadAt(w, 0.5)).toBe(0)
  expect(playheadAt(w, 1)).toBe(1)
  expect(playheadAt(w, 2)).toBeNull()
})
test('endTime é o fim da última janela', () => {
  expect(endTime(buildWindows([q, h], 60, [{ fromIndex: 0, t0: 10 }]))).toBe(13)
})
