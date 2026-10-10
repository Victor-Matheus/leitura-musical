import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { MicInput } from '../audio/micInput'
import type { Piece, Step } from '../data/notes'
import { createFakeRecognizer } from '../recognition/fakeRecognizer'
import { performanceClock } from './clock'
import { usePracticeSession, type SessionDeps } from './usePracticeSession'

const piece: Piece = {
  id: 't',
  title: 'Teste',
  level: 1,
  clef: 'treble',
  notes: [
    { step: 'C', octave: 4, duration: 'q' },
    { step: 'D', octave: 4, duration: 'q' },
    { step: 'E', octave: 4, duration: 'q' },
  ],
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout'],
  })
})
afterEach(() => {
  vi.useRealTimers()
})

// Margem de 20 ms: o rAF falso dispara em quadros de ~16 ms.
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms + 20))
// Deixa as promessas do mic/seleção resolverem.
const flush = () => act(async () => {})

function fakeMic() {
  const close = vi.fn<() => void>()
  const mic: MicInput = { context: {} as AudioContext, sampleRate: 16000, onFrame: () => () => {}, close }
  return Object.assign(mic, { close })
}

function setup(opts: { voiceEnabled?: boolean; deps?: Partial<SessionDeps> } = {}) {
  const rec = createFakeRecognizer('local')
  const mic = fakeMic()
  const select = vi.fn(async () => rec)
  const onComplete = vi.fn()
  const deps: Partial<SessionDeps> = {
    createContext: () => ({ close: async () => {} }) as unknown as AudioContext,
    openMic: async () => mic,
    select,
    clockFor: () => performanceClock,
    ...opts.deps,
  }
  const hook = renderHook(() =>
    usePracticeSession({ piece, voiceEnabled: opts.voiceEnabled ?? true, bpm: 60, onComplete, deps }),
  )
  return { ...hook, rec, mic, select, onComplete }
}

const say = (rec: ReturnType<typeof createFakeRecognizer>, step: Step, onset: number) =>
  act(() => rec.emit({ step, onset, arrivedAt: performanceClock.now() }))

test('lição completa com acertos, erro e sem resposta', async () => {
  const { result, rec, mic, select, onComplete } = setup()
  const t = performanceClock.now()
  act(() => result.current.start())
  await flush()
  expect(select).toHaveBeenCalledWith(mic, 3.5)
  expect(result.current.engine).toBe('local')
  expect(result.current.listening).toBe(true)

  const t0 = t + 4
  advance(4000)
  say(rec, 'C', t0 + 0.1)
  advance(1000)
  say(rec, 'F', t0 + 1.1)
  advance(2000) // nota 2 sem resposta; fim da lição
  expect(onComplete).not.toHaveBeenCalled()
  const stop = vi.spyOn(rec, 'stop')
  advance(1500)
  expect(onComplete).toHaveBeenCalledTimes(1)
  const { results, durationMs } = onComplete.mock.calls[0][0]
  expect(results.map((r: { outcome: unknown }) => r.outcome)).toEqual(['correct', 'wrong', 'missed'])
  expect(results[0].note).toBe(piece.notes[0])
  expect(durationMs).toBeGreaterThanOrEqual(7000)
  expect(stop).toHaveBeenCalled()
  expect(mic.close).toHaveBeenCalled()
  expect(result.current.listening).toBe(false)
})

test('evento atrasado é pontuado na nota certa sem feedback visual', async () => {
  const { result, rec, onComplete } = setup()
  const t0 = performanceClock.now() + 4
  act(() => result.current.start())
  await flush()
  advance(4000 + 1100) // já na nota 1
  expect(result.current.index).toBe(1)
  say(rec, 'C', t0 + 0.5) // onset da nota 0, chegou tarde
  expect(result.current.feedback).toBe('idle')
  expect(result.current.lastHeard).toBeNull()
  advance(2000 + 1500)
  expect(onComplete.mock.calls[0][0].results[0].outcome).toBe('correct')
})

test('reiniciar descarta eventos da execução anterior', async () => {
  const { result, rec, onComplete } = setup()
  const firstT0 = performanceClock.now() + 4
  act(() => result.current.start())
  await flush()
  advance(4100)
  say(rec, 'C', firstT0 + 0.1)
  expect(result.current.feedback).toBe('correct')
  const stop = vi.spyOn(rec, 'stop')
  act(() => result.current.restart())
  expect(stop).toHaveBeenCalled()
  expect(result.current.feedback).toBe('idle')
  expect(result.current.lastHeard).toBeNull()
  await flush()
  const t0 = performanceClock.now() + 4
  say(rec, 'E', firstT0 + 0.3) // chegou depois do restart, mas a fala é da execução anterior
  expect(result.current.lastHeard).toBeNull()
  advance(4000)
  say(rec, 'D', t0 + 1.1)
  advance(3000 + 1500)
  expect(onComplete).toHaveBeenCalledTimes(1)
  expect(onComplete.mock.calls[0][0].results.map((r: { outcome: unknown }) => r.outcome)).toEqual([
    'missed',
    'correct',
    'missed',
  ])
})

test('mic negado → modo silencioso com outcome null', async () => {
  const { result, select, onComplete } = setup({
    deps: { openMic: () => Promise.reject(new Error('denied')) },
  })
  act(() => result.current.start())
  await flush()
  expect(result.current.voiceError).toBe('denied')
  expect(result.current.engine).toBe('silent')
  expect(result.current.listening).toBe(false)
  expect(select).not.toHaveBeenCalled()
  advance(4000 + 3000 + 1500)
  expect(onComplete.mock.calls[0][0].results.map((r: { outcome: unknown }) => r.outcome)).toEqual([
    null,
    null,
    null,
  ])
})

test('voz desligada não abre o mic e fica silenciosa', async () => {
  const openMic = vi.fn<SessionDeps['openMic']>()
  const { result, onComplete } = setup({ voiceEnabled: false, deps: { openMic } })
  act(() => result.current.start())
  await flush()
  expect(openMic).not.toHaveBeenCalled()
  expect(result.current.engine).toBe('silent')
  expect(result.current.voiceError).toBeNull()
  advance(4000 + 3000 + 1500)
  expect(onComplete.mock.calls[0][0].results.every((r: { outcome: unknown }) => r.outcome === null)).toBe(true)
})

test('aba oculta pausa a sessão', async () => {
  const { result } = setup()
  act(() => result.current.start())
  await flush()
  advance(4500)
  expect(result.current.phase).toBe('playing')
  const spy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
  act(() => void document.dispatchEvent(new Event('visibilitychange')))
  expect(result.current.phase).toBe('paused')
  spy.mockRestore()
})

test('feedback mostra verde na nota atual e volta a idle na próxima', async () => {
  const { result, rec } = setup()
  const t0 = performanceClock.now() + 4
  act(() => result.current.start())
  await flush()
  advance(4100)
  say(rec, 'C', t0 + 0.1)
  expect(result.current.feedback).toBe('correct')
  expect(result.current.lastHeard).toBe('Dó')
  say(rec, 'G', t0 + 0.3) // segunda sílaba na mesma nota não muda o feedback
  expect(result.current.feedback).toBe('correct')
  advance(1000)
  expect(result.current.index).toBe(1)
  expect(result.current.feedback).toBe('idle')
  say(rec, 'A', t0 + 1.2)
  expect(result.current.feedback).toBe('wrong')
})

test('desmontar para o reconhecedor e fecha o mic', async () => {
  const { result, rec, mic, unmount } = setup()
  act(() => result.current.start())
  await flush()
  const stop = vi.spyOn(rec, 'stop')
  unmount()
  expect(stop).toHaveBeenCalled()
  expect(mic.close).toHaveBeenCalled()
})

const outcomesOf = (onComplete: ReturnType<typeof vi.fn>) =>
  onComplete.mock.calls[0][0].results.map((r: { outcome: unknown }) => r.outcome)

test('reconhecedor que cai no meio da lição é parado e a lição segue silenciosa', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { result, rec, onComplete } = setup()
  const t0 = performanceClock.now() + 4
  act(() => result.current.start())
  await flush()
  advance(4100)
  say(rec, 'C', t0 + 0.1)
  const stop = vi.spyOn(rec, 'stop')
  act(() => rec.fail('crashed'))
  expect(stop).toHaveBeenCalled()
  expect(warn).toHaveBeenCalledTimes(1)
  expect(result.current.voiceError).toBe('crashed')
  expect(result.current.engine).toBe('silent')
  expect(result.current.listening).toBe(false)
  advance(3000 + 1500)
  expect(outcomesOf(onComplete)).toEqual([null, null, null])
  warn.mockRestore()
})

test('sílaba que chega na espera final de 1,5 s é pontuada', async () => {
  const { result, rec, onComplete } = setup()
  const t0 = performanceClock.now() + 4
  act(() => result.current.start())
  await flush()
  advance(4000 + 3000) // lição terminou, espera em curso
  expect(result.current.phase).toBe('finished')
  say(rec, 'E', t0 + 2.5) // onset na nota 2, chegou atrasado
  expect(result.current.feedback).toBe('idle')
  advance(1500)
  expect(outcomesOf(onComplete)).toEqual(['missed', 'missed', 'correct'])
})

test('select sem reconhecedor → motor silencioso', async () => {
  const { result, onComplete } = setup({ deps: { select: async () => null } })
  act(() => result.current.start())
  await flush()
  expect(result.current.engine).toBe('silent')
  expect(result.current.listening).toBe(false)
  advance(4000 + 3000 + 1500)
  expect(outcomesOf(onComplete)).toEqual([null, null, null])
})

test('sem AudioContext com voz ligada → voiceError unsupported', async () => {
  const openMic = vi.fn<SessionDeps['openMic']>()
  const { result } = setup({ deps: { createContext: () => null, openMic } })
  act(() => result.current.start())
  await flush()
  expect(openMic).not.toHaveBeenCalled()
  expect(result.current.voiceError).toBe('unsupported')
  expect(result.current.engine).toBe('silent')
})

test('sílaba emitida durante a pausa é descartada', async () => {
  const { result, rec, onComplete } = setup()
  const t0 = performanceClock.now() + 4
  act(() => result.current.start())
  await flush()
  advance(4000 + 1500) // meio da nota 1
  act(() => result.current.pause())
  expect(result.current.phase).toBe('paused')
  // Onset na nota 0 (janela ainda válida), mas chegou com a sessão pausada.
  say(rec, 'C', t0 + 0.5)
  act(() => result.current.resume())
  advance(4000 + 2000 + 1500) // retoma da nota 1, ninguém responde
  expect(outcomesOf(onComplete)).toEqual(['missed', 'missed', 'missed'])
})
