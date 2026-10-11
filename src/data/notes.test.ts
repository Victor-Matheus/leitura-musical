import { expect, test } from 'vitest'
import { noteBeats, noteName } from './notes'

test('noteBeats considera o ponto de aumento', () => {
  expect(noteBeats({ duration: 'h', dots: 1 })).toBe(3)
  expect(noteBeats({ duration: 'q' })).toBe(1)
  expect(noteBeats({ duration: '8', dots: 1 })).toBe(0.75)
  expect(noteBeats({ duration: 'w', dots: 0 })).toBe(4)
})

test('noteName mostra ♯ e ♭', () => {
  expect(noteName({ step: 'F', accidental: '#', octave: 4, duration: 'q' })).toBe('Fá♯')
  expect(noteName({ step: 'B', accidental: 'b', octave: 4, duration: 'q' })).toBe('Si♭')
  expect(noteName({ step: 'C', octave: 4, duration: 'q' })).toBe('Dó')
})
