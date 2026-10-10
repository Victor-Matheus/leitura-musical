import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { openMic } from './micInput'

const stopTrack = vi.fn()
let workletThrows = false

class FakeNode {
  connections: unknown[] = []
  connect = vi.fn((dest: unknown) => {
    this.connections.push(dest)
  })
  disconnect = vi.fn()
}

class FakeWorkletNode extends FakeNode {
  port = { onmessage: null as unknown }
  constructor() {
    super()
    if (workletThrows) throw new Error('boom')
  }
}

function fakeContext() {
  const source = new FakeNode()
  const gain = Object.assign(new FakeNode(), { gain: { value: 1 } })
  const destination = {}
  const ctx = {
    sampleRate: 48000,
    destination,
    audioWorklet: { addModule: async () => {} },
    createMediaStreamSource: () => source,
    createGain: () => gain,
  } as unknown as AudioContext
  return { ctx, source, gain, destination }
}

beforeEach(() => {
  workletThrows = false
  stopTrack.mockClear()
  vi.stubGlobal('AudioContext', class {})
  vi.stubGlobal('AudioWorkletNode', FakeWorkletNode)
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: stopTrack }] }) },
  })
})
afterEach(() => vi.unstubAllGlobals())

test('o worklet vai a um ganho 0 ligado ao destination, e close() desliga tudo', async () => {
  const { ctx, source, gain, destination } = fakeContext()
  const mic = await openMic(ctx)
  expect(gain.gain.value).toBe(0)
  expect(source.connections[0]).toBeInstanceOf(FakeWorkletNode)
  const node = source.connections[0] as FakeWorkletNode
  expect(node.connections).toEqual([gain])
  expect(gain.connections).toEqual([destination])
  mic.close()
  expect(gain.disconnect).toHaveBeenCalled()
  expect(node.disconnect).toHaveBeenCalled()
  expect(stopTrack).toHaveBeenCalled()
})

test('AudioWorkletNode lançando: as trilhas do microfone são paradas', async () => {
  workletThrows = true
  const { ctx } = fakeContext()
  await expect(openMic(ctx)).rejects.toThrow('unsupported')
  expect(stopTrack).toHaveBeenCalled()
})
