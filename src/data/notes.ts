// Modelo de nota e utilitários de solfejo (pt-BR)

export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
export type Accidental = '#' | 'b'
export type Duration = 'w' | 'h' | 'q' | '8' // semibreve, mínima, semínima, colcheia

export interface Note {
  step: Step
  octave: number
  accidental?: Accidental
  duration: Duration
  /** Ponto de aumento: 1 soma metade do valor da figura */
  dots?: 0 | 1
}

export interface Piece {
  id: string
  title: string
  level: 1 | 2 | 3 | 4
  clef: 'treble' | 'bass'
  notes: Note[]
}

// Mapa nota (cifra) -> solfejo pt-BR
export const SOLFEGE: Record<Step, string> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
}

/** Nome legível da nota em solfejo, ex.: "Dó", "Fá#" */
export function noteName(note: Note): string {
  return SOLFEGE[note.step] + (note.accidental ?? '')
}

/** Chave para o VexFlow, ex.: "c/4", "f#/4" */
export function vexKey(note: Note): string {
  const acc = note.accidental ?? ''
  return `${note.step.toLowerCase()}${acc}/${note.octave}`
}

/** Duração em batidas (semínima = 1 batida) */
export function durationBeats(duration: Duration): number {
  switch (duration) {
    case 'w':
      return 4
    case 'h':
      return 2
    case 'q':
      return 1
    case '8':
      return 0.5
  }
}

/** Duração em batidas considerando o ponto de aumento (× 1,5) */
export function noteBeats(n: { duration: Duration; dots?: 0 | 1 }): number {
  const base = durationBeats(n.duration)
  return n.dots === 1 ? base * 1.5 : base
}

/** Todas as notas naturais usadas no app, em ordem (para sortear) */
export const NATURAL_STEPS: Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
