// Registro dos geradores por tipo de exercício

import type { ExerciseType, Generator } from '../types'
import { concept } from './concept'
import { figureValue } from './figureValue'
import { interval } from './interval'
import { keySignature } from './keySignature'
import { measureFill } from './measureFill'
import { noteName } from './noteName'
import { scale } from './scale'

export const GENERATORS: Record<ExerciseType, Generator> = {
  concept,
  noteName,
  figureValue,
  measureFill,
  interval,
  scale,
  keySignature,
}
