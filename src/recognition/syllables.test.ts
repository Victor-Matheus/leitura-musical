import { expect, test } from 'vitest'
import { textToSteps, wordToStep } from './syllables'

test.each([
  ['dó', 'C'],['do', 'C'],['Dó!', 'C'],['ré', 'D'],['re', 'D'],['rei', 'D'],['mi', 'E'],['me', 'E'],
  ['fá', 'F'],['fa', 'F'],['sol', 'G'],['só', 'G'],['lá', 'A'],['la', 'A'],['si', 'B'],['ti', 'B'],
])('%s → %s', (w, s) => expect(wordToStep(w)).toBe(s))

test.each(['o', 'e', 'sola', 'dore', 'solzinho', '', ' '])('%s não vira nota', (w) =>
  expect(wordToStep(w)).toBeNull())

test('textToSteps preserva ordem e repetições', () =>
  expect(textToSteps('Dó dó, ré e mi')).toEqual(['C', 'C', 'D', 'E']))
