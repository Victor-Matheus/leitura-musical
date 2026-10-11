// Ordem da trilha de teoria: reordenar aqui muda a trilha inteira

import { acidentes } from './lessons/acidentes'
import { andamentoDinamica } from './lessons/andamento-dinamica'
import { armaduras } from './lessons/armaduras'
import { claveFa } from './lessons/clave-fa'
import { compasso } from './lessons/compasso'
import { escalaMaior } from './lessons/escala-maior'
import { figurasPausas } from './lessons/figuras-pausas'
import { intervalos } from './lessons/intervalos'
import { pautaClaveSol } from './lessons/pauta-clave-sol'
import { pontoLigadura } from './lessons/ponto-ligadura'
import { som } from './lessons/som'
import { tomSemitom } from './lessons/tom-semitom'
import type { ExerciseSpec, Lesson } from './types'

export const CURRICULUM: Lesson[] = [
  som,
  pautaClaveSol,
  claveFa,
  figurasPausas,
  compasso,
  pontoLigadura,
  acidentes,
  tomSemitom,
  intervalos,
  escalaMaior,
  armaduras,
  andamentoDinamica,
]

export function getLesson(id: string): Lesson | undefined {
  return CURRICULUM.find((l) => l.id === id)
}

export function getExercise(lessonId: string, exerciseId: string): ExerciseSpec | undefined {
  return getLesson(lessonId)?.exercises.find((e) => e.id === exerciseId)
}
