/** Relógio único do motor, em segundos. */
export interface Clock {
  now(): number
}

export function audioClock(ctx: AudioContext): Clock {
  return { now: () => ctx.currentTime }
}

export const performanceClock: Clock = {
  now: () => performance.now() / 1000,
}
