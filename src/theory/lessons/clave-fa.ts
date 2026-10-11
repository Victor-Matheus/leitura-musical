import type { Lesson } from '../types'
import { note } from './build'

export const claveFa: Lesson = {
  id: 'clave-fa',
  order: 3,
  title: 'Clave de fá',
  summary: 'A clave das notas graves e como ler nela.',
  blocks: [
    {
      kind: 'text',
      text: 'Instrumentos graves, como o fagote, o trombone, a tuba e a mão esquerda do órgão, usam a **clave de fá**. Ela deixa as notas graves dentro da pauta, sem muitas linhas suplementares.',
    },
    {
      kind: 'text',
      text: 'A clave de fá mais usada é a **clave de fá na 4ª linha**. Seus dois pontinhos ficam um acima e outro abaixo da 4ª linha, e a nota dessa linha é o **Fá**.',
    },
    {
      kind: 'score',
      clef: 'bass',
      elements: [note('G2', 'w'), note('A2', 'w'), note('B2', 'w'), note('C3', 'w'), note('D3', 'w'), note('E3', 'w'), note('F3', 'w')],
      caption: 'Da 1ª linha (Sol) até a 4ª linha (Fá)',
    },
    {
      kind: 'text',
      text: 'Na clave de fá, a 1ª linha é **Sol**, a 3ª linha é **Ré** e a 5ª linha é **Lá**. Logo acima da pauta vem o Si, e o **Dó** fica na 1ª linha suplementar de cima.',
    },
    {
      kind: 'score',
      clef: 'bass',
      elements: [note('F3', 'w'), note('G3', 'w'), note('A3', 'w'), note('B3', 'w'), note('C4', 'w')],
      caption: 'Do Fá da 4ª linha até o Dó central',
    },
    {
      kind: 'tip',
      text: 'O Dó da 1ª linha suplementar de cima, na clave de fá, é o mesmo som do Dó da 1ª linha suplementar de baixo, na clave de sol. Ele é chamado de Dó central.',
    },
  ],
  exercises: [{ id: 'notas-fa', title: 'Notas na clave de fá', type: 'noteName', params: { clef: 'bass', low: 'G2', high: 'C4' } }],
}
