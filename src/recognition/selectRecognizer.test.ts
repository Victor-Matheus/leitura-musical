import { describe, expect, test, vi, afterEach } from 'vitest'
import type { MicInput } from '../audio/micInput'
import type { NoteRecognizer } from './types'
import { selectRecognizer } from './selectRecognizer'

const mic = {} as MicInput

function fake(kind: 'local' | 'online', start: () => Promise<void>) {
  return {
    kind,
    status: 'idle',
    start: vi.fn(start),
    stop: vi.fn(),
    onSyllable: () => () => {},
    onStatus: () => () => {},
  } as unknown as NoteRecognizer & { start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn> }
}

afterEach(() => vi.useRealTimers())

describe('selectRecognizer', () => {
  test('modelo em cache e carga ok → local', async () => {
    const local = fake('local', async () => {})
    const online = fake('online', async () => {})
    const r = await selectRecognizer(mic, 5, {
      createLocal: () => local,
      createOnline: () => online,
      isModelCached: async () => true,
    })
    expect(r).toBe(local)
    expect(online.start).not.toHaveBeenCalled()
  })

  test('sem cache → online, sem tentar o local', async () => {
    const createLocal = vi.fn()
    const online = fake('online', async () => {})
    const r = await selectRecognizer(mic, 5, {
      createLocal,
      createOnline: () => online,
      isModelCached: async () => false,
    })
    expect(r).toBe(online)
    expect(createLocal).not.toHaveBeenCalled()
  })

  test('deviceMemory 1 → online', async () => {
    const createLocal = vi.fn()
    const online = fake('online', async () => {})
    const r = await selectRecognizer(mic, 5, {
      createLocal,
      createOnline: () => online,
      isModelCached: async () => true,
      deviceMemory: 1,
    })
    expect(r).toBe(online)
    expect(createLocal).not.toHaveBeenCalled()
  })

  test('local rejeita → online', async () => {
    const local = fake('local', async () => {
      throw new Error('load-failed')
    })
    const online = fake('online', async () => {})
    const r = await selectRecognizer(mic, 5, {
      createLocal: () => local,
      createOnline: () => online,
      isModelCached: async () => true,
    })
    expect(r).toBe(online)
  })

  test('local não fica pronto no timeout → online e local.stop() chamado', async () => {
    vi.useFakeTimers()
    const local = fake('local', () => new Promise<void>(() => {}))
    const online = fake('online', async () => {})
    const p = selectRecognizer(mic, 5, {
      createLocal: () => local,
      createOnline: () => online,
      isModelCached: async () => true,
    })
    await vi.advanceTimersByTimeAsync(5000)
    expect(await p).toBe(online)
    expect(local.stop).toHaveBeenCalled()
  })

  test('online indisponível (null) e local falhou → null', async () => {
    const local = fake('local', async () => {
      throw new Error('load-failed')
    })
    const r = await selectRecognizer(mic, 5, {
      createLocal: () => local,
      createOnline: () => null,
      isModelCached: async () => true,
    })
    expect(r).toBeNull()
  })

  test('online start rejeita → null e online.stop()', async () => {
    const online = fake('online', async () => {
      throw new Error('denied')
    })
    const r = await selectRecognizer(mic, 5, {
      createLocal: vi.fn(),
      createOnline: () => online,
      isModelCached: async () => false,
    })
    expect(r).toBeNull()
    expect(online.stop).toHaveBeenCalled()
  })
})
