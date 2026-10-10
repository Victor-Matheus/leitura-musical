import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { VoiceFeedback } from './VoiceFeedback'

const UNAVAILABLE = 'Reconhecimento de voz indisponível neste navegador. A lição segue sem voz.'

describe('VoiceFeedback', () => {
  afterEach(cleanup)

  it('motor silencioso sem outro erro avisa que a voz está indisponível', () => {
    render(<VoiceFeedback listening={false} error={null} engine="silent" lastHeard={null} feedback="idle" />)
    expect(screen.getByText(UNAVAILABLE)).toBeTruthy()
  })

  it('com um erro específico mostra só a mensagem do erro', () => {
    render(<VoiceFeedback listening={false} error="denied" engine="silent" lastHeard={null} feedback="idle" />)
    expect(screen.queryByText(UNAVAILABLE)).toBeNull()
    expect(screen.getByText(/Permissão de microfone negada/)).toBeTruthy()
  })

  it('motor ativo não mostra o aviso', () => {
    render(<VoiceFeedback listening error={null} engine="local" lastHeard={null} feedback="idle" />)
    expect(screen.queryByText(UNAVAILABLE)).toBeNull()
  })
})
