import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Block } from '../theory/types'
import { LessonBlocks } from './LessonBlocks'

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(cleanup)

describe('LessonBlocks', () => {
  it('converte **negrito** em <strong>', () => {
    const blocks: Block[] = [{ kind: 'text', text: 'A **Clave** indica o nome das notas.' }]
    const { container } = render(<LessonBlocks blocks={blocks} highContrast={false} />)
    const strong = container.querySelector('strong')
    expect(strong?.textContent).toBe('Clave')
    expect(container.querySelector('p')?.textContent).toBe('A Clave indica o nome das notas.')
  })

  it('renderiza os cabeçalhos da tabela', () => {
    const blocks: Block[] = [{ kind: 'table', head: ['Figura', 'Tempos'], rows: [['Semínima', '1']] }]
    render(<LessonBlocks blocks={blocks} highContrast={false} />)
    expect(screen.getByRole('columnheader', { name: 'Figura' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Tempos' })).toBeTruthy()
    expect(screen.getByRole('cell', { name: 'Semínima' })).toBeTruthy()
  })

  it('mostra a dica e a legenda da pauta', () => {
    const blocks: Block[] = [
      { kind: 'tip', text: 'Treine devagar.' },
      {
        kind: 'score',
        clef: 'treble',
        elements: [{ kind: 'note', note: { step: 'C', octave: 4, duration: 'q' } }],
        caption: 'Dó na segunda linha',
      },
    ]
    render(<LessonBlocks blocks={blocks} highContrast={false} />)
    expect(screen.getByText('Treine devagar.')).toBeTruthy()
    expect(screen.getByText('Dó na segunda linha')).toBeTruthy()
    expect(screen.getByRole('img')).toBeTruthy()
  })
})
