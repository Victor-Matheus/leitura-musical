// Baixa o modelo Vosk pt-BR e reempacota como tar.gz em public/models/.
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import * as tar from 'tar'

const URL_ZIP = 'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip'
const PASTA = 'vosk-model-small-pt-0.3'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'public', 'models', 'vosk-pt-small.tar.gz')

if (existsSync(out)) {
  console.log('Modelo de voz já existe, nada a fazer.')
  process.exit(0)
}

console.log('Baixando o modelo de voz pt-BR (~32 MB)...')
const res = await fetch(URL_ZIP)
if (!res.ok) throw new Error(`Falha ao baixar o modelo: HTTP ${res.status}`)
const zip = new Uint8Array(await res.arrayBuffer())

console.log('Descompactando...')
const files = unzipSync(zip)
const tmp = mkdtempSync(join(tmpdir(), 'vosk-'))
try {
  for (const [name, data] of Object.entries(files)) {
    if (name.endsWith('/')) continue
    const dest = join(tmp, name)
    if (!dest.startsWith(tmp)) throw new Error(`Caminho inválido no zip: ${name}`)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, data)
  }
  mkdirSync(dirname(out), { recursive: true })
  console.log('Empacotando em tar.gz...')
  await tar.c({ gzip: true, cwd: tmp, file: out }, [PASTA])
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
console.log(`Modelo pronto: ${out} (${(statSync(out).size / 1e6).toFixed(1)} MB)`)
