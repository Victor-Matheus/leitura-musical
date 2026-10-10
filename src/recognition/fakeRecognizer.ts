import type { NoteRecognizer, RecognizerError, RecognizerKind, RecognizerStatus, SyllableEvent } from './types'

/** Reconhecedor controlado pelo teste: `emit` entrega uma sílaba aos ouvintes. */
export function createFakeRecognizer(
  kind: RecognizerKind = 'local',
): NoteRecognizer & { emit(e: SyllableEvent): void; fail(err: RecognizerError): void } {
  const syllables = new Set<(e: SyllableEvent) => void>()
  const statuses = new Set<(s: RecognizerStatus, err?: RecognizerError) => void>()
  let status: RecognizerStatus = 'idle'
  const setStatus = (s: RecognizerStatus, err?: RecognizerError) => {
    status = s
    statuses.forEach((cb) => cb(s, err))
  }
  return {
    kind,
    get status() {
      return status
    },
    async start() {
      setStatus('ready')
    },
    stop() {
      setStatus('idle')
    },
    onSyllable(cb) {
      syllables.add(cb)
      return () => syllables.delete(cb)
    },
    onStatus(cb) {
      statuses.add(cb)
      return () => statuses.delete(cb)
    },
    emit(e) {
      syllables.forEach((cb) => cb(e))
    },
    /** Simula a queda do motor: status 'error' com o motivo. */
    fail(err) {
      setStatus('error', err)
    },
  }
}
