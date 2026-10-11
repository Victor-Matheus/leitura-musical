import { expect, test } from 'vitest'
import type { Accidental, Step } from '../../data/notes'
import { pitchToMidi, solfege } from '../music'
import { mulberry32 } from '../rng'
import { checkQuestionInvariants, expectAnswerPositionsVary } from './assertions'
import { noteName } from './noteName'

const TREBLE = { clef: 'treble', low: 'C4', high: 'G4' }
const BASS = { clef: 'bass', low: 'G2', high: 'C4' }
const ACCIDENTALS = { clef: 'treble', low: 'C4', high: 'C5', accidentals: true }

const STEPS: Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
/** Classe de altura de cada nome em solfejo (naturais, sustenidos e bemóis) */
const PITCH_CLASS = new Map<string, number>()
for (const step of STEPS) {
  for (const accidental of [undefined, '#', 'b'] as (Accidental | undefined)[]) {
    PITCH_CLASS.set(solfege({ step, accidental }), (pitchToMidi({ step, accidental, octave: 4 }) + 12) % 12)
  }
}

function shownNote(q: ReturnType<typeof noteName>) {
  const el = q.score!.elements[0]
  if (el.kind !== 'note') throw new Error('esperava nota')
  return el.note
}

test.each([TREBLE, BASS, ACCIDENTALS])('200 sementes respeitam as invariantes (%o)', (params) => {
  for (let seed = 1; seed <= 200; seed++) checkQuestionInvariants(noteName(params, mulberry32(seed)))
})

test.each([TREBLE, BASS, ACCIDENTALS])('a posição da resposta varia (%o)', (params) => {
  expectAnswerPositionsVary(noteName, params, 50)
})

test('clave de fá, Sol2–Dó4: resposta é o solfejo da semibreve mostrada, dentro do range', () => {
  const low = pitchToMidi({ step: 'G', octave: 2 })
  const high = pitchToMidi({ step: 'C', octave: 4 })
  for (let seed = 1; seed <= 200; seed++) {
    const q = noteName(BASS, mulberry32(seed))
    expect(q.score!.clef).toBe('bass')
    expect(q.score!.elements).toHaveLength(1)
    const note = shownNote(q)
    expect(note.duration).toBe('w')
    expect(note.accidental).toBeUndefined()
    expect(q.options[q.answer]).toBe(solfege(note))
    const midi = pitchToMidi(note)
    expect(midi).toBeGreaterThanOrEqual(low)
    expect(midi).toBeLessThanOrEqual(high)
  }
})

test('sem acidentes, nenhuma opção tem ♯ ou ♭', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const q = noteName(TREBLE, mulberry32(seed))
    for (const o of q.options) expect(o).not.toMatch(/[♯♭]/)
  }
})

test('com acidentes: nenhum par de opções é enarmônico; nada de Mi♯, Si♯, Fá♭, Dó♭', () => {
  let altered = 0
  const low = pitchToMidi({ step: 'C', octave: 4 })
  const high = pitchToMidi({ step: 'C', octave: 5 })
  for (let seed = 1; seed <= 200; seed++) {
    const q = noteName(ACCIDENTALS, mulberry32(seed))
    const note = shownNote(q)
    if (note.accidental) altered++
    expect(q.options[q.answer]).toBe(solfege(note))
    const midi = pitchToMidi(note)
    expect(midi).toBeGreaterThanOrEqual(low)
    expect(midi).toBeLessThanOrEqual(high)
    const pcs = q.options.map((o) => PITCH_CLASS.get(o))
    for (const pc of pcs) expect(pc).toBeDefined()
    expect(new Set(pcs).size).toBe(q.options.length)
    for (const o of q.options) expect(['Mi♯', 'Si♯', 'Fá♭', 'Dó♭']).not.toContain(o)
  }
  expect(altered).toBeGreaterThan(40)
})

test('snapshot com mulberry32(1)', () => {
  expect(noteName(TREBLE, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 1,
      "explanation": "Na clave de sol, a nota no 1º espaço é Fá.",
      "options": [
        "Ré",
        "Fá",
        "Lá",
        "Si",
      ],
      "prompt": "Qual é o nome desta nota?",
      "score": {
        "clef": "treble",
        "elements": [
          {
            "kind": "note",
            "note": {
              "duration": "w",
              "octave": 4,
              "step": "F",
            },
          },
        ],
      },
    }
  `)
  expect(noteName(ACCIDENTALS, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 2,
      "explanation": "Na clave de sol, a nota na 1ª linha suplementar inferior é Dó.",
      "options": [
        "Fá",
        "Lá",
        "Dó",
        "Dó♯",
      ],
      "prompt": "Qual é o nome desta nota?",
      "score": {
        "clef": "treble",
        "elements": [
          {
            "kind": "note",
            "note": {
              "duration": "w",
              "octave": 4,
              "step": "C",
            },
          },
        ],
      },
    }
  `)
})
