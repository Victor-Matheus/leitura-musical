import { expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { contrastRatio, parseThemeBlocks } from './contrast'

const css = readFileSync('src/index.css', 'utf8')
const { light, contrast } = parseThemeBlocks(css)

test('contrastRatio', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
})

test.each([
  ['light', 'text', 'bg', 4.5],
  ['light', 'text', 'surface', 4.5],
  ['light', 'muted', 'bg', 4.5],
  ['light', 'muted', 'surface', 4.5],
  ['light', 'on-primary', 'primary', 4.5],
  ['contrast', 'text', 'bg', 4.5],
  ['contrast', 'text', 'surface', 4.5],
  ['contrast', 'muted', 'bg', 4.5],
  ['contrast', 'muted', 'surface', 4.5],
  ['contrast', 'on-primary', 'primary', 4.5],
  ['contrast', 'border', 'surface', 3],
])('%s: %s sobre %s >= %d', (theme, fg, bg, min) => {
  const t = theme === 'light' ? light : { ...light, ...contrast }
  expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(min)
})

test('branco sobre success e error no tema claro', () => {
  expect(contrastRatio('#FFFFFF', light.success)).toBeGreaterThanOrEqual(4.5)
  expect(contrastRatio('#FFFFFF', light.error)).toBeGreaterThanOrEqual(4.5)
})
