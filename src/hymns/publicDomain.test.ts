import { describe, expect, test } from 'vitest'
import type { Duration, Note } from '../data/notes'
import { measuresClose } from './measures'
import { PUBLIC_DOMAIN_HYMNS } from './publicDomain'

const n = (duration: Duration, dots?: 0 | 1) => ({ duration, dots })

describe('measuresClose', () => {
  test('casos básicos', () => {
    expect(measuresClose([n('h'), n('h'), n('w')], 4)).toBe(true)
    expect(measuresClose([n('q'), n('h')], 4)).toBe(false)
    expect(measuresClose([n('q'), n('h'), n('q'), n('h'), n('q'), n('h')], 3, 1)).toBe(true)
  })
  test('nota não pode atravessar a barra', () => {
    expect(measuresClose([n('h'), n('w'), n('h')], 4)).toBe(false)
  })
  test('ponto conta 1,5×', () => {
    expect(measuresClose([n('q', 1), n('8'), n('h')], 4)).toBe(true)
  })
  test('anacruse exige o complemento no fim', () => {
    expect(measuresClose([n('q'), n('h'), n('q'), n('h', 1)], 3, 1)).toBe(false)
    expect(measuresClose([], 4)).toBe(false)
  })
})

// MIDI simples para comparar altura (Sol3 = 55, Sol5 = 79)
const BASE: Record<Note['step'], number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const midi = (x: Note) => 12 * (x.octave + 1) + BASE[x.step] + (x.accidental === '#' ? 1 : x.accidental === 'b' ? -1 : 0)

test('três hinos embutidos, ids esperados', () => {
  expect(PUBLIC_DOMAIN_HYMNS.map((h) => h.id)).toEqual(['old-hundredth', 'new-britain', 'hino-da-alegria'])
})

describe.each(PUBLIC_DOMAIN_HYMNS)('$id', (h) => {
  test('fecha os compassos', () => {
    const beats = Number(h.timeSignature.split('/')[0])
    expect(measuresClose(h.piece.notes, beats, h.pickupBeats)).toBe(true)
  })
  test('domínio público, com origem', () => {
    expect(h.year).toBeLessThan(1900)
    expect(h.origin.length).toBeGreaterThan(0)
    expect(h.title.length).toBeGreaterThan(0)
  })
  test('clave de sol e notas entre Sol3 e Sol5, sem pausas', () => {
    expect(h.piece.clef).toBe('treble')
    expect(h.piece.id).toBe(h.id)
    expect(h.piece.notes.length).toBeGreaterThan(10)
    for (const note of h.piece.notes) {
      expect(midi(note)).toBeGreaterThanOrEqual(55)
      expect(midi(note)).toBeLessThanOrEqual(79)
      expect(Object.keys(note).sort()).toEqual(expect.arrayContaining(['duration', 'octave', 'step']))
      expect(note).not.toHaveProperty('rest')
    }
  })
  test('Fá sempre sustenido (Sol maior e Ré maior)', () => {
    for (const note of h.piece.notes.filter((x) => x.step === 'F')) expect(note.accidental).toBe('#')
  })
})
