import { expect, test } from 'vitest'
import type { MicInput } from '../audio/micInput'
import { VOSK_GRAMMAR } from './syllables'
import type { RecognizerStatus, SyllableEvent } from './types'
import { createVoskRecognizer } from './voskRecognizer'
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

test('stop libera recognizer e modelo e para de ouvir o microfone', async () => {
  const { rec, kaldi, listeners, wasTerminated } = await started()
  rec.stop()
  expect(kaldi.removed).toBe(true)
  expect(wasTerminated()).toBe(true)
  expect(listeners.size).toBe(0)
  expect(rec.status).toBe('idle')
})

test('stop() durante o carregamento: o modelo tardio é encerrado e o status nunca vira ready', async () => {
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
  expect(env.wasTerminated()).toBe(true)
  expect(env.kaldis).toHaveLength(0)
  expect(env.listeners.size).toBe(0)
  expect(seen).not.toContain('ready')
  expect(rec.status).toBe('idle')
})

test('KaldiRecognizer lançando: load-failed e model.terminate chamado', async () => {
  const env = setup()
  let terminated = false
  const badModel: VoskModelLike = {
    KaldiRecognizer: class {
      constructor() {
        throw new Error('boom')
      }
    } as unknown as VoskModelLike['KaldiRecognizer'],
    terminate: () => {
      terminated = true
    },
  }
  const rec = createVoskRecognizer(env.mic, { loadModel: async () => badModel })
  await expect(rec.start()).rejects.toThrow('load-failed')
  expect(terminated).toBe(true)
  expect(rec.status).toBe('error')
})
