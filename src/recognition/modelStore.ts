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

/**
 * URL estável (absoluta, mesma origem) que o worker do vosk-browser baixa.
 *
 * O worker guarda o modelo extraído no IDBFS em "/vosk/" + url.replace(/\W/g, "_")
 * e, antes de baixar, sincroniza o IDBFS e pula o download se encontra
 * "<chave>/extracted.ok". Com uma URL estável o próprio IDBFS do Vosk vira o
 * cache offline: só a primeira carga usa a rede. (Antes passávamos um blob: URL
 * novo a cada lição, e cada lição gravava mais uma cópia de ~30 MB no IDBFS.)
 *
 * A cópia na Cache API continua como marca de "baixado e validado" e esquenta o
 * cache HTTP para o primeiro fetch do worker; logo após o download o modelo é
 * pré-carregado, o que já grava o IDBFS enquanto há rede.
 */
export function getModelUrl(): string {
  return new URL(MODEL_PATH, location.origin).href
}

export const IDBFS_CLEANUP_FLAG = 'vosk-idbfs-cleanup-v1'
/** Banco do IDBFS do vosk-browser: o Emscripten usa o ponto de montagem como nome. */
const VOSK_IDBFS_DB = '/vosk'
let cleanupInFlight: Promise<void> | null = null

function readFlag(): boolean | null {
  try {
    return localStorage.getItem(IDBFS_CLEANUP_FLAG) === 'done'
  } catch {
    return null
  }
}

/**
 * Limpeza única das cópias "/vosk/blob_*" deixadas pela versão que usava blob: URL.
 * Apaga o banco "/vosk" inteiro uma vez (antes de qualquer carga do modelo); a
 * próxima carga baixa de novo pela URL estável. Sem localStorage não dá para
 * lembrar que já limpou, então não limpa (evita rebaixar a cada visita).
 */
export function cleanupStaleVoskStore(): Promise<void> {
  if (readFlag() !== false) return Promise.resolve()
  if (typeof indexedDB === 'undefined') return Promise.resolve()
  cleanupInFlight ??= new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase(VOSK_IDBFS_DB)
    req.onsuccess = () => {
      try {
        localStorage.setItem(IDBFS_CLEANUP_FLAG, 'done')
      } catch {
        /* sem armazenamento: tenta de novo na próxima visita */
      }
      resolve()
    }
    // Erro ou bloqueio (outra aba aberta): segue a carga; tenta de novo depois.
    req.onerror = () => resolve()
    req.onblocked = () => resolve()
  }).finally(() => {
    cleanupInFlight = null
  })
  return cleanupInFlight
}
