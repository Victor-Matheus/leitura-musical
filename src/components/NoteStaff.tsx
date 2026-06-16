import { useEffect, useRef } from 'react'
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'
import type { Note } from '../data/notes'
import { vexKey } from '../data/notes'
import type { DisplayMode } from '../store/usePracticeStore'

interface NoteStaffProps {
  notes: Note[]
  index: number
  clef: 'treble' | 'bass'
  mode: DisplayMode
  /** cor da nota atual (feedback: verde/vermelho/azul). default = primário */
  highlightColor?: string
}

function buildStaveNote(note: Note, clef: string, color?: string): StaveNote {
  const sn = new StaveNote({ keys: [vexKey(note)], duration: note.duration, clef })
  if (note.accidental) sn.addModifier(new Accidental(note.accidental), 0)
  if (color) sn.setStyle({ fillStyle: color, strokeStyle: color })
  return sn
}

/**
 * Aplica width:100% height:auto no SVG do VexFlow sobrescrevendo o inline style
 * que o VexFlow coloca via setAttribute('style', ...).
 */
function makeResponsive(host: HTMLElement, viewW: number, viewH: number) {
  const svgEl = host.querySelector('svg')
  if (!svgEl) return
  svgEl.setAttribute('viewBox', `0 0 ${viewW} ${viewH}`)
  // VexFlow usa style inline — precisa sobrescrever diretamente
  svgEl.style.width = '100%'
  svgEl.style.height = 'auto'
  svgEl.style.display = 'block'
  svgEl.style.overflow = 'visible'
}

export function NoteStaff({ notes, index, clef, mode, highlightColor = '#2b6cb0' }: NoteStaffProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    host.innerHTML = ''

    const renderer = new Renderer(host, Renderer.Backends.SVG)
    const ctx = renderer.getContext()

    if (mode === 'flashcard') {
      // Canvas lógico estreito → o SVG cresce via CSS width:100% para preencher o container
      // Quanto menor o canvas, maior o zoom aparente. 280×200 dá boa amplificação.
      const W = 280
      const H = 200 // altura extra: 60px acima da pauta para linhas suplementares altas
      renderer.resize(W, H)

      // y=70 posiciona a pauta no centro do canvas e deixa espaço p/ Dó5, Ré5, etc.
      const stave = new Stave(4, 70, W - 8)
      stave.addClef(clef)
      stave.setContext(ctx).draw()

      const note = notes[index]
      if (note) {
        const sn = buildStaveNote(note, clef, highlightColor)
        const voice = new Voice().setStrict(false)
        voice.addTickables([sn])
        new Formatter().joinVoices([voice]).format([voice], W - 80)
        voice.draw(ctx, stave)
      }

      makeResponsive(host, W, H)
    } else {
      // Partitura: pauta completa com cursor
      const noteW = 52
      const W = Math.max(600, notes.length * noteW + 100)
      const H = 200
      renderer.resize(W, H)

      const stave = new Stave(10, 50, W - 30)
      stave.addClef(clef)
      stave.setContext(ctx).draw()

      const staveNotes = notes.map((n, i) =>
        buildStaveNote(n, clef, i === index ? highlightColor : undefined),
      )
      const voice = new Voice().setStrict(false)
      voice.addTickables(staveNotes)
      new Formatter().joinVoices([voice]).format([voice], W - 90)
      voice.draw(ctx, stave)

      makeResponsive(host, W, H)

      // auto-scroll para manter a nota atual visível
      const ratio = notes.length > 1 ? index / (notes.length - 1) : 0
      host.scrollLeft = ratio * (W - host.clientWidth)
    }
  }, [notes, index, clef, mode, highlightColor])

  return (
    <div
      ref={hostRef}
      // flashcard: cresce até 512px (366px alto) — grande o suficiente para pessoas de idade
      // partitura: ocupa largura total com scroll horizontal
      className={`vf-staff overflow-x-auto ${
        mode === 'flashcard' ? 'mx-auto w-full max-w-lg' : 'w-full'
      }`}
      aria-hidden="true"
    />
  )
}
