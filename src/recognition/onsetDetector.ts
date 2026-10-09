export interface OnsetDetectorOptions {
  hopSeconds?: number
  minBurstSeconds?: number
  minGapSeconds?: number
  thresholdRatio?: number
}

export interface OnsetDetector {
  /** Onsets confirmados neste bloco (segundos no relógio de `startTime`). */
  push(samples: Float32Array, startTime: number, sampleRate: number): number[]
  reset(): void
}

const NOISE_ALPHA = 0.05
const MIN_THRESHOLD = 0.01

type Phase = 'idle' | 'candidate' | 'speaking'

export function createOnsetDetector(opts: OnsetDetectorOptions = {}): OnsetDetector {
  const hop = opts.hopSeconds ?? 0.01
  const burstWindows = Math.max(1, Math.round((opts.minBurstSeconds ?? 0.06) / hop))
  const gapWindows = Math.max(1, Math.round((opts.minGapSeconds ?? 0.06) / hop))
  const ratio = opts.thresholdRatio ?? 4

  let phase: Phase = 'idle'
  let noise = 0
  let candidateOnset = 0
  let aboveCount = 0
  let belowCount = 0
  let leftover: Float32Array = new Float32Array(0)
  let nextWindowTime = 0

  function reset() {
    phase = 'idle'
    noise = 0
    candidateOnset = 0
    aboveCount = 0
    belowCount = 0
    leftover = new Float32Array(0)
    nextWindowTime = 0
  }

  function trackNoise(rms: number) {
    noise = noise === 0 ? rms : noise + NOISE_ALPHA * (rms - noise)
  }

  function step(rms: number, time: number, found: number[]) {
    const above = rms > Math.max(noise * ratio, MIN_THRESHOLD)
    if (phase === 'idle') {
      if (above) {
        phase = 'candidate'
        candidateOnset = time
        aboveCount = 1
        if (aboveCount >= burstWindows) confirm(found)
      } else trackNoise(rms)
    } else if (phase === 'candidate') {
      if (above) {
        aboveCount++
        if (aboveCount >= burstWindows) confirm(found)
      } else {
        phase = 'idle'
        trackNoise(rms)
      }
    } else if (above) {
      belowCount = 0
    } else {
      trackNoise(rms)
      belowCount++
      if (belowCount >= gapWindows) phase = 'idle'
    }
  }

  function confirm(found: number[]) {
    phase = 'speaking'
    belowCount = 0
    found.push(candidateOnset)
  }

  return {
    push(samples, startTime, sampleRate) {
      const found: number[] = []
      const hopSamples = Math.max(1, Math.round(hop * sampleRate))
      let data = samples
      if (leftover.length === 0) {
        nextWindowTime = startTime
      } else {
        data = new Float32Array(leftover.length + samples.length)
        data.set(leftover)
        data.set(samples, leftover.length)
      }
      let pos = 0
      while (pos + hopSamples <= data.length) {
        let sum = 0
        for (let i = pos; i < pos + hopSamples; i++) sum += data[i] * data[i]
        step(Math.sqrt(sum / hopSamples), nextWindowTime, found)
        pos += hopSamples
        nextWindowTime += hopSamples / sampleRate
      }
      leftover = data.slice(pos)
      return found
    },
    reset,
  }
}
