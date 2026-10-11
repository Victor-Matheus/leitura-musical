import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Results } from './Results'
import { usePracticeStore } from '../store/usePracticeStore'
import type { Note, Step } from '../data/notes'

const note = (step: Step): Note => ({ step, octave: 4, duration: 'q' })

describe('Results', () => {
  beforeEach(() => {
    usePracticeStore.setState({
      lastSession: {
        pieceTitle: 'Teste',
        voiceEnabled: true,
        durationMs: 12000,
        results: [
          { note: note('C'), outcome: 'correct' },
          { note: note('D'), outcome: 'wrong' },
          { note: note('E'), outcome: 'missed' },
        ],
      },
    })
  })
  afterEach(cleanup)

  it('mostra a contagem de acertos e a legenda com "sem resposta"', () => {
    render(
      <MemoryRouter>
        <Results />
      </MemoryRouter>,
    )
    expect(screen.getByText('1 de 3 notas certas')).toBeTruthy()
    expect(screen.getByText(/sem resposta/)).toBeTruthy()
  })

  it('voz ligada sem nenhuma nota pontuada não mostra porcentagem', () => {
    usePracticeStore.setState({
      lastSession: {
        pieceTitle: 'Teste',
        voiceEnabled: true,
        durationMs: 12000,
        results: [
          { note: note('C'), outcome: null },
          { note: note('D'), outcome: null },
        ],
      },
    })
    render(
      <MemoryRouter>
        <Results />
      </MemoryRouter>,
    )
    expect(screen.queryByText(/%/)).toBeNull()
    expect(screen.queryByText(/notas certas/)).toBeNull()
  })

  it('com returnTo mostra "Voltar" e navega para lá; mantém "Nova lição"', () => {
    usePracticeStore.setState({
      lastSession: {
        pieceTitle: 'Teste',
        voiceEnabled: false,
        durationMs: 1000,
        results: [{ note: note('C'), outcome: null }],
        returnTo: '/hinos/abc/editar',
      },
    })
    render(
      <MemoryRouter initialEntries={['/resultado']}>
        <Routes>
          <Route path="/resultado" element={<Results />} />
          <Route path="/hinos/:id/editar" element={<p>Editor do hino</p>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: 'Nova lição' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('Editor do hino')).toBeTruthy()
  })

  it('sem returnTo não mostra "Voltar"', () => {
    render(
      <MemoryRouter>
        <Results />
      </MemoryRouter>,
    )
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
  })
})
