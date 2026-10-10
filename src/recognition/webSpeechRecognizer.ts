import type { MicInput } from '../audio/micInput'
import type { Step } from '../data/notes'
import { createAligner } from './aligner'
import { createOnsetDetector } from './onsetDetector'
import { textToSteps } from './syllables'
import type { NoteRecognizer, RecognizerError, RecognizerStatus, SyllableEvent } from './types'

// ---- Tipos mínimos da Web Speech API (não fazem parte do lib.dom padrão) ----
interface SpeechRecognitionAlternative {
  transcript: string
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  isFinal: boolean
}
interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function hasWebSpeech(): boolean {
  return getRecognitionCtor() !== null
}

export function createWebSpeechRecognizer(
  mic: MicInput,
  deps: { Ctor?: SpeechRecognitionCtor | null } = {},
): NoteRecognizer {
  const syllableListeners = new Set<(e: SyllableEvent) => void>()
  const statusListeners = new Set<(s: RecognizerStatus, err?: RecognizerError) => void>()
  const aligner = createAligner()
  const detector = createOnsetDetector()
  let status: RecognizerStatus = 'idle'
  let rec: SpeechRecognitionLike | null = null
  let unsubscribeFrames: (() => void) | null = null
  let emitted: Record<number, number> = {}

  function setStatus(s: RecognizerStatus, err?: RecognizerError) {
    status = s
    statusListeners.forEach((cb) => cb(s, err))
  }

  function handleResult(e: SpeechRecognitionEvent) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const steps: Step[] = textToSteps(e.results[i][0].transcript)
      const already = emitted[i] ?? 0
      for (const step of steps.slice(already)) {
        const ev = aligner.pushStep(step, mic.context.currentTime)
        if (ev) syllableListeners.forEach((cb) => cb(ev))
      }
      emitted[i] = Math.max(already, steps.length)
    }
  }

  function teardown() {
    unsubscribeFrames?.()
    unsubscribeFrames = null
    const r = rec
    rec = null
    if (r) {
      r.onresult = null
      r.onerror = null
      r.onend = null
      try {
        r.abort()
      } catch {
        /* noop */
      }
    }
  }

  return {
    kind: 'online',
    get status() {
      return status
    },
    async start() {
      const Ctor = deps.Ctor !== undefined ? deps.Ctor : getRecognitionCtor()
      if (!Ctor) {
        setStatus('error', 'unsupported')
        throw new Error('unsupported')
      }
      teardown()
      detector.reset()
      aligner.reset()
      emitted = {}

      const r = new Ctor()
      r.lang = 'pt-BR'
      r.continuous = true
      r.interimResults = true
      r.onresult = handleResult
      r.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          teardown()
          setStatus('error', 'denied')
        }
      }
      // mantém a escuta viva: reinicia ao terminar enquanto ativo
      r.onend = () => {
        if (rec !== r) return
        emitted = {}
        try {
          r.start()
        } catch {
          /* já iniciado */
        }
      }
      rec = r

      unsubscribeFrames = mic.onFrame((samples, startTime) => {
        for (const t of detector.push(samples, startTime, mic.sampleRate)) aligner.pushOnset(t)
      })

      try {
        r.start()
      } catch {
        teardown()
        setStatus('error', 'crashed')
        throw new Error('crashed')
      }
      setStatus('ready')
    },
    stop() {
      teardown()
      setStatus('idle')
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
