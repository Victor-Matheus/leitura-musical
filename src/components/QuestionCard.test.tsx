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

  it('"Próxima" chama onNext; na última pergunta o botão é "Ver resultado"', () => {
    const { onNext } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(onNext).toHaveBeenCalledTimes(1)
    cleanup()
    setup({ index: 9 })
    fireEvent.click(screen.getByRole('button', { name: 'Ré' }))
    expect(screen.getByRole('button', { name: 'Ver resultado' })).toBeTruthy()
  })
})
