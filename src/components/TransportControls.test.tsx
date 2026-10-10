import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { TransportControls } from './TransportControls'

const handlers = {
  onStart: vi.fn(),
  onPause: vi.fn(),
  onResume: vi.fn(),
  onRestart: vi.fn(),
}

describe('TransportControls', () => {
  afterEach(cleanup)

  it('pausado mostra Continuar', () => {
    render(<TransportControls playing={false} started finished={false} {...handlers} />)
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy()
  })

  it('terminada (drenando) não oferece Continuar e desabilita os controles', () => {
    render(<TransportControls playing={false} started finished {...handlers} />)
    expect(screen.queryByRole('button', { name: 'Continuar' })).toBeNull()
    const buttons = screen.getAllByRole<HTMLButtonElement>('button')
    expect(buttons.every((b) => b.disabled)).toBe(true)
  })
})
