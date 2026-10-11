import { expect, test } from 'vitest'
import { MAJOR_KEYS } from '../music'
import { mulberry32 } from '../rng'
import { checkQuestionInvariants, expectAnswerPositionsVary } from './assertions'
import { keySignature } from './keySignature'

test.each([0, 1, 2, 4])('200 sementes passam pelas invariantes (maxAccidentals %i)', (maxAccidentals) => {
  for (let s = 0; s < 200; s++) checkQuestionInvariants(keySignature({ maxAccidentals }, mulberry32(s)))
})

test('a posição da resposta varia', () => {
  expectAnswerPositionsVary(keySignature, { maxAccidentals: 4 }, 50)
})

test('resposta corresponde a MAJOR_KEYS pelo vexKey do score, dentro do limite', () => {
  const seen = new Set<string>()
  for (const maxAccidentals of [0, 1, 2, 3, 4]) {
    for (let s = 0; s < 200; s++) {
      const q = keySignature({ maxAccidentals }, mulberry32(s))
      expect(q.score!.elements).toEqual([])
      const key = MAJOR_KEYS.find((k) => k.vexKey === q.score!.keySignature)!
      expect(key).toBeDefined()
      expect(q.options[q.answer]).toBe(key.name)
      expect(Math.max(key.sharps, key.flats)).toBeLessThanOrEqual(maxAccidentals)
      for (const o of q.options) expect(MAJOR_KEYS.map((k) => k.name)).toContain(o)
      if (maxAccidentals === 4) seen.add(key.name)
    }
  }
  expect(seen.size).toBe(MAJOR_KEYS.length)
})

test('snapshot com mulberry32(1)', () => {
  expect(keySignature({ maxAccidentals: 4 }, mulberry32(1))).toMatchSnapshot()
})
