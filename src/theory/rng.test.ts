import { expect, test } from 'vitest'
import { mulberry32, pick, shuffle } from './rng'

test('mulberry32 é determinístico e fica em [0,1)', () => {
  const a = mulberry32(42)
  const b = mulberry32(42)
  const xs = Array.from({ length: 20 }, () => a())
  const ys = Array.from({ length: 20 }, () => b())
  expect(xs).toEqual(ys)
  for (const x of xs) {
    expect(x).toBeGreaterThanOrEqual(0)
    expect(x).toBeLessThan(1)
  }
  expect(new Set(xs).size).toBeGreaterThan(1)
})

test('shuffle não muta e preserva os elementos', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8]
  const copy = [...xs]
  const out = shuffle(mulberry32(7), xs)
  expect(xs).toEqual(copy)
  expect(out).not.toBe(xs)
  expect([...out].sort((x, y) => x - y)).toEqual(copy)
})

test('pick devolve um elemento da lista', () => {
  const rng = mulberry32(1)
  const xs = ['a', 'b', 'c'] as const
  for (let i = 0; i < 20; i++) expect(xs).toContain(pick(rng, xs))
})
