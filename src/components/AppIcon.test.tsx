import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppIcon } from './AppIcon'
import favicon from '../../public/favicon.svg?raw'

const faviconDoc = new DOMParser().parseFromString(favicon, 'image/svg+xml')

describe('AppIcon', () => {
  afterEach(cleanup)

  it('desenha o mesmo ícone do favicon.svg', () => {
    const { container } = render(<AppIcon size={96} />)
    const svg = container.querySelector('svg')!
    const pick = (root: ParentNode) => ({
      rect: root.querySelector('rect')?.getAttribute('fill'),
      path: root.querySelector('path')?.getAttribute('d')?.replace(/\s+/g, ' '),
      circle: root.querySelector('circle')?.getAttribute('fill'),
    })
    expect(pick(svg)).toEqual(pick(faviconDoc))
  })

  it('usa o tamanho pedido', () => {
    const { container } = render(<AppIcon size={40} />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('40')
    expect(svg.getAttribute('height')).toBe('40')
  })
})
