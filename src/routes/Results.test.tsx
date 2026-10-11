import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
})
