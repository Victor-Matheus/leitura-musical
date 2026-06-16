import { useCallback, useEffect, useRef, useState } from 'react'
import type { Step } from '../data/notes'
import { matchSpokenNote } from './noteMatcher'

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
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const speechSupported = getRecognitionCtor() !== null

interface UseSpeechNotesOptions {
  enabled: boolean
  onNote: (step: Step) => void
}

/**
 * Escuta o microfone continuamente e dispara `onNote` quando reconhece
 * o nome de uma nota falada (em pt-BR).
 */
export function useSpeechNotes({ enabled, onNote }: UseSpeechNotesOptions) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const onNoteRef = useRef(onNote)
  onNoteRef.current = onNote

  // intervalo mínimo entre disparos da mesma nota (evita repetições do interim)
  const lastFireRef = useRef(0)

  useEffect(() => {
    if (!enabled) return
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setError('unsupported')
      return
    }

    const rec = new Ctor()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = true
    recRef.current = rec

    rec.onresult = (e) => {
      // pega o resultado mais recente
      const result = e.results[e.results.length - 1]
      if (!result) return
      const text = result[0].transcript
      const step = matchSpokenNote(text)
      if (step) {
        const now = Date.now()
        if (now - lastFireRef.current > 350) {
          lastFireRef.current = now
          onNoteRef.current(step)
        }
      }
    }

    rec.onerror = (ev) => {
      if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
        setError('denied')
        setListening(false)
      }
    }

    // mantém a escuta viva: reinicia ao terminar enquanto habilitado
    rec.onend = () => {
      if (enabled && recRef.current === rec) {
        try {
          rec.start()
        } catch {
          /* já iniciado */
        }
      }
    }

    try {
      rec.start()
      setListening(true)
      setError(null)
    } catch {
      /* ignora start duplicado */
    }

    return () => {
      recRef.current = null
      rec.onend = null
      rec.onresult = null
      rec.onerror = null
      try {
        rec.abort()
      } catch {
        /* noop */
      }
      setListening(false)
    }
  }, [enabled])

  const reset = useCallback(() => {
    lastFireRef.current = 0
  }, [])

  return { listening, error, supported: speechSupported, reset }
}
