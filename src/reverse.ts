export function reverseSamples(samples: Float32Array): Float32Array<ArrayBuffer> {
  const out = new Float32Array(samples.length);
  for (let i = 0, j = samples.length - 1; i < samples.length; i++, j--) {
    out[i] = samples[j];
  }
  return out;
}

export function reverseAudioBuffer(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const out = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    out.copyToChannel(reverseSamples(buffer.getChannelData(ch)), ch);
  }
  return out;
}
