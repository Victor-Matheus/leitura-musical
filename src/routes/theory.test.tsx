import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Theory } from './Theory'
import { Lesson } from './Lesson'
import { Exercise } from './Exercise'
import { CURRICULUM, getLesson } from '../theory/curriculum'
import { GENERATORS } from '../theory/generators'
import { mulberry32 } from '../theory/rng'
import { useProgressStore } from '../store/useProgressStore'

function PraticarProbe() {
  const location = useLocation()
  const state = location.state as { piece?: { title: string }; returnTo?: string } | null
  return (
    <p>
      praticar: {state?.piece?.title ?? 'sem peça'} volta: {state?.returnTo ?? 'nenhuma'}
    </p>
  )
}

function renderAt(path: string, seed?: number) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/teoria" element={<Theory />} />
        <Route path="/teoria/:lessonId" element={<Lesson />} />
        <Route path="/teoria/:lessonId/exercicio/:exerciseId" element={<Exercise seed={seed} />} />
        <Route path="/praticar" element={<PraticarProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('telas de teoria', () => {
  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  beforeEach(() => useProgressStore.getState().reset())
  afterEach(cleanup)

  it('Theory lista as 12 lições em ordem', () => {
    renderAt('/teoria')
    expect(screen.getByText('Teoria musical')).toBeTruthy()
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual(CURRICULUM.map((l) => l.title))
    expect(titles).toHaveLength(12)
  })

  it('Lesson mostra o título e o botão do exercício', () => {
    const lesson = getLesson('compasso')!
    renderAt('/teoria/compasso')
    expect(screen.getByRole('heading', { level: 1, name: lesson.title })).toBeTruthy()
    expect(screen.getByRole('button', { name: new RegExp(lesson.exercises[0].title) })).toBeTruthy()
  })

  it('o botão do exercício abre /teoria/<lição>/exercicio/<exercício>', () => {
    const lesson = getLesson('compasso')!
    renderAt('/teoria/compasso')
    fireEvent.click(screen.getByRole('button', { name: new RegExp(lesson.exercises[0].title) }))
    expect(screen.getByText('1 / 10')).toBeTruthy()
  })

  it('Lesson com id inválido mostra "Lição não encontrada"', () => {
    renderAt('/teoria/xyz')
    expect(screen.getByText('Lição não encontrada')).toBeTruthy()
  })

  it('Lesson mostra a melhor nota do exercício', () => {
    const lesson = getLesson('compasso')!
    useProgressStore.getState().recordScore('compasso', lesson.exercises[0].id, 8)
    renderAt('/teoria/compasso')
    expect(screen.getByText('Melhor: 8/10')).toBeTruthy()
  })

  it('Exercise com seed=1: acertar tudo grava 10 e mostra "10 / 10"', () => {
    const lesson = getLesson('compasso')!
    const ex = lesson.exercises[0]
    const rng = mulberry32(1)
    const questions = Array.from({ length: 10 }, () => GENERATORS[ex.type](ex.params, rng))
    renderAt(`/teoria/compasso/exercicio/${ex.id}`, 1)
    for (let i = 0; i < 10; i++) {
      fireEvent.click(screen.getByRole('button', { name: questions[i].options[questions[i].answer] }))
      fireEvent.click(screen.getByRole('button', { name: i === 9 ? 'Ver resultado' : 'Próxima' }))
    }
    expect(screen.getByText('10 / 10')).toBeTruthy()
    expect(screen.getByText('Muito bem!')).toBeTruthy()
    expect(useProgressStore.getState().bestScore('compasso', ex.id)).toBe(10)
  })

  it('"Leitura métrica" navega para /praticar com state.piece e volta para a lição', () => {
    const lesson = CURRICULUM.find((l) => l.reading)!
    renderAt(`/teoria/${lesson.id}`)
    fireEvent.click(screen.getByRole('button', { name: 'Leitura métrica' }))
    expect(screen.getByText(`praticar: ${lesson.reading!.title} volta: /teoria/${lesson.id}`)).toBeTruthy()
  })
})
