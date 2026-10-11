import { beforeEach, expect, test } from 'vitest'
import type { Note } from '../data/notes'
import { MAX_HYMN_NOTES, useHymnStore } from './useHymnStore'

const KEY = 'leitura-musical-hymns'
const notes: Note[] = [
  { step: 'G', octave: 4, duration: 'h' },
  { step: 'F', octave: 4, accidental: '#', duration: 'q', dots: 1 },
]

beforeEach(() => {
  localStorage.clear()
  useHymnStore.setState({ hymns: [] })
})

test('CRUD de hinos', () => {
  expect(MAX_HYMN_NOTES).toBe(400)
  const id = useHymnStore.getState().save({ title: 'Meu hino', clef: 'treble', notes })
  expect(typeof id).toBe('string')
  const h = useHymnStore.getState().get(id)
  expect(h).toMatchObject({ id, title: 'Meu hino', clef: 'treble', notes })
  expect(typeof h?.updatedAt).toBe('number')

  const id2 = useHymnStore.getState().save({ title: 'Outro', clef: 'bass', notes: [] })
  expect(id2).not.toBe(id)
  expect(useHymnStore.getState().hymns).toHaveLength(2)

  // atualizar mantém o id e não duplica
  const same = useHymnStore.getState().save({ id, title: 'Renomeado', clef: 'bass', notes })
  expect(same).toBe(id)
  expect(useHymnStore.getState().hymns).toHaveLength(2)
  expect(useHymnStore.getState().get(id)?.title).toBe('Renomeado')

  useHymnStore.getState().remove(id)
  expect(useHymnStore.getState().get(id)).toBeUndefined()
  expect(useHymnStore.getState().hymns).toHaveLength(1)
})

test('persiste na chave leitura-musical-hymns', () => {
  useHymnStore.getState().save({ title: 'A', clef: 'treble', notes })
  const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
  expect(raw.version).toBe(1)
  expect(raw.state.hymns).toHaveLength(1)
})

test('estado corrompido volta ao inicial sem lançar', async () => {
  const bad = [
    '{lixo',
    JSON.stringify({ state: { hymns: 'x' }, version: 1 }),
    JSON.stringify({ state: { hymns: [{ id: 1 }] }, version: 1 }),
    JSON.stringify({
      state: { hymns: [{ id: 'a', title: 'T', clef: 'treble', notes: [{ step: 'H', octave: 4, duration: 'q' }], updatedAt: 1 }] },
      version: 1,
    }),
  ]
  for (const raw of bad) {
    useHymnStore.setState({ hymns: [] })
    localStorage.setItem(KEY, raw)
    await useHymnStore.persist.rehydrate()
    expect(useHymnStore.getState().hymns).toEqual([])
  }
})

test('estado válido é hidratado', async () => {
  const hymn = { id: 'a', title: 'T', clef: 'treble', notes, updatedAt: 1 }
  localStorage.setItem(KEY, JSON.stringify({ state: { hymns: [hymn] }, version: 1 }))
  await useHymnStore.persist.rehydrate()
  expect(useHymnStore.getState().get('a')).toEqual(hymn)
})
