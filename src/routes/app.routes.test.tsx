import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { getLesson } from '../theory/curriculum'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('rotas do App', () => {
  afterEach(cleanup)

  it('/teoria mostra a trilha de teoria', () => {
    renderAt('/teoria')
    expect(screen.getByRole('heading', { level: 1, name: 'Teoria musical' })).toBeTruthy()
  })

  it('/hinos mostra a tela de hinos', () => {
    renderAt('/hinos')
    expect(screen.getByRole('heading', { level: 1, name: 'Hinos' })).toBeTruthy()
  })

  it('/hinos/novo mostra o editor', () => {
    renderAt('/hinos/novo')
    expect(screen.queryByRole('heading', { name: 'Hinos' })).toBeNull()
    expect(screen.getByRole('link', { name: /hinos/i })).toBeTruthy()
  })

  it('rota de exercício (com e sem o segmento "exercicio") abre o exercício', () => {
    const ex = getLesson('compasso')!.exercises[0]
    for (const path of [`/teoria/compasso/exercicio/${ex.id}`, `/teoria/compasso/${ex.id}`]) {
      renderAt(path)
      expect(screen.queryByText('Exercício não encontrado')).toBeNull()
      expect(screen.getByText('1 / 10')).toBeTruthy()
      cleanup()
    }
  })

  it('a Início tem as entradas de Teoria e Hinos', () => {
    renderAt('/')
    expect(screen.getByRole('button', { name: /Teoria musical/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Hinos/ })).toBeTruthy()
  })
})
