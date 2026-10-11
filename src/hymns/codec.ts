// Código de troca de hinos: 'LM1:' + base64url(JSON em UTF-8)
import type { Accidental, Duration, Note, Step } from '../data/notes'
import type { UserHymn } from '../store/useHymnStore'

export type HymnData = Pick<UserHymn, 'title' | 'clef' | 'notes'>

export const MAX_HYMN_NOTES = 400
export const MAX_HYMN_TITLE = 200
const PREFIX = 'LM1:'

const STEPS: readonly Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const ACCIDENTALS: readonly Accidental[] = ['#', 'b']
const DURATIONS: readonly Duration[] = ['w', 'h', 'q', '8']

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Valida uma nota e devolve uma cópia só com os campos conhecidos. */
function parseNote(v: unknown): Note | null {
  if (!isRecord(v)) return null
  const { step, octave, accidental, duration, dots } = v
  if (!STEPS.includes(step as Step)) return null
  if (typeof octave !== 'number' || !Number.isInteger(octave) || octave < 0 || octave > 8) return null
  if (!DURATIONS.includes(duration as Duration)) return null
  if (accidental !== undefined && !ACCIDENTALS.includes(accidental as Accidental)) return null
  if (dots !== undefined && dots !== 0 && dots !== 1) return null
  const note: Note = { step: step as Step, octave, duration: duration as Duration }
  if (accidental !== undefined) note.accidental = accidental as Accidental
  if (dots !== undefined) note.dots = dots
  return note
}

/** Valida título, clave e notas (até MAX_HYMN_NOTES). Devolve null quando inválido. */
export function parseHymnData(v: unknown): HymnData | null {
  if (!isRecord(v)) return null
  const { title, clef, notes } = v
  if (typeof title !== 'string' || title.length > MAX_HYMN_TITLE) return null
  if (clef !== 'treble' && clef !== 'bass') return null
  if (!Array.isArray(notes) || notes.length > MAX_HYMN_NOTES) return null
  const parsed: Note[] = []
  for (const n of notes) {
    const note = parseNote(n)
    if (!note) return null
    parsed.push(note)
  }
  return { title, clef, notes: parsed }
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('invalid')
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export function encodeHymn(h: HymnData): string {
  const json = JSON.stringify({ title: h.title, clef: h.clef, notes: h.notes })
  return PREFIX + toBase64Url(new TextEncoder().encode(json))
}

/** Lança Error('invalid') para prefixo, base64, JSON ou campos inválidos. */
export function decodeHymn(code: string): HymnData {
  const trimmed = code.trim()
  if (!trimmed.startsWith(PREFIX)) throw new Error('invalid')
  let value: unknown
  try {
    const bytes = fromBase64Url(trimmed.slice(PREFIX.length))
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch {
    throw new Error('invalid')
  }
  const data = parseHymnData(value)
  if (!data) throw new Error('invalid')
  return data
}
