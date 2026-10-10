/** Lê o valor atual de uma variável CSS do tema (ex.: readToken('primary') → '#1c3f3a'). */
export function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim()
}
