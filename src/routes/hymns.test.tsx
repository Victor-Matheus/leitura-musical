import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Hymns } from './Hymns'
import { HymnEditor } from './HymnEditor'
import { useHymnStore } from '../store/useHymnStore'
import { encodeHymn, MAX_HYMN_NOTES } from '../hymns/codec'
import type { Note } from '../data/notes'

// O VexFlow mede texto num canvas; o jsdom não tem canvas e avisa a cada chamada.
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

/** Mostra o state recebido em /praticar para conferir a navegação. */
function PracticeProbe() {
  const location = useLocation()
  const state = location.state as { piece?: { title: string; level: number; notes: Note[] }; returnTo?: string } | null
  const piece = state?.piece
  return (
    <>
      <p>
        Praticando {piece?.title} nível {piece?.level} com {piece?.notes.length} notas
      </p>
      {state?.returnTo && <p>Volta para {state.returnTo}</p>}
    </>
  )
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/hinos" element={<Hymns />} />
        <Route path="/hinos/novo" element={<HymnEditor />} />
        <Route path="/hinos/:id/editar" element={<HymnEditor />} />
        <Route path="/praticar" element={<PracticeProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('Hymns', () => {
  beforeEach(() => useHymnStore.setState({ hymns: [] }))
  afterEach(cleanup)

  it('mostra o aviso e as 3 melodias embutidas', () => {
    renderAt('/hinos')
    expect(screen.getByText(/Por direitos autorais, o app não traz os hinos do Hinário/)).toBeTruthy()
    for (const title of ['Old Hundredth', 'New Britain', 'Hino da Alegria']) {
      expect(screen.getByText(title)).toBeTruthy()
    }
    expect(screen.getByText(/Louis Bourgeois, Saltério de Genebra · 1551/)).toBeTruthy()
    expect(screen.getAllByText('Versão para leitura, sem ligaduras')).toHaveLength(3)
  })

  it('Praticar numa melodia embutida navega com o piece', () => {
    renderAt('/hinos')
    click('Praticar Old Hundredth')
    expect(screen.getByText(/Praticando Old Hundredth/)).toBeTruthy()
  })

  it('importa um código válido e cria um hino', () => {
    renderAt('/hinos')
    const code = encodeHymn({ title: 'Meu hino', clef: 'treble', notes: [{ step: 'C', octave: 4, duration: 'q' }] })
    fireEvent.change(screen.getByLabelText('Código do hino'), { target: { value: code } })
    click('Importar')
    const hymns = useHymnStore.getState().hymns
    expect(hymns).toHaveLength(1)
    expect(hymns[0].title).toBe('Meu hino')
    expect(screen.getByText('Meu hino')).toBeTruthy()
  })

  it('código inválido mostra o erro e não cria hino', () => {
    renderAt('/hinos')
    fireEvent.change(screen.getByLabelText('Código do hino'), { target: { value: 'LM1:lixo!' } })
    click('Importar')
    expect(screen.getByText('Código inválido ou de versão diferente')).toBeTruthy()
    expect(useHymnStore.getState().hymns).toHaveLength(0)
  })

  it('Excluir com confirmação remove o hino', () => {
    useHymnStore.getState().save({ title: 'Para apagar', clef: 'treble', notes: [{ step: 'C', octave: 4, duration: 'q' }] })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderAt('/hinos')
    click('Excluir Para apagar')
    expect(confirm).toHaveBeenCalled()
    expect(useHymnStore.getState().hymns).toHaveLength(0)
    expect(screen.queryByText('Para apagar')).toBeNull()
  })

  it('Excluir sem confirmação mantém o hino', () => {
    useHymnStore.getState().save({ title: 'Fica', clef: 'treble', notes: [{ step: 'C', octave: 4, duration: 'q' }] })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderAt('/hinos')
    click('Excluir Fica')
    expect(useHymnStore.getState().hymns).toHaveLength(1)
  })

  it('Praticar num hino do usuário navega com nível 1', () => {
    useHymnStore.getState().save({ title: 'Meu', clef: 'bass', notes: [{ step: 'C', octave: 3, duration: 'q' }] })
    renderAt('/hinos')
    click('Praticar Meu')
    expect(screen.getByText('Praticando Meu nível 1 com 1 notas')).toBeTruthy()
  })
})

describe('HymnEditor', () => {
  beforeEach(() => useHymnStore.setState({ hymns: [] }))
  afterEach(cleanup)

  it('adiciona Sol e Lá, desfaz e salva 1 nota', () => {
    renderAt('/hinos/novo')
    click('Semínima')
    click('Sol')
    click('Mínima')
    click('Ponto')
    click('Lá')
    expect(screen.getByText('2 notas')).toBeTruthy()
    click('Desfazer')
    expect(screen.getByText('1 nota')).toBeTruthy()
    click('Salvar')
    const hymns = useHymnStore.getState().hymns
    expect(hymns).toHaveLength(1)
    expect(hymns[0].title).toBe('Sem título')
    expect(hymns[0].notes).toHaveLength(1)
    expect(hymns[0].notes[0]).toMatchObject({ step: 'G', duration: 'q' })
    expect(hymns[0].notes[0].dots).toBeUndefined()
  })

  it('Ponto com Mínima salva dots: 1', () => {
    renderAt('/hinos/novo')
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Pontuado' } })
    click('Mínima')
    click('Ponto')
    click('Dó')
    click('Salvar')
    const [hymn] = useHymnStore.getState().hymns
    expect(hymn.title).toBe('Pontuado')
    expect(hymn.notes[0]).toEqual({ step: 'C', octave: 4, duration: 'h', dots: 1 })
  })

  it('sustenido vale só para a próxima nota; oitava muda dentro de 3 a 5', () => {
    renderAt('/hinos/novo')
    click('Sustenido')
    click('Fá')
    click('Oitava acima')
    click('Oitava acima')
    expect((screen.getByRole('button', { name: 'Oitava acima' }) as HTMLButtonElement).disabled).toBe(true)
    click('Fá')
    click('Salvar')
    const [hymn] = useHymnStore.getState().hymns
    expect(hymn.notes[0]).toEqual({ step: 'F', octave: 4, duration: 'q', accidental: '#' })
    expect(hymn.notes[1]).toEqual({ step: 'F', octave: 5, duration: 'q' })
  })

  it('Salvar e Praticar ficam desabilitados com 0 notas', () => {
    renderAt('/hinos/novo')
    expect((screen.getByRole('button', { name: 'Salvar' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Praticar' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('edita um hino existente sem duplicar', () => {
    const id = useHymnStore.getState().save({ title: 'Antigo', clef: 'treble', notes: [{ step: 'C', octave: 4, duration: 'q' }] })
    renderAt(`/hinos/${id}/editar`)
    expect((screen.getByLabelText('Título') as HTMLInputElement).value).toBe('Antigo')
    click('Ré')
    click('Salvar')
    const hymns = useHymnStore.getState().hymns
    expect(hymns).toHaveLength(1)
    expect(hymns[0].notes).toHaveLength(2)
  })

  it('id inexistente mostra "Hino não encontrado"', () => {
    renderAt('/hinos/nao-existe/editar')
    expect(screen.getByText('Hino não encontrado')).toBeTruthy()
  })

  it('no limite de notas, desabilita os botões de nota e avisa', () => {
    const notes: Note[] = Array.from({ length: MAX_HYMN_NOTES }, () => ({ step: 'C', octave: 4, duration: 'q' }))
    const id = useHymnStore.getState().save({ title: 'Cheio', clef: 'treble', notes })
    renderAt(`/hinos/${id}/editar`)
    expect((screen.getByRole('button', { name: 'Sol' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText(/Limite de 400 notas/)).toBeTruthy()
  })

  it('Praticar navega com o piece do editor', () => {
    renderAt('/hinos/novo')
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Rascunho' } })
    click('Mi')
    click('Praticar')
    expect(screen.getByText('Praticando Rascunho nível 1 com 1 notas')).toBeTruthy()
  })

  it('Praticar salva o hino antes e passa o editor como volta', () => {
    renderAt('/hinos/novo')
    click('Mi')
    click('Sol')
    click('Praticar')
    const hymns = useHymnStore.getState().hymns
    expect(hymns).toHaveLength(1)
    expect(hymns[0].title).toBe('Sem título')
    expect(hymns[0].notes.map((n) => n.step)).toEqual(['E', 'G'])
    expect(screen.getByText(`Volta para /hinos/${hymns[0].id}/editar`)).toBeTruthy()
  })

  it('Praticar num hino existente atualiza sem duplicar', () => {
    const id = useHymnStore.getState().save({ title: 'Antigo', clef: 'treble', notes: [{ step: 'C', octave: 4, duration: 'q' }] })
    renderAt(`/hinos/${id}/editar`)
    click('Ré')
    click('Praticar')
    const hymns = useHymnStore.getState().hymns
    expect(hymns).toHaveLength(1)
    expect(hymns[0].notes).toHaveLength(2)
    expect(screen.getByText(`Volta para /hinos/${id}/editar`)).toBeTruthy()
  })

  it('Copiar código sem clipboard mostra o código num campo', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    renderAt('/hinos/novo')
    click('Mi')
    click('Copiar código')
    const field = (await screen.findByLabelText('Código para copiar')) as HTMLTextAreaElement
    expect(field.value.startsWith('LM1:')).toBe(true)
  })
})
