export const MODEL_PATH = '/models/vosk-pt-small.tar.gz'
const CACHE_NAME = 'leitura-musical-models-v1'

export async function isModelCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  const cache = await caches.open(CACHE_NAME)
  return !!(await cache.match(MODEL_PATH))
}

export async function downloadModel(onProgress: (fraction: number) => void): Promise<void> {
  const res = await fetch(MODEL_PATH)
  if (!res.ok) throw new Error(`Falha ao baixar o modelo (${res.status})`)
  const total = Number(res.headers.get('content-length')) || 0
  let body: Blob
  if (res.body && total > 0) {
    const reader = res.body.getReader()
    const parts: Uint8Array<ArrayBuffer>[] = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      parts.push(value as Uint8Array<ArrayBuffer>)
      received += value.length
      onProgress(Math.min(1, received / total))
    }
    body = new Blob(parts, { type: 'application/gzip' })
  } else {
    body = await res.blob()
  }
  const cache = await caches.open(CACHE_NAME)
  await cache.put(MODEL_PATH, new Response(body, { headers: { 'content-type': 'application/gzip' } }))
  onProgress(1)
}

/** blob: URL do modelo em cache; lança se ainda não foi baixado. */
export async function getModelUrl(): Promise<string> {
  const cache = await caches.open(CACHE_NAME)
  const res = await cache.match(MODEL_PATH)
  if (!res) throw new Error('Modelo de voz não está em cache')
  return URL.createObjectURL(await res.blob())
}
