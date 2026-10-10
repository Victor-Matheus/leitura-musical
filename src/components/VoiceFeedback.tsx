import { Mic, MicOff, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { EngineLabel, FeedbackState } from '../engine/usePracticeSession'
import type { RecognizerError } from '../recognition/types'

interface VoiceFeedbackProps {
  listening: boolean
  error: RecognizerError | null
  engine: EngineLabel | null
  lastHeard: string | null
  feedback: FeedbackState
}

const ERROR_MESSAGE: Record<RecognizerError, { text: string; critical: boolean; icon: LucideIcon }> = {
  denied: {
    text: 'Permissão de microfone negada. Libere o microfone para usar o modo voz.',
    critical: true,
    icon: MicOff,
  },
  unsupported: {
    text: 'Seu navegador não suporta reconhecimento de voz. Desligue a voz nas configurações.',
    critical: false,
    icon: TriangleAlert,
  },
  'load-failed': {
    text: 'Não foi possível carregar o motor de voz. Usando o modo online.',
    critical: false,
    icon: TriangleAlert,
  },
  crashed: {
    text: 'O motor de voz parou. A lição segue sem voz.',
    critical: false,
    icon: TriangleAlert,
  },
}

/** Voz ligada, mas nenhum motor disponível e nenhum outro erro a explicar. */
const UNAVAILABLE_MESSAGE = {
  text: 'Reconhecimento de voz indisponível neste navegador. A lição segue sem voz.',
  critical: false,
  icon: TriangleAlert,
}

export function VoiceFeedback({ listening, error, engine, lastHeard, feedback }: VoiceFeedbackProps) {
  const message = error ? ERROR_MESSAGE[error] : engine === 'silent' ? UNAVAILABLE_MESSAGE : null
  const MicIcon = listening ? Mic : MicOff

  return (
    <div className="flex flex-col items-center gap-2">
      {message && (
        <p
          className={`flex items-start gap-2 text-center text-base ${
            message.critical ? 'text-[var(--error)]' : 'text-[var(--muted)]'
          }`}
        >
          <message.icon size={22} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          <span>{message.text}</span>
        </p>
      )}
      {(!message || listening) && (
        <div className="flex items-center gap-2 text-base text-[var(--muted)]">
          <MicIcon
            size={22}
            strokeWidth={1.75}
            aria-hidden="true"
            className={listening ? 'text-[var(--success)]' : 'text-[var(--subtle)]'}
          />
          {listening ? 'Ouvindo… fale a nota' : 'Microfone parado'}
          {(engine === 'local' || engine === 'online') && <span>· voz: {engine}</span>}
        </div>
      )}
      {feedback !== 'idle' && (
        <div
          key={lastHeard + feedback}
          className={`animate-pop text-2xl font-extrabold ${
            feedback === 'correct' ? 'text-[var(--success)]' : 'text-[var(--error)]'
          }`}
        >
          {feedback === 'correct' ? '✓ Isso!' : '✗ Quase!'}
          {lastHeard ? ` (${lastHeard})` : ''}
        </div>
      )}
    </div>
  )
}
