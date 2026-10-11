import { describe, expect, test } from 'vitest'
import type { Note } from '../../data/notes'
import { intervalBetween, intervalName, semitones } from '../music'
import { mulberry32 } from '../rng'
import type { Question } from '../types'
import { checkQuestionInvariants, expectAnswerPositionsVary } from './assertions'
import { interval } from './interval'

function notesOf(q: Question): [Note, Note] {
  const els = q.score?.elements ?? []
  expect(els).toHaveLength(2)
  const notes = els.map((e) => {
    if (e.kind !== 'note') throw new Error('esperava nota')
    return e.note
  })
  return [notes[0], notes[1]]
}

const CASES = [
  { withQuality: false, clef: 'treble' },
  { withQuality: true, clef: 'treble' },
  { withQuality: false, clef: 'bass' },
  { withQuality: true, clef: 'bass' },
  { withQuality: true, clef: 'treble', maxNumber: 2 },
  { withQuality: false, clef: 'bass', maxNumber: 2 },
]

describe.each(CASES)('interval %o', (params) => {
  test('200 sementes passam pelas invariantes', () => {
    for (let s = 0; s < 200; s++) checkQuestionInvariants(interval(params, mulberry32(s)))
  })

  test('a posição da resposta varia', () => {
    expectAnswerPositionsVary(interval, params, 50)
  })

  test('duas semibreves ascendentes na clave pedida', () => {
    for (let s = 0; s < 200; s++) {
      const q = interval(params, mulberry32(s))
      expect(q.score?.clef).toBe(params.clef)
      const [a, b] = notesOf(q)
      expect(a.duration).toBe('w')
      expect(b.duration).toBe('w')
      expect(semitones(a, b)).toBeGreaterThan(0)
    }
  })
})

test.each([false, true])('resposta = intervalName(intervalBetween(notas do score)) (withQuality %s)', (withQuality) => {
  for (const clef of ['treble', 'bass']) {
    for (let s = 0; s < 200; s++) {
      const q = interval({ withQuality, clef }, mulberry32(s))
      const [a, b] = notesOf(q)
      const info = intervalBetween(a, b)
      expect(q.options[q.answer]).toBe(intervalName(info, withQuality))
      expect(info.number).toBeGreaterThanOrEqual(2)
      expect(info.number).toBeLessThanOrEqual(8)
      expect(['maior', 'menor', 'justa']).toContain(info.quality)
    }
  }
})

test('com qualidade, todas as opções são maior, menor ou justa', () => {
  for (let s = 0; s < 200; s++) {
    const q = interval({ withQuality: true, clef: 'treble' }, mulberry32(s))
    for (const o of q.options) expect(o).toMatch(/^[2-8]ª (maior|menor|justa)$/)
  }
})

test('sem qualidade, as opções são só números', () => {
  for (let s = 0; s < 200; s++) {
    const q = interval({ withQuality: false, clef: 'treble' }, mulberry32(s))
    for (const o of q.options) expect(o).toMatch(/^[2-8]ª$/)
  }
})

test('maxNumber limita o número do intervalo', () => {
  for (let s = 0; s < 200; s++) {
    const q = interval({ withQuality: true, clef: 'treble', maxNumber: 5 }, mulberry32(s))
    const [a, b] = notesOf(q)
    expect(intervalBetween(a, b).number).toBeLessThanOrEqual(5)
  }
})

test('maxNumber 2: resposta Tom ou Semitom, correta pelos semitons', () => {
  const seen = new Set<string>()
  for (let s = 0; s < 200; s++) {
    const q = interval({ withQuality: true, clef: 'treble', maxNumber: 2 }, mulberry32(s))
    const [a, b] = notesOf(q)
    expect(intervalBetween(a, b).number).toBe(2)
    const answer = q.options[q.answer]
    expect(['Tom', 'Semitom']).toContain(answer)
    expect(answer).toBe(semitones(a, b) === 2 ? 'Tom' : 'Semitom')
    expect(q.options).toContain('Tom')
    expect(q.options).toContain('Semitom')
    seen.add(answer)
  }
  expect(seen).toEqual(new Set(['Tom', 'Semitom']))
})

test('2ª menor: explicação no singular ("1 semitom")', () => {
  let checked = 0
  for (let s = 0; s < 400; s++) {
    const q = interval({ withQuality: true, clef: 'treble' }, mulberry32(s))
    if (q.options[q.answer] !== '2ª menor') continue
    checked++
    expect(q.explanation).toContain('1 semitom')
    expect(q.explanation).not.toContain('1 semitons')
  }
  expect(checked).toBeGreaterThan(0)
})

test('snapshot com mulberry32(1)', () => {
  expect(interval({ withQuality: true, clef: 'treble' }, mulberry32(1))).toMatchSnapshot()
  expect(interval({ withQuality: false, clef: 'bass' }, mulberry32(1))).toMatchSnapshot()
  expect(interval({ withQuality: true, clef: 'treble', maxNumber: 2 }, mulberry32(1))).toMatchSnapshot()
})
