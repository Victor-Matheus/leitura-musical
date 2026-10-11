import { expect, test } from 'vitest'
import { noteBeats } from '../../data/notes'
import { mulberry32 } from '../rng'
import type { Question } from '../types'
import { checkQuestionInvariants, expectAnswerPositionsVary } from './assertions'
import { measureFill } from './measureFill'

const FIGURE_BEATS: Record<string, number> = {
  semibreve: 4,
  mínima: 2,
  semínima: 1,
  colcheia: 0.5,
  'mínima pontuada': 3,
  'semínima pontuada': 1.5,
}

function shownBeats(q: Question): number {
  return q.score!.elements.reduce((sum, el) => {
    if (el.kind === 'note') return sum + noteBeats(el.note)
    if (el.kind === 'rest') return sum + noteBeats(el)
    return sum
  }, 0)
}

const SIGNATURES = [
  ['2/4', 2],
  ['3/4', 3],
  ['4/4', 4],
] as const

test.each(SIGNATURES)('%s: 200 sementes respeitam as invariantes', (timeSignature) => {
  for (let seed = 1; seed <= 200; seed++) checkQuestionInvariants(measureFill({ timeSignature }, mulberry32(seed)))
})

test.each(SIGNATURES)('%s: a posição da resposta varia', (timeSignature) => {
  expectAnswerPositionsVary(measureFill, { timeSignature }, 50)
})

test.each(SIGNATURES)('%s: só a resposta completa o compasso; faltam de ½ a 2 tempos', (timeSignature, total) => {
  for (let seed = 1; seed <= 200; seed++) {
    const q = measureFill({ timeSignature }, mulberry32(seed))
    expect(q.score!.timeSignature).toBe(timeSignature)
    const shown = shownBeats(q)
    const missing = total - shown
    expect(missing).toBeGreaterThanOrEqual(0.5)
    expect(missing).toBeLessThanOrEqual(2)
    expect(shown).toBeGreaterThan(0)
    for (const o of q.options) expect(FIGURE_BEATS[o]).toBeDefined()
    expect(shown + FIGURE_BEATS[q.options[q.answer]]).toBe(total)
    q.options.forEach((o, i) => {
      if (i !== q.answer) expect(shown + FIGURE_BEATS[o]).not.toBe(total)
    })
  }
})

test('snapshot com mulberry32(1)', () => {
  expect(measureFill({ timeSignature: '3/4' }, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 1,
      "explanation": "O compasso 3/4 tem 3 tempos. As figuras mostradas somam 1½ tempos. Faltam 1½ tempos, que é o valor da semínima pontuada.",
      "options": [
        "semibreve",
        "semínima pontuada",
        "mínima",
        "colcheia",
      ],
      "prompt": "Qual figura completa este compasso de 3/4?",
      "score": {
        "clef": "treble",
        "elements": [
          {
            "kind": "note",
            "note": {
              "duration": "q",
              "octave": 4,
              "step": "B",
            },
          },
          {
            "kind": "note",
            "note": {
              "duration": "8",
              "octave": 5,
              "step": "D",
            },
          },
        ],
        "timeSignature": "3/4",
      },
    }
  `)
})
