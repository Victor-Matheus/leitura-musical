import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Note } from '../data/notes'
import type { Clock } from './clock'
import type { NoteWindow, Segment } from './timeline'
import { beatSeconds, buildWindows, endTime, playheadAt } from './timeline'

export type PlayerPhase = 'idle' | 'countIn' | 'playing' | 'paused' | 'finished'

export interface TimelinePlayer {
  phase: PlayerPhase
  /** Nota em exibição (0 no countIn). */
  index: number
  /** 4..1 durante o countIn, 0 fora. */
  countIn: number
  /** Tempos decorridos desde o início do segmento atual (pulso visual). */
  beat: number
  windows: (NoteWindow | null)[]
  start(clock: Clock): void
  pause(): void
  resume(): void
  stop(): void
}

interface Run {
  clock: Clock
  /** BPM congelado no start. */
  bpm: number
  segments: Segment[]
  status: 'running' | 'paused' | 'finished'
  /** Nota em que o próximo resume recomeça. */
  resumeIndex: number
}

const COUNT_IN_BEATS = 4
const NO_WINDOWS: (NoteWindow | null)[] = []

export function useTimelinePlayer(opts: {
  notes: Note[]
  bpm: number
  onFinish: (endedAt: number) => void
}): TimelinePlayer {
  const { notes, bpm, onFinish } = opts
  const [run, setRun] = useState<Run | null>(null)
  const [now, setNow] = useState(0)

  const notesRef = useRef(notes)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    notesRef.current = notes
    onFinishRef.current = onFinish
  })

  const windows = useMemo(
    () => (run ? buildWindows(notes, run.bpm, run.segments) : NO_WINDOWS),
    [notes, run],
  )

  const running = run?.status === 'running'
  useEffect(() => {
    if (!running || !run) return
    const { clock, bpm: frozenBpm, segments } = run
    let raf = 0
    const tick = () => {
      const t = clock.now()
      setNow(t)
      const w = buildWindows(notesRef.current, frozenBpm, segments)
      if (t >= endTime(w)) {
        setRun((r) => (r ? { ...r, status: 'finished' } : r))
        onFinishRef.current(t)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [running, run])

  const beginSegment = useCallback((clock: Clock, frozenBpm: number, fromIndex: number, prev: Segment[]) => {
    const t = clock.now()
    const t0 = t + COUNT_IN_BEATS * beatSeconds(frozenBpm)
    setNow(t)
    setRun({
      clock,
      bpm: frozenBpm,
      segments: [...prev, { fromIndex, t0 }],
      status: 'running',
      resumeIndex: fromIndex,
    })
  }, [])

  const start = useCallback((clock: Clock) => beginSegment(clock, bpm, 0, []), [beginSegment, bpm])

  const pause = useCallback(() => {
    if (!run || run.status !== 'running') return
    const t = run.clock.now()
    const last = run.segments[run.segments.length - 1]
    if (t < last.t0) {
      // Pausou no countIn: descarta o segmento que ainda não começou.
      setRun({ ...run, segments: run.segments.slice(0, -1), status: 'paused', resumeIndex: last.fromIndex })
      return
    }
    const w = buildWindows(notes, run.bpm, run.segments)
    const at = playheadAt(w, t) ?? last.fromIndex
    const closed = run.segments.map((s) => (s === last ? { ...s, endedAt: t } : s))
    setNow(t)
    setRun({ ...run, segments: closed, status: 'paused', resumeIndex: at })
  }, [run, notes])

  const resume = useCallback(() => {
    if (!run || run.status !== 'paused') return
    beginSegment(run.clock, run.bpm, run.resumeIndex, run.segments)
  }, [run, beginSegment])

  const stop = useCallback(() => setRun(null), [])

  let phase: PlayerPhase = 'idle'
  let index = 0
  let countIn = 0
  let beat = 0
  if (run) {
    const last = run.segments[run.segments.length - 1]
    if (run.status === 'paused') {
      phase = 'paused'
      index = run.resumeIndex
    } else if (run.status === 'finished') {
      phase = 'finished'
      index = Math.max(0, notes.length - 1)
    } else if (last && now < last.t0) {
      phase = 'countIn'
      index = last.fromIndex
      countIn = Math.min(COUNT_IN_BEATS, Math.max(1, Math.ceil((last.t0 - now) / beatSeconds(run.bpm))))
    } else if (last) {
      phase = 'playing'
      index = playheadAt(windows, now) ?? last.fromIndex
      beat = Math.floor((now - last.t0) / beatSeconds(run.bpm))
    }
  }

  return { phase, index, countIn, beat, windows, start, pause, resume, stop }
}
