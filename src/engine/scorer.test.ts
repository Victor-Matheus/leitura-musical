import { expect, test } from 'vitest'
import type { Note, Step } from '../data/notes'
import type { SyllableEvent } from '../recognition/types'
import { attribute, score } from './scorer'
import { buildWindows } from './timeline'

const note = (step: Step): Note => ({ step, octave: 4, duration: 'q' })
const n = [note('C'), note('D'), note('E')]
const w = buildWindows(n, 60, [{ fromIndex: 0, t0: 0 }])
const ev = (step: Step, onset: number, arrivedAt = onset + 0.3): SyllableEvent => ({ step, onset, arrivedAt })

test('sílaba no meio da janela', () =>
  expect(score(n, w, 60, [ev('C', 0.5)])).toEqual(['correct', 'missed', 'missed']))
test('antecipação de 100 ms conta para a nota que começa', () => expect(attribute(w, 60, 0.9)).toBe(1))
test('chegada 1,5 s atrasada usa o onset', () =>
  expect(score(n, w, 60, [ev('D', 1.2, 2.7)])).toEqual(['missed', 'correct', 'missed']))
test('primeira sílaba decide', () =>
  expect(score(n, w, 60, [ev('D', 0.2), ev('C', 0.4), ev('E', 0.6)])[0]).toBe('wrong'))
test('fora de janela é descartado', () => {
  expect(attribute(w, 60, -0.5)).toBeNull()
  expect(attribute(w, 60, 3.5)).toBeNull()
})
test('evento durante a pausa é descartado', () => {
  const wp = buildWindows(n, 60, [{ fromIndex: 0, t0: 0, endedAt: 1.4 }, { fromIndex: 1, t0: 20 }])
  expect(score(n, wp, 60, [ev('D', 5)])).toEqual(['missed', 'missed', 'missed'])
})
test('eventos fora de ordem são ordenados por onset', () =>
  expect(score(n, w, 60, [ev('C', 0.6), ev('D', 0.3)])[0]).toBe('wrong'))
