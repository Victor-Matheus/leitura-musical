// Gerador de escala maior: nota que falta ou qual é a escala

import type { Accidental, Note, Step } from '../../data/notes'
import { NATURAL_STEPS } from '../../data/notes'
import { MAJOR_KEYS, majorScale, solfege } from '../music'
import { pick, shuffle } from '../rng'
import type { Generator, Question, ScoreElement } from '../types'

type Key = (typeof MAJOR_KEYS)[number]

const PATTERN = 'tom, tom, semitom, tom, tom, tom, semitom'
/** Grafias raras para iniciantes, nunca usadas como opção */
const RARE = new Set(['E#', 'Fb', 'B#', 'Cb'])

/** Os 8 graus (tônica até a oitava), subindo a partir da oitava 4 */
function scaleNotes(key: Key): Note[] {
  const start = NATURAL_STEPS.indexOf(key.tonic.step)
  const pcs = majorScale(key.tonic)
  return [...pcs, pcs[0]].map((pc, i) => {
    const note: Note = { step: pc.step, octave: 4 + Math.floor((start + i) / 7), duration: 'q' }
    if (pc.accidental) note.accidental = pc.accidental
    return note
  })
}

function keysFrom(names: unknown): Key[] {
  const list = Array.isArray(names) ? names : []
  const keys = MAJOR_KEYS.filter((k) => list.includes(k.name))
  return keys.length > 0 ? keys : MAJOR_KEYS
}

function scaleText(notes: Note[]): string {
  return notes.map((n) => solfege(n)).join(', ')
}

/** Mesma letra com outro acidente e as letras vizinhas naturais */
function noteDistractors(correct: Note, rng: () => number): string[] {
  const variants: { step: Step; accidental?: Accidental }[] = [{ step: correct.step }, { step: correct.step, accidental: '#' }, { step: correct.step, accidental: 'b' }]
  const sameLetter = variants.filter((v) => v.accidental !== correct.accidental && !RARE.has(v.step + (v.accidental ?? '')))
  const i = NATURAL_STEPS.indexOf(correct.step)
  const neighbors = [NATURAL_STEPS[(i + 6) % 7], NATURAL_STEPS[(i + 1) % 7]].map((step) => ({ step }))
  return [...shuffle(rng, sameLetter), ...shuffle(rng, neighbors)].slice(0, 3).map((v) => solfege(v))
}

function finish(prompt: string, elements: ScoreElement[], caption: string | undefined, correct: string, distractors: string[], rng: () => number, explanation: string): Question {
  const scoreLabel = caption ? 'Uma escala com uma nota faltando' : 'Uma escala na pauta'
  const options = shuffle(rng, [correct, ...distractors])
  return {
    prompt,
    score: caption ? { clef: 'treble', elements, caption } : { clef: 'treble', elements },
    scoreLabel,
    options,
    answer: options.indexOf(correct),
    explanation,
  }
}

export const scale: Generator = (params, rng) => {
  const keys = keysFrom(params.keys)
  const key = pick(rng, keys)
  const notes = scaleNotes(key)
  const explanation = `A escala de ${key.name} é ${scaleText(notes)}. Ela segue o padrão ${PATTERN}.`

  if (rng() < 0.5) {
    // Variante 1: um grau (2º ao 7º) trocado por "?"
    const degree = 1 + Math.floor(rng() * 6)
    const missing = notes[degree]
    const elements: ScoreElement[] = notes.map((note, i) => (i === degree ? { kind: 'rest', duration: 'q' } : { kind: 'note', note }))
    const caption = notes.map((n, i) => (i === degree ? '?' : solfege(n))).join(' – ')
    return finish(
      `Qual nota falta na escala de ${key.name}?`,
      elements,
      caption,
      solfege(missing),
      noteDistractors(missing, rng),
      rng,
      `${explanation} O ${degree + 1}º grau é ${solfege(missing)}.`,
    )
  }

  // Variante 2: escala completa, qual é?
  const preferred = shuffle(rng, keys.filter((k) => k !== key))
  const rest = shuffle(rng, MAJOR_KEYS.filter((k) => k !== key && !keys.includes(k)))
  const distractors = [...preferred, ...rest].slice(0, 3).map((k) => k.name)
  return finish(
    'Qual escala maior está na pauta?',
    notes.map((note) => ({ kind: 'note', note })),
    undefined,
    key.name,
    distractors,
    rng,
    `Ela começa e termina em ${solfege(key.tonic)}. ${explanation}`,
  )
}
