import type { Lesson } from '../types'
import { note, pitch, rest } from './build'

export const figurasPausas: Lesson = {
  id: 'figuras-pausas',
  order: 4,
  title: 'Figuras de valor e pausas',
  summary: 'Quanto tempo dura cada nota e cada silêncio.',
  blocks: [
    {
      kind: 'text',
      text: 'O desenho de uma nota mostra quanto tempo ela dura. Esses desenhos são as **figuras de valor**. Medimos tudo em **tempos**, que são como as batidas regulares de um relógio.',
    },
    {
      kind: 'table',
      head: ['Figura', 'Como é', 'Tempos'],
      rows: [
        ['Semibreve', 'Cabeça vazada, sem haste', '4'],
        ['Mínima', 'Cabeça vazada, com haste', '2'],
        ['Semínima', 'Cabeça cheia, com haste', '1'],
        ['Colcheia', 'Cabeça cheia, haste e uma bandeirola', '½'],
      ],
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('G4', 'w'), note('G4', 'h'), note('G4', 'q'), note('G4', '8')],
      caption: 'Semibreve, mínima, semínima e colcheia',
    },
    {
      kind: 'text',
      text: 'Cada figura vale a metade da anterior: uma semibreve dura o mesmo que 2 mínimas, 4 semínimas ou 8 colcheias. Existe ainda a **semicolcheia**, com duas bandeirolas, que vale metade da colcheia.',
    },
    {
      kind: 'text',
      text: 'O silêncio também é medido. Para cada figura existe uma **pausa** com o mesmo valor. Durante a pausa não tocamos, mas continuamos contando os tempos.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [rest('w'), rest('h'), rest('q'), rest('8')],
      caption: 'Pausas de semibreve, mínima, semínima e colcheia',
    },
    {
      kind: 'tip',
      text: 'As pausas de semibreve e de mínima são parecidas. A de semibreve fica pendurada embaixo da 4ª linha; a de mínima fica sentada em cima da 3ª linha.',
    },
  ],
  exercises: [
    { id: 'figuras', title: 'Figuras e pausas', type: 'figureValue', params: { include: ['w', 'h', 'q', '8'], rests: true, dotted: false } },
  ],
  reading: {
    id: 'leitura-figuras-pausas',
    title: 'Leitura — Figuras de valor e pausas',
    level: 1,
    clef: 'treble',
    notes: [
      pitch('C4', 'h'),
      pitch('E4', 'q'),
      pitch('G4', 'q'),
      pitch('F4', 'h'),
      pitch('E4', 'h'),
      pitch('D4', 'q'),
      pitch('E4', 'q'),
      pitch('F4', 'q'),
      pitch('D4', 'q'),
      pitch('E4', 'h'),
      pitch('C4', 'h'),
    ],
  },
}
