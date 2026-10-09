/** Agrupa os quanta de 128 amostras do worklet em blocos de `size` amostras. */
export function createChunker(
  size: number,
  onChunk: (samples: Float32Array, startTime: number) => void,
): { push(samples: Float32Array, time: number, sampleRate: number): void } {
  let buffer = new Float32Array(size)
  let filled = 0
  let startTime = 0

  return {
    push(samples, time, sampleRate) {
      let offset = 0
      while (offset < samples.length) {
        if (filled === 0) startTime = time + offset / sampleRate
        const n = Math.min(size - filled, samples.length - offset)
        buffer.set(samples.subarray(offset, offset + n), filled)
        filled += n
        offset += n
        if (filled === size) {
          onChunk(buffer, startTime)
          buffer = new Float32Array(size)
          filled = 0
        }
      }
    },
  }
}
