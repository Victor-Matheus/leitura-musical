import { expect, test } from 'vitest'
import type { Note } from '../data/notes'
import { decodeHymn, encodeHymn } from './codec'

const notes: Note[] = [
  { step: 'G', octave: 4, duration: 'h' },
  { step: 'F', octave: 4, accidental: '#', duration: 'q', dots: 1 },
  { step: 'B', octave: 3, accidental: 'b', duration: '8' },
]

function rawCode(payload: unknown): string {
  const b64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return 'LM1:' + b64
}

test('ida e volta, com acentos no título', () => {
  const hymn = { title: 'Canção de louvor — ação', clef: 'bass' as const, notes }
  const code = encodeHymn(hymn)
  expect(code.startsWith('LM1:')).toBe(true)
  expect(code.slice(4)).toMatch(/^[A-Za-z0-9_-]+$/)
  expect(decodeHymn(code)).toEqual(hymn)
})

test('rejeita prefixo errado', () => {
  expect(() => decodeHymn('XX:abc')).toThrow('invalid')
  expect(() => decodeHymn('')).toThrow('invalid')
})

test('rejeita base64 quebrado e JSON quebrado', () => {
  expect(() => decodeHymn('LM1:@@@')).toThrow('invalid')
  expect(() => decodeHymn('LM1:a')).toThrow('invalid')
  expect(() => decodeHymn('LM1:' + btoa('{nao json'))).toThrow('invalid')
})

test('rejeita JSON sem notes ou com campos inválidos', () => {
  expect(() => decodeHymn(rawCode({ title: 'T', clef: 'treble' }))).toThrow('invalid')
  expect(() => decodeHymn(rawCode({ title: 'T', clef: 'alto', notes }))).toThrow('invalid')
  expect(() => decodeHymn(rawCode({ title: 1, clef: 'treble', notes }))).toThrow('invalid')
  expect(() => decodeHymn(rawCode({ title: 'T', clef: 'treble', notes: [{ step: 'G', octave: 4, duration: 'x' }] }))).toThrow(
    'invalid',
  )
  expect(() => decodeHymn(rawCode([1, 2]))).toThrow('invalid')
})

test('rejeita mais de 400 notas', () => {
  const many: Note[] = Array.from({ length: 401 }, () => ({ step: 'C', octave: 4, duration: 'q' }))
  expect(() => decodeHymn(rawCode({ title: 'T', clef: 'treble', notes: many }))).toThrow('invalid')
  expect(decodeHymn(rawCode({ title: 'T', clef: 'treble', notes: many.slice(0, 400) })).notes).toHaveLength(400)
})

test('descarta campos extras das notas', () => {
  const decoded = decodeHymn(rawCode({ title: 'T', clef: 'treble', notes: [{ step: 'G', octave: 4, duration: 'q', lixo: 1 }] }))
  expect(decoded.notes).toEqual([{ step: 'G', octave: 4, duration: 'q' }])
})
