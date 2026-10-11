// Gerador de armaduras: qual tonalidade maior a armadura indica

import { MAJOR_KEYS } from '../music'
import { pick, shuffle } from '../rng'
import type { Generator } from '../types'

const SHARP_ORDER = ['Fá♯', 'Dó♯', 'Sol♯', 'Ré♯']
const FLAT_ORDER = ['Si♭', 'Mi♭', 'Lá♭', 'Ré♭']

/** Lista "a, b e c" */
function joinPt(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export const keySignature: Generator = (params, rng) => {
  const max = typeof params.maxAccidentals === 'number' ? params.maxAccidentals : 4
  const eligible = MAJOR_KEYS.filter((k) => Math.max(k.sharps, k.flats) <= max)
  const pool = eligible.length > 0 ? eligible : MAJOR_KEYS.slice(0, 1)
  const key = pick(rng, pool)

  const preferred = shuffle(rng, pool.filter((k) => k !== key))
  const rest = shuffle(rng, MAJOR_KEYS.filter((k) => k !== key && !pool.includes(k)))
  const distractors = [...preferred, ...rest].slice(0, 3).map((k) => k.name)
  const options = shuffle(rng, [key.name, ...distractors])

  let explanation: string
  if (key.sharps > 0) {
    const list = SHARP_ORDER.slice(0, key.sharps)
    explanation = `Com ${plural(key.sharps, 'sustenido', 'sustenidos')} (${joinPt(list)}), a tonalidade é ${key.name}. A tônica fica um semitom acima do último sustenido.`
  } else if (key.flats > 0) {
    const list = FLAT_ORDER.slice(0, key.flats)
    explanation = `Com ${plural(key.flats, 'bemol', 'bemóis')} (${joinPt(list)}), a tonalidade é ${key.name}.`
    if (key.flats > 1) explanation += ' A tônica é o penúltimo bemol.'
  } else {
    explanation = `Sem sustenidos nem bemóis na armadura, a tonalidade é ${key.name}.`
  }

  return {
    prompt: 'Qual tonalidade maior esta armadura indica?',
    score: { clef: 'treble', keySignature: key.vexKey, elements: [] },
    options,
    answer: options.indexOf(key.name),
    explanation,
  }
}
