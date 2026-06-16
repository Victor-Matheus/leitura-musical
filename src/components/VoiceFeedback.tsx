export type FeedbackState = 'idle' | 'correct' | 'wrong'

interface VoiceFeedbackProps {
  listening: boolean
  error: string | null
  lastHeard: string | null
  feedback: FeedbackState
}

export function VoiceFeedback({ listening, error, lastHeard, feedback }: VoiceFeedbackProps) {
  if (error === 'unsupported') {
    return (
      <p className="text-center text-base" style={{ color: 'var(--muted)' }}>
        ⚠️ Seu navegador não reconhece voz. Use o Chrome ou desligue a voz nas configurações.
      </p>
    )
  }
  if (error === 'denied') {
    return (
      <p className="text-center text-base" style={{ color: 'var(--error)' }}>
        🎤 Permissão de microfone negada. Libere o microfone para usar o modo voz.
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-base" style={{ color: 'var(--muted)' }}>
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ background: listening ? 'var(--success)' : 'var(--border)' }}
        />
        {listening ? 'Ouvindo… fale a nota' : 'Microfone parado'}
      </div>
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
