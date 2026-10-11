import { expect, test } from 'vitest'
import type { Note } from '../../data/notes'
import { MAJOR_KEYS, majorScale, pitchToMidi, solfege } from '../music'
import { mulberry32 } from '../rng'
import { checkQuestionInvariants, expectAnswerPositionsVary } from './assertions'
import { scale } from './scale'

const ALL = { keys: MAJOR_KEYS.map((k) => k.name) }
const FEW = { keys: ['Dó maior', 'Sol maior'] }

test.each([ALL, FEW])('200 sementes passam pelas invariantes (%o)', (params) => {
  for (let s = 0; s < 200; s++) checkQuestionInvariants(scale(params, mulberry32(s)))
})

test.each([ALL, FEW])('a posição da resposta varia (%o)', (params) => {
  expectAnswerPositionsVary(scale, params, 50)
})

test('as duas variantes aparecem', () => {
  const kinds = new Set<string>()
  for (let s = 0; s < 200; s++) {
    const q = scale(ALL, mulberry32(s))
    kinds.add(q.score!.elements.some((e) => e.kind === 'rest') ? 'falta' : 'qual')
  }
  expect(kinds).toEqual(new Set(['falta', 'qual']))
})

function notes(elements: { kind: string; note?: Note }[]): (Note | null)[] {
  return elements.map((e) => (e.kind === 'note' ? e.note! : null))
}

test('nota faltante = majorScale(tônica)[grau], e o resto do score é a escala', () => {
  let checked = 0
  for (let s = 0; s < 400; s++) {
    const q = scale(ALL, mulberry32(s))
    const els = notes(q.score!.elements)
    if (!els.includes(null)) continue
    checked++
    expect(els).toHaveLength(8)
    const tonicNote = els[0]!
    const key = MAJOR_KEYS.find((k) => k.tonic.step === tonicNote.step && k.tonic.accidental === tonicNote.accidental)!
    expect(key).toBeDefined()
    const sc = majorScale(key.tonic)
    const degree = els.indexOf(null)
    expect(degree).toBeGreaterThan(0)
    expect(degree).toBeLessThan(7)
    expect(q.options[q.answer]).toBe(solfege(sc[degree]))
    els.forEach((n, i) => {
      if (!n) return
      expect(n.step).toBe(sc[i % 7].step)
      expect(n.accidental).toBe(sc[i % 7].accidental)
      if (i > 0 && els[i - 1]) expect(pitchToMidi(n)).toBeGreaterThan(pitchToMidi(els[i - 1]!))
    })
    expect(pitchToMidi(els[7]!) - pitchToMidi(els[0]!)).toBe(12)
  }
  expect(checked).toBeGreaterThan(50)
})

test('qual escala: resposta é o nome da tonalidade cuja escala aparece', () => {
  let checked = 0
  for (let s = 0; s < 400; s++) {
    const q = scale(FEW, mulberry32(s))
    const els = notes(q.score!.elements)
    if (els.includes(null)) continue
    checked++
    const key = MAJOR_KEYS.find((k) => k.name === q.options[q.answer])!
    expect(FEW.keys).toContain(key.name)
    const sc = majorScale(key.tonic)
    els.forEach((n, i) => {
      expect(n!.step).toBe(sc[i % 7].step)
      expect(n!.accidental).toBe(sc[i % 7].accidental)
    })
    for (const o of q.options) expect(MAJOR_KEYS.map((k) => k.name)).toContain(o)
  }
  expect(checked).toBeGreaterThan(50)
})

test('só usa tonalidades de params.keys', () => {
  for (let s = 0; s < 200; s++) {
    const q = scale(FEW, mulberry32(s))
    const first = q.score!.elements[0]
    if (first.kind !== 'note') throw new Error('esperava nota')
    expect(['C', 'G']).toContain(first.note.step)
  }
})

test('snapshot com mulberry32(1)', () => {
  expect(scale(ALL, mulberry32(1))).toMatchSnapshot()
  expect(scale(ALL, mulberry32(2))).toMatchSnapshot()
})
