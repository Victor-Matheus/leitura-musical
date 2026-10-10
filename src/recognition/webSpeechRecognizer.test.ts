import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { MicInput } from '../audio/micInput'
import type { Step } from '../data/notes'
import { createWebSpeechRecognizer } from './webSpeechRecognizer'

const SR = 16000

function burstsSignal(count: number): Float32Array {
  // [silêncio 0,5 s] + count × [fala 0,2 s, silêncio 0,1 s] + silêncio 0,3 s
  const parts: [number, number][] = [[0.5, 0]]
  for (let k = 0; k < count; k++) parts.push([0.2, 0.3], [0.1, 0])
  parts.push([0.3, 0])
  const total = parts.reduce((n, [s]) => n + Math.round(s * SR), 0)
  const out = new Float32Array(total)
  let i = 0
  for (const [seconds, amp] of parts) {
    const n = Math.round(seconds * SR)
    for (let k = 0; k < n; k++, i++) out[i] = amp * Math.sin((2 * Math.PI * 220 * i) / SR)
  }
  return out
}

class FakeRecognition {
  lang = ''
  continuous = false
  interimResults = false
  start = vi.fn()
  stop = vi.fn()
  abort = vi.fn()
  onresult: ((e: { resultIndex: number; results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } } }) => void) | null = null
  onerror: ((e: { error: string }) => void) | null = null
  onend: (() => void) | null = null

  emit(results: { t: string; final: boolean }[], resultIndex = 0) {
    const list: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } } = {
      length: results.length,
    }
    results.forEach((r, i) => {
      list[i] = { 0: { transcript: r.t }, isFinal: r.final }
    })
    this.onresult?.({ resultIndex, results: list })
  }
}

const instances: FakeRecognition[] = []
let fake: FakeRecognition
let frame: ((s: Float32Array, t: number) => void) | null
let now: number
let mic: MicInput

class Ctor extends FakeRecognition {
  constructor() {
    super()
    instances.push(this)
  }
}

function speak(count: number) {
  frame?.(burstsSignal(count), now)
  now += burstsSignal(count).length / SR
}

async function setup() {
  const r = createWebSpeechRecognizer(mic, { Ctor })
  const steps: Step[] = []
  r.onSyllable((e) => steps.push(e.step))
  await r.start()
  fake = instances[instances.length - 1]
  return { r, steps }
}

beforeEach(() => {
  frame = null
  now = 100
  const context = { get currentTime() { return now } } as unknown as AudioContext
  mic = {
    context,
    sampleRate: SR,
    onFrame(cb) {
      frame = cb
      return () => {
        frame = null
      }
    },
    close() {},
  }
})

afterEach(() => vi.useRealTimers())

describe('createWebSpeechRecognizer', () => {
  test('configura o reconhecedor e é do tipo online', async () => {
    const { r } = await setup()
    expect(r.kind).toBe('online')
    expect(r.status).toBe('ready')
    expect(fake.lang).toBe('pt-BR')
    expect(fake.continuous).toBe(true)
    expect(fake.interimResults).toBe(true)
    expect(fake.start).toHaveBeenCalledTimes(1)
  })

  test('parciais acumulados não reemitem sílabas (regressão do encavalar)', async () => {
    const { steps } = await setup()
    speak(1)
    fake.emit([{ t: 'dó', final: false }])
    speak(1)
    fake.emit([{ t: 'dó ré', final: false }])
    fake.emit([{ t: 'dó ré', final: true }])
    expect(steps).toEqual(['C', 'D'])
  })

  test('nota repetida no mesmo resultado gera duas sílabas', async () => {
    const { steps } = await setup()
    speak(2)
    fake.emit([{ t: 'dó dó', final: false }])
    expect(steps).toEqual(['C', 'C'])
  })

  test('parcial revisado para menos palavras não emite nada novo', async () => {
    const { steps } = await setup()
    speak(2)
    fake.emit([{ t: 'sol lá', final: false }])
    fake.emit([{ t: 'sola', final: true }])
    expect(steps).toEqual(['G', 'A'])
  })

  test('onend reinicia o reconhecimento após 250 ms', async () => {
    vi.useFakeTimers()
    await setup()
    fake.onend?.()
    expect(fake.start).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(249)
    expect(fake.start).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    expect(fake.start).toHaveBeenCalledTimes(2)
  })

  test('reinícios sem resultado esperam o dobro a cada vez, até 4 s', async () => {
    vi.useFakeTimers()
    await setup()
    const delays: number[] = []
    for (let k = 0; k < 5; k++) {
      const before = fake.start.mock.calls.length
      fake.onend?.()
      let waited = 0
      while (fake.start.mock.calls.length === before) {
        vi.advanceTimersByTime(50)
        waited += 50
      }
      delays.push(waited)
    }
    expect(delays).toEqual([250, 500, 1000, 2000, 4000])
  })

  test('5 reinícios seguidos sem resultado (ex.: network) → error/crashed', async () => {
    vi.useFakeTimers()
    const { r } = await setup()
    const seen: [string, string | undefined][] = []
    r.onStatus((s, err) => seen.push([s, err]))
    for (let k = 0; k < 5; k++) {
      fake.onerror?.({ error: 'network' })
      fake.onend?.()
      vi.advanceTimersByTime(4000)
    }
    expect(r.status).toBe('ready')
    fake.onerror?.({ error: 'network' })
    fake.onend?.()
    expect(r.status).toBe('error')
    expect(seen).toContainEqual(['error', 'crashed'])
    expect(frame).toBeNull()
    vi.advanceTimersByTime(10000)
    expect(fake.start).toHaveBeenCalledTimes(6)
  })

  test('um resultado zera a contagem de falhas e a espera', async () => {
    vi.useFakeTimers()
    const { r } = await setup()
    for (let k = 0; k < 4; k++) {
      fake.onend?.()
      vi.advanceTimersByTime(4000)
    }
    fake.emit([{ t: 'dó', final: true }])
    fake.onend?.()
    vi.advanceTimersByTime(250)
    expect(fake.start).toHaveBeenCalledTimes(6)
    for (let k = 0; k < 4; k++) {
      fake.onend?.()
      vi.advanceTimersByTime(4000)
    }
    expect(r.status).toBe('ready')
  })

  test('stop() cancela um reinício agendado', async () => {
    vi.useFakeTimers()
    const { r } = await setup()
    fake.onend?.()
    r.stop()
    vi.advanceTimersByTime(1000)
    expect(fake.start).toHaveBeenCalledTimes(1)
  })

  test('not-allowed vira status error/denied', async () => {
    const { r } = await setup()
    const seen: [string, string | undefined][] = []
    r.onStatus((s, err) => seen.push([s, err]))
    fake.onerror?.({ error: 'not-allowed' })
    expect(r.status).toBe('error')
    expect(seen).toContainEqual(['error', 'denied'])
  })

  test('stop não reinicia no onend', async () => {
    const { r } = await setup()
    r.stop()
    fake.onend?.()
    expect(fake.start).toHaveBeenCalledTimes(1)
    expect(frame).toBeNull()
  })

  test('sem Web Speech, start rejeita com unsupported', async () => {
    const r = createWebSpeechRecognizer(mic, { Ctor: null })
    await expect(r.start()).rejects.toThrow('unsupported')
  })
})
