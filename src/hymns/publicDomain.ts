// Hinos embutidos: só melodias em domínio público (ano < 1900), sem letra.
// Primeira estrofe de cada melodia, em clave de sol, só com notas (o motor não tem
// pausas nem ligaduras).
import type { Accidental, Duration, Note, Piece, Step } from '../data/notes'

export interface PublicDomainHymn {
  id: string
  title: string
  origin: string
  year: number
  timeSignature: '3/4' | '4/4'
  /** Tempos da anacruse (0 = começa no tempo forte) */
  pickupBeats: number
  piece: Piece
}

/**
 * Converte uma sequência como "G4:h F#4:q. B4:8" em notas.
 * Formato: nota + acidente opcional + oitava, ":" e duração (w, h, q, 8), "." para ponto.
 * Barras "|" são ignoradas e servem só para leitura.
 */
function melody(src: string): Note[] {
  return src
    .split(/\s+/)
    .filter((t) => t && t !== '|')
    .map((token) => {
      const m = /^([A-G])([#b]?)(\d):(w|h|q|8)(\.?)$/.exec(token)
      if (!m) throw new Error(`nota inválida: ${token}`)
      const note: Note = { step: m[1] as Step, octave: Number(m[3]), duration: m[4] as Duration }
      if (m[2]) note.accidental = m[2] as Accidental
      if (m[5]) note.dots = 1
      return note
    })
}

export const PUBLIC_DOMAIN_HYMNS: PublicDomainHymn[] = [
  {
    // Louis Bourgeois, Saltério de Genebra, 1551 (melodia do Salmo 134, "Old 100th").
    // Versão de valores iguais: semibreve no início e no fim de cada frase, mínimas no meio.
    id: 'old-hundredth',
    title: 'Old Hundredth',
    origin: 'Louis Bourgeois, Saltério de Genebra',
    year: 1551,
    timeSignature: '4/4',
    pickupBeats: 0,
    piece: {
      id: 'old-hundredth',
      title: 'Old Hundredth',
      level: 2,
      clef: 'treble',
      notes: melody(`
        G4:w | G4:h F#4:h | E4:h D4:h | G4:h A4:h | B4:w |
        B4:w | B4:h A4:h | G4:h C5:h | B4:h A4:h | G4:w |
        G4:w | A4:h B4:h | A4:h G4:h | E4:h F#4:h | G4:w |
        D5:w | B4:h G4:h | A4:h C5:h | B4:h A4:h | G4:w
      `),
    },
  },
  {
    // Melodia tradicional americana "New Britain", publicada em 1829
    // (Virginia Harmony, de Carrell e Clayton). Sem ligaduras, as notas longas do
    // fim de cada frase ficam como mínima.
    id: 'new-britain',
    title: 'New Britain',
    origin: 'Melodia tradicional americana',
    year: 1829,
    timeSignature: '3/4',
    pickupBeats: 1,
    piece: {
      id: 'new-britain',
      title: 'New Britain',
      level: 3,
      clef: 'treble',
      notes: melody(`
        D4:q |
        G4:h B4:8 G4:8 | B4:h A4:q | G4:h E4:q | D4:h D4:q |
        G4:h B4:8 G4:8 | B4:h A4:q | D5:h B4:q |
        D5:h B4:8 G4:8 | B4:h A4:q | G4:h E4:q | D4:h D4:q |
        G4:h B4:8 G4:8 | B4:h A4:q | G4:h
      `),
    },
  },
  {
    // Ludwig van Beethoven, tema do "Hino à Alegria", 4º movimento da 9ª Sinfonia, 1824.
    // Ré maior. Sem a ligadura da antecipação no compasso 12.
    id: 'hino-da-alegria',
    title: 'Hino da Alegria',
    origin: 'Ludwig van Beethoven, 9ª Sinfonia',
    year: 1824,
    timeSignature: '4/4',
    pickupBeats: 0,
    piece: {
      id: 'hino-da-alegria',
      title: 'Hino da Alegria',
      level: 2,
      clef: 'treble',
      notes: melody(`
        F#4:q F#4:q G4:q A4:q | A4:q G4:q F#4:q E4:q | D4:q D4:q E4:q F#4:q | F#4:q. E4:8 E4:h |
        F#4:q F#4:q G4:q A4:q | A4:q G4:q F#4:q E4:q | D4:q D4:q E4:q F#4:q | E4:q. D4:8 D4:h |
        E4:q E4:q F#4:q D4:q | E4:q F#4:8 G4:8 F#4:q D4:q | E4:q F#4:8 G4:8 F#4:q E4:q | D4:q E4:q A3:h |
        F#4:q F#4:q G4:q A4:q | A4:q G4:q F#4:q E4:q | D4:q D4:q E4:q F#4:q | E4:q. D4:8 D4:h
      `),
    },
  },
]
