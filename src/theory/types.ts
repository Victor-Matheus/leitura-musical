// Tipos do conteúdo de teoria (lições, blocos e exercícios)

import type { Duration, Note, Piece } from '../data/notes'
import type { Rng } from './rng'

export type ScoreElement =
  | { kind: 'note'; note: Note }
  | { kind: 'rest'; duration: Duration; dots?: 0 | 1 }
  | { kind: 'bar' }

export type Block =
  | { kind: 'text'; text: string } // parágrafo; **negrito** simples
  | {
      kind: 'score'
      clef: 'treble' | 'bass'
      keySignature?: string
      timeSignature?: string
      elements: ScoreElement[]
      caption?: string
    }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'tip'; text: string } // destaque "Dica"

export type ScoreBlock = Omit<Extract<Block, { kind: 'score' }>, 'kind'>

export type ExerciseType = 'concept' | 'noteName' | 'figureValue' | 'measureFill' | 'interval' | 'scale' | 'keySignature'

export interface ExerciseSpec {
  id: string
  title: string
  type: ExerciseType
  params: Record<string, unknown>
}

export interface Question {
  prompt: string
  score?: ScoreBlock
  /** aria-label da pauta que não entrega a resposta (sem ele, a pauta se descreve inteira) */
  scoreLabel?: string
  /** 3 ou 4 opções, sem repetição */
  options: string[]
  /** Índice da opção correta */
  answer: number
  /** Mostrada após responder */
  explanation: string
}

export interface Lesson {
  id: string
  order: number
  title: string
  summary: string
  blocks: Block[]
  /** 1 ou 2 */
  exercises: ExerciseSpec[]
  /** Leitura métrica opcional (só notas, sem pausas) */
  reading?: Piece
}

export type Generator = (params: Record<string, unknown>, rng: Rng) => Question
