import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ScoreBlock, ScoreElement } from '../theory/types'
import { ScoreView } from './ScoreView'
import { buildElements, describeScore, splitIntoLines, vexDuration } from './scoreLayout'

// O VexFlow mede texto num canvas; o jsdom não tem canvas e avisa a cada chamada.
// Devolver null (o mesmo que o jsdom devolve) só silencia o aviso.
beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

describe('vexDuration', () => {
  it('monta a duração do VexFlow com ponto e pausa', () => {
    expect(vexDuration('h', 1)).toBe('hd')
    expect(vexDuration('q', 0, true)).toBe('qr')
    expect(vexDuration('8', 1, true)).toBe('8dr')
    expect(vexDuration('w')).toBe('w')
  })
})

describe('describeScore', () => {
  it('descreve clave de fá, compasso 4/4 e uma pausa', () => {
    const score: ScoreBlock = {
      clef: 'bass',
      timeSignature: '4/4',
      elements: [
        { kind: 'note', note: { step: 'C', octave: 3, duration: 'h', dots: 1 } },
        { kind: 'rest', duration: 'q' },
        { kind: 'bar' },
      ],
    }
    expect(describeScore(score)).toBe('Clave de fá, compasso 4/4: Dó mínima pontuada, pausa de semínima')
  })

  it('inclui a armadura e mostra acidentes com ♯ e ♭', () => {
    const score: ScoreBlock = {
      clef: 'treble',
      keySignature: 'D',
      timeSignature: '3/4',
      elements: [
        { kind: 'note', note: { step: 'F', accidental: '#', octave: 4, duration: 'q' } },
        { kind: 'note', note: { step: 'B', accidental: 'b', octave: 4, duration: '8' } },
        { kind: 'rest', duration: 'h', dots: 1 },
      ],
    }
    expect(describeScore(score)).toBe(
      'Clave de sol, armadura com 2 sustenidos, compasso 3/4: Fá♯ semínima, Si♭ colcheia, pausa de mínima pontuada',
    )
  })
})

describe('splitIntoLines', () => {
  const note: ScoreElement = { kind: 'note', note: { step: 'G', octave: 4, duration: 'q' } }
  const bar: ScoreElement = { kind: 'bar' }

  it('quebra nas barras sem passar de 8 por linha', () => {
    const elements: ScoreElement[] = []
    for (let i = 0; i < 20; i++) {
      elements.push(note)
      if (i % 4 === 3) elements.push(bar)
    }
    const lines = splitIntoLines(elements, 8)
    expect(lines).toHaveLength(3)
    for (const line of lines) {
      expect(line.filter((e) => e.kind !== 'bar').length).toBeLessThanOrEqual(8)
      // a barra do fim da linha vira o fim da pauta
      expect(line[line.length - 1].kind).not.toBe('bar')
    }
    expect(lines[0]).toEqual([note, note, note, note, bar, note, note, note, note])
    // nenhuma nota se perde
    expect(lines.flat().filter((e) => e.kind === 'note')).toHaveLength(20)
  })

  it('divide um compasso maior que a linha', () => {
    const lines = splitIntoLines(Array(10).fill(note), 8)
    expect(lines.map((l) => l.length)).toEqual([8, 2])
  })

  it('devolve uma linha vazia para uma pauta sem elementos', () => {
    expect(splitIntoLines([], 8)).toEqual([[]])
  })
})

describe('buildElements', () => {
  it('passa a clave de fá para a StaveNote', () => {
    const [sn] = buildElements([{ kind: 'note', note: { step: 'C', octave: 4, duration: 'q' } }], {
      clef: 'bass',
      color: '#000',
      highlightColor: '#f00',
    })
    expect(sn.getCategory()).toBe('StaveNote')
    expect((sn as unknown as { clef: string }).clef).toBe('bass')
  })

  it('cria pausa, ponto e barra', () => {
    const els = buildElements(
      [
        { kind: 'rest', duration: 'h', dots: 1 },
        { kind: 'bar' },
        { kind: 'note', note: { step: 'A', octave: 4, duration: 'h', dots: 1 } },
      ],
      { clef: 'treble', color: '#000', highlightColor: '#f00' },
    )
    expect(els.map((e) => e.getCategory())).toEqual(['StaveNote', 'BarNote', 'StaveNote'])
    const [rest, , dotted] = els
    expect(rest.getDuration()).toBe('h')
    expect(rest.isRest()).toBe(true)
    expect(dotted.getModifiersByType('Dot')).toHaveLength(1)
  })

  it('não repete o acidente que já está na armadura', () => {
    const [fSharp, cSharp, gSharp] = buildElements(
      [
        { kind: 'note', note: { step: 'F', accidental: '#', octave: 4, duration: 'q' } },
        { kind: 'note', note: { step: 'C', accidental: '#', octave: 5, duration: 'q' } },
        { kind: 'note', note: { step: 'G', accidental: '#', octave: 4, duration: 'q' } },
      ],
      { clef: 'treble', keySignature: 'D', color: '#000', highlightColor: '#f00' },
    )
    expect(fSharp.getModifiersByType('Accidental')).toHaveLength(0)
    expect(cSharp.getModifiersByType('Accidental')).toHaveLength(0)
    expect(gSharp.getModifiersByType('Accidental')).toHaveLength(1)
  })
})

describe('ScoreView', () => {
  afterEach(cleanup)

  it('desenha um svg dentro de role="img" com a descrição da pauta', () => {
    const score: ScoreBlock = {
      clef: 'bass',
      keySignature: 'D',
      timeSignature: '3/4',
      elements: [
        { kind: 'note', note: { step: 'C', octave: 4, duration: 'h', dots: 1 } },
        { kind: 'bar' },
        { kind: 'rest', duration: 'q' },
      ],
    }
    const { getByRole } = render(<ScoreView {...score} />)
    const img = getByRole('img')
    expect(img.getAttribute('aria-label')).toBe(describeScore(score))
    expect(img.querySelector('svg')).not.toBeNull()
  })
})
