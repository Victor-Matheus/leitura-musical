import type { Lesson } from '../types'
import { bar, note } from './build'

export const acidentes: Lesson = {
  id: 'acidentes',
  order: 7,
  title: 'Sustenido, bemol e bequadro',
  summary: 'Os sinais que sobem, descem ou devolvem a nota ao natural.',
  blocks: [
    {
      kind: 'text',
      text: 'Os **acidentes** são sinais escritos antes da nota, na mesma linha ou espaço dela. Eles mudam a altura da nota em um **semitom**, a menor distância entre dois sons no nosso sistema.',
    },
    {
      kind: 'table',
      head: ['Sinal', 'Nome', 'O que faz'],
      rows: [
        ['♯', 'Sustenido', 'Sobe a nota um semitom'],
        ['♭', 'Bemol', 'Desce a nota um semitom'],
        ['♮', 'Bequadro', 'Cancela o sustenido ou o bemol e volta à nota natural'],
      ],
    },
    {
      kind: 'score',
      clef: 'treble',
      timeSignature: '4/4',
      elements: [note('F4', 'q'), note('F#4', 'q'), note('G4', 'h'), bar, note('B4', 'q'), note('Bb4', 'q'), note('A4', 'h')],
      caption: 'Fá e Fá♯; depois Si e Si♭',
    },
    {
      kind: 'text',
      text: 'O nome da nota alterada junta o nome natural e o acidente: **Fá sustenido** (Fá♯), **Si bemol** (Si♭). Na pauta, a nota continua no mesmo lugar; só o som muda.',
    },
    {
      kind: 'text',
      text: 'Um acidente escrito no meio da música vale para as notas da mesma linha ou espaço **até o fim do compasso**. Depois da barra, a nota volta ao natural. Para cancelar antes disso, usamos o bequadro.',
    },
    {
      kind: 'tip',
      text: 'Fale o nome inteiro ao ler: "Fá sustenido", e não só "Fá". Assim você não esquece o acidente.',
    },
  ],
  exercises: [
    { id: 'notas-alteradas', title: 'Notas com acidentes', type: 'noteName', params: { clef: 'treble', low: 'C4', high: 'C5', accidentals: true } },
  ],
}
