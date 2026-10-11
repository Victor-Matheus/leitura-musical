import type { Step } from '../data/notes'

export interface SyllableEvent {
  step: Step
  onset: number
  arrivedAt: number
}

export type RecognizerStatus = 'idle' | 'loading' | 'ready' | 'error'
export type RecognizerKind = 'local' | 'online'
export type RecognizerError = 'denied' | 'unsupported' | 'load-failed' | 'crashed'

export interface NoteRecognizer {
  readonly kind: RecognizerKind
  readonly status: RecognizerStatus
  /** Rejeita com Error(message: RecognizerError). */
  start(): Promise<void>
  stop(): void
  /** Retorna unsubscribe. */
  onSyllable(cb: (e: SyllableEvent) => void): () => void
  onStatus(cb: (s: RecognizerStatus, err?: RecognizerError) => void): () => void
}
