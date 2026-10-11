import { describe, expect, test } from 'vitest'
import { mulberry32 } from '../rng'
import { checkQuestionInvariants, expectAnswerPositionsVary } from './assertions'
import { concept } from './concept'
import { CONCEPT_BANKS } from './conceptBanks'

const BANKS = ['properties', 'dynamics'] as const

describe.each(BANKS)('concept (%s)', (bank) => {
  test('200 sementes respeitam as invariantes', () => {
    for (let seed = 1; seed <= 200; seed++) checkQuestionInvariants(concept({ bank }, mulberry32(seed)))
  })

  test('a posição da resposta varia', () => {
    expectAnswerPositionsVary(concept, { bank }, 50)
  })

  test('a resposta é a correta do item do banco', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const q = concept({ bank }, mulberry32(seed))
      const item = CONCEPT_BANKS[bank].find((i) => i.prompt === q.prompt)
      expect(item).toBeDefined()
      expect(q.options[q.answer]).toBe(item!.correct)
      expect(q.explanation).toBe(item!.explanation)
    }
  })

  test('banco tem pelo menos 12 itens, sem prompts duplicados, 3 distratores distintos', () => {
    const items = CONCEPT_BANKS[bank]
    expect(items.length).toBeGreaterThanOrEqual(12)
    expect(new Set(items.map((i) => i.prompt)).size).toBe(items.length)
    for (const i of items) {
      expect(i.distractors).toHaveLength(3)
      expect(new Set([i.correct, ...i.distractors]).size).toBe(4)
    }
  })
})

test('snapshot com mulberry32(1)', () => {
  expect(concept({ bank: 'properties' }, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 3,
      "explanation": "Agudo é o som fino. O som grosso é chamado de grave.",
      "options": [
        "Sempre mais longo que os outros",
        "Sempre mais forte que os outros",
        "Grosso, como um trovão",
        "Fino, como o canto de um passarinho",
      ],
      "prompt": "Como é um som agudo?",
    }
  `)
  expect(concept({ bank: 'dynamics' }, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 3,
      "explanation": "O ângulo se fecha como o som que vai diminuindo.",
      "options": [
        "Ponto de aumento",
        "Pianíssimo",
        "Crescendo",
        "Diminuendo",
      ],
      "prompt": "Um sinal em forma de ângulo que vai se fechando, embaixo das notas, significa...",
    }
  `)
})
