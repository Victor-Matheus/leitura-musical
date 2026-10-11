class MicTap extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0] && inputs[0][0]
    if (channel) this.port.postMessage({ samples: channel.slice(), time: currentTime })
    return true
  }
}
registerProcessor('mic-tap', MicTap)
