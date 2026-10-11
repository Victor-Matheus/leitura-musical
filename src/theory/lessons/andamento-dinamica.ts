import type { Lesson } from '../types'
import { bar, note } from './build'

export const andamentoDinamica: Lesson = {
  id: 'andamento-dinamica',
  order: 12,
  title: 'Andamento e dinâmica',
  summary: 'A velocidade da música e a força com que tocamos.',
  blocks: [
    {
      kind: 'text',
      text: '**Andamento** é a velocidade dos tempos. Ele costuma vir escrito no alto da partitura, com palavras em italiano. O **metrônomo** ajuda a medir: o número indica quantos tempos cabem em um minuto.',
    },
    {
      kind: 'table',
      head: ['Andamento', 'Significado'],
      rows: [
        ['Largo', 'Muito lento e amplo'],
        ['Adagio', 'Lento e tranquilo'],
        ['Andante', 'Calmo, no passo de quem caminha'],
        ['Moderato', 'Moderado'],
        ['Allegro', 'Rápido e alegre'],
      ],
    },
    {
      kind: 'text',
      text: '**Dinâmica** é a variação de intensidade: tocar mais forte ou mais suave. Os sinais ficam embaixo da pauta e valem até aparecer outro.',
    },
    {
      kind: 'table',
      head: ['Sinal', 'Nome', 'Como tocar'],
      rows: [
        ['pp', 'Pianíssimo', 'Muito suave'],
        ['p', 'Piano', 'Suave'],
        ['mp', 'Mezzo piano (meio piano)', 'Um pouco suave'],
        ['mf', 'Mezzo forte (meio forte)', 'Um pouco forte'],
        ['f', 'Forte', 'Forte'],
        ['ff', 'Fortíssimo', 'Muito forte'],
      ],
    },
    {
      kind: 'text',
      text: 'Para mudar aos poucos, usamos o **crescendo** (cresc.), que vai ficando mais forte, e o **diminuendo** (dim.), que vai ficando mais suave. Eles também aparecem como dois traços em ângulo: abrindo é crescendo, fechando é diminuendo.',
    },
    {
      kind: 'score',
      clef: 'treble',
      timeSignature: '4/4',
      elements: [note('C4', 'q'), note('D4', 'q'), note('E4', 'q'), note('F4', 'q'), bar, note('G4', 'w')],
      caption: 'Cante este trecho em p, depois em f: as notas são as mesmas, só a intensidade muda',
    },
    {
      kind: 'tip',
      text: 'Treine primeiro devagar e com o metrônomo. Só aumente a velocidade quando as notas estiverem seguras.',
    },
  ],
  exercises: [{ id: 'andamento-e-dinamica', title: 'Andamento e dinâmica', type: 'concept', params: { bank: 'dynamics' } }],
}
