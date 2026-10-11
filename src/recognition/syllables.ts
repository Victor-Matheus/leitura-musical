import type { Step } from '../data/notes'

// Sinônimos de sílaba já normalizados (minúsculas, sem acento) -> nota
const SYLLABLE_TO_STEP: Record<string, Step> = {
  do: 'C',
  re: 'D',
  rei: 'D',
  mi: 'E',
  me: 'E',
  fa: 'F',
  sol: 'G',
  so: 'G',
  la: 'A',
  si: 'B',
  ti: 'B',
}

// Gramática enviada ao Vosk: palavras reconhecíveis + [unk] para o resto
export const VOSK_GRAMMAR: string[] = ['do', 'dó', 're', 'ré', 'mi', 'fa', 'fá', 'sol', 'la', 'lá', 'si', '[unk]']

/** Minúsculas, sem acento e sem pontuação. */
export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

/** Nota para uma palavra inteira reconhecida; null se não for sílaba de nota. */
export function wordToStep(w: string): Step | null {
  const key = normalizeWord(w)
  return Object.prototype.hasOwnProperty.call(SYLLABLE_TO_STEP, key) ? SYLLABLE_TO_STEP[key] : null
}

/** Uma nota por palavra reconhecida, em ordem; ignora as demais palavras. */
export function textToSteps(text: string): Step[] {
  const steps: Step[] = []
  for (const token of text.split(/[^\p{L}]+/u)) {
    const step = wordToStep(token)
    if (step !== null) steps.push(step)
  }
  return steps
}
