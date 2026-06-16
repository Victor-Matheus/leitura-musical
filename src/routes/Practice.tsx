import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NoteStaff } from '../components/NoteStaff'
import { SpeedControl } from '../components/SpeedControl'
import { TransportControls } from '../components/TransportControls'
import { VoiceFeedback } from '../components/VoiceFeedback'
import type { FeedbackState } from '../components/VoiceFeedback'
import { usePlayer } from '../engine/usePlayer'
import { useSpeechNotes } from '../engine/useSpeechNotes'
import { SOLFEGE, noteName } from '../data/notes'
import type { Piece, Step } from '../data/notes'
import { usePracticeStore } from '../store/usePracticeStore'
import type { NoteResult } from '../store/usePracticeStore'

const FEEDBACK_COLOR: Record<FeedbackState, string> = {
  idle: '#2b6cb0',
  correct: '#1f9d55',
  wrong: '#d64545',
}

export function Practice() {
  const navigate = useNavigate()
  const location = useLocation()
  const piece = (location.state as { piece?: Piece } | null)?.piece

  const settings = usePracticeStore((s) => s.settings)
  const setSettings = usePracticeStore((s) => s.setSettings)
  const saveSession = usePracticeStore((s) => s.saveSession)

  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [lastHeard, setLastHeard] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const resultsRef = useRef<NoteResult[]>([])
  const startTimeRef = useRef(0)
  const indexRef = useRef(0)

  // Janela de graça: atribui resultados tardios de voz à nota anterior.
  // Tamanho = min(800ms, 40% da duração de uma semínima) para não ultrapassar a nota seguinte.
  const graceMs = Math.min(800, Math.round((60000 / settings.bpm) * 0.4))
  const prevIndexRef = useRef(-1)
  const advanceTimeRef = useRef(0)

  const notes = useMemo(() => piece?.notes ?? [], [piece])

  useEffect(() => {
    resultsRef.current = notes.map((note) => ({ note, correct: null }))
  }, [notes])

  const finalizeNote = (i: number) => {
    if (settings.voiceEnabled && resultsRef.current[i]?.correct === null) {
      resultsRef.current[i].correct = false
    }
  }

  const player = usePlayer({
    notes,
    bpm: settings.bpm,
    onAdvance: (from) => {
      prevIndexRef.current = from
      advanceTimeRef.current = Date.now()
      // Adia finalização para dar tempo ao resultado de voz chegar
      setTimeout(() => finalizeNote(from), graceMs)
      setFeedback('idle')
      setLastHeard(null)
    },
    onFinish: (last) => {
      finalizeNote(last)
      saveSession({
        pieceTitle: piece?.title ?? 'Lição',
        results: resultsRef.current.map((r) => ({ ...r })),
        voiceEnabled: settings.voiceEnabled,
        durationMs: Date.now() - startTimeRef.current,
      })
      navigate('/resultado')
    },
  })

  indexRef.current = player.index

  const applyAnswer = (step: Step, targetIndex: number) => {
    const target = notes[targetIndex]
    if (!target) return
    // Só exibe feedback visual se a resposta é para a nota ATUALMENTE exibida.
    // Quando o grace period aplica à nota anterior, registramos o score em silêncio.
    const showFeedback = targetIndex === indexRef.current
    setLastHeard(SOLFEGE[step])
    if (step === target.step) {
      resultsRef.current[targetIndex].correct = true
      if (showFeedback) setFeedback('correct')
    } else {
      if (resultsRef.current[targetIndex].correct !== true)
        resultsRef.current[targetIndex].correct = false
      if (showFeedback) {
        setFeedback('wrong')
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
    }
  }

  const onNote = (step: Step) => {
    // Ignora resultados capturados durante a contagem regressiva (warmup do mic)
    if (!player.playing) return

    const now = Date.now()
    const pi = prevIndexRef.current

    // Se estivermos dentro da janela de graça após um avanço, o resultado de voz
    // provavelmente foi capturado durante a nota anterior
    if (pi >= 0 && now - advanceTimeRef.current < graceMs) {
      const prevResult = resultsRef.current[pi]
      if (prevResult && prevResult.correct !== true) {
        applyAnswer(step, pi)
        return
      }
    }

    applyAnswer(step, indexRef.current)
  }

  // Ativa o microfone durante a contagem regressiva para aquecimento.
  // Resultados durante a contagem são descartados pelo guard em onNote.
  const speech = useSpeechNotes({
    enabled: settings.voiceEnabled && (player.playing || player.countdown > 0),
    onNote,
  })

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

  const started = player.playing || player.index > 0

  const onStart = () => {
    // Reseta estado de sessão anterior antes de iniciar.
    // prevIndexRef=0 + advanceTimeRef≈fim da contagem regressiva: trata a nota 0 como se
    // já tivesse "avançado" para ela, então o grace period cobre a 1ª nota também
    // (sem isso, pi=-1 fazia a fala da 1ª nota cair direto no índice atual, já avançado).
    prevIndexRef.current = 0
    advanceTimeRef.current = Date.now() + 2700
    startTimeRef.current = Date.now()
    resultsRef.current = notes.map((note) => ({ note, correct: null }))
    speech.reset() // limpa debounce para garantir que o primeiro resultado passe
    player.start()
  }

  const onRestart = () => {
    prevIndexRef.current = 0
    advanceTimeRef.current = Date.now() + 2700
    startTimeRef.current = Date.now()
    resultsRef.current = notes.map((note) => ({ note, correct: null }))
    setFeedback('idle')
    speech.reset()
    player.restart()
  }

  const current = notes[player.index]

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-2">
      <div className="flex w-full items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {piece.title}
        </h1>
        <span className="text-lg font-semibold tabular-nums" style={{ color: 'var(--muted)' }}>
          {player.index + 1} / {notes.length}
        </span>
      </div>

      {/* Pauta / nota */}
      <div
        className={`relative flex w-full items-center justify-center rounded-3xl ${
          shake ? 'animate-shake' : ''
        }`}
        style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
      >
        <NoteStaff
          notes={notes}
          index={player.index}
          clef={piece.clef}
          mode={settings.displayMode}
          highlightColor={FEEDBACK_COLOR[feedback]}
        />
        {player.countdown > 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-3xl text-7xl font-extrabold"
            style={{ background: 'rgba(0,0,0,0.45)', color: '#fff' }}
          >
            {player.countdown}
          </div>
        )}
        {settings.showHint && current && player.countdown === 0 && (
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
          listening={speech.listening}
          error={speech.error}
          lastHeard={lastHeard}
          feedback={feedback}
        />
      ) : (
        <p className="text-base" style={{ color: 'var(--muted)' }}>
          Modo silencioso — os nomes das notas aparecem ao final.
        </p>
      )}

      <SpeedControl bpm={settings.bpm} onChange={(bpm) => setSettings({ bpm })} />

      <TransportControls
        playing={player.playing}
        started={started}
        onStart={onStart}
        onPause={player.pause}
        onResume={player.resume}
        onRestart={onRestart}
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
