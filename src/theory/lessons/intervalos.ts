import type { Lesson } from '../types'
import { bar, note } from './build'

export const intervalos: Lesson = {
  id: 'intervalos',
  order: 9,
  title: 'Intervalos',
  summary: 'Como medir e classificar a distância entre duas notas.',
  blocks: [
    {
      kind: 'text',
      text: '**Intervalo** é a distância entre duas notas. Para achar o número dele, contamos as notas de uma até a outra, **incluindo as duas**. De Dó a Mi passamos por Dó, Ré e Mi: são 3 notas, então é uma **3ª**.',
    },
    {
      kind: 'text',
      text: 'Só o número não basta, porque nem toda 3ª tem o mesmo tamanho. Por isso contamos também os semitons. As 2ª, 3ª, 6ª e 7ª podem ser **maiores** ou **menores**; as 4ª, 5ª e 8ª são **justas**. Só há uma exceção entre as notas naturais: Fá–Si tem 6 semitons, um a mais que a 4ª justa, e por isso é uma **4ª aumentada**. Ao contrário, Si–Fá é uma **5ª diminuta**.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('C4', 'w'), note('E4', 'w'), bar, note('D4', 'w'), note('F4', 'w')],
      caption: 'Dó–Mi: 3ª maior (4 semitons). Ré–Fá: 3ª menor (3 semitons)',
    },
    {
      kind: 'table',
      head: ['Intervalo', 'Semitons', 'Exemplo'],
      rows: [
        ['2ª menor', '1', 'Mi–Fá'],
        ['2ª maior', '2', 'Dó–Ré'],
        ['3ª menor', '3', 'Ré–Fá'],
        ['3ª maior', '4', 'Dó–Mi'],
        ['4ª justa', '5', 'Dó–Fá'],
        ['5ª justa', '7', 'Dó–Sol'],
        ['6ª menor', '8', 'Mi–Dó'],
        ['6ª maior', '9', 'Dó–Lá'],
        ['7ª menor', '10', 'Ré–Dó'],
        ['7ª maior', '11', 'Dó–Si'],
        ['8ª justa', '12', 'Dó–Dó'],
      ],
    },
    {
      kind: 'text',
      text: 'Quando as notas soam uma depois da outra, o intervalo é **melódico**. Quando soam juntas, é **harmônico**. A contagem é a mesma nos dois casos.',
    },
    {
      kind: 'tip',
      text: 'Um intervalo menor tem um semitom a menos que o maior de mesmo número. Lembre de Mi–Fá e Si–Dó, os semitons naturais, ao contar.',
    },
  ],
  exercises: [{ id: 'classificar', title: 'Classificar intervalos', type: 'interval', params: { withQuality: true, clef: 'treble' } }],
}
