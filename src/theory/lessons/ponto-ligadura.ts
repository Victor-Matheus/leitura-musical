import type { Lesson } from '../types'
import { bar, note, pitch } from './build'

export const pontoLigadura: Lesson = {
  id: 'ponto-ligadura',
  order: 6,
  title: 'Ponto de aumento e ligadura',
  summary: 'Dois jeitos de deixar uma nota mais longa.',
  blocks: [
    {
      kind: 'text',
      text: 'O **ponto de aumento** é um pontinho escrito à direita da nota. Ele soma à nota **metade do valor** dela. Uma mínima vale 2 tempos; com o ponto, vale 2 + 1 = 3 tempos.',
    },
    {
      kind: 'table',
      head: ['Figura pontuada', 'Conta', 'Tempos'],
      rows: [
        ['Semibreve pontuada', '4 + 2', '6'],
        ['Mínima pontuada', '2 + 1', '3'],
        ['Semínima pontuada', '1 + ½', '1½'],
      ],
    },
    {
      kind: 'score',
      clef: 'treble',
      timeSignature: '3/4',
      elements: [note('C4', 'q'), note('D4', 'q'), note('E4', 'q'), bar, note('F4', 'h', 1), bar, note('E4', 'q'), note('D4', 'q'), note('E4', 'q'), bar, note('C4', 'h', 1)],
      caption: 'A mínima pontuada ocupa um compasso inteiro de 3/4',
    },
    {
      kind: 'score',
      clef: 'treble',
      timeSignature: '4/4',
      elements: [note('E4', 'q', 1), note('F4', '8'), note('G4', 'h'), bar, note('C4', 'w')],
      caption: 'Semínima pontuada (1½) + colcheia (½) = 2 tempos',
    },
    {
      kind: 'text',
      text: 'A **ligadura de valor** é um arco que une duas notas **iguais** e vizinhas. Tocamos só a primeira e seguramos o som pela soma das duas. Ela pode atravessar a barra de compasso, coisa que o ponto não consegue.',
    },
    {
      kind: 'tip',
      text: 'Se o arco une notas de alturas diferentes, ele é outro sinal: a ligadura de expressão (ou de frase), que pede para tocar as notas sem separá-las. A ligadura de valor sempre liga a mesma nota.',
    },
  ],
  exercises: [{ id: 'pontuadas', title: 'Figuras pontuadas', type: 'figureValue', params: { include: ['w', 'h', 'q'], rests: false, dotted: true } }],
  reading: {
    id: 'leitura-ponto-ligadura',
    title: 'Leitura — Ponto de aumento e ligadura',
    level: 2,
    clef: 'treble',
    notes: [
      pitch('C4', 'q'),
      pitch('D4', 'q'),
      pitch('E4', 'q'),
      pitch('F4', 'h', 1),
      pitch('G4', 'q'),
      pitch('F4', 'q'),
      pitch('E4', 'q'),
      pitch('D4', 'h', 1),
      pitch('E4', 'q'),
      pitch('D4', 'q'),
      pitch('E4', 'q'),
      pitch('C4', 'h', 1),
    ],
  },
}
