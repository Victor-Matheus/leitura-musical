// Verificações compartilhadas pelos testes dos geradores

import { expect } from 'vitest'
import { mulberry32 } from '../rng'
import type { Generator, Question } from '../types'

/** 3 a 4 opções distintas, resposta válida, prompt e explicação não vazios */
export function checkQuestionInvariants(q: Question): void {
  expect(q.options.length).toBeGreaterThanOrEqual(3)
  expect(q.options.length).toBeLessThanOrEqual(4)
  expect(new Set(q.options).size).toBe(q.options.length)
  for (const o of q.options) expect(o.trim()).not.toBe('')
  expect(Number.isInteger(q.answer)).toBe(true)
  expect(q.answer).toBeGreaterThanOrEqual(0)
  expect(q.answer).toBeLessThan(q.options.length)
  expect(q.prompt.trim()).not.toBe('')
  expect(q.explanation.trim()).not.toBe('')
}

/** Gera n perguntas (sementes 1..n) e exige pelo menos 3 posições diferentes para a resposta */
export function expectAnswerPositionsVary(gen: Generator, params: Record<string, unknown>, n: number): void {
  const positions = new Set<number>()
  for (let seed = 1; seed <= n; seed++) positions.add(gen(params, mulberry32(seed)).answer)
  expect(positions.size).toBeGreaterThanOrEqual(3)
}
