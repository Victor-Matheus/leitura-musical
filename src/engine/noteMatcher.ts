import type { Step } from '../data/notes'

// Remove acentos e normaliza para minúsculas
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Variações de transcrição que a Web Speech API pode devolver para cada sílaba.
// (sílabas curtas costumam vir imprecisas, então mapeamos vários sinônimos)
const SYNONYMS: Record<string, Step> = {
  do: 'C',
  o: 'C',
  doh: 'C',
  re: 'D',
  e: 'D',
  rey: 'D',
  mi: 'E',
  me: 'E',
  fa: 'F',
  faz: 'F',
  fah: 'F',
  sol: 'G',
  so: 'G',
  soh: 'G',
  la: 'A',
  lah: 'A',
  si: 'B',
  ti: 'B',
}

/**
 * Tenta extrair a nota (Step) falada a partir de uma transcrição.
 * Considera as últimas palavras do reconhecimento.
 */
export function matchSpokenNote(transcript: string): Step | null {
  const words = normalize(transcript).split(/\s+/).filter(Boolean)
  // procura de trás pra frente: a fala mais recente é a relevante
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i]
    if (w in SYNONYMS) return SYNONYMS[w]
    // tenta casar pela primeira sílaba (ex.: "dóremi" colado, "solzinho")
    const prefix = w.slice(0, 3)
    if (prefix in SYNONYMS) return SYNONYMS[prefix]
    const p2 = w.slice(0, 2)
    if (p2 in SYNONYMS) return SYNONYMS[p2]
  }
  return null
}
