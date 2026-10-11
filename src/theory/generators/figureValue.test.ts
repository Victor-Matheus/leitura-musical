import { expect, test } from 'vitest'
import { noteBeats } from '../../data/notes'
import { mulberry32 } from '../rng'
import type { Question } from '../types'
import { checkQuestionInvariants, expectAnswerPositionsVary, expectHiddenScoreLabel } from './assertions'
import { figureValue } from './figureValue'

const BASIC = { include: ['w', 'h', 'q', '8'], rests: true, dotted: false }
const DOTTED = { include: ['h', 'q'], rests: false, dotted: true }

function shown(q: Question) {
  const el = q.score!.elements[0]
  if (el.kind === 'bar') throw new Error('esperava figura')
  return el.kind === 'note' ? { kind: 'note', duration: el.note.duration, dots: el.note.dots } : el
}

function isBeatsQuestion(q: Question) {
  return q.prompt.includes('tempos')
}

/** "1½" -> 1.5 */
function parseBeats(s: string): number {
  return s === '½' ? 0.5 : s.endsWith('½') ? Number(s.slice(0, -1)) + 0.5 : Number(s)
}

test.each([BASIC, DOTTED])('200 sementes respeitam as invariantes (%o)', (params) => {
  for (let seed = 1; seed <= 200; seed++) checkQuestionInvariants(figureValue(params, mulberry32(seed)))
})

test.each([BASIC, DOTTED])('a posição da resposta varia (%o)', (params) => {
  expectAnswerPositionsVary(figureValue, params, 50)
})

test('alterna perguntas de nome e de tempos; só usa as figuras incluídas', () => {
  let beats = 0
  let names = 0
  let rests = 0
  for (let seed = 1; seed <= 200; seed++) {
    const q = figureValue({ include: ['h', 'q'], rests: true, dotted: false }, mulberry32(seed))
    const fig = shown(q)
    expect(['h', 'q']).toContain(fig.duration)
    if (fig.kind === 'rest') rests++
    if (isBeatsQuestion(q)) {
      beats++
      expect(parseBeats(q.options[q.answer])).toBe(noteBeats(fig))
    } else {
      names++
    }
  }
  expect(beats).toBeGreaterThan(50)
  expect(names).toBeGreaterThan(50)
  expect(rests).toBeGreaterThan(50)
})

test('nome: resposta corresponde à figura ou pausa mostrada', () => {
  const NAMES = { w: 'semibreve', h: 'mínima', q: 'semínima', '8': 'colcheia' } as const
  for (let seed = 1; seed <= 200; seed++) {
    const q = figureValue(BASIC, mulberry32(seed))
    if (isBeatsQuestion(q)) continue
    const fig = shown(q)
    const expected = fig.kind === 'rest' ? `pausa de ${NAMES[fig.duration]}` : NAMES[fig.duration]
    expect(q.options[q.answer]).toBe(expected)
    if (fig.kind === 'rest') for (const o of q.options) expect(o.startsWith('pausa de ')).toBe(true)
  }
})

test('sem pausas, nunca mostra pausa; sem ponto, nunca pontua', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const q = figureValue({ include: ['w', 'h', 'q', '8'], rests: false, dotted: false }, mulberry32(seed))
    const fig = shown(q)
    expect(fig.kind).toBe('note')
    expect(fig.dots ?? 0).toBe(0)
  }
})

test('com ponto: pergunta de tempos sobre mínima pontuada tem resposta "3"', () => {
  let found = 0
  for (let seed = 1; seed <= 200; seed++) {
    const q = figureValue(DOTTED, mulberry32(seed))
    const fig = shown(q)
    if (!isBeatsQuestion(q) || fig.duration !== 'h' || fig.dots !== 1) continue
    found++
    expect(q.options[q.answer]).toBe('3')
  }
  expect(found).toBeGreaterThan(5)
})

test('com ponto: nome de figura pontuada termina em "pontuada"', () => {
  let found = 0
  for (let seed = 1; seed <= 200; seed++) {
    const q = figureValue(DOTTED, mulberry32(seed))
    const fig = shown(q)
    if (isBeatsQuestion(q) || fig.dots !== 1) continue
    found++
    expect(q.options[q.answer]).toBe(fig.duration === 'h' ? 'mínima pontuada' : 'semínima pontuada')
  }
  expect(found).toBeGreaterThan(5)
})

test('snapshot com mulberry32(1)', () => {
  expect(figureValue(BASIC, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 1,
      "explanation": "A pausa de semínima tem um traço em zigue-zague. Ela marca 1 tempo de silêncio.",
      "options": [
        "pausa de semibreve",
        "pausa de semínima",
        "pausa de mínima",
        "pausa de colcheia",
      ],
      "prompt": "Qual é esta pausa?",
      "score": {
        "clef": "treble",
        "elements": [
          {
            "duration": "q",
            "kind": "rest",
          },
        ],
      },
      "scoreLabel": "Uma pausa na pauta",
    }
  `)
  expect(figureValue(DOTTED, mulberry32(1))).toMatchInlineSnapshot(`
    {
      "answer": 2,
      "explanation": "É uma semínima (cabeça cheia e haste) com o ponto de aumento ao lado.",
      "options": [
        "semibreve pontuada",
        "semínima",
        "semínima pontuada",
        "mínima pontuada",
      ],
      "prompt": "Qual é esta figura?",
      "score": {
        "clef": "treble",
        "elements": [
          {
            "kind": "note",
            "note": {
              "dots": 1,
              "duration": "q",
              "octave": 4,
              "step": "B",
            },
          },
        ],
      },
      "scoreLabel": "Uma figura musical na pauta",
    }
  `)
})

test.each([BASIC, DOTTED])('aria-label da pauta não dá a resposta (%o)', (params) => {
  for (let seed = 0; seed < 200; seed++) {
    const q = figureValue(params, mulberry32(seed))
    expectHiddenScoreLabel(q)
    const isRest = q.score!.elements[0].kind === 'rest'
    expect(q.scoreLabel).toBe(isRest ? 'Uma pausa na pauta' : 'Uma figura musical na pauta')
  }
})
