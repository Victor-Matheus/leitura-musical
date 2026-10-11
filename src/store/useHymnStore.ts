import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Note } from '../data/notes'
import { MAX_HYMN_NOTES, MAX_HYMN_TITLE, parseHymnData } from '../hymns/codec'

export { MAX_HYMN_NOTES } from '../hymns/codec'

export interface UserHymn {
  id: string
  title: string
  clef: 'treble' | 'bass'
  notes: Note[]
  updatedAt: number
}

interface HymnState {
  hymns: UserHymn[]
  /**
   * Cria (sem id) ou atualiza (com id). Retorna o id. O título é cortado em
   * MAX_HYMN_TITLE; mais de MAX_HYMN_NOTES notas lança Error('too-many-notes').
   */
  save: (h: Omit<UserHymn, 'id' | 'updatedAt'> & { id?: string }) => string
  remove: (id: string) => void
  get: (id: string) => UserHymn | undefined
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

/** Mantém os hinos válidos e descarta só os itens inválidos. */
function parseHymns(v: unknown): UserHymn[] {
  if (!Array.isArray(v)) return []
  const out: UserHymn[] = []
  for (const item of v) {
    const data = parseHymnData(item)
    const { id, updatedAt } = (item ?? {}) as { id?: unknown; updatedAt?: unknown }
    if (!data || typeof id !== 'string' || typeof updatedAt !== 'number') continue
    out.push({ id, ...data, updatedAt })
  }
  return out
}

export const useHymnStore = create<HymnState>()(
  persist(
    (set, get) => ({
      hymns: [],
      save: ({ id, title, clef, notes }) => {
        if (notes.length > MAX_HYMN_NOTES) throw new Error('too-many-notes')
        title = title.slice(0, MAX_HYMN_TITLE)
        const hymnId = id ?? newId()
        const hymn: UserHymn = { id: hymnId, title, clef, notes, updatedAt: Date.now() }
        set((s) =>
          s.hymns.some((h) => h.id === hymnId)
            ? { hymns: s.hymns.map((h) => (h.id === hymnId ? hymn : h)) }
            : { hymns: [hymn, ...s.hymns] },
        )
        return hymnId
      },
      remove: (id) => set((s) => ({ hymns: s.hymns.filter((h) => h.id !== id) })),
      get: (id) => get().hymns.find((h) => h.id === id),
    }),
    {
      name: 'leitura-musical-hymns',
      version: 1,
      partialize: (s) => ({ hymns: s.hymns }),
      // estado salvo inválido volta ao inicial, sem lançar
      merge: (persisted, current) => {
        try {
          return { ...current, hymns: parseHymns((persisted as { hymns?: unknown } | null)?.hymns) }
        } catch {
          return { ...current, hymns: [] }
        }
      },
    },
  ),
)
