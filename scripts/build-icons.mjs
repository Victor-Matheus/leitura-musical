// Gera os PNGs do ícone do app a partir de public/favicon.svg.
// Uso: npm run icons
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const svg = readFileSync(`${publicDir}favicon.svg`, 'utf8')

// O iOS aplica a própria máscara arredondada; cantos transparentes ficariam pretos.
const squareSvg = svg.replace('rx="112"', 'rx="0"')

const targets = [
  { file: 'apple-touch-icon.png', size: 180, source: squareSvg },
  { file: 'icon-192.png', size: 192, source: svg },
  { file: 'icon-512.png', size: 512, source: svg },
]

for (const { file, size, source } of targets) {
  const png = new Resvg(source, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(`${publicDir}${file}`, png)
  console.log(`${file} (${size}x${size})`)
}
