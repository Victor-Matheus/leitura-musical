import type { Lesson } from '../types'
import { bar, note, pitch } from './build'

export const compasso: Lesson = {
  id: 'compasso',
  order: 5,
  title: 'Compasso e fórmula de compasso',
  summary: 'Como os tempos se agrupam e o que dizem os números da pauta.',
  blocks: [
    {
      kind: 'text',
      text: 'Os tempos da música se juntam em grupos do mesmo tamanho, chamados **compassos**. Na pauta, cada compasso termina numa **barra de compasso**, um traço vertical.',
    },
    {
      kind: 'text',
      text: 'No início da música fica a **fórmula de compasso**, com dois números. O de cima diz **quantos tempos** cada compasso tem. O de baixo diz **qual figura vale um tempo**; o número 4 indica a semínima.',
    },
    {
      kind: 'table',
      head: ['Fórmula', 'Tempos', 'Como contar'],
      rows: [
        ['2/4', '2 semínimas', 'forte, fraco'],
        ['3/4', '3 semínimas', 'forte, fraco, fraco'],
        ['4/4', '4 semínimas', 'forte, fraco, meio forte, fraco'],
      ],
    },
    {
      kind: 'score',
      clef: 'treble',
      timeSignature: '3/4',
      elements: [note('C4', 'h'), note('E4', 'q'), bar, note('G4', 'q'), note('F4', 'q'), note('E4', 'q'), bar, note('D4', 'h'), note('C4', 'q')],
      caption: 'Compasso 3/4: cada compasso soma 3 tempos',
    },
    {
      kind: 'text',
      text: 'O primeiro tempo de cada compasso é o **tempo forte**, o que recebe mais apoio. Os outros são **tempos fracos**. Sentir essa diferença ajuda a manter o ritmo.',
    },
    {
      kind: 'tip',
      text: 'Para conferir um compasso, some o valor das figuras. O total precisa ser igual ao número de cima da fórmula.',
    },
  ],
  exercises: [
    { id: 'completar-3-4', title: 'Completar compassos de 3/4', type: 'measureFill', params: { timeSignature: '3/4' } },
    { id: 'completar-4-4', title: 'Completar compassos de 4/4', type: 'measureFill', params: { timeSignature: '4/4' } },
  ],
  reading: {
    id: 'leitura-compasso',
    title: 'Leitura — Compasso e fórmula de compasso',
    level: 2,
    clef: 'treble',
    notes: [
      pitch('C4', 'h'),
      pitch('E4', 'q'),
      pitch('G4', 'h'),
      pitch('E4', 'q'),
      pitch('F4', 'q'),
      pitch('E4', 'q'),
      pitch('D4', 'q'),
      pitch('E4', 'h'),
      pitch('D4', 'q'),
      pitch('C4', 'h'),
      pitch('C4', 'q'),
    ],
  },
}
