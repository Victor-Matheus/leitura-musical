import { useNavigate, useLocation } from 'react-router-dom'
import { BeatPulse } from '../components/BeatPulse'
import { NoteStaff } from '../components/NoteStaff'
import { SpeedControl } from '../components/SpeedControl'
import { TransportControls } from '../components/TransportControls'
import { VoiceFeedback } from '../components/VoiceFeedback'
import { usePracticeSession } from '../engine/usePracticeSession'
import type { FeedbackState } from '../engine/usePracticeSession'
import { noteName } from '../data/notes'
import type { Piece } from '../data/notes'
import { usePracticeStore } from '../store/usePracticeStore'

const FEEDBACK_COLOR: Record<FeedbackState, string> = {
  idle: '#2b6cb0',
  correct: '#1f9d55',
  wrong: '#d64545',
}

export function Practice() {
  const navigate = useNavigate()
  const location = useLocation()
  const piece = (location.state as { piece?: Piece } | null)?.piece

  if (!piece) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-12">
        <p className="text-xl" style={{ color: 'var(--muted)' }}>
          Nenhuma lição selecionada.
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl px-6 py-3 text-lg font-bold"
          style={{ background: 'var(--primary)', color: '#fff' }}
        >
          Escolher lição
        </button>
      </div>
    )
  }

  return <PracticeSession piece={piece} />
}

function PracticeSession({ piece }: { piece: Piece }) {
  const navigate = useNavigate()
  const settings = usePracticeStore((s) => s.settings)
  const setSettings = usePracticeStore((s) => s.setSettings)
  const saveSession = usePracticeStore((s) => s.saveSession)

  const session = usePracticeSession({
    piece,
    voiceEnabled: settings.voiceEnabled,
    bpm: settings.bpm,
    onComplete: ({ results, durationMs }) => {
      saveSession({
        pieceTitle: piece.title,
        results,
        voiceEnabled: settings.voiceEnabled,
        durationMs,
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
    <div className="flex flex-1 flex-col items-center gap-6 py-2">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {piece.title}
        </h1>
        <span className="flex items-center gap-3">
          <BeatPulse beat={session.beat} active={running} />
          <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>
            {session.index + 1} / {notes.length}
          </span>
        </span>
      </div>

      {/* Pauta / nota */}
      <div
        className={`relative flex w-full items-center justify-center rounded-3xl ${
          session.feedback === 'wrong' ? 'animate-shake' : ''
        }`}
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <NoteStaff
          notes={notes}
          index={session.index}
          clef={piece.clef}
          mode={settings.displayMode}
          highlightColor={FEEDBACK_COLOR[session.feedback]}
          textColor={settings.highContrast ? '#ffffff' : '#1c1b1a'}
        />
        {phase === 'countIn' && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-3xl text-7xl font-extrabold"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
          >
            {session.countIn}
          </div>
        )}
        {settings.showHint && current && phase !== 'countIn' && (
          <div
            className="absolute bottom-3 text-2xl font-extrabold"
            style={{ color: 'var(--primary)' }}
          >
            {noteName(current)}
          </div>
        )}
      </div>

      {/* Feedback de voz */}
      {settings.voiceEnabled ? (
        <VoiceFeedback
          listening={session.listening}
          error={session.voiceError}
          engine={session.engine}
          lastHeard={session.lastHeard}
          feedback={session.feedback}
        />
      ) : (
        <p className="text-base" style={{ color: 'var(--muted)' }}>
          Modo silencioso — os nomes das notas aparecem ao final.
        </p>
      )}

      <SpeedControl
        bpm={settings.bpm}
        onChange={(bpm) => setSettings({ bpm })}
        disabled={speedLocked}
      />

      {/* start() precisa rodar direto no clique (exigência de áudio do iOS). */}
      <TransportControls
        playing={running}
        started={phase !== 'idle'}
        onStart={session.start}
        onPause={session.pause}
        onResume={session.resume}
        onRestart={session.restart}
      />

      <button
        onClick={() => navigate('/')}
        className="text-base underline"
        style={{ color: 'var(--muted)' }}
      >
        ← Voltar às lições
      </button>
    </div>
  )
}
