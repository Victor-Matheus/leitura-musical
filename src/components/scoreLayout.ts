// Lógica da pauta genérica: durações, descrição acessível, quebra de linhas e
// montagem das notas do VexFlow (sem desenhar, então roda sem DOM).

import { Accidental, BarNote, Dot, StaveNote } from 'vexflow'
import type { Note as VexNote } from 'vexflow'
import type { Duration } from '../data/notes'
import { vexKey } from '../data/notes'
import { MAJOR_KEYS, majorScale, solfege } from '../theory/music'
import type { ScoreBlock, ScoreElement } from '../theory/types'

/** Duração no formato do VexFlow: 'q', 'qd', 'hr', 'hdr'... */
export function vexDuration(d: Duration, dots?: 0 | 1, rest?: boolean): string {
  return d + (dots === 1 ? 'd' : '') + (rest ? 'r' : '')
}

const FIGURE_NAMES: Record<Duration, string> = {
  w: 'semibreve',
  h: 'mínima',
  q: 'semínima',
  '8': 'colcheia',
}

function figureName(d: Duration, dots?: 0 | 1): string {
  return FIGURE_NAMES[d] + (dots === 1 ? ' pontuada' : '')
}

function keyInfo(keySignature?: string) {
  return MAJOR_KEYS.find((k) => k.vexKey === keySignature)
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Texto para o aria-label, ex.: "Clave de sol, compasso 3/4: Sol semínima, pausa de semínima" */
export function describeScore(s: ScoreBlock): string {
  const header = [s.clef === 'bass' ? 'Clave de fá' : 'Clave de sol']
  const key = keyInfo(s.keySignature)
  if (key?.sharps) header.push('armadura com ' + plural(key.sharps, 'sustenido', 'sustenidos'))
  if (key?.flats) header.push('armadura com ' + plural(key.flats, 'bemol', 'bemóis'))
  if (s.timeSignature) header.push('compasso ' + s.timeSignature)

  const items = s.elements.flatMap((e) => {
    if (e.kind === 'note') return [`${solfege(e.note)} ${figureName(e.note.duration, e.note.dots)}`]
    if (e.kind === 'rest') return [`pausa de ${figureName(e.duration, e.dots)}`]
    return []
  })
  return items.length ? `${header.join(', ')}: ${items.join(', ')}` : header.join(', ')
}

/**
 * Divide os elementos em linhas de no máximo `maxPerLine` notas/pausas.
 * Quebra nas barras de compasso sempre que possível; a barra do fim da linha
 * some, porque o fim da pauta já desenha a barra.
 */
export function splitIntoLines(elements: ScoreElement[], maxPerLine: number): ScoreElement[][] {
  // compassos (sem as barras), cortando os que não cabem numa linha
  const measures: ScoreElement[][] = []
  let current: ScoreElement[] = []
  for (const e of elements) {
    if (e.kind === 'bar') {
      if (current.length) measures.push(current)
      current = []
    } else {
      current.push(e)
      if (current.length === maxPerLine) {
        measures.push(current)
        current = []
      }
    }
  }
  if (current.length) measures.push(current)

  const lines: ScoreElement[][] = []
  let line: ScoreElement[] = []
  let count = 0
  for (const m of measures) {
    if (count > 0 && count + m.length > maxPerLine) {
      lines.push(line)
      line = []
      count = 0
    }
    if (count > 0) line.push({ kind: 'bar' })
    line.push(...m)
    count += m.length
  }
  lines.push(line)
  return lines
}

/**
 * Converte o índice destacado (dentro de `elements`) no índice de cada linha.
 * A quebra mantém a ordem das notas/pausas (só mexe nas barras), então o destaque
 * é a n-ésima nota/pausa contada sem as barras. Linhas sem o destaque recebem undefined.
 */
export function highlightPerLine(
  elements: ScoreElement[],
  lines: ScoreElement[][],
  highlightIndex?: number,
): (number | undefined)[] {
  const target =
    highlightIndex !== undefined && elements[highlightIndex] && elements[highlightIndex].kind !== 'bar'
      ? elements.slice(0, highlightIndex).filter((e) => e.kind !== 'bar').length
      : -1
  let offset = 0
  return lines.map((line) => {
    const ordinals = line.map((e) => (e.kind === 'bar' ? -1 : offset++))
    const local = target >= 0 ? ordinals.indexOf(target) : -1
    return local >= 0 ? local : undefined
  })
}

export interface BuildOptions {
  clef: 'treble' | 'bass'
  keySignature?: string
  color: string
  highlightColor: string
  /** índice (dentro de `elements`) do elemento destacado */
  highlightIndex?: number
}

/** Passos alterados pela armadura, ex.: Ré maior → { F: '#', C: '#' } */
function keyAccidentals(keySignature?: string): Partial<Record<string, string>> {
  const key = keyInfo(keySignature)
  if (!key) return {}
  return Object.fromEntries(
    majorScale(key.tonic)
      .filter((p) => p.accidental)
      .map((p) => [p.step, p.accidental]),
  )
}

/** Monta as notas, pausas e barras do VexFlow com as cores já aplicadas. */
export function buildElements(elements: ScoreElement[], opts: BuildOptions): VexNote[] {
  const inKey = keyAccidentals(opts.keySignature)
  // posição da pausa no meio da pauta (linha do Si4 na clave de sol, Ré3 na de fá)
  const restKey = opts.clef === 'bass' ? 'd/3' : 'b/4'

  return elements.map((e, i) => {
    const color = i === opts.highlightIndex ? opts.highlightColor : opts.color
    const style = { fillStyle: color, strokeStyle: color }
    if (e.kind === 'bar') {
      const bar = new BarNote()
      bar.setStyle(style)
      return bar
    }

    let sn: StaveNote
    let dots: 0 | 1 | undefined
    if (e.kind === 'rest') {
      dots = e.dots
      sn = new StaveNote({ keys: [restKey], duration: vexDuration(e.duration, dots, true), clef: opts.clef })
    } else {
      const { note } = e
      dots = note.dots
      sn = new StaveNote({ keys: [vexKey(note)], duration: vexDuration(note.duration, dots), clef: opts.clef })
      if (note.accidental && inKey[note.step] !== note.accidental) {
        sn.addModifier(new Accidental(note.accidental), 0)
      } else if (!note.accidental && inKey[note.step]) {
        // sem acidente = natural: anula o ♯/♭ da armadura
        sn.addModifier(new Accidental('n'), 0)
      }
      // linhas suplementares têm estilo próprio (padrão #444, invisível no alto contraste)
      sn.setLedgerLineStyle(style)
    }
    if (dots === 1) Dot.buildAndAttach([sn], { all: true })
    sn.setStyle(style)
    sn.getModifiers().forEach((m) => m.setStyle(style))
    return sn
  })
}
