import { expect, test } from 'vitest'
import { createChunker } from './chunker'

test('chunker agrupa 16 quanta em um bloco com o horário do primeiro', () => {
  const got: [number, number][] = []
  const c = createChunker(2048, (s, t) => got.push([s.length, t]))
  for (let i = 0; i < 17; i++) c.push(new Float32Array(128), 5 + (i * 128) / 16000, 16000)
  expect(got).toEqual([[2048, 5]])
})

test('chunker entrega cópias independentes e mantém o conteúdo', () => {
  const got: Float32Array[] = []
  const c = createChunker(4, (s) => got.push(s))
  c.push(new Float32Array([1, 2]), 0, 4)
  c.push(new Float32Array([3, 4]), 0.5, 4)
  c.push(new Float32Array([5, 6, 7, 8]), 1, 4)
  expect(got.map((g) => Array.from(g))).toEqual([[1, 2, 3, 4], [5, 6, 7, 8]])
})
