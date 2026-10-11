import { beforeEach, expect, test } from 'vitest'
import { PASS_SCORE, useProgressStore } from './useProgressStore'

const KEY = 'leitura-musical-progress'

beforeEach(() => {
  localStorage.clear()
  useProgressStore.getState().reset()
})

test('melhor pontuação só sobe', () => {
  const s = useProgressStore.getState()
  s.recordScore('som', 'ex1', 8)
  useProgressStore.getState().recordScore('som', 'ex1', 5)
  expect(useProgressStore.getState().bestScore('som', 'ex1')).toBe(8)
  useProgressStore.getState().recordScore('som', 'ex1', 9)
  expect(useProgressStore.getState().bestScore('som', 'ex1')).toBe(9)
  expect(useProgressStore.getState().bestScore('som', 'outro')).toBeUndefined()
})

test('status da lição: novo, andamento, concluida', () => {
  const lesson = { id: 'som', exercises: [{ id: 'a' }, { id: 'b' }] }
  const st = () => useProgressStore.getState()
  expect(PASS_SCORE).toBe(7)
  expect(st().lessonStatus(lesson)).toBe('novo')
  st().recordScore('som', 'a', 3)
  // nota abaixo de 7 já é andamento
  expect(st().lessonStatus(lesson)).toBe('andamento')
  st().recordScore('som', 'a', 7)
  expect(st().lessonStatus(lesson)).toBe('andamento')
  st().recordScore('som', 'b', 6)
  expect(st().lessonStatus(lesson)).toBe('andamento')
  st().recordScore('som', 'b', 10)
  expect(st().lessonStatus(lesson)).toBe('concluida')
})

test('persiste na chave leitura-musical-progress', () => {
  useProgressStore.getState().recordScore('som', 'a', 8)
  const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null')
  expect(raw.version).toBe(1)
  expect(raw.state.best).toEqual({ 'som/a': 8 })
})

test('JSON corrompido no localStorage hidrata sem erro e com best vazio', async () => {
  localStorage.setItem(KEY, '{isto não é json')
  await expect(useProgressStore.persist.rehydrate()).resolves.toBeUndefined()
  expect(useProgressStore.getState().best).toEqual({})
  expect(useProgressStore.getState().lessonStatus({ id: 'som', exercises: [{ id: 'a' }] })).toBe('novo')
})

test('estado com forma inválida volta ao inicial', async () => {
  for (const state of [{ best: 'x' }, { best: { 'som/a': 'dez' } }, { best: { 'som/a': 99 } }, { best: [8] }, null, 42]) {
    useProgressStore.getState().reset()
    localStorage.setItem(KEY, JSON.stringify({ state, version: 1 }))
    await useProgressStore.persist.rehydrate()
    expect(useProgressStore.getState().best).toEqual({})
    expect(typeof useProgressStore.getState().recordScore).toBe('function')
  }
})

test('estado válido é hidratado', async () => {
  localStorage.setItem(KEY, JSON.stringify({ state: { best: { 'som/a': 9 } }, version: 1 }))
  await useProgressStore.persist.rehydrate()
  expect(useProgressStore.getState().bestScore('som', 'a')).toBe(9)
})

test('hidratação descarta só as entradas inválidas', async () => {
  const best = { 'som/a': 9, 'som/b': 'dez', 'som/c': 99, 'som/d': -1, 'pauta/a': 0, 'pauta/b': 6.5 }
  localStorage.setItem(KEY, JSON.stringify({ state: { best }, version: 1 }))
  await useProgressStore.persist.rehydrate()
  expect(useProgressStore.getState().best).toEqual({ 'som/a': 9, 'pauta/a': 0, 'pauta/b': 6.5 })
})

test('migrate da versão 1 mantém os dados', () => {
  const migrate = useProgressStore.persist.getOptions().migrate!
  const state = { best: { 'som/a': 8 } }
  expect(migrate(state, 1)).toEqual({ best: { 'som/a': 8 } })
})
