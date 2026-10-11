import type { Lesson } from '../types'

export const som: Lesson = {
  id: 'som',
  order: 1,
  title: 'O som e suas propriedades',
  summary: 'O que é o som e as quatro qualidades que o descrevem.',
  blocks: [
    {
      kind: 'text',
      text: 'Tudo o que ouvimos começa com uma **vibração**. Uma corda, a palheta de um instrumento ou as nossas cordas vocais tremem e empurram o ar. Esse movimento chega aos ouvidos, e o cérebro o percebe como **som**.',
    },
    {
      kind: 'text',
      text: 'Quando a vibração é regular, ouvimos um som musical, que tem afinação. Quando é irregular, como uma porta batendo, ouvimos um **ruído**.',
    },
    {
      kind: 'text',
      text: 'Todo som musical tem quatro **propriedades**. Com elas conseguimos descrever qualquer nota que tocamos ou cantamos.',
    },
    {
      kind: 'table',
      head: ['Propriedade', 'O que diz', 'Exemplo'],
      rows: [
        ['Altura', 'Se o som é grave ou agudo', 'Um trovão é grave; um apito é agudo'],
        ['Duração', 'Se o som é longo ou curto', 'Uma nota segurada é longa; uma palma é curta'],
        ['Intensidade', 'Se o som é forte ou fraco', 'Um grito é forte; um cochicho é fraco'],
        ['Timbre', 'A "cor" própria de cada fonte sonora', 'Violino e flauta tocando a mesma nota soam diferentes'],
      ],
    },
    {
      kind: 'tip',
      text: 'Não confunda altura com volume. Altura é grave ou agudo. Forte ou fraco é intensidade.',
    },
    {
      kind: 'text',
      text: 'Na partitura, a altura aparece no lugar da nota na pauta, e a duração aparece na figura usada. A intensidade é indicada por sinais de dinâmica, que veremos na última lição.',
    },
  ],
  exercises: [{ id: 'propriedades', title: 'Propriedades do som', type: 'concept', params: { bank: 'properties' } }],
}
