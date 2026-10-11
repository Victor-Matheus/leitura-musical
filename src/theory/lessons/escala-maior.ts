import type { Lesson } from '../types'
import { note, pitch } from './build'

export const escalaMaior: Lesson = {
  id: 'escala-maior',
  order: 10,
  title: 'Escala maior',
  summary: 'O padrão de tons e semitons que forma a escala maior.',
  blocks: [
    {
      kind: 'text',
      text: 'Uma **escala** é uma sequência de notas vizinhas, subindo ou descendo. A **escala maior** vai da primeira nota, a **tônica**, até a mesma nota uma oitava acima. Cada nota é um **grau** da escala.',
    },
    {
      kind: 'text',
      text: 'O que define a escala maior é a ordem das distâncias entre os graus: **T T S T T T S** (tom, tom, semitom, tom, tom, tom, semitom). Os semitons ficam entre o 3º e o 4º grau e entre o 7º e o 8º.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('C4', 'q'), note('D4', 'q'), note('E4', 'q'), note('F4', 'q'), note('G4', 'q'), note('A4', 'q'), note('B4', 'q'), note('C5', 'q')],
      caption: 'Dó maior: só notas naturais, com semitons em Mi–Fá e Si–Dó',
    },
    {
      kind: 'text',
      text: 'Começando em outra nota, às vezes é preciso um acidente para manter o padrão. Em **Sol maior**, o 7º grau precisa ser **Fá♯**: assim fica um tom entre Mi e Fá♯ e um semitom entre Fá♯ e Sol.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('G4', 'q'), note('A4', 'q'), note('B4', 'q'), note('C5', 'q'), note('D5', 'q'), note('E5', 'q'), note('F#5', 'q'), note('G5', 'q')],
      caption: 'Sol maior: Sol, Lá, Si, Dó, Ré, Mi, Fá♯, Sol',
    },
    {
      kind: 'tip',
      text: 'Em Fá maior acontece o contrário: o 4º grau precisa ser Si♭, para ficar um semitom entre Lá e Si♭.',
    },
  ],
  exercises: [
    { id: 'escalas', title: 'Escalas maiores', type: 'scale', params: { keys: ['Dó maior', 'Sol maior', 'Ré maior', 'Fá maior'] } },
  ],
  reading: {
    id: 'leitura-escala-maior',
    title: 'Leitura — Escala maior',
    level: 3,
    clef: 'treble',
    notes: [
      pitch('G4', 'q'),
      pitch('A4', 'q'),
      pitch('B4', 'q'),
      pitch('C5', 'q'),
      pitch('D5', 'q'),
      pitch('E5', 'q'),
      pitch('F#5', 'q'),
      pitch('G5', 'q'),
      pitch('F#5', 'q'),
      pitch('E5', 'q'),
      pitch('D5', 'q'),
      pitch('C5', 'q'),
      pitch('B4', 'q'),
      pitch('A4', 'q'),
      pitch('G4', 'h'),
    ],
  },
}
