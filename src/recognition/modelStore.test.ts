import { afterEach, expect, test, vi } from 'vitest'
import { MODEL_PATH, downloadModel, getModelUrl, isModelCached } from './modelStore'

afterEach(() => vi.unstubAllGlobals())

function fakeCaches(match: () => Promise<Response | undefined>, put = vi.fn()) {
  vi.stubGlobal('caches', { open: async () => ({ match, put }) } as unknown as CacheStorage)
  return put
}

test('isModelCached consulta o cache', async () => {
  fakeCaches(async () => new Response('x'))
  expect(await isModelCached()).toBe(true)
})

test('isModelCached é falso quando não há entrada', async () => {
  fakeCaches(async () => undefined)
  expect(await isModelCached()).toBe(false)
})

test('downloadModel reporta progresso até 1 e grava no cache', async () => {
  const put = fakeCaches(async () => undefined)
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new Uint8Array([1, 2]))
      c.enqueue(new Uint8Array([3, 4]))
      c.close()
    },
  })
  vi.stubGlobal('fetch', async () => new Response(body, { headers: { 'content-length': '4' } }))
  const progress: number[] = []
  await downloadModel((f) => progress.push(f))
  expect(progress).toEqual([0.5, 1, 1])
  expect(put).toHaveBeenCalledTimes(1)
  expect(put.mock.calls[0][0]).toBe(MODEL_PATH)
})

test('getModelUrl lança se não estiver em cache', async () => {
  fakeCaches(async () => undefined)
  await expect(getModelUrl()).rejects.toThrow()
})
