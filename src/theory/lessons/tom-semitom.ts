import type { Lesson } from '../types'
import { bar, note } from './build'

export const tomSemitom: Lesson = {
  id: 'tom-semitom',
  order: 8,
  title: 'Tom e semitom',
  summary: 'As duas medidas de distância entre notas vizinhas.',
  blocks: [
    {
      kind: 'text',
      text: 'O **semitom** é a menor distância entre duas notas diferentes. Dois semitons juntos formam um **tom**.',
    },
    {
      kind: 'text',
      text: 'Entre as notas naturais vizinhas, quase sempre há um tom. As exceções são **Mi–Fá** e **Si–Dó**: entre elas há só um semitom.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('C4', 'w'), note('D4', 'w'), note('E4', 'w'), note('F4', 'w'), note('G4', 'w'), note('A4', 'w'), note('B4', 'w'), note('C5', 'w')],
      caption: 'Dó–Ré tom, Ré–Mi tom, Mi–Fá semitom, Fá–Sol tom, Sol–Lá tom, Lá–Si tom, Si–Dó semitom',
    },
    {
      kind: 'text',
      text: 'Os acidentes também andam de semitom em semitom. De **Fá** para **Fá♯** há um semitom. De **Fá♯** para **Sol** há outro. Por isso, de Fá a Sol há um tom.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('F4', 'w'), note('F#4', 'w'), note('G4', 'w'), bar, note('E4', 'w'), note('F4', 'w')],
      caption: 'Fá–Fá♯–Sol: dois semitons. Mi–Fá: um semitom',
    },
    {
      kind: 'tip',
      text: 'No teclado, de uma tecla para a vizinha mais próxima, branca ou preta, há sempre um semitom. Entre Mi e Fá, e entre Si e Dó, não há tecla preta.',
    },
  ],
  exercises: [{ id: 'tom-ou-semitom', title: 'Tom ou semitom?', type: 'interval', params: { maxNumber: 2, clef: 'treble' } }],
}
