import { createChunker } from './chunker'

export interface MicInput {
  readonly context: AudioContext
  readonly sampleRate: number
  onFrame(cb: (samples: Float32Array, startTime: number) => void): () => void
  close(): void
}

const FRAME_SIZE = 2048

export function isVoiceSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof AudioContext !== 'undefined' &&
    typeof AudioWorkletNode !== 'undefined'
  )
}

/** Chamar dentro do gesto do usuário (clique), para o navegador liberar o áudio. */
export function createAudioContext(): AudioContext {
  const ctx = new AudioContext()
  void ctx.resume()
  return ctx
}

export async function openMic(ctx: AudioContext): Promise<MicInput> {
  if (!isVoiceSupported()) throw new Error('unsupported')

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
    })
  } catch {
    throw new Error('denied')
  }

  try {
    await ctx.audioWorklet.addModule('/worklets/mic-tap.js')
  } catch {
    stream.getTracks().forEach((t) => t.stop())
    throw new Error('unsupported')
  }

  const source = ctx.createMediaStreamSource(stream)
  const node = new AudioWorkletNode(ctx, 'mic-tap')
  const listeners = new Set<(samples: Float32Array, startTime: number) => void>()
  const chunker = createChunker(FRAME_SIZE, (samples, startTime) => {
    listeners.forEach((cb) => cb(samples, startTime))
  })
  node.port.onmessage = (e: MessageEvent<{ samples: Float32Array; time: number }>) => {
    chunker.push(e.data.samples, e.data.time, ctx.sampleRate)
  }
  source.connect(node) // o nó não vai ao destination: não há retorno de áudio

  return {
    context: ctx,
    sampleRate: ctx.sampleRate,
    onFrame(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    close() {
      node.port.onmessage = null
      source.disconnect()
      node.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      listeners.clear()
    },
  }
}
