import { useCallback, useEffect, useRef, useState } from 'react'
import type { Note } from '../data/notes'
import { durationBeats } from '../data/notes'

interface UsePlayerOptions {
  notes: Note[]
  bpm: number
  onAdvance?: (fromIndex: number, toIndex: number) => void
  onFinish?: (lastIndex: number) => void
}

/**
 * Motor do "passador de notas": avança o índice da nota atual no ritmo
 * definido pelo BPM, com contagem regressiva antes de começar.
 */
export function usePlayer({ notes, bpm, onAdvance, onFinish }: UsePlayerOptions) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bpmRef = useRef(bpm)
  bpmRef.current = bpm
  const onAdvanceRef = useRef(onAdvance)
  onAdvanceRef.current = onAdvance
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // agenda o avanço da nota `i` para a próxima
  const scheduleFrom = useCallback(
    (i: number) => {
      const note = notes[i]
      if (!note) return
      const beatMs = 60000 / bpmRef.current
      const ms = durationBeats(note.duration) * beatMs
      timerRef.current = setTimeout(() => {
        const next = i + 1
        if (next >= notes.length) {
          setPlaying(false)
          onFinishRef.current?.(i)
        } else {
          onAdvanceRef.current?.(i, next)
          setIndex(next)
          scheduleFrom(next)
        }
      }, ms)
    },
    [notes],
  )

  const start = useCallback(() => {
    clear()
    setIndex(0)
    setCountdown(3)
    let c = 3
    const tick = setInterval(() => {
      c -= 1
      if (c <= 0) {
        clearInterval(tick)
        setCountdown(0)
        setPlaying(true)
        scheduleFrom(0)
      } else {
        setCountdown(c)
      }
    }, 1000)
  }, [clear, scheduleFrom])

  const pause = useCallback(() => {
    clear()
    setPlaying(false)
  }, [clear])

  const resume = useCallback(() => {
    if (playing) return
    setPlaying(true)
    scheduleFrom(index)
  }, [playing, index, scheduleFrom])

  const restart = useCallback(() => {
    clear()
    start()
  }, [clear, start])

  useEffect(() => clear, [clear])

  return { index, playing, countdown, start, pause, resume, restart }
}
