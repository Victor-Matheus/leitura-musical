import { afterEach, expect, test, vi } from 'vitest'
import { IDBFS_CLEANUP_FLAG, MODEL_PATH } from './modelStore'

const created: string[] = []
const order: string[] = []

vi.mock('vosk-browser', () => ({
  Model: class {
    worker = { terminate: () => {} }
    constructor(url: string) {
      created.push(url)
      order.push('model')
    }
    on(event: string, cb: (m: { result?: boolean }) => void) {
      if (event === 'load') queueMicrotask(() => cb({ result: true }))
    }
  },
}))

afterEach(() => vi.unstubAllGlobals())

test('o modelo da página recebe a URL estável, depois da limpeza do IDBFS antigo', async () => {
  localStorage.removeItem(IDBFS_CLEANUP_FLAG)
  vi.stubGlobal('indexedDB', {
    deleteDatabase: () => {
      order.push('cleanup')
      const req = {} as IDBOpenDBRequest
      queueMicrotask(() => req.onsuccess?.(new Event('success')))
      return req
    },
  })
  const { getWarmModel } = await import('./voskModelCache')
  await getWarmModel()
  await getWarmModel()
  expect(created).toEqual([`${location.origin}${MODEL_PATH}`])
  expect(order).toEqual(['cleanup', 'model'])
})
