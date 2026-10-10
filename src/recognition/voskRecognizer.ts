import type { MicInput } from '../audio/micInput'
import { createAligner } from './aligner'
import { cleanupStaleVoskStore, getModelUrl } from './modelStore'
import { createOnsetDetector } from './onsetDetector'
import { textToSteps, VOSK_GRAMMAR } from './syllables'
import type { NoteRecognizer, RecognizerError, RecognizerStatus, SyllableEvent } from './types'

/** Escala aplicada às amostras antes do Vosk. Usar 32768 se o Kaldi não reconhecer floats em [-1, 1]. */
export const SAMPLE_SCALE = 1

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

export interface FinalWord {
  word: string
  start: number
  end: number
  conf: number
}

export interface VoskRecognizerDeps {
  loadModel?: () => Promise<VoskModelLike>
  onFinalWords?: (words: FinalWord[], streamStart: number) => void
}

async function defaultLoadModel(): Promise<VoskModelLike> {
  await cleanupStaleVoskStore()
  const { createModel } = await import('vosk-browser')
  return (await createModel(getModelUrl())) as unknown as VoskModelLike
}

export function createVoskRecognizer(mic: MicInput, deps: VoskRecognizerDeps = {}): NoteRecognizer {
  const loadModel = deps.loadModel ?? defaultLoadModel
  const syllableListeners = new Set<(e: SyllableEvent) => void>()
  const statusListeners = new Set<(s: RecognizerStatus, err?: RecognizerError) => void>()
  const detector = createOnsetDetector()
  const aligner = createAligner()

  let status: RecognizerStatus = 'idle'
  let model: VoskModelLike | null = null
  let kaldi: VoskRecognizerLike | null = null
  let unsubscribeFrames: (() => void) | null = null
  let streamStart: number | null = null
  let emittedInUtterance = 0
  let generation = 0

  function setStatus(s: RecognizerStatus, err?: RecognizerError) {
    status = s
    statusListeners.forEach((cb) => cb(s, err))
  }

  function emitFrom(text: string) {
    const steps = textToSteps(text)
    for (const step of steps.slice(emittedInUtterance)) {
      const event = aligner.pushStep(step, mic.context.currentTime)
      if (event) syllableListeners.forEach((cb) => cb(event))
    }
    emittedInUtterance = Math.max(emittedInUtterance, steps.length)
  }

  function release() {
    unsubscribeFrames?.()
    unsubscribeFrames = null
    kaldi?.remove()
    kaldi = null
    model?.terminate()
    model = null
  }

  return {
    kind: 'local',
    get status() {
      return status
    },
    async start() {
      // Cada stop() invalida o start() em andamento. Se isso ocorrer durante o
      // carregamento, o modelo tardio é encerrado e start() rejeita 'load-failed'
      // sem alterar o status (que já voltou a 'idle').
      const myGeneration = ++generation
      const stopped = () => myGeneration !== generation
      setStatus('loading')
      let loaded: VoskModelLike
      try {
        loaded = await loadModel()
      } catch {
        if (!stopped()) setStatus('error', 'load-failed')
        throw new Error('load-failed')
      }
      if (stopped()) {
        loaded.terminate()
        throw new Error('load-failed')
      }
      model = loaded
      try {
        const recognizer = new loaded.KaldiRecognizer(mic.sampleRate, JSON.stringify(VOSK_GRAMMAR))
        kaldi = recognizer
        recognizer.setWords(true)
        recognizer.on('partialresult', (m) => {
          if (kaldi === recognizer) emitFrom(m.result.partial)
        })
        recognizer.on('result', (m) => {
          if (kaldi !== recognizer) return
          emitFrom(m.result.text)
          deps.onFinalWords?.(m.result.result ?? [], streamStart ?? 0)
          emittedInUtterance = 0
        })
        recognizer.on('error', () => {
          if (kaldi === recognizer && status === 'ready') setStatus('error', 'crashed')
        })
        unsubscribeFrames = mic.onFrame((samples, startTime) => {
          streamStart ??= startTime
          for (const t of detector.push(samples, startTime, mic.sampleRate)) aligner.pushOnset(t)
          const buf = SAMPLE_SCALE === 1 ? samples : samples.map((v) => v * SAMPLE_SCALE)
          recognizer.acceptWaveformFloat(buf, mic.sampleRate)
        })
      } catch {
        release()
        setStatus('error', 'load-failed')
        throw new Error('load-failed')
      }
      setStatus('ready')
    },
    stop() {
      generation++
      release()
      detector.reset()
      aligner.reset()
      streamStart = null
      emittedInUtterance = 0
      if (status !== 'idle') setStatus('idle')
    },
    onSyllable(cb) {
      syllableListeners.add(cb)
      return () => syllableListeners.delete(cb)
    },
    onStatus(cb) {
      statusListeners.add(cb)
      return () => statusListeners.delete(cb)
    },
  }
}
