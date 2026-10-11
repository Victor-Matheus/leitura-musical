import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Play } from 'lucide-react'
import { Badge, Button, Card, IconBox } from './index'

describe('componentes base', () => {
  afterEach(cleanup)

  it('Button cta é uma pílula', () => {
    render(<Button variant="cta">Começar</Button>)
    expect(screen.getByRole('button', { name: 'Começar' }).className).toContain('rounded-full')
  })

  it('Button secondary tem fundo surface e borda border', () => {
    render(<Button variant="secondary">Config</Button>)
    const cls = screen.getByRole('button').className
    expect(cls).toContain('bg-[var(--surface)]')
    expect(cls).toContain('border-[var(--border)]')
  })

  it('Button com ícone renderiza svg com stroke-width 1.75', () => {
    render(<Button icon={Play}>Tocar</Button>)
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('stroke-width')).toBe('1.75')
  })

  it('Button disabled fica desabilitado e opaco', () => {
    render(<Button disabled>Parar</Button>)
    const btn = screen.getByRole<HTMLButtonElement>('button')
    expect(btn.disabled).toBe(true)
    expect(btn.className).toContain('opacity-50')
  })

  it('Card dark usa o token surface-dark-2', () => {
    render(<Card variant="dark">Conteúdo</Card>)
    expect(screen.getByText('Conteúdo').className).toContain('--surface-dark-2')
  })

  it('Card as="button" interactive renderiza um button', () => {
    render(<Card as="button" interactive>Abrir</Card>)
    expect(screen.getByRole('button', { name: 'Abrir' }).tagName).toBe('BUTTON')
  })

  it('Badge renderiza o texto', () => {
    render(<Badge>Iniciante</Badge>)
    expect(screen.getByText('Iniciante').textContent).toBe('Iniciante')
  })

  it('Button e Card as="button" têm foco visível', () => {
    render(
      <>
        <Button>Ir</Button>
        <Card as="button">Lição</Card>
      </>,
    )
    for (const name of ['Ir', 'Lição']) {
      const cls = screen.getByRole('button', { name }).className
      expect(cls).toContain('focus-visible:outline-2')
      expect(cls).toContain('focus-visible:outline-[var(--primary)]')
    }
  })

  it('IconBox é um span (válido dentro de <button>)', () => {
    const { container } = render(<IconBox icon={Play} />)
    expect(container.firstElementChild?.tagName).toBe('SPAN')
  })
})
