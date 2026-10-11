import { describe, expect, test } from 'vitest'
import { createOnsetDetector } from './onsetDetector'

function signal(sr: number, parts: [number, number][]): Float32Array {
  const total = parts.reduce((n, [s]) => n + Math.round(s * sr), 0)
  const out = new Float32Array(total)
  let i = 0
  for (const [seconds, amp] of parts) {
    const n = Math.round(seconds * sr)
    for (let k = 0; k < n; k++, i++) out[i] = amp * Math.sin((2 * Math.PI * 220 * i) / sr)
  }
  return out
}

describe('createOnsetDetector', () => {
  test('silêncio → fala → silêncio gera um onset no início da fala', () => {
    const d = createOnsetDetector()
    const out = d.push(signal(16000, [[0.5, 0], [0.3, 0.3], [0.5, 0]]), 100, 16000)
    expect(out).toHaveLength(1)
    expect(Math.abs(out[0] - 100.5)).toBeLessThan(0.02)
  })

  test('rajada de 30 ms não gera onset', () =>
    expect(createOnsetDetector().push(signal(16000, [[0.5, 0], [0.03, 0.5], [0.5, 0]]), 0, 16000)).toEqual([]))

  test('duas falas separadas por 80 ms geram dois onsets', () =>
    expect(
      createOnsetDetector().push(signal(16000, [[0.5, 0], [0.2, 0.3], [0.08, 0], [0.2, 0.3], [0.3, 0]]), 0, 16000),
    ).toHaveLength(2))

  test('onset atravessa a fronteira entre blocos', () => {
    const d = createOnsetDetector()
    const s = signal(16000, [[0.5, 0], [0.3, 0.3], [0.2, 0]])
    const a = d.push(s.subarray(0, 8320), 0, 16000)
    const b = d.push(s.subarray(8320), 0.52, 16000)
    expect([...a, ...b]).toHaveLength(1)
  })
})
