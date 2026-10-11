// Nome de uma nota mostrada na pauta (semibreve)

import type { Accidental, Step } from '../../data/notes'
import { pitchToMidi, solfege, type Pitch } from '../music'
import { shuffle } from '../rng'
import type { Generator } from '../types'

const STEPS: readonly Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
/** Sustenidos e bemóis usados (sem Mi♯, Si♯, Fá♭, Dó♭, que soam como notas naturais) */
const SHARPABLE: readonly Step[] = ['C', 'D', 'F', 'G', 'A']
const FLATTABLE: readonly Step[] = ['D', 'E', 'G', 'A', 'B']
/** Nota da 1ª linha (a de baixo) de cada clave */
const BOTTOM_LINE: Record<'treble' | 'bass', Pitch> = {
  treble: { step: 'E', octave: 4 },
  bass: { step: 'G', octave: 2 },
}
const CLEF_NAME = { treble: 'Na clave de sol', bass: 'Na clave de fá' } as const

type PitchClass = Pick<Pitch, 'step' | 'accidental'>

function parsePitch(s: string): Pitch {
  const m = /^([A-G])([#b]?)(\d)$/.exec(s)
  if (!m) throw new Error(`noteName: nota inválida "${s}"`)
  const p: Pitch = { step: m[1] as Step, octave: Number(m[3]) }
  if (m[2]) p.accidental = m[2] as Accidental
  return p
}

function pitchClass(p: PitchClass): number {
  return pitchToMidi({ ...p, octave: 4 }) % 12
}

function variants(step: Step): PitchClass[] {
  const out: PitchClass[] = [{ step }]
  if (SHARPABLE.includes(step)) out.push({ step, accidental: '#' })
  if (FLATTABLE.includes(step)) out.push({ step, accidental: 'b' })
  return out
}

/** Posição em degraus a partir da 1ª linha: par = linha, ímpar = espaço */
function staffPlace(p: Pitch, clef: 'treble' | 'bass'): string {
  const bottom = BOTTOM_LINE[clef]
  const d = p.octave * 7 + STEPS.indexOf(p.step) - (bottom.octave * 7 + STEPS.indexOf(bottom.step))
  if (d >= 0 && d <= 8) return d % 2 === 0 ? `na ${d / 2 + 1}ª linha` : `no ${(d + 1) / 2}º espaço`
  const below = d < 0
  const k = below ? -d : d - 8
  const side = below ? 'inferior' : 'superior'
  if (k % 2 === 0) return `na ${k / 2}ª linha suplementar ${side}`
  if (k === 1) return below ? 'logo abaixo da pauta' : 'logo acima da pauta'
  return `${below ? 'abaixo' : 'acima'} da ${(k - 1) / 2}ª linha suplementar ${side}`
}

export const noteName: Generator = (params, rng) => {
  const clef = params.clef as 'treble' | 'bass'
  const accidentals = params.accidentals === true
  const low = pitchToMidi(parsePitch(params.low as string))
  const high = pitchToMidi(parsePitch(params.high as string))

  const naturals: Pitch[] = []
  const altered: Pitch[] = []
  for (let octave = 0; octave <= 8; octave++) {
    for (const step of STEPS) {
      for (const v of variants(step)) {
        const p: Pitch = { ...v, octave }
        const midi = pitchToMidi(p)
        if (midi < low || midi > high) continue
        if (v.accidental) altered.push(p)
        else naturals.push(p)
      }
    }
  }
  if (naturals.length === 0) throw new Error('noteName: range sem notas')

  const useAltered = accidentals && altered.length > 0 && rng() < 0.6
  const pool = useAltered ? altered : naturals
  const pitch = pool[Math.floor(rng() * pool.length)]
  const correct = solfege(pitch)

  // Distratores com classes de altura diferentes entre si e da resposta (nada de enarmônicos)
  let candidates: PitchClass[]
  if (accidentals) {
    const sameLetter = shuffle(
      rng,
      variants(pitch.step).filter((v) => v.accidental !== pitch.accidental),
    )
    const others = shuffle(
      rng,
      STEPS.filter((s) => s !== pitch.step).flatMap(variants),
    )
    candidates = [...sameLetter, ...others]
  } else {
    candidates = shuffle(
      rng,
      STEPS.filter((s) => s !== pitch.step).map((step) => ({ step })),
    )
  }
  const used = new Set([pitchClass(pitch)])
  const distractors: string[] = []
  for (const c of candidates) {
    if (distractors.length === 3) break
    const pc = pitchClass(c)
    if (used.has(pc)) continue
    used.add(pc)
    distractors.push(solfege(c))
  }

  const options = shuffle(rng, [correct, ...distractors])
  const place = staffPlace(pitch, clef)
  let explanation = `${CLEF_NAME[clef]}, a nota ${place} é ${solfege({ step: pitch.step })}.`
  if (pitch.accidental === '#') explanation += ` O sustenido (♯) sobe meio tom: ${correct}.`
  if (pitch.accidental === 'b') explanation += ` O bemol (♭) desce meio tom: ${correct}.`

  return {
    prompt: 'Qual é o nome desta nota?',
    score: {
      clef,
      elements: [{ kind: 'note', note: { ...pitch, duration: 'w' } }],
    },
    options,
    answer: options.indexOf(correct),
    explanation,
  }
}
