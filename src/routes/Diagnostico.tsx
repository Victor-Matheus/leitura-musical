import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card } from '../components/ui'
import { createAudioContext, openMic } from '../audio/micInput'
import type { MicInput } from '../audio/micInput'
import type { Note, Step } from '../data/notes'
import { SOLFEGE } from '../data/notes'
import { audioClock } from '../engine/clock'
import { score } from '../engine/scorer'
import { useTimelinePlayer } from '../engine/useTimelinePlayer'
import { accuracy, latencyStats } from '../recognition/diagnostics'
import type { LatencyStats } from '../recognition/diagnostics'
import { downloadModel, isModelCached } from '../recognition/modelStore'
import type { NoteRecognizer, SyllableEvent } from '../recognition/types'
import { createVoskRecognizer } from '../recognition/voskRecognizer'
import type { FinalWord } from '../recognition/voskRecognizer'
import { createWebSpeechRecognizer, hasWebSpeech } from '../recognition/webSpeechRecognizer'

type Engine = 'local' | 'online'

const SEQUENCE: Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const NOTES: Note[] = SEQUENCE.map((step) => ({ step, octave: 4, duration: 'q' }))
const FINAL_WAIT_MS = 1500
const MAX_LATENCY_P90 = 0.5
const MIN_ACCURACY = 0.9

interface Report {
  latency: LatencyStats
  accuracy: number
  /** Média de (onset do detector − (streamStart + word.start)), só no Vosk. */
  onsetDelta: number | null
  approved: boolean
}

interface PerformanceWithMemory extends Performance {
  memory?: { usedJSHeapSize: number }
}

function heapMb(): string {
  const used = (performance as PerformanceWithMemory).memory?.usedJSHeapSize
  return used === undefined ? 'indisponível neste navegador' : `${(used / 1024 / 1024).toFixed(1)} MB`
}

function errorMessage(e: unknown): string {
  const code = e instanceof Error ? e.message : String(e)
  const known: Record<string, string> = {
    denied: 'Permissão do microfone negada.',
    unsupported: 'Este navegador não suporta o recurso necessário.',
    'load-failed': 'Falha ao carregar o modelo.',
    crashed: 'O reconhecedor falhou.',
  }
  return known[code] ?? code
}

/** Média do desvio entre cada onset e o início de palavra do Vosk mais próximo (até 1 s). */
function meanOnsetDelta(events: SyllableEvent[], wordStarts: number[]): number | null {
  const deltas: number[] = []
  for (const e of events) {
    let best: number | null = null
    for (const w of wordStarts) {
      if (best === null || Math.abs(e.onset - w) < Math.abs(best)) best = e.onset - w
    }
    if (best !== null && Math.abs(best) <= 1) deltas.push(best)
  }
  return deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null
}

function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-bold" style={{ color: 'var(--text)' }}>
        {label}
      </span>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            disabled={disabled}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className="rounded-xl px-4 py-2 font-bold transition-all disabled:opacity-50"
            style={{
              background: value === o.value ? 'var(--primary)' : 'var(--surface)',
              color: value === o.value ? 'var(--on-primary)' : 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Diagnostico() {
  const [engine, setEngine] = useState<Engine>('local')
  const [bpm, setBpm] = useState(60)
  const [cached, setCached] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [loadSeconds, setLoadSeconds] = useState<number | null>(null)
  const [memory, setMemory] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('parado')
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<Report | null>(null)

  const eventsRef = useRef<SyllableEvent[]>([])
  const wordStartsRef = useRef<number[]>([])
  const recognizerRef = useRef<NoteRecognizer | null>(null)
  const micRef = useRef<MicInput | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const finishTimerRef = useRef<number>(0)
  const runBpmRef = useRef(bpm)
  const engineRef = useRef(engine)

  useEffect(() => {
    isModelCached().then(setCached, () => setCached(false))
  }, [])

  const teardown = useCallback(() => {
    window.clearTimeout(finishTimerRef.current)
    recognizerRef.current?.stop()
    recognizerRef.current = null
    micRef.current?.close()
    micRef.current = null
    void ctxRef.current?.close().catch(() => undefined)
    ctxRef.current = null
  }, [])

  useEffect(() => teardown, [teardown])

  const windowsRef = useRef<ReturnType<typeof useTimelinePlayer>['windows']>([])

  const finish = useCallback(() => {
    const events = [...eventsRef.current]
    const outcomes = score(NOTES, windowsRef.current, runBpmRef.current, events)
    const got = outcomes.map((o, i) => (o === 'correct' ? SEQUENCE[i] : null))
    const latency = latencyStats(events)
    const acc = accuracy(SEQUENCE, got)
    const delta = engineRef.current === 'local' ? meanOnsetDelta(events, wordStartsRef.current) : null
    setReport({
      latency,
      accuracy: acc,
      onsetDelta: delta,
      approved: latency.count > 0 && latency.p90 < MAX_LATENCY_P90 && acc >= MIN_ACCURACY,
    })
    setMemory(heapMb())
    teardown()
    setStatus('parado')
    setBusy(false)
  }, [teardown])

  const player = useTimelinePlayer({
    notes: NOTES,
    bpm,
    onFinish: () => {
      finishTimerRef.current = window.setTimeout(finish, FINAL_WAIT_MS)
    },
  })
  useEffect(() => {
    windowsRef.current = player.windows
  })

  const handleDownload = useCallback(async () => {
    setError(null)
    setProgress(0)
    try {
      await downloadModel(setProgress)
      setCached(true)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setProgress(null)
    }
  }, [])

  const handleStart = useCallback(async () => {
    setError(null)
    setReport(null)
    setBusy(true)
    runBpmRef.current = bpm
    engineRef.current = engine
    eventsRef.current = []
    wordStartsRef.current = []
    // O AudioContext precisa nascer dentro do gesto de clique (iOS).
    const ctx = createAudioContext()
    ctxRef.current = ctx
    try {
      const mic = await openMic(ctx)
      micRef.current = mic
      const recognizer =
        engine === 'local'
          ? createVoskRecognizer(mic, {
              onFinalWords: (words: FinalWord[], streamStart: number) => {
                for (const w of words) wordStartsRef.current.push(streamStart + w.start)
              },
            })
          : createWebSpeechRecognizer(mic)
      recognizerRef.current = recognizer
      recognizer.onStatus((s) => setStatus(s))
      recognizer.onSyllable((e) => eventsRef.current.push(e))
      const t0 = performance.now()
      await recognizer.start()
      setLoadSeconds((performance.now() - t0) / 1000)
      setMemory(heapMb())
      player.start(audioClock(ctx))
    } catch (e) {
      setError(errorMessage(e))
      teardown()
      setStatus('parado')
      setBusy(false)
    }
  }, [bpm, engine, player, teardown])

  const handleCancel = useCallback(() => {
    player.stop()
    teardown()
    setStatus('parado')
    setBusy(false)
  }, [player, teardown])

  const noteLabel = useMemo(() => SEQUENCE.map((s) => SOLFEGE[s]).join(' · '), [])
  const playing = player.phase === 'countIn' || player.phase === 'playing'
  const canStart = !busy && (engine === 'online' ? hasWebSpeech() : cached)

  return (
    <div className="flex flex-col gap-6 py-2">
      <h1 className="text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
        Diagnóstico do reconhecimento
      </h1>

      <Card as="section" className="flex flex-col gap-4 !p-4">
        <Choice
          label="Motor"
          value={engine}
          disabled={busy}
          onChange={setEngine}
          options={[
            { value: 'local', label: 'Local (Vosk)' },
            { value: 'online', label: 'Online (Web Speech)' },
          ]}
        />
        <Choice
          label="Andamento"
          value={bpm}
          disabled={busy}
          onChange={setBpm}
          options={[
            { value: 60, label: '60 BPM' },
            { value: 90, label: '90 BPM' },
          ]}
        />
        {engine === 'local' && (
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={busy || progress !== null}
              className="self-start"
            >
              Baixar modelo
            </Button>
            <span style={{ color: 'var(--muted)' }}>
              {progress !== null
                ? `Baixando: ${Math.round(progress * 100)}%`
                : cached
                  ? 'Modelo em cache.'
                  : 'Modelo ainda não baixado.'}
            </span>
          </div>
        )}
        {engine === 'online' && !hasWebSpeech() && (
          <span style={{ color: 'var(--muted)' }}>Web Speech não está disponível neste navegador.</span>
        )}
      </Card>

      <Card as="section" className="flex flex-col gap-3 !p-4">
        <p style={{ color: 'var(--text)' }}>
          Fale cada sílaba no tempo da nota: <strong>{noteLabel}</strong>
        </p>
        <div className="flex gap-3">
          <Button onClick={handleStart} disabled={!canStart}>
            Iniciar teste
          </Button>
          {busy && (
            <Button variant="secondary" onClick={handleCancel}>
              Cancelar
            </Button>
          )}
        </div>
        <div aria-live="polite" className="text-center text-5xl font-extrabold" style={{ color: 'var(--text)' }}>
          {player.phase === 'countIn' && player.countIn}
          {player.phase === 'playing' && SOLFEGE[SEQUENCE[player.index]]}
          {player.phase === 'finished' && 'Aguardando o fim…'}
          {!playing && player.phase !== 'finished' && ' '}
        </div>
      </Card>

      <Card as="section" className="flex flex-col gap-1 !p-4">
        <div style={{ color: 'var(--text)' }}>Status do reconhecedor: {status}</div>
        <div style={{ color: 'var(--text)' }}>
          Tempo de carga do modelo: {loadSeconds === null ? '—' : `${loadSeconds.toFixed(2)} s`}
        </div>
        <div style={{ color: 'var(--text)' }}>Memória (heap JS): {memory ?? heapMb()}</div>
        {error && (
          <div role="alert" style={{ color: 'var(--error)' }}>
            {error}
          </div>
        )}
      </Card>

      {report && (
        <Card as="section" className="flex flex-col gap-1 !p-4" aria-live="polite">
          <div className="text-2xl font-extrabold" style={{ color: 'var(--text)' }}>
            {report.approved ? 'APROVADO' : 'REPROVADO'}
          </div>
          <div style={{ color: 'var(--text)' }}>
            Latência média: {(report.latency.mean * 1000).toFixed(0)} ms · p90:{' '}
            {(report.latency.p90 * 1000).toFixed(0)} ms ({report.latency.count} eventos)
          </div>
          <div style={{ color: 'var(--text)' }}>Acerto: {(report.accuracy * 100).toFixed(0)}%</div>
          {report.onsetDelta !== null && (
            <div style={{ color: 'var(--text)' }}>
              Onset do detector − palavra do Vosk (média): {(report.onsetDelta * 1000).toFixed(0)} ms
            </div>
          )}
          <div style={{ color: 'var(--muted)' }}>Critério: p90 &lt; 500 ms e acerto ≥ 90%.</div>
        </Card>
      )}
    </div>
  )
}
