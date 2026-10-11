import type { Lesson } from '../types'
import { note, pitch } from './build'

export const pautaClaveSol: Lesson = {
  id: 'pauta-clave-sol',
  order: 2,
  title: 'Pauta, notas e clave de sol',
  summary: 'As cinco linhas, os nomes das notas e a primeira clave.',
  blocks: [
    {
      kind: 'text',
      text: 'A música é escrita na **pauta**, também chamada de **pentagrama**. Ela tem **5 linhas** e **4 espaços**, que contamos sempre de baixo para cima. Cada linha ou espaço guarda uma nota.',
    },
    {
      kind: 'text',
      text: 'As notas são sete: **Dó, Ré, Mi, Fá, Sol, Lá e Si**. Depois do Si, a sequência recomeça no Dó, mais agudo. Quanto mais alta a nota na pauta, mais agudo é o som.',
    },
    {
      kind: 'text',
      text: 'A **clave** fica no começo da pauta e dá nome às notas. A **clave de sol** se enrola na **2ª linha**: a nota dessa linha é o **Sol**. A partir dele, descobrimos as outras subindo ou descendo, uma linha ou espaço por vez.',
    },
    {
      kind: 'score',
      clef: 'treble',
      elements: [note('C4', 'w'), note('D4', 'w'), note('E4', 'w'), note('F4', 'w'), note('G4', 'w')],
      caption: 'Dó, Ré, Mi, Fá e Sol na clave de sol',
    },
    {
      kind: 'text',
      text: 'Quando a nota não cabe na pauta, usamos pequenos traços chamados **linhas suplementares**. O Dó do exemplo fica na 1ª linha suplementar de baixo. O Ré fica logo abaixo da 1ª linha.',
    },
    {
      kind: 'tip',
      text: 'Decore duas notas de referência: o Sol na 2ª linha e o Mi na 1ª linha. As outras ficam fáceis de achar a partir delas.',
    },
  ],
  exercises: [{ id: 'notas-sol', title: 'Notas na clave de sol', type: 'noteName', params: { clef: 'treble', low: 'C4', high: 'G4' } }],
  reading: {
    id: 'leitura-pauta-clave-sol',
    title: 'Leitura — Pauta, notas e clave de sol',
    level: 1,
    clef: 'treble',
    notes: [
      pitch('C4', 'q'),
      pitch('D4', 'q'),
      pitch('E4', 'q'),
      pitch('F4', 'q'),
      pitch('G4', 'q'),
      pitch('F4', 'q'),
      pitch('E4', 'q'),
      pitch('D4', 'q'),
      pitch('C4', 'q'),
      pitch('E4', 'q'),
      pitch('D4', 'q'),
      pitch('F4', 'q'),
      pitch('E4', 'q'),
      pitch('G4', 'q'),
      pitch('D4', 'q'),
      pitch('C4', 'q'),
    ],
  },
}
