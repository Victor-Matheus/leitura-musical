export const MODEL_PATH = '/models/vosk-pt-small.tar.gz'
const CACHE_NAME = 'leitura-musical-models-v1'
/** O modelo real tem ~30 MB; qualquer coisa abaixo disso não é o tar.gz. */
export const MIN_MODEL_BYTES = 5 * 1024 * 1024

/**
 * Valida que a resposta é mesmo o tar.gz do modelo. Com o rewrite de SPA, um
 * arquivo ausente volta como index.html com status 200: por isso recusamos
 * text/html, exigimos a assinatura gzip (1f 8b) e um tamanho mínimo.
 */
async function isValidModel(body: Blob, contentType: string | null): Promise<boolean> {
  if (contentType?.toLowerCase().includes('text/html')) return false
  if (body.size < MIN_MODEL_BYTES) return false
  const magic = new Uint8Array(await body.slice(0, 2).arrayBuffer())
  return magic[0] === 0x1f && magic[1] === 0x8b
}

/**
 * Verdadeiro quando há um modelo válido baixado. Uma entrada inválida no cache
 * (ex.: index.html gravado por uma versão anterior) é apagada.
 */
export async function isModelCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false
  const cache = await caches.open(CACHE_NAME)
  const res = await cache.match(MODEL_PATH)
  if (!res) return false
  if (await isValidModel(await res.blob(), res.headers.get('content-type'))) return true
  await cache.delete(MODEL_PATH)
  return false
}

export async function downloadModel(onProgress: (fraction: number) => void): Promise<void> {
  const res = await fetch(MODEL_PATH)
  if (!res.ok) throw new Error(`Falha ao baixar o modelo (${res.status})`)
  const contentType = res.headers.get('content-type')
  if (contentType?.toLowerCase().includes('text/html')) throw new Error('Modelo de voz inválido')
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
  if (!(await isValidModel(body, contentType))) throw new Error('Modelo de voz inválido')
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
