import type { Lesson } from '../types'
import { bar, note } from './build'

export const armaduras: Lesson = {
  id: 'armaduras',
  order: 11,
  title: 'Armadura de clave e tonalidades',
  summary: 'Os acidentes fixos do início da pauta e a tonalidade que eles indicam.',
  blocks: [
    {
      kind: 'text',
      text: 'Para não escrever o mesmo acidente toda hora, colocamos os sustenidos ou bemóis da escala logo depois da clave. Esse grupo de acidentes é a **armadura de clave**. Ela vale para **todas as notas daquele nome**, em qualquer oitava, até o fim da música.',
    },
    {
      kind: 'score',
      clef: 'treble',
      keySignature: 'G',
      timeSignature: '4/4',
      elements: [note('G4', 'q'), note('A4', 'q'), note('B4', 'q'), note('C5', 'q'), bar, note('D5', 'q'), note('E5', 'q'), note('F#5', 'q'), note('G5', 'q')],
      caption: 'Com Fá♯ na armadura, todo Fá é tocado sustenido: é Sol maior',
    },
    {
      kind: 'text',
      text: 'Os acidentes da armadura aparecem sempre na mesma ordem. Sustenidos: **Fá, Dó, Sol, Ré**. Bemóis: **Si, Mi, Lá, Ré**. A armadura indica a **tonalidade**, isto é, a escala em que a música foi feita.',
    },
    {
      kind: 'table',
      head: ['Armadura', 'Tonalidade maior'],
      rows: [
        ['Sem acidentes', 'Dó maior'],
        ['1 sustenido (Fá♯)', 'Sol maior'],
        ['2 sustenidos (Fá♯, Dó♯)', 'Ré maior'],
        ['3 sustenidos (Fá♯, Dó♯, Sol♯)', 'Lá maior'],
        ['4 sustenidos (Fá♯, Dó♯, Sol♯, Ré♯)', 'Mi maior'],
        ['1 bemol (Si♭)', 'Fá maior'],
        ['2 bemóis (Si♭, Mi♭)', 'Si♭ maior'],
        ['3 bemóis (Si♭, Mi♭, Lá♭)', 'Mi♭ maior'],
        ['4 bemóis (Si♭, Mi♭, Lá♭, Ré♭)', 'Lá♭ maior'],
      ],
    },
    {
      kind: 'tip',
      text: 'Com sustenidos, suba um semitom a partir do último: Dó♯ leva a Ré maior. Com dois ou mais bemóis, o penúltimo dá o nome: em Si♭, Mi♭ e Lá♭, a tonalidade é Mi♭ maior. Um bemol só é Fá maior.',
    },
    {
      kind: 'score',
      clef: 'treble',
      keySignature: 'F',
      timeSignature: '4/4',
      elements: [note('F4', 'q'), note('G4', 'q'), note('A4', 'q'), note('Bb4', 'q'), bar, note('C5', 'w')],
      caption: 'Si♭ na armadura: Fá maior',
    },
  ],
  exercises: [{ id: 'tonalidades', title: 'Qual é a tonalidade?', type: 'keySignature', params: { maxAccidentals: 4 } }],
}
