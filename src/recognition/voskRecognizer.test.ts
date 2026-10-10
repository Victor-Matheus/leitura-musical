import { expect, test, vi } from 'vitest'
import type { MicInput } from '../audio/micInput'
import { VOSK_GRAMMAR } from './syllables'
import type { RecognizerStatus, SyllableEvent } from './types'
import { createVoskRecognizer } from './voskRecognizer'
import { createWarmModelCache, openVoskModel } from './voskModelCache'
import type { FinalWord, VoskModelLike, VoskRecognizerLike } from './voskRecognizer'

const RATE = 16000

class FakeKaldi implements VoskRecognizerLike {
  handlers: Record<string, (m: unknown) => void> = {}
  waveforms: Float32Array[] = []
  words = false
  removed = false
  on(event: string, cb: (m: unknown) => void) {
    this.handlers[event] = cb
  }
  setWords(v: boolean) {
    this.words = v
  }
  acceptWaveformFloat(buf: Float32Array) {
    this.waveforms.push(buf)
  }
  remove() {
    this.removed = true
  }
  partial(partial: string) {
    this.handlers.partialresult({ result: { partial } })
  }
  final(text: string, words: FinalWord[] = []) {
    this.handlers.result({ result: { result: words, text } })
  }
}

function setup() {
  const kaldis: FakeKaldi[] = []
  const kaldiArgs: unknown[][] = []
  let terminated = false
  const model: VoskModelLike = {
    KaldiRecognizer: class extends FakeKaldi {
      constructor(...args: unknown[]) {
        super()
        kaldiArgs.push(args)
        kaldis.push(this)
      }
    },
    terminate() {
      terminated = true
    },
  }
  const listeners = new Set<(s: Float32Array, t: number) => void>()
  const mic = {
    context: { currentTime: 3 },
    sampleRate: RATE,
    onFrame(cb: (s: Float32Array, t: number) => void) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    close() {},
  } as unknown as MicInput
  const frame = (amp: number, t: number, seconds = 0.1) => {
    const buf = new Float32Array(Math.round(seconds * RATE)).fill(amp)
    listeners.forEach((cb) => cb(buf, t))
  }
  /** Uma sílaba falada: rajada alta seguida de silêncio. */
  const burst = (t: number) => {
    frame(0.5, t)
    frame(0, t + 0.1)
  }
  return { model, kaldis, kaldiArgs, mic, listeners, frame, burst, wasTerminated: () => terminated }
}

async function started(onFinalWords?: (w: FinalWord[], s: number) => void) {
  const env = setup()
  const rec = createVoskRecognizer(env.mic, { loadModel: async () => env.model, onFinalWords })
  const steps: string[] = []
  const events: SyllableEvent[] = []
  rec.onSyllable((e) => {
    steps.push(e.step)
    events.push(e)
  })
  await rec.start()
  return { ...env, rec, steps, events, kaldi: env.kaldis[0] }
}

test('parciais crescentes emitem só as sílabas novas', async () => {
  const { kaldi, burst, steps } = await started()
  burst(1)
  burst(2)
  kaldi.partial('dó')
  kaldi.partial('dó ré')
  kaldi.final('dó ré')
  expect(steps).toEqual(['C', 'D'])
})

test('após result, a próxima fala recomeça a contagem', async () => {
  const { kaldi, burst, steps } = await started()
  burst(1)
  kaldi.final('dó')
  burst(2)
  kaldi.partial('dó')
  expect(steps).toEqual(['C', 'C'])
})

test('result emite só o que faltou e ignora [unk]', async () => {
  const { kaldi, burst, steps } = await started()
  burst(1)
  burst(2)
  kaldi.partial('dó')
  kaldi.final('dó [unk] mi')
  expect(steps).toEqual(['C', 'E'])
})

test('o onset do evento vem do detector e arrivedAt do relógio do áudio', async () => {
  const { kaldi, burst, events } = await started()
  burst(1)
  kaldi.partial('dó')
  expect(events).toHaveLength(1)
  expect(events[0].onset).toBeCloseTo(1, 1)
  expect(events[0].arrivedAt).toBe(3)
})

test('gramática restrita é passada ao recognizer', async () => {
  const { kaldiArgs, kaldi } = await started()
  expect(kaldiArgs[0][0]).toBe(RATE)
  expect(kaldiArgs[0][1]).toBe(JSON.stringify(VOSK_GRAMMAR))
  expect(kaldi.words).toBe(true)
})

test('frames são enviados ao Vosk', async () => {
  const { kaldi, frame } = await started()
  frame(0.1, 1)
  expect(kaldi.waveforms).toHaveLength(1)
})

test('status passa por loading e ready', async () => {
  const env = setup()
  const rec = createVoskRecognizer(env.mic, { loadModel: async () => env.model })
  const seen: RecognizerStatus[] = []
  rec.onStatus((s) => seen.push(s))
  await rec.start()
  expect(seen).toEqual(['loading', 'ready'])
  expect(rec.kind).toBe('local')
})

test('falha ao carregar rejeita load-failed', async () => {
  const env = setup()
  const rec = createVoskRecognizer(env.mic, {
    loadModel: async () => {
      throw new Error('boom')
    },
  })
  await expect(rec.start()).rejects.toThrow('load-failed')
  expect(rec.status).toBe('error')
})

test('onFinalWords recebe as palavras com streamStart', async () => {
  const calls: Array<[FinalWord[], number]> = []
  const { kaldi, frame } = await started((w, s) => calls.push([w, s]))
  frame(0.1, 3.5)
  frame(0.1, 3.6)
  const words = [{ word: 'dó', start: 0.1, end: 0.4, conf: 1 }]
  kaldi.final('dó', words)
  expect(calls).toEqual([[words, 3.5]])
})

test('erro do recognizer após ready vira status error/crashed', async () => {
  const { kaldi, rec } = await started()
  const seen: Array<[RecognizerStatus, string | undefined]> = []
  rec.onStatus((s, e) => seen.push([s, e]))
  kaldi.handlers.error({ error: 'x' })
  expect(seen).toEqual([['error', 'crashed']])
})

test('stop libera o recognizer, mantém o modelo compartilhado e para de ouvir o microfone', async () => {
  const { rec, kaldi, listeners, wasTerminated } = await started()
  rec.stop()
  expect(kaldi.removed).toBe(true)
  expect(wasTerminated()).toBe(false)
  expect(listeners.size).toBe(0)
  expect(rec.status).toBe('idle')
})

test('stop() durante o carregamento: o modelo compartilhado segue vivo e o status nunca vira ready', async () => {
  const env = setup()
  let resolveModel!: (m: VoskModelLike) => void
  const rec = createVoskRecognizer(env.mic, {
    loadModel: () => new Promise<VoskModelLike>((r) => (resolveModel = r)),
  })
  const seen: RecognizerStatus[] = []
  rec.onStatus((s) => seen.push(s))
  const pending = rec.start()
  rec.stop()
  resolveModel(env.model)
  await expect(pending).rejects.toThrow('load-failed')
  expect(env.wasTerminated()).toBe(false)
  expect(env.kaldis).toHaveLength(0)
  expect(env.listeners.size).toBe(0)
  expect(seen).not.toContain('ready')
  expect(rec.status).toBe('idle')
})

test('KaldiRecognizer lançando: load-failed e o modelo compartilhado é descartado', async () => {
  const env = setup()
  const badModel: VoskModelLike = {
    KaldiRecognizer: class {
      constructor() {
        throw new Error('boom')
      }
    } as unknown as VoskModelLike['KaldiRecognizer'],
    terminate: () => {},
  }
  const discardModel = vi.fn()
  const rec = createVoskRecognizer(env.mic, { loadModel: async () => badModel, discardModel })
  await expect(rec.start()).rejects.toThrow('load-failed')
  expect(discardModel).toHaveBeenCalledTimes(1)
  expect(rec.status).toBe('error')
})

/** Model falso no formato do vosk-browser: eventos do worker e campo privado `worker`. */
class FakeLoadingModel {
  static instances: FakeLoadingModel[] = []
  handlers: Record<string, (m: { result?: boolean; error?: string }) => void> = {}
  worker = { terminate: vi.fn() }
  terminate = vi.fn()
  kaldis: FakeKaldi[] = []
  KaldiRecognizer: VoskModelLike['KaldiRecognizer']
  url: string
  constructor(url: string) {
    this.url = url
    FakeLoadingModel.instances.push(this)
    const kaldis = this.kaldis
    this.KaldiRecognizer = class extends FakeKaldi {
      constructor() {
        super()
        kaldis.push(this)
      }
    }
  }
  on(event: string, cb: (m: { result?: boolean; error?: string }) => void) {
    this.handlers[event] = cb
  }
}

function realisticCache() {
  FakeLoadingModel.instances = []
  return createWarmModelCache(() => openVoskModel('https://app.test/models/m.tar.gz', FakeLoadingModel))
}

test('worker emite error: start() rejeita load-failed e o Worker é encerrado', async () => {
  const env = setup()
  const cache = realisticCache()
  const rec = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel, discardModel: cache.disposeModel })
  const pending = rec.start()
  await Promise.resolve()
  FakeLoadingModel.instances[0].handlers.error({ error: 'fetch failed' })
  await expect(pending).rejects.toThrow('load-failed')
  expect(rec.status).toBe('error')
  expect(FakeLoadingModel.instances[0].worker.terminate).toHaveBeenCalledTimes(1)
})

test('worker responde load:false: start() rejeita load-failed e o Worker é encerrado', async () => {
  const env = setup()
  const cache = realisticCache()
  const rec = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel, discardModel: cache.disposeModel })
  const pending = rec.start()
  await Promise.resolve()
  FakeLoadingModel.instances[0].handlers.load({ result: false })
  await expect(pending).rejects.toThrow('load-failed')
  expect(FakeLoadingModel.instances[0].worker.terminate).toHaveBeenCalledTimes(1)
})

test('dois reconhecedores compartilham uma única carga do modelo', async () => {
  const env = setup()
  const cache = realisticCache()
  const a = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel, discardModel: cache.disposeModel })
  const b = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel, discardModel: cache.disposeModel })
  const pa = a.start()
  const pb = b.start()
  await Promise.resolve()
  expect(FakeLoadingModel.instances).toHaveLength(1)
  FakeLoadingModel.instances[0].handlers.load({ result: true })
  await Promise.all([pa, pb])
  a.stop()
  const c = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel, discardModel: cache.disposeModel })
  await c.start()
  const model = FakeLoadingModel.instances[0]
  expect(FakeLoadingModel.instances).toHaveLength(1)
  expect(model.kaldis).toHaveLength(3)
  expect(model.kaldis[0].removed).toBe(true)
  expect(model.worker.terminate).not.toHaveBeenCalled()
  expect(model.terminate).not.toHaveBeenCalled()
})

test('carga que falha limpa o singleton e a próxima tentativa carrega de novo', async () => {
  const env = setup()
  const cache = realisticCache()
  const first = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel })
  const p1 = first.start()
  await Promise.resolve()
  FakeLoadingModel.instances[0].handlers.error({ error: 'x' })
  await expect(p1).rejects.toThrow('load-failed')
  const second = createVoskRecognizer(env.mic, { loadModel: cache.getWarmModel })
  const p2 = second.start()
  await Promise.resolve()
  expect(FakeLoadingModel.instances).toHaveLength(2)
  FakeLoadingModel.instances[1].handlers.load({ result: true })
  await p2
  expect(second.status).toBe('ready')
})
