import { expect, test } from 'vitest'
import type { Accidental, Step } from '../data/notes'
import type { Pitch } from './music'
import { MAJOR_KEYS, intervalBetween, intervalName, majorScale, pitchToMidi, semitones, solfege } from './music'

function p(s: string): Pitch {
  const m = /^([A-G])([#b]?)(-?\d+)$/.exec(s)
  if (!m) throw new Error(`nota inválida: ${s}`)
  const pitch: Pitch = { step: m[1] as Step, octave: Number(m[3]) }
  if (m[2]) pitch.accidental = m[2] as Accidental
  return pitch
}

test.each([
  ['C4', 'E4', '3ª maior'], ['C4', 'Eb4', '3ª menor'], ['C4', 'G4', '5ª justa'], ['C4', 'F4', '4ª justa'],
  ['C4', 'F#4', '4ª aumentada'], ['B3', 'F4', '5ª diminuta'], ['C4', 'D4', '2ª maior'], ['E4', 'F4', '2ª menor'],
  ['C4', 'A4', '6ª maior'], ['E4', 'C5', '6ª menor'], ['C4', 'B4', '7ª maior'], ['D4', 'C5', '7ª menor'],
  ['C4', 'C5', '8ª justa'], ['G4', 'B4', '3ª maior'], ['A4', 'C5', '3ª menor'], ['D4', 'F#4', '3ª maior'],
  ['F4', 'Bb4', '4ª justa'], ['Bb3', 'F4', '5ª justa'], ['E4', 'G#4', '3ª maior'], ['B3', 'D4', '3ª menor'],
])('%s→%s = %s', (a, b, name) => expect(intervalName(intervalBetween(p(a), p(b)), true)).toBe(name))

test('nome do intervalo sem qualidade', () => {
  expect(intervalName({ number: 2, quality: 'maior' }, false)).toBe('2ª')
  expect(intervalName({ number: 5, quality: 'justa' }, false)).toBe('5ª')
})

test('escalas maiores', () => {
  expect(majorScale({ step: 'G' }).map(solfege)).toEqual(['Sol', 'Lá', 'Si', 'Dó', 'Ré', 'Mi', 'Fá♯'])
  expect(majorScale({ step: 'F' }).map(solfege)).toEqual(['Fá', 'Sol', 'Lá', 'Si♭', 'Dó', 'Ré', 'Mi'])
  expect(majorScale({ step: 'D' }).map(solfege)).toEqual(['Ré', 'Mi', 'Fá♯', 'Sol', 'Lá', 'Si', 'Dó♯'])
  expect(majorScale({ step: 'B', accidental: 'b' }).map(solfege)).toEqual(['Si♭', 'Dó', 'Ré', 'Mi♭', 'Fá', 'Sol', 'Lá'])
  expect(majorScale({ step: 'C' }).map(solfege)).toEqual(['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'])
})

test('armaduras', () => {
  expect(MAJOR_KEYS.find((k) => k.name === 'Ré maior')).toMatchObject({ sharps: 2, flats: 0, vexKey: 'D' })
  expect(MAJOR_KEYS.find((k) => k.name === 'Mi♭ maior')).toMatchObject({ sharps: 0, flats: 3, vexKey: 'Eb' })
  expect(MAJOR_KEYS).toHaveLength(9)
})

test('armadura bate com os acidentes da escala', () => {
  for (const k of MAJOR_KEYS) {
    const scale = majorScale(k.tonic)
    expect(scale.filter((d) => d.accidental === '#')).toHaveLength(k.sharps)
    expect(scale.filter((d) => d.accidental === 'b')).toHaveLength(k.flats)
  }
})

test('midi e semitons', () => {
  expect(pitchToMidi(p('C4'))).toBe(60)
  expect(pitchToMidi(p('A4'))).toBe(69)
  expect(pitchToMidi(p('Bb3'))).toBe(58)
  expect(semitones(p('C4'), p('G4'))).toBe(7)
  expect(semitones(p('G4'), p('C4'))).toBe(-7)
})
