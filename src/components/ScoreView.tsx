import { useEffect, useRef, useState } from 'react'
import { Formatter, Renderer, Stave, Voice } from 'vexflow'
import type { RenderContext } from 'vexflow'
import { readToken } from '../theme/readToken'
import type { ScoreBlock } from '../theory/types'
import { buildElements, describeScore, splitIntoLines } from './scoreLayout'

type ScoreViewProps = ScoreBlock & {
  /** VexFlow desenha com estilo inline: as cores vêm dos tokens no momento do desenho,
   * e a pauta é redesenhada quando o alto contraste muda (como no NoteStaff). */
  highContrast?: boolean
  /** índice (dentro de `elements`) do elemento destacado com a cor primária */
  highlightIndex?: number
}

const NARROW_QUERY = '(max-width: 479px)'
const LINE_HEIGHT = 120
const TOP = 20

function isNarrow(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(NARROW_QUERY).matches
}

/** Telas estreitas: 8 elementos por linha; as demais: 16. */
function useMaxPerLine(): number {
  const [narrow, setNarrow] = useState(isNarrow)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(NARROW_QUERY)
    const onChange = () => setNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return narrow ? 8 : 16
}

/** Linhas da pauta e modifiers (clave, armadura, compasso) não herdam o estilo da Stave. */
function drawStave(stave: Stave, ctx: RenderContext, textColor: string) {
  ctx.setFillStyle(textColor)
  ctx.setStrokeStyle(textColor)
  stave.getModifiers().forEach((m) => m.setStyle({ fillStyle: textColor, strokeStyle: textColor }))
  stave.setContext(ctx).draw()
}

/** Sobrescreve o style inline do VexFlow para o SVG ocupar a largura do container. */
function makeResponsive(host: HTMLElement, viewW: number, viewH: number) {
  const svgEl = host.querySelector('svg')
  if (!svgEl) return
  svgEl.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`)
  svgEl.style.width = '100%'
  svgEl.style.height = 'auto'
  svgEl.style.display = 'block'
  svgEl.style.overflow = 'visible'
}

export function ScoreView({ highContrast, highlightIndex, ...score }: ScoreViewProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const maxPerLine = useMaxPerLine()
  const { clef, keySignature, timeSignature, elements } = score

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.innerHTML = ''
    const textColor = readToken('text')
    const highlightColor = readToken('primary')

    const lines = splitIntoLines(elements, maxPerLine)
    // a quebra mantém a ordem das notas/pausas (só mexe nas barras): o destaque é a
    // n-ésima nota/pausa, contada sem as barras
    const target =
      highlightIndex !== undefined && elements[highlightIndex]?.kind !== 'bar'
        ? elements.slice(0, highlightIndex).filter((e) => e.kind !== 'bar').length
        : -1
    let offset = 0
    const W = maxPerLine === 8 ? 400 : 720
    const H = TOP + lines.length * LINE_HEIGHT

    const renderer = new Renderer(host, Renderer.Backends.SVG)
    renderer.resize(W, H)
    const ctx = renderer.getContext()

    lines.forEach((line, li) => {
      const stave = new Stave(4, TOP + li * LINE_HEIGHT, W - 8)
      stave.addClef(clef)
      if (keySignature) stave.addKeySignature(keySignature)
      if (li === 0 && timeSignature) stave.addTimeSignature(timeSignature)
      drawStave(stave, ctx, textColor)
      if (!line.length) return

      const ordinals = line.map((e) => (e.kind === 'bar' ? -1 : offset++))
      const notes = buildElements(line, {
        clef,
        keySignature,
        color: textColor,
        highlightColor,
        highlightIndex: target >= 0 ? ordinals.indexOf(target) : undefined,
      })
      const voice = new Voice().setStrict(false)
      voice.addTickables(notes)
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.draw(ctx, stave)
    })

    makeResponsive(host, W, H)
    // highContrast não é lido no efeito, mas troca os valores dos tokens: precisa redesenhar.
  }, [clef, keySignature, timeSignature, elements, maxPerLine, highlightIndex, highContrast])

  return (
    <div role="img" aria-label={describeScore(score)} className="w-full">
      <div ref={hostRef} className="vf-staff w-full" aria-hidden="true" />
    </div>
  )
}
