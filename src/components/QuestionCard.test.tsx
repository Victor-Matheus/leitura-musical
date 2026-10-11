import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Question } from '../theory/types'
import { QuestionCard } from './QuestionCard'

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(cleanup)

const question: Question = {
  prompt: 'Qual é o nome desta nota?',
  options: ['Dó', 'Ré', 'Mi'],
  answer: 1,
  explanation: 'A segunda nota da escala é Ré.',
}

function setup(over: Partial<{ index: number; total: number }> = {}) {
  const onAnswer = vi.fn()
  const onNext = vi.fn()
  render(
    <QuestionCard question={question} index={2} total={10} highContrast={false} onAnswer={onAnswer} onNext={onNext} {...over} />,
  )
  return { onAnswer, onNext }
}

describe('QuestionCard', () => {
  it('mostra o contador e o enunciado', () => {
    setup()
    expect(screen.getByText('3 / 10')).toBeTruthy()
    expect(screen.getByText('Qual é o nome desta nota?')).toBeTruthy()
  })

  it('opção errada: chama onAnswer(false), mostra a resposta, a explicação e trava as opções', () => {
    const { onAnswer } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mi' }))
    expect(onAnswer).toHaveBeenCalledWith(false)
    expect(screen.getByText(/Resposta:/).textContent).toContain('Ré')
    expect(screen.getByText('A segunda nota da escala é Ré.')).toBeTruthy()
    for (const name of ['Dó', 'Ré', 'Mi']) {
      expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled).toBe(true)
    }
  })

  it('opção certa: chama onAnswer(true) e mostra "Certo!"', () => {
    const { onAnswer } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    expect(onAnswer).toHaveBeenCalledWith(true)
    expect(screen.getByText('Certo!')).toBeTruthy()
  })

  it('marca a opção escolhida com aria-pressed', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mi' }))
    expect(screen.getByRole('button', { name: 'Mi' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Dó' }).getAttribute('aria-pressed')).toBe('false')
    expect(screen.getByRole('button', { name: 'Ré' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('um segundo clique depois de responder não chama onAnswer de novo', () => {
    const { onAnswer } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })

  it('o feedback fica dentro de uma região aria-live', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    expect(screen.getByText('Certo!').closest('[aria-live]')).toBeTruthy()
  })

  it('"Próxima" chama onNext', () => {
    const { onNext } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('na última pergunta o botão é "Ver resultado"', () => {
    setup({ index: 9 })
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeTruthy()
  })

  it('usa o scoreLabel da pergunta como aria-label da pauta', () => {
    const withScore: Question = {
      ...question,
      score: { clef: 'treble', elements: [{ kind: 'note', note: { step: 'D', octave: 4, duration: 'w' } }] },
      scoreLabel: 'Uma nota logo abaixo da pauta da clave de sol',
    }
    render(
      <QuestionCard question={withScore} index={0} total={10} highContrast={false} onAnswer={vi.fn()} onNext={vi.fn()} />,
    )
    const img = screen.getByRole('img')
    expect(img.getAttribute('aria-label')).toBe('Uma nota logo abaixo da pauta da clave de sol')
    expect(img.getAttribute('aria-label')).not.toContain('Ré')
  })
})
