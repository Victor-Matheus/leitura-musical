import type { EngineLabel, FeedbackState } from '../engine/usePracticeSession'
import type { RecognizerError } from '../recognition/types'

interface VoiceFeedbackProps {
  listening: boolean
  error: RecognizerError | null
  engine: EngineLabel | null
  lastHeard: string | null
  feedback: FeedbackState
}

const ERROR_MESSAGE: Record<RecognizerError, { text: string; critical: boolean }> = {
  denied: {
    text: '🎤 Permissão de microfone negada. Libere o microfone para usar o modo voz.',
    critical: true,
  },
  unsupported: {
    text: '⚠️ Seu navegador não suporta reconhecimento de voz. Desligue a voz nas configurações.',
    critical: false,
  },
  'load-failed': {
    text: '⚠️ Não foi possível carregar o motor de voz. Usando o modo online.',
    critical: false,
  },
  crashed: {
    text: '⚠️ O motor de voz parou. A lição segue sem voz.',
    critical: false,
  },
}

export function VoiceFeedback({ listening, error, engine, lastHeard, feedback }: VoiceFeedbackProps) {
  const message = error ? ERROR_MESSAGE[error] : null

  return (
    <div className="flex flex-col items-center gap-1">
      {message && (
        <p
          className="text-center text-base"
          style={{ color: message.critical ? 'var(--error)' : 'var(--muted)' }}
        >
          {message.text}
        </p>
      )}
      {(!message || listening) && (
        <div className="flex items-center gap-2 text-base" style={{ color: 'var(--muted)' }}>
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: listening ? 'var(--success)' : 'var(--border)' }}
          />
          {listening ? 'Ouvindo… fale a nota' : 'Microfone parado'}
          {(engine === 'local' || engine === 'online') && <span>· voz: {engine}</span>}
        </div>
      )}
      {feedback !== 'idle' && (
        <div
          key={lastHeard + feedback}
          className="animate-pop text-2xl font-extrabold"
          style={{ color: feedback === 'correct' ? 'var(--success)' : 'var(--error)' }}
        >
          {feedback === 'correct' ? '✓ Isso!' : '✗ Quase!'}
          {lastHeard ? ` (${lastHeard})` : ''}
        </div>
      )}
    </div>
  )
}
