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

  let source: MediaStreamAudioSourceNode
  let node: AudioWorkletNode
  let sink: GainNode
  try {
    source = ctx.createMediaStreamSource(stream)
    node = new AudioWorkletNode(ctx, 'mic-tap')
    sink = ctx.createGain()
  } catch {
    stream.getTracks().forEach((t) => t.stop())
    throw new Error('unsupported')
  }
  const listeners = new Set<(samples: Float32Array, startTime: number) => void>()
  const chunker = createChunker(FRAME_SIZE, (samples, startTime) => {
    listeners.forEach((cb) => cb(samples, startTime))
  })
  node.port.onmessage = (e: MessageEvent<{ samples: Float32Array; time: number }>) => {
    chunker.push(e.data.samples, e.data.time, ctx.sampleRate)
  }
  // O WebKit só processa nós que chegam ao destination. O ganho 0 garante que
  // não há retorno do microfone nos alto-falantes.
  sink.gain.value = 0
  source.connect(node)
  node.connect(sink)
  sink.connect(ctx.destination)

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
      sink.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      listeners.clear()
    },
  }
}
