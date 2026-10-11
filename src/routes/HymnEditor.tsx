import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Copy, Eraser, Minus, Play, Plus, Save, Undo2 } from 'lucide-react'
import { Button, Card } from '../components/ui'
import { FOCUS_RING } from '../components/ui/Button'
import { ScoreView } from '../components/ScoreView'
import { encodeHymn, MAX_HYMN_NOTES, MAX_HYMN_TITLE } from '../hymns/codec'
import { useHymnStore } from '../store/useHymnStore'
import type { UserHymn } from '../store/useHymnStore'
import { usePracticeStore } from '../store/usePracticeStore'
import { NATURAL_STEPS, SOLFEGE } from '../data/notes'
import type { Accidental, Duration, Note, Step } from '../data/notes'
import type { ScoreElement } from '../theory/types'

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 'w', label: 'Semibreve' },
  { value: 'h', label: 'Mínima' },
  { value: 'q', label: 'Semínima' },
  { value: '8', label: 'Colcheia' },
]
const MIN_OCTAVE = 3
const MAX_OCTAVE = 5
const PREVIEW_NOTES = 16

function notesLabel(n: number) {
  return n === 1 ? '1 nota' : `${n} notas`
}

/** Botão de alternância (duração, ponto, acidente) com estado visível e aria-pressed. */
function Toggle({
  pressed,
  onClick,
  label,
  children,
}: {
  pressed: boolean
  onClick: () => void
  label?: string
  children: string
}) {
  const look = pressed
    ? 'bg-[var(--primary)] text-[var(--on-primary)] border-[var(--primary)]'
    : 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--bg)]'
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3 py-2 text-base font-semibold transition-colors ${look} ${FOCUS_RING}`}
    >
      {children}
    </button>
  )
}

function EditorForm({ initial }: { initial?: UserHymn }) {
  const navigate = useNavigate()
  const save = useHymnStore((s) => s.save)
  const highContrast = usePracticeStore((s) => s.settings.highContrast)

  const [savedId, setSavedId] = useState(initial?.id)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [clef, setClef] = useState<'treble' | 'bass'>(initial?.clef ?? 'treble')
  const [notes, setNotes] = useState<Note[]>(initial?.notes ?? [])
  const [octave, setOctave] = useState(4)
  const [duration, setDuration] = useState<Duration>('q')
  const [dotted, setDotted] = useState(false)
  const [accidental, setAccidental] = useState<Accidental | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [shownCode, setShownCode] = useState<string | null>(null)

  const full = notes.length >= MAX_HYMN_NOTES
  const empty = notes.length === 0
  const finalTitle = title.trim() || 'Sem título'

  const edit = (next: Note[]) => {
    setNotes(next)
    setStatus(null)
    setShownCode(null)
  }

  const addNote = (step: Step) => {
    if (full) return
    const note: Note = { step, octave, duration }
    if (accidental) note.accidental = accidental
    if (dotted) note.dots = 1
    edit([...notes, note])
    setAccidental(null)
  }

  const clear = () => {
    if (empty || window.confirm('Apagar todas as notas?')) edit([])
  }

  const onSave = () => {
    const id = save({ id: savedId, title: finalTitle, clef, notes })
    setSavedId(id)
    setTitle(finalTitle)
    setStatus('Hino salvo neste aparelho.')
  }

  const practice = () =>
    navigate('/praticar', {
      state: { piece: { id: `hino-${savedId ?? 'rascunho'}`, title: finalTitle, level: 1, clef, notes } },
    })

  const copyCode = async () => {
    const code = encodeHymn({ title: finalTitle, clef, notes })
    try {
      if (!navigator.clipboard) throw new Error('sem clipboard')
      await navigator.clipboard.writeText(code)
      setShownCode(null)
      setStatus('Código copiado. Envie para quem vai importar.')
    } catch {
      setShownCode(code)
      setStatus('Não deu para copiar sozinho. Selecione o código abaixo e copie.')
    }
  }

  const elements = useMemo<ScoreElement[]>(
    () => notes.slice(-PREVIEW_NOTES).map((note) => ({ kind: 'note', note })),
    [notes],
  )

  return (
    <div className="flex flex-col gap-6 py-2">
      <header className="flex flex-col gap-3">
        <Link to="/hinos" className={`inline-flex items-center gap-2 self-start font-semibold text-[var(--primary)] ${FOCUS_RING}`}>
          <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          Hinos
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">
          {initial ? 'Editar hino' : 'Novo hino'}
        </h1>
      </header>

      <Card className="flex flex-col gap-4 sm:flex-row">
        <label className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold text-[var(--text)]">Título</span>
          <input
            value={title}
            maxLength={MAX_HYMN_TITLE}
            placeholder="Sem título"
            onChange={(e) => {
              setTitle(e.target.value)
              setStatus(null)
            }}
            className="min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-[var(--text)]">Clave</span>
          <select
            value={clef}
            onChange={(e) => {
              setClef(e.target.value as 'treble' | 'bass')
              setStatus(null)
            }}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)]"
          >
            <option value="treble">Clave de sol</option>
            <option value="bass">Clave de fá</option>
          </select>
        </label>
      </Card>

      <Card as="section" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text)]">Prévia</h2>
          <span className="text-base text-[var(--muted)]">{notesLabel(notes.length)}</span>
        </div>
        {notes.length > PREVIEW_NOTES && (
          <p className="text-sm text-[var(--muted)]">Mostrando as últimas {PREVIEW_NOTES} notas.</p>
        )}
        <ScoreView clef={clef} elements={elements} highContrast={highContrast} />
      </Card>

      <Card as="section" className="flex flex-col gap-5" aria-label="Teclado de notas">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-[var(--text)]">Duração</span>
          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <Toggle key={d.value} pressed={duration === d.value} onClick={() => setDuration(d.value)}>
                {d.label}
              </Toggle>
            ))}
            <Toggle pressed={dotted} onClick={() => setDotted((v) => !v)}>
              Ponto
            </Toggle>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-[var(--text)]">Acidente da próxima nota</span>
            <div className="flex gap-2">
              <Toggle label="Sustenido" pressed={accidental === '#'} onClick={() => setAccidental((a) => (a === '#' ? null : '#'))}>
                ♯
              </Toggle>
              <Toggle label="Bemol" pressed={accidental === 'b'} onClick={() => setAccidental((a) => (a === 'b' ? null : 'b'))}>
                ♭
              </Toggle>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-[var(--text)]">Oitava</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={Minus}
                aria-label="Oitava abaixo"
                className="px-3! py-2!"
                disabled={octave <= MIN_OCTAVE}
                onClick={() => setOctave((o) => o - 1)}
              />
              <span className="min-w-8 text-center text-xl font-bold text-[var(--text)]" aria-live="polite">
                {octave}
              </span>
              <Button
                variant="secondary"
                icon={Plus}
                aria-label="Oitava acima"
                className="px-3! py-2!"
                disabled={octave >= MAX_OCTAVE}
                onClick={() => setOctave((o) => o + 1)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {NATURAL_STEPS.map((step) => (
            <Button key={step} variant="secondary" className="px-2!" disabled={full} onClick={() => addNote(step)}>
              {SOLFEGE[step]}
            </Button>
          ))}
        </div>
        {full && (
          <p role="alert" className="font-semibold text-[var(--error)]">
            Limite de {MAX_HYMN_NOTES} notas atingido. Desfaça alguma nota para continuar.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" icon={Undo2} disabled={empty} onClick={() => edit(notes.slice(0, -1))}>
            Desfazer
          </Button>
          <Button variant="ghost" icon={Eraser} disabled={empty} onClick={clear}>
            Limpar
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button icon={Save} disabled={empty} onClick={onSave}>
          Salvar
        </Button>
        <Button variant="secondary" icon={Play} disabled={empty} onClick={practice}>
          Praticar
        </Button>
        <Button variant="secondary" icon={Copy} disabled={empty} onClick={copyCode}>
          Copiar código
        </Button>
      </div>
      {status && (
        <p role="status" className="text-base text-[var(--primary)]">
          {status}
        </p>
      )}
      {shownCode && (
        <textarea
          readOnly
          aria-label="Código para copiar"
          value={shownCode}
          rows={4}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full break-all rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-sm text-[var(--text)]"
        />
      )}
    </div>
  )
}

export function HymnEditor() {
  const { id } = useParams()
  const hymn = useHymnStore((s) => (id ? s.hymns.find((h) => h.id === id) : undefined))

  if (id && !hymn) {
    return (
      <div className="flex flex-col items-start gap-4 py-2">
        <h1 className="text-2xl font-bold text-[var(--text)]">Hino não encontrado</h1>
        <Link to="/hinos" className={`font-semibold text-[var(--primary)] ${FOCUS_RING}`}>
          Voltar para Hinos
        </Link>
      </div>
    )
  }
  return <EditorForm key={id ?? 'novo'} initial={hymn} />
}
