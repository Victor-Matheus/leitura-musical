function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return (
    0.2126 * channel((n >> 16) & 255) +
    0.7152 * channel((n >> 8) & 255) +
    0.0722 * channel(n & 255)
  )
}

/** Razão de contraste WCAG 2.x entre duas cores em hex. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA)
  const b = luminance(hexB)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function parseBlock(css: string, selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(css)
  const vars: Record<string, string> = {}
  if (!match) return vars
  for (const [, name, value] of match[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    vars[name] = value.trim()
  }
  return vars
}

/** Variáveis de ':root' (light) e '.theme-contrast' (contrast); chaves sem '--'. */
export function parseThemeBlocks(css: string): {
  light: Record<string, string>
  contrast: Record<string, string>
} {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return { light: parseBlock(clean, ':root'), contrast: parseBlock(clean, '.theme-contrast') }
}
