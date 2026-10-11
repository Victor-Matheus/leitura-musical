import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Info, Music, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, IconBox } from '../components/ui'
import { PUBLIC_DOMAIN_HYMNS } from '../hymns/publicDomain'
import { decodeHymn } from '../hymns/codec'
import { useHymnStore } from '../store/useHymnStore'
import type { UserHymn } from '../store/useHymnStore'
import type { Piece } from '../data/notes'

/** Piece de prática a partir de um hino do usuário. */
function hymnPiece(h: Pick<UserHymn, 'id' | 'title' | 'clef' | 'notes'>): Piece {
  return { id: `hino-${h.id}`, title: h.title, level: 1, clef: h.clef, notes: h.notes }
}

function notesLabel(n: number) {
  return n === 1 ? '1 nota' : `${n} notas`
}

function ImportCode() {
  const save = useHymnStore((s) => s.save)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const importCode = () => {
    try {
      const data = decodeHymn(code)
      save(data)
      setCode('')
      setMessage({ ok: true, text: `“${data.title || 'Sem título'}” foi importado.` })
    } catch {
      setMessage({ ok: false, text: 'Código inválido ou de versão diferente' })
    }
  }

  return (
    <Card as="section" className="flex flex-col gap-3">
      <label htmlFor="hymn-code" className="text-lg font-bold text-[var(--text)]">
        Importar código
      </label>
      <p className="text-base text-[var(--muted)]">Cole o código que alguém copiou no editor.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="hymn-code"
          aria-label="Código do hino"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setMessage(null)
          }}
          placeholder="LM1:…"
          className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-base text-[var(--text)]"
        />
        <Button variant="secondary" icon={Download} onClick={importCode} disabled={!code.trim()}>
          Importar
        </Button>
      </div>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={message.ok ? 'text-[var(--primary)]' : 'text-[var(--error)] font-semibold'}>
          {message.text}
        </p>
      )}
    </Card>
  )
}

export function Hymns() {
  const navigate = useNavigate()
  const hymns = useHymnStore((s) => s.hymns)
  const remove = useHymnStore((s) => s.remove)

  const play = (piece: Piece) => navigate('/praticar', { state: { piece } })
  const confirmRemove = (h: UserHymn) => {
    if (window.confirm(`Excluir “${h.title}”? Não dá para desfazer.`)) remove(h.id)
  }

  return (
    <div className="flex flex-col gap-10 py-2">
      <header className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text)]">Hinos</h1>
        <Card className="flex items-start gap-4">
          <IconBox icon={Info} />
          <p className="text-base text-[var(--text)]">
            Por direitos autorais, o app não traz os hinos do Hinário. Digite no editor a melodia do hino que
            você está estudando — ela fica salva só neste aparelho.
          </p>
        </Card>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-[var(--text)]">Melodias tradicionais (domínio público)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PUBLIC_DOMAIN_HYMNS.map((h) => (
            <Card key={h.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <IconBox icon={Music} />
                <Badge tone="neutral">{h.timeSignature}</Badge>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold text-[var(--text)]">{h.title}</span>
                <span className="text-base text-[var(--muted)]">
                  {h.origin} · {h.year}
                </span>
                <span className="text-sm text-[var(--muted)]">Versão para leitura, sem ligaduras</span>
              </div>
              <Button icon={Play} onClick={() => play(h.piece)} aria-label={`Praticar ${h.title}`} className="self-start">
                Praticar
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-[var(--text)]">Meus hinos</h2>
          <Button icon={Plus} onClick={() => navigate('/hinos/novo')}>
            Novo hino
          </Button>
        </div>
        {hymns.length === 0 ? (
          <p className="text-base text-[var(--muted)]">
            Você ainda não tem hinos. Toque em “Novo hino” para digitar uma melodia.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {hymns.map((h) => (
              <li key={h.id}>
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="break-words text-xl font-bold text-[var(--text)]">{h.title}</span>
                    <span className="text-base text-[var(--muted)]">
                      {notesLabel(h.notes.length)} · {h.clef === 'bass' ? 'Clave de fá' : 'Clave de sol'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      icon={Play}
                      onClick={() => play(hymnPiece(h))}
                      disabled={h.notes.length === 0}
                      aria-label={`Praticar ${h.title}`}
                    >
                      Praticar
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Pencil}
                      onClick={() => navigate(`/hinos/${h.id}/editar`)}
                      aria-label={`Editar ${h.title}`}
                    >
                      Editar
                    </Button>
                    <Button variant="ghost" icon={Trash2} onClick={() => confirmRemove(h)} aria-label={`Excluir ${h.title}`}>
                      Excluir
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ImportCode />
    </div>
  )
}
