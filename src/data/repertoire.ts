import type { Note, Piece, Step } from './notes'
import { NATURAL_STEPS } from './notes'

const q = (step: Step, octave = 4): Note => ({ step, octave, duration: 'q' })
const h = (step: Step, octave = 4): Note => ({ step, octave, duration: 'h' })

// Escala de Dó maior (subindo e descendo) — primeiro contato
const SCALE_C: Piece = {
  id: 'escala-do-maior',
  title: 'Escala de Dó Maior',
  level: 1,
  clef: 'treble',
  notes: [
    q('C'), q('D'), q('E'), q('F'), q('G'), q('A'), q('B'), q('C', 5),
    q('C', 5), q('B'), q('A'), q('G'), q('F'), q('E'), q('D'), h('C'),
  ],
}

// Brilha Brilha Estrelinha (Twinkle Twinkle) — domínio público
const TWINKLE: Piece = {
  id: 'brilha-brilha',
  title: 'Brilha Brilha Estrelinha',
  level: 1,
  clef: 'treble',
  notes: [
    q('C'), q('C'), q('G'), q('G'), q('A'), q('A'), h('G'),
    q('F'), q('F'), q('E'), q('E'), q('D'), q('D'), h('C'),
    q('G'), q('G'), q('F'), q('F'), q('E'), q('E'), h('D'),
    q('G'), q('G'), q('F'), q('F'), q('E'), q('E'), h('D'),
    q('C'), q('C'), q('G'), q('G'), q('A'), q('A'), h('G'),
    q('F'), q('F'), q('E'), q('E'), q('D'), q('D'), h('C'),
  ],
}

// Lightly Row (Suzuki bk1) — melodia tradicional de domínio público
const LIGHTLY_ROW: Piece = {
  id: 'lightly-row',
  title: 'Lightly Row',
  level: 1,
  clef: 'treble',
  notes: [
    q('G'), q('E'), q('E'), q('F'), q('D'), q('D'),
    q('C'), q('D'), q('E'), q('F'), q('G'), q('G'), q('G'),
    q('G'), q('E'), q('E'), q('F'), q('D'), q('D'),
    q('C'), q('E'), q('G'), q('G'), h('C', 5),
  ],
}

// Go Tell Aunt Rhody — melodia tradicional de domínio público
const AUNT_RHODY: Piece = {
  id: 'aunt-rhody',
  title: 'Go Tell Aunt Rhody',
  level: 2,
  clef: 'treble',
  notes: [
    q('E'), q('E'), q('D'), q('C'), q('D'), q('E'), h('E'),
    q('D'), q('D'), q('C'), h('C'),
    q('E'), q('E'), q('D'), q('C'), q('D'), q('E'), h('E'),
    q('D'), q('D'), q('C'), q('D'), h('C'),
  ],
}

// Melodias fixas listadas na Home
export const PIECES: Piece[] = [SCALE_C, TWINKLE, LIGHTLY_ROW, AUNT_RHODY]

// ---- Drills de notas aleatórias ----

// Faixa de notas por nível (vai ampliando a região da pauta)
const LEVEL_RANGE: Record<number, Note[]> = {
  1: [q('C'), q('D'), q('E'), q('F'), q('G')],
  2: [q('C'), q('D'), q('E'), q('F'), q('G'), q('A'), q('B'), q('C', 5)],
  3: [q('G', 3), q('A', 3), q('B', 3), q('C'), q('D'), q('E'), q('F'), q('G'), q('A'), q('B'), q('C', 5)],
  4: [
    q('G', 3), q('A', 3), q('B', 3), q('C'), q('D'), q('E'), q('F'), q('G'),
    q('A'), q('B'), q('C', 5), q('D', 5), q('E', 5), q('F', 5), q('G', 5),
  ],
}

/** Gera uma lição de notas aleatórias para o nível dado */
export function makeRandomDrill(level: 1 | 2 | 3 | 4, count = 12): Piece {
  const pool = LEVEL_RANGE[level]
  const notes: Note[] = []
  let last = -1
  for (let i = 0; i < count; i++) {
    let idx = Math.floor(Math.random() * pool.length)
    if (idx === last && pool.length > 1) idx = (idx + 1) % pool.length // evita repetir
    last = idx
    notes.push({ ...pool[idx], duration: 'q' })
  }
  return {
    id: `drill-${level}-${Date.now()}`,
    title: `Notas Aleatórias — Nível ${level}`,
    level,
    clef: 'treble',
    notes,
  }
}

export const DRILL_LEVELS = [1, 2, 3, 4] as const

export { NATURAL_STEPS }
