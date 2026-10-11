import { describe, expect, test } from 'vitest'
import type { Duration } from '../data/notes'
import { noteBeats } from '../data/notes'
import { measuresClose } from '../hymns/measures'
import { CURRICULUM, getExercise, getLesson } from './curriculum'
import { checkQuestionInvariants } from './generators/assertions'
import { GENERATORS } from './generators/index'
import { mulberry32 } from './rng'
import type { ScoreElement } from './types'

const IDS = [
  'som',
  'pauta-clave-sol',
  'clave-fa',
  'figuras-pausas',
  'compasso',
  'ponto-ligadura',
  'acidentes',
  'tom-semitom',
  'intervalos',
  'escala-maior',
  'armaduras',
  'andamento-dinamica',
]

type Timed = { duration: Duration; dots?: 0 | 1 }

/** Notas e pausas de cada compasso, separadas pelas barras */
function measuresOf(elements: ScoreElement[]): Timed[][] {
  const out: Timed[][] = [[]]
  for (const e of elements) {
    if (e.kind === 'bar') out.push([])
    else out[out.length - 1].push(e.kind === 'note' ? e.note : e)
  }
  return out.filter((m) => m.length > 0)
}

test('12 lições, nos ids da trilha, com ordem 1..12 e ids únicos', () => {
  expect(CURRICULUM.map((l) => l.id)).toEqual(IDS)
  expect(CURRICULUM.map((l) => l.order)).toEqual(IDS.map((_, i) => i + 1))
  expect(new Set(CURRICULUM.map((l) => l.id)).size).toBe(12)
})

test('getLesson e getExercise', () => {
  expect(getLesson('xyz')).toBeUndefined()
  expect(getLesson('compasso')?.order).toBe(5)
  const first = CURRICULUM[0].exercises[0]
  expect(getExercise('som', first.id)).toBe(first)
  expect(getExercise('som', 'xyz')).toBeUndefined()
  expect(getExercise('xyz', first.id)).toBeUndefined()
})

describe.each(CURRICULUM.map((l) => [l.id, l] as const))('lição %s', (_id, lesson) => {
  test('título, resumo e 3 a 7 blocos sem texto vazio', () => {
    expect(lesson.title.trim()).not.toBe('')
    expect(lesson.summary.trim()).not.toBe('')
    expect(lesson.blocks.length).toBeGreaterThanOrEqual(3)
    expect(lesson.blocks.length).toBeLessThanOrEqual(7)
    for (const b of lesson.blocks) {
      if (b.kind === 'text' || b.kind === 'tip') expect(b.text.trim()).not.toBe('')
      if (b.kind === 'table') {
        expect(b.head.length).toBeGreaterThan(0)
        for (const row of b.rows) expect(row.length).toBe(b.head.length)
      }
      if (b.kind === 'score' && b.caption !== undefined) expect(b.caption.trim()).not.toBe('')
    }
  })

  test('tem bloco de pauta (exceto a lição 1)', () => {
    if (lesson.order === 1) return
    expect(lesson.blocks.some((b) => b.kind === 'score')).toBe(true)
  })

  test('1 ou 2 exercícios, com ids únicos, cujo gerador roda 10 vezes', () => {
    expect(lesson.exercises.length).toBeGreaterThanOrEqual(1)
    expect(lesson.exercises.length).toBeLessThanOrEqual(2)
    expect(new Set(lesson.exercises.map((e) => e.id)).size).toBe(lesson.exercises.length)
    for (const ex of lesson.exercises) {
      expect(ex.title.trim()).not.toBe('')
      const gen = GENERATORS[ex.type]
      expect(gen).toBeTypeOf('function')
      for (let i = 0; i < 10; i++) checkQuestionInvariants(gen(ex.params, mulberry32(i)))
    }
  })

  test('blocos de pauta com fórmula de compasso fecham os compassos', () => {
    for (const b of lesson.blocks) {
      if (b.kind !== 'score' || !b.timeSignature) continue
      const [top, bottom] = b.timeSignature.split('/').map(Number)
      expect(bottom).toBe(4)
      const measures = measuresOf(b.elements)
      expect(measures.length).toBeGreaterThan(0)
      for (const m of measures) expect(measuresClose(m, top)).toBe(true)
      expect(measuresClose(measures.flat(), top)).toBe(true)
    }
  })

  test('leitura: só notas, 8 a 16, id e título padronizados', () => {
    const piece = lesson.reading
    if (!piece) return
    expect(piece.id).toBe(`leitura-${lesson.id}`)
    expect(piece.title).toBe(`Leitura — ${lesson.title}`)
    expect(piece.notes.length).toBeGreaterThanOrEqual(8)
    expect(piece.notes.length).toBeLessThanOrEqual(16)
    for (const n of piece.notes) {
      expect(n).toHaveProperty('step')
      expect(n).toHaveProperty('octave')
      expect(noteBeats(n)).toBeGreaterThan(0)
    }
  })
})

test('as leituras previstas na trilha existem', () => {
  const withReading = CURRICULUM.filter((l) => l.reading).map((l) => l.id)
  expect(withReading).toEqual(['pauta-clave-sol', 'figuras-pausas', 'compasso', 'ponto-ligadura', 'escala-maior'])
})

test('lição 6 usa mínima pontuada e lição 10 escreve Fá♯ com sustenido', () => {
  const six = getLesson('ponto-ligadura')?.reading?.notes ?? []
  expect(six.some((n) => n.duration === 'h' && n.dots === 1)).toBe(true)
  const ten = getLesson('escala-maior')?.reading?.notes ?? []
  const fs = ten.filter((n) => n.step === 'F')
  expect(fs.length).toBeGreaterThan(0)
  for (const n of fs) expect(n.accidental).toBe('#')
})

test('GENERATORS cobre todos os tipos de exercício', () => {
  expect(Object.keys(GENERATORS).sort()).toEqual(
    ['concept', 'figureValue', 'interval', 'keySignature', 'measureFill', 'noteName', 'scale'].sort(),
  )
})
