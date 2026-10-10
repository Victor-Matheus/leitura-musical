import { afterEach, expect, test, vi } from 'vitest'
import { MIN_MODEL_BYTES, MODEL_PATH, downloadModel, getModelUrl, isModelCached } from './modelStore'

afterEach(() => vi.unstubAllGlobals())

/** Bytes que passam pela validação: assinatura gzip e tamanho mínimo. */
function gzipBytes(size = MIN_MODEL_BYTES): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(size)
  b[0] = 0x1f
  b[1] = 0x8b
  return b
}

function fakeCaches(match: () => Promise<Response | undefined>) {
  const put = vi.fn()
  const del = vi.fn(async () => true)
  vi.stubGlobal('caches', { open: async () => ({ match, put, delete: del }) } as unknown as CacheStorage)
  return { put, del }
}

function streamOf(bytes: Uint8Array<ArrayBuffer>, chunks = 2) {
  const step = Math.ceil(bytes.length / chunks)
  return new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < bytes.length; i += step) c.enqueue(bytes.slice(i, i + step))
      c.close()
    },
  })
}

test('isModelCached é verdadeiro para um modelo válido', async () => {
  const { del } = fakeCaches(async () => new Response(gzipBytes()))
  expect(await isModelCached()).toBe(true)
  expect(del).not.toHaveBeenCalled()
})

test('isModelCached é falso quando não há entrada', async () => {
  fakeCaches(async () => undefined)
  expect(await isModelCached()).toBe(false)
})

test('isModelCached apaga uma entrada inválida (index.html) e responde falso', async () => {
  const { del } = fakeCaches(
    async () => new Response('<!doctype html>', { headers: { 'content-type': 'text/html' } }),
  )
  expect(await isModelCached()).toBe(false)
  expect(del).toHaveBeenCalledWith(MODEL_PATH)
})

test('isModelCached apaga uma entrada sem assinatura gzip', async () => {
  const { del } = fakeCaches(async () => new Response(new Uint8Array(MIN_MODEL_BYTES)))
  expect(await isModelCached()).toBe(false)
  expect(del).toHaveBeenCalledWith(MODEL_PATH)
})

test('downloadModel reporta progresso até 1 e grava no cache', async () => {
  const { put } = fakeCaches(async () => undefined)
  const bytes = gzipBytes()
  vi.stubGlobal(
    'fetch',
    async () => new Response(streamOf(bytes), { headers: { 'content-length': String(bytes.length) } }),
  )
  const progress: number[] = []
  await downloadModel((f) => progress.push(f))
  expect(progress).toEqual([0.5, 1, 1])
  expect(put).toHaveBeenCalledTimes(1)
  expect(put.mock.calls[0][0]).toBe(MODEL_PATH)
})

test('downloadModel recusa text/html (rewrite da SPA) e não grava', async () => {
  const { put } = fakeCaches(async () => undefined)
  vi.stubGlobal(
    'fetch',
    async () => new Response(gzipBytes(), { headers: { 'content-type': 'text/html; charset=utf-8' } }),
  )
  await expect(downloadModel(() => {})).rejects.toThrow('inválido')
  expect(put).not.toHaveBeenCalled()
})

test('downloadModel recusa conteúdo sem a assinatura gzip', async () => {
  const { put } = fakeCaches(async () => undefined)
  vi.stubGlobal('fetch', async () => new Response(new Uint8Array(MIN_MODEL_BYTES)))
  await expect(downloadModel(() => {})).rejects.toThrow('inválido')
  expect(put).not.toHaveBeenCalled()
})

test('downloadModel recusa arquivo menor que 5 MB', async () => {
  const { put } = fakeCaches(async () => undefined)
  vi.stubGlobal('fetch', async () => new Response(gzipBytes(1024)))
  await expect(downloadModel(() => {})).rejects.toThrow('inválido')
  expect(put).not.toHaveBeenCalled()
})

test('getModelUrl lança se não estiver em cache', async () => {
  fakeCaches(async () => undefined)
  await expect(getModelUrl()).rejects.toThrow()
})
