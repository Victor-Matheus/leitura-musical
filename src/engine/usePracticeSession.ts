import { useCallback, useEffect, useRef, useState } from 'react'
import type { MicInput } from '../audio/micInput'
import { createAudioContext, openMic } from '../audio/micInput'
import type { Piece } from '../data/notes'
import { SOLFEGE } from '../data/notes'
import { selectRecognizer } from '../recognition/selectRecognizer'
import type { NoteRecognizer, RecognizerError, SyllableEvent } from '../recognition/types'
import type { NoteResult } from '../store/usePracticeStore'
import type { Clock } from './clock'
import { audioClock, performanceClock } from './clock'
import { attribute, score } from './scorer'
import { beatSeconds } from './timeline'
import type { PlayerPhase, TimelinePlayer } from './useTimelinePlayer'
import { useTimelinePlayer } from './useTimelinePlayer'

export type FeedbackState = 'idle' | 'correct' | 'wrong'
export type EngineLabel = 'local' | 'online' | 'silent'

export interface SessionDeps {
  createContext: () => AudioContext | null
  openMic: (ctx: AudioContext) => Promise<MicInput>
  select: (mic: MicInput, timeoutSeconds: number) => Promise<NoteRecognizer | null>
  clockFor: (ctx: AudioContext | null) => Clock
}

export interface PracticeSession {
  phase: PlayerPhase
  index: number
  countIn: number
  beat: number
  feedback: FeedbackState
  lastHeard: string | null
  engine: EngineLabel | null
  voiceError: RecognizerError | null
  listening: boolean
  start(): void
  pause(): void
  resume(): void
  restart(): void
}

const COUNT_IN_BEATS = 4
/** Espera após a última nota para recolher sílabas atrasadas, em segundos. */
const DRAIN_SECONDS = 1.5

const defaultDeps: SessionDeps = {
  createContext: () => {
    try {
      return createAudioContext()
    } catch {
      return null
    }
  },
  openMic,
  select: (mic, timeoutSeconds) => selectRecognizer(mic, timeoutSeconds),
  clockFor: (ctx) => (ctx ? audioClock(ctx) : performanceClock),
}

/** O motor precisa estar pronto antes do fim da contagem de entrada. */
function selectionTimeout(bpm: number): number {
  return Math.max(0.5, COUNT_IN_BEATS * beatSeconds(bpm) - 0.5)
}

/**
 * Retoma o AudioContext (chamar no clique). Um contexto suspenso ou interrompido
 * (iOS, chamada telefônica) congela o relógio de áudio e, com ele, a lição.
 */
function resumeAudio(ctx: AudioContext | null | undefined) {
  if (!ctx) return
  void ctx.resume().catch(() => {})
}

function asRecognizerError(err: unknown): RecognizerError {
  return err instanceof Error && err.message === 'denied' ? 'denied' : 'unsupported'
}

/** Recursos de uma execução (do start até o fim, restart ou desmontagem). */
interface Run {
  clock: Clock
  bpm: number
  startedAt: number
  ctx: AudioContext | null
  mic: MicInput | null
  recognizer: NoteRecognizer | null
  /** O reconhecedor falhou no meio da lição: segue no modo silencioso. */
  silent: boolean
  unsubscribe: (() => void) | null
  events: SyllableEvent[]
  draining: boolean
  drainTimer: ReturnType<typeof setTimeout> | null
}

export function usePracticeSession(opts: {
  piece: Piece
  voiceEnabled: boolean
  bpm: number
  onComplete: (r: { results: NoteResult[]; durationMs: number }) => void
  deps?: Partial<SessionDeps>
}): PracticeSession {
  const { piece, voiceEnabled, bpm, onComplete, deps } = opts
  const [feedback, setFeedback] = useState<{ index: number; state: FeedbackState } | null>(null)
  const [lastHeard, setLastHeard] = useState<string | null>(null)
  const [engine, setEngine] = useState<EngineLabel | null>(null)
  const [voiceError, setVoiceError] = useState<RecognizerError | null>(null)
  const [listening, setListening] = useState(false)

  const runRef = useRef<Run | null>(null)
  const playerRef = useRef<TimelinePlayer | null>(null)
  const latest = useRef({ piece, voiceEnabled, bpm, onComplete, deps: { ...defaultDeps, ...deps } })
  useEffect(() => {
    latest.current = { piece, voiceEnabled, bpm, onComplete, deps: { ...defaultDeps, ...deps } }
  })

  /** Libera mic, reconhecedor e contexto da execução atual. */
  const teardown = useCallback(() => {
    const run = runRef.current
    if (!run) return
    runRef.current = null
    if (run.drainTimer !== null) clearTimeout(run.drainTimer)
    run.unsubscribe?.()
    run.recognizer?.stop()
    run.mic?.close()
    void run.ctx?.close().catch(() => {})
    setListening(false)
  }, [])

  const complete = useCallback(
    (run: Run, endedAt: number) => {
      const player = playerRef.current
      if (runRef.current !== run || !player) return
      const { piece: p, onComplete: done } = latest.current
      const silent = run.silent || run.recognizer === null
      const outcomes = silent ? null : score(p.notes, player.windows, run.bpm, run.events)
      teardown()
      done({
        results: p.notes.map((note, i) => ({ note, outcome: outcomes ? outcomes[i] : null })),
        durationMs: Math.round((endedAt - run.startedAt) * 1000),
      })
    },
    [teardown],
  )

  const onFinish = useCallback(
    (endedAt: number) => {
      const run = runRef.current
      if (!run) return
      run.draining = true
      // Relógio de parede: se o AudioContext for suspenso na espera, o relógio
      // de áudio para e a lição nunca terminaria.
      run.drainTimer = setTimeout(() => {
        run.drainTimer = null
        complete(run, endedAt)
      }, DRAIN_SECONDS * 1000)
    },
    [complete],
  )

  const player = useTimelinePlayer({ notes: piece.notes, bpm, onFinish })
  useEffect(() => {
    playerRef.current = player
  })

  const handleSyllable = useCallback((run: Run, e: SyllableEvent) => {
    const p = playerRef.current
    if (runRef.current !== run || !p) return
    const active = run.draining || p.phase === 'playing' || p.phase === 'countIn'
    if (!active || e.onset < run.startedAt) return
    run.events.push(e)
    const i = attribute(p.windows, run.bpm, e.onset)
    if (i === null || i !== p.index || run.draining) return
    const first = run.events.every((other) => other === e || attribute(p.windows, run.bpm, other.onset) !== i)
    if (!first) return
    const target = latest.current.piece.notes[i]
    setFeedback({ index: i, state: e.step === target.step ? 'correct' : 'wrong' })
    setLastHeard(SOLFEGE[e.step])
  }, [])

  const connectVoice = useCallback(
    async (run: Run) => {
      const { deps: d } = latest.current
      const stale = () => runRef.current !== run
      if (!run.ctx) {
        setVoiceError('unsupported')
        setEngine('silent')
        return
      }
      let mic: MicInput
      try {
        mic = await d.openMic(run.ctx)
      } catch (err) {
        if (stale()) return
        setVoiceError(asRecognizerError(err))
        setEngine('silent')
        return
      }
      if (stale()) {
        mic.close()
        return
      }
      run.mic = mic
      const recognizer = await d.select(mic, selectionTimeout(run.bpm)).catch(() => null)
      if (stale()) {
        recognizer?.stop()
        return
      }
      if (!recognizer) {
        setEngine('silent')
        return
      }
      run.recognizer = recognizer
      const offSyllable = recognizer.onSyllable((e) => handleSyllable(run, e))
      const offStatus = recognizer.onStatus((s, err) => {
        if (runRef.current !== run || s !== 'error') return
        // A lição em curso segue no modo silencioso; o reconhecedor é liberado já.
        run.silent = true
        offSyllable()
        recognizer.stop()
        console.warn(`[voz] reconhecedor ${recognizer.kind} falhou (${err ?? 'crashed'}); lição segue sem voz`)
        setVoiceError(err ?? 'crashed')
        setEngine('silent')
        setListening(false)
      })
      run.unsubscribe = () => {
        offSyllable()
        offStatus()
      }
      setEngine(recognizer.kind)
      setListening(true)
    },
    [handleSyllable],
  )

  const start = useCallback(() => {
    teardown()
    const { deps: d, voiceEnabled: voice, bpm: frozenBpm } = latest.current
    // Criar o contexto ainda dentro do gesto do usuário (exigência do iOS).
    const ctx = d.createContext()
    resumeAudio(ctx)
    const clock = d.clockFor(ctx)
    const run: Run = {
      clock,
      bpm: frozenBpm,
      startedAt: clock.now(),
      ctx,
      mic: null,
      recognizer: null,
      silent: false,
      unsubscribe: null,
      events: [],
      draining: false,
      drainTimer: null,
    }
    runRef.current = run
    setFeedback(null)
    setLastHeard(null)
    setVoiceError(null)
    setEngine(voice ? null : 'silent')
    playerRef.current?.start(clock)
    if (voice) void connectVoice(run)
  }, [teardown, connectVoice])

  const restart = useCallback(() => start(), [start])
  /** O feedback da nota anterior não deve sobreviver à pausa nem à retomada. */
  const clearFeedback = useCallback(() => {
    setFeedback(null)
    setLastHeard(null)
  }, [])
  const pause = useCallback(() => {
    clearFeedback()
    playerRef.current?.pause()
  }, [clearFeedback])
  const resume = useCallback(() => {
    resumeAudio(runRef.current?.ctx)
    clearFeedback()
    playerRef.current?.resume()
  }, [clearFeedback])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') playerRef.current?.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => teardown, [teardown])

  return {
    phase: player.phase,
    index: player.index,
    countIn: player.countIn,
    beat: player.beat,
    feedback: feedback && feedback.index === player.index ? feedback.state : 'idle',
    lastHeard,
    engine,
    voiceError,
    listening,
    start,
    pause,
    resume,
    restart,
  }
}
