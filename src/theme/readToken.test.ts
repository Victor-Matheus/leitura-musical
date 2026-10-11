import { afterEach, expect, test } from 'vitest'
import { readToken } from './readToken'

afterEach(() => {
  document.documentElement.style.removeProperty('--primary')
})

test('readToken lê a variável CSS do documentElement', () => {
  document.documentElement.style.setProperty('--primary', '#1C3F3A')
  expect(readToken('primary')).toBe('#1C3F3A')
})
