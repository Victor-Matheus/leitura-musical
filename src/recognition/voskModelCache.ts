import { cleanupStaleVoskStore, getModelUrl } from './modelStore'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface VoskRecognizerLike {
  on(event: 'result' | 'partialresult' | 'error', cb: (m: any) => void): void
  setWords(v: boolean): void
  acceptWaveformFloat(buf: Float32Array, sampleRate: number): void
  remove(): void
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface VoskModelLike {
  KaldiRecognizer: new (sampleRate: number, grammar?: string) => VoskRecognizerLike
  terminate(): void
}

/** O Model do vosk-browser antes de carregar: eventos 'load' e 'error' do worker. */
export interface LoadingVoskModel extends VoskModelLike {
  on(event: 'load' | 'error', cb: (m: { result?: boolean; error?: string }) => void): void
}

export type VoskModelCtor = new (url: string) => LoadingVoskModel

/**
 * Encerra o worker do modelo. O Model.terminate() do vosk-browser só manda a
 * mensagem 'terminate', e o worker então chama this.model.delete(): se o modelo
 * nunca carregou, isso lança antes do close() e o worker fica vivo. Por isso
 * matamos o Worker direto pelo campo privado `worker` (cast tipado). Fakes de
 * teste sem esse campo caem no terminate() público.
 */
export function killModel(model: VoskModelLike): void {
  const worker = (model as unknown as { worker?: { terminate(): void } }).worker
  if (worker) worker.terminate()
  else model.terminate()
}

/**
 * Cria o Model e espera o worker responder. O createModel() do vosk-browser só
 * escuta 'load' e nunca rejeita (erros chegam como event:'error'); aqui 'error'
 * ou load:false rejeitam 'load-failed' e o worker é encerrado.
 */
export function openVoskModel(url: string, Model: VoskModelCtor): Promise<VoskModelLike> {
  return new Promise<VoskModelLike>((resolve, reject) => {
    let settled = false
    const fail = () => {
      if (settled) return
      settled = true
      killModel(model)
      reject(new Error('load-failed'))
    }
    const model = new Model(url)
    model.on('load', (m) => {
      if (settled) return
      if (!m.result) return fail()
      settled = true
      resolve(model)
    })
    model.on('error', fail)
  })
}

async function defaultOpen(): Promise<VoskModelLike> {
  // A limpeza do IDBFS antigo precisa terminar antes de o worker abrir o banco.
  await cleanupStaleVoskStore()
  const { Model } = await import('vosk-browser')
  return openVoskModel(getModelUrl(), Model as unknown as VoskModelCtor)
}

export interface WarmModelCache {
  /** O modelo da página; carrega na primeira chamada e reaproveita depois. */
  getWarmModel(): Promise<VoskModelLike>
  /** Começa a carregar em segundo plano, sem esperar nem propagar erro. */
  preloadModel(): void
  /** Encerra o modelo (ex.: após uma queda); a próxima chamada carrega de novo. */
  disposeModel(): void
}

/**
 * Um único modelo aquecido por página: cada lição cria só um KaldiRecognizer.
 * Uma carga que falha limpa o singleton para que a próxima tentativa recomece.
 */
export function createWarmModelCache(open: () => Promise<VoskModelLike> = defaultOpen): WarmModelCache {
  let warm: Promise<VoskModelLike> | null = null

  function getWarmModel() {
    if (!warm) {
      const attempt: Promise<VoskModelLike> = open().catch((err: unknown) => {
        if (warm === attempt) warm = null
        throw err
      })
      warm = attempt
    }
    return warm
  }

  return {
    getWarmModel,
    preloadModel() {
      getWarmModel().catch(() => {})
    },
    disposeModel() {
      const current = warm
      warm = null
      current?.then(killModel, () => {})
    },
  }
}

const pageCache = createWarmModelCache()
export const getWarmModel = pageCache.getWarmModel
export const preloadModel = pageCache.preloadModel
export const disposeModel = pageCache.disposeModel
