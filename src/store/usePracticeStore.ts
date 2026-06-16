import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Note } from '../data/notes'

export type FontSize = 'normal' | 'grande' | 'enorme'
export type DisplayMode = 'flashcard' | 'partitura'

export interface Settings {
  voiceEnabled: boolean
  bpm: number
  fontSize: FontSize
  highContrast: boolean
  showHint: boolean // mostra o nome da nota como dica
  displayMode: DisplayMode
}

// Resultado de uma única nota tocada na sessão
export interface NoteResult {
  note: Note
  correct: boolean | null // null = não respondida (modo sem voz)
}

export interface SessionResult {
  pieceTitle: string
  results: NoteResult[]
  voiceEnabled: boolean
  durationMs: number
}

interface State {
  settings: Settings
  lastSession: SessionResult | null
  setSettings: (patch: Partial<Settings>) => void
  saveSession: (session: SessionResult) => void
}

export const usePracticeStore = create<State>()(
  persist(
    (set) => ({
      settings: {
        voiceEnabled: true,
        bpm: 60,
        fontSize: 'grande',
        highContrast: false,
        showHint: false,
        displayMode: 'flashcard',
      },
      lastSession: null,
      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      saveSession: (session) => set({ lastSession: session }),
    }),
    {
      name: 'leitura-musical',
      // não persistimos a sessão (apenas as configurações)
      partialize: (s) => ({ settings: s.settings }) as State,
    },
  ),
)
