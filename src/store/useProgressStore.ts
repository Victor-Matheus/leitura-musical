import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Nota mínima (0..10) para um exercício contar como concluído */
export const PASS_SCORE = 7

export type LessonStatus = 'novo' | 'andamento' | 'concluida'

interface ProgressState {
  /** chave `${lessonId}/${exerciseId}` → melhor nota 0..10 */
  best: Record<string, number>
  recordScore: (lessonId: string, exerciseId: string, score: number) => void
  bestScore: (lessonId: string, exerciseId: string) => number | undefined
  lessonStatus: (lesson: { id: string; exercises: { id: string }[] }) => LessonStatus
  reset: () => void
}

const key = (lessonId: string, exerciseId: string) => `${lessonId}/${exerciseId}`
const isScore = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10

/** Mantém as notas válidas e descarta só as entradas inválidas. */
function parseBest(v: unknown): Record<string, number> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {}
  const out: Record<string, number> = {}
  for (const [k, score] of Object.entries(v)) {
    if (isScore(score)) out[k] = score
  }
  return out
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      best: {},
      recordScore: (lessonId, exerciseId, score) => {
        if (!isScore(score)) return
        const k = key(lessonId, exerciseId)
        const prev = get().best[k]
        if (prev !== undefined && prev >= score) return
        set((s) => ({ best: { ...s.best, [k]: score } }))
      },
      bestScore: (lessonId, exerciseId) => get().best[key(lessonId, exerciseId)],
      lessonStatus: (lesson) => {
        const scores = lesson.exercises.map((e) => get().best[key(lesson.id, e.id)])
        const passed = scores.filter((s) => s !== undefined && s >= PASS_SCORE).length
        if (lesson.exercises.length > 0 && passed === lesson.exercises.length) return 'concluida'
        // qualquer nota gravada, mesmo abaixo de PASS_SCORE, já conta como em andamento
        return scores.some((s) => s !== undefined) ? 'andamento' : 'novo'
      },
      reset: () => set({ best: {} }),
    }),
    {
      name: 'leitura-musical-progress',
      version: 1,
      partialize: (s) => ({ best: s.best }),
      // Versão 1 é a atual: o estado salvo passa como está (o merge valida).
      // Ao subir a versão, converta o estado antigo aqui; nunca descarte o progresso.
      migrate: (persisted) => persisted as ProgressState,
      // entradas inválidas são descartadas, sem lançar
      merge: (persisted, current) => {
        try {
          return { ...current, best: parseBest((persisted as { best?: unknown } | null)?.best) }
        } catch {
          return { ...current, best: {} }
        }
      },
    },
  ),
)
