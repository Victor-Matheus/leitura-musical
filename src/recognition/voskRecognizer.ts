import type { MicInput } from '../audio/micInput'
import { createAligner } from './aligner'
import { createOnsetDetector } from './onsetDetector'
import { textToSteps, VOSK_GRAMMAR } from './syllables'
import type { NoteRecognizer, RecognizerError, RecognizerStatus, SyllableEvent } from './types'
import { disposeModel, getWarmModel } from './voskModelCache'
import type { VoskModelLike, VoskRecognizerLike } from './voskModelCache'

/** Escala aplicada às amostras antes do Vosk. Usar 32768 se o Kaldi não reconhecer floats em [-1, 1]. */
export const SAMPLE_SCALE = 1

/** O Vosk local responde rápido: um onset sem rótulo há mais de 1 s é órfão. */
export const MAX_PENDING_SECONDS = 1
/** Após um result final, onsets mais velhos que isto não ganham mais rótulo. */
export const FINAL_DROP_SECONDS = 0.5

export type { VoskModelLike, VoskRecognizerLike }

export interface FinalWord {
  word: string
  start: number
  end: number
  conf: number
}

export interface VoskRecognizerDeps {
  /** Padrão: o modelo aquecido compartilhado da página (voskModelCache). */
  loadModel?: () => Promise<VoskModelLike>
  /** Descarta o modelo compartilhado quando ele se mostra quebrado. */
  discardModel?: () => void
  onFinalWords?: (words: FinalWord[], streamStart: number) => void
}

export function createVoskRecognizer(mic: MicInput, deps: VoskRecognizerDeps = {}): NoteRecognizer {
  const loadModel = deps.loadModel ?? getWarmModel
  const discardModel = deps.discardModel ?? disposeModel
  const syllableListeners = new Set<(e: SyllableEvent) => void>()
  const statusListeners = new Set<(s: RecognizerStatus, err?: RecognizerError) => void>()
  const detector = createOnsetDetector()
  const aligner = createAligner({ maxPendingSeconds: MAX_PENDING_SECONDS })

  let status: RecognizerStatus = 'idle'
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

  /** Solta o KaldiRecognizer desta execução; o modelo é compartilhado e fica vivo. */
  function release() {
    unsubscribeFrames?.()
    unsubscribeFrames = null
    kaldi?.remove()
    kaldi = null
  }

  return {
    kind: 'local',
    get status() {
      return status
    },
    async start() {
      // Cada stop() invalida o start() em andamento. Se isso ocorrer durante o
      // carregamento, start() rejeita 'load-failed' sem alterar o status (que já
      // voltou a 'idle'). O modelo compartilhado segue carregando: a próxima
      // lição o encontra pronto.
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
      if (stopped()) throw new Error('load-failed')
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
          aligner.dropBefore(mic.context.currentTime - FINAL_DROP_SECONDS)
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
        // O KaldiRecognizer só falha assim com o modelo encerrado ou quebrado.
        discardModel()
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
