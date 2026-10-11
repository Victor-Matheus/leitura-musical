import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BeatPulse } from '../components/BeatPulse'
import { NoteStaff } from '../components/NoteStaff'
import type { HighlightToken } from '../components/NoteStaff'
import { SpeedControl } from '../components/SpeedControl'
import { TransportControls } from '../components/TransportControls'
import { VoiceFeedback } from '../components/VoiceFeedback'
import { Badge, Button, Card } from '../components/ui'
import { usePracticeSession } from '../engine/usePracticeSession'
import type { FeedbackState } from '../engine/usePracticeSession'
import { noteName } from '../data/notes'
import type { Piece } from '../data/notes'
import { preloadLocalModel } from '../recognition/selectRecognizer'
import { usePracticeStore } from '../store/usePracticeStore'

// Tokens de cor da nota atual; o NoteStaff resolve cada um com readToken ao desenhar.
const FEEDBACK_COLOR: Record<FeedbackState, HighlightToken> = {
  idle: 'primary',
  correct: 'success',
  wrong: 'error',
}

export function Practice() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { piece?: Piece; returnTo?: unknown } | null
  const piece = state?.piece
  // só caminhos internos
  const returnTo =
    typeof state?.returnTo === 'string' && state.returnTo.startsWith('/') ? state.returnTo : undefined

  if (!piece) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <p className="text-xl text-[var(--muted)]">Nenhuma lição selecionada.</p>
        <Button variant="primary" size="lg" onClick={() => navigate('/')}>
          Escolher lição
        </Button>
      </div>
    )
  }

  return <PracticeSession piece={piece} returnTo={returnTo} />
}

function PracticeSession({ piece, returnTo }: { piece: Piece; returnTo?: string }) {
  const navigate = useNavigate()
  const settings = usePracticeStore((s) => s.settings)
  const setSettings = usePracticeStore((s) => s.setSettings)
  const saveSession = usePracticeStore((s) => s.saveSession)

  // Um modelo local aquecido por página: a lição só cria o KaldiRecognizer.
  useEffect(() => {
    if (settings.voiceEnabled) preloadLocalModel()
  }, [settings.voiceEnabled])

  const session = usePracticeSession({
    piece,
    voiceEnabled: settings.voiceEnabled,
    bpm: settings.bpm,
    onComplete: ({ results, durationMs }) => {
      saveSession({
        pieceTitle: piece.title,
        results,
        // Sem nenhuma nota pontuada (motor indisponível) não há porcentagem a mostrar.
        voiceEnabled: results.some((r) => r.outcome !== null),
        durationMs,
        returnTo,
      })
      navigate('/resultado')
    },
  })

  const { phase } = session
  const notes = piece.notes
  const current = notes[session.index]
  const running = phase === 'countIn' || phase === 'playing'
  // O BPM é congelado a cada execução: só muda com a lição parada ou terminada.
  const speedLocked = running || phase === 'paused'

  return (
    <div className="flex flex-1 flex-col gap-5 py-2">
      <div className="flex w-full items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
          {piece.title}
        </h1>
        <Badge>
          <span className="tabular-nums">
            {session.index + 1} / {notes.length}
          </span>
        </Badge>
      </div>

      {/* Pauta / nota */}
      <Card
        className={`relative flex w-full items-center justify-center ${
          session.feedback === 'wrong' ? 'animate-shake' : ''
        }`}
      >
        <NoteStaff
          notes={notes}
          index={session.index}
          clef={piece.clef}
          mode={settings.displayMode}
          highlight={FEEDBACK_COLOR[session.feedback]}
          highContrast={settings.highContrast}
        />
        {phase === 'countIn' && (
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--surface-dark)]/80 text-7xl font-extrabold text-[var(--on-dark)]"
          >
            {session.countIn}
          </div>
        )}
        {settings.showHint && current && phase !== 'countIn' && (
          <div className="absolute bottom-3 text-2xl font-extrabold text-[var(--primary)]">
            {noteName(current)}
          </div>
        )}
      </Card>
      {/* Região sempre montada para o leitor de tela anunciar a contagem 4-3-2-1. */}
      <div aria-live="polite" className="sr-only">
        {phase === 'countIn' ? session.countIn : ''}
      </div>

      {/* Feedback de voz e pulso */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <BeatPulse beat={session.beat} active={running} />
        {settings.voiceEnabled ? (
          <VoiceFeedback
            listening={session.listening}
            error={session.voiceError}
            engine={session.engine}
            lastHeard={session.lastHeard}
            feedback={session.feedback}
          />
        ) : (
          <p className="text-base text-[var(--muted)]">
            Modo silencioso — os nomes das notas aparecem ao final.
          </p>
        )}
      </div>

      <Card className="w-full">
        <SpeedControl
          bpm={settings.bpm}
          onChange={(bpm) => setSettings({ bpm })}
          disabled={speedLocked}
        />
      </Card>

      {/* start() precisa rodar direto no clique (exigência de áudio do iOS). */}
      <TransportControls
        playing={running}
        started={phase !== 'idle'}
        finished={phase === 'finished'}
        onStart={session.start}
        onPause={session.pause}
        onResume={session.resume}
        onRestart={session.restart}
      />

      <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(returnTo ?? '/')} className="self-center">
        {returnTo ? 'Voltar' : 'Voltar às lições'}
      </Button>
    </div>
  )
}
