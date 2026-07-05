function encodeWAV(audioBuffer: AudioBuffer, maxSeconds?: number): Blob {
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = maxSeconds
    ? Math.min(audioBuffer.length, Math.floor(maxSeconds * sampleRate))
    : audioBuffer.length;

  const samples = new Int16Array(length * numberOfChannels);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      samples[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
  }

  const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wavBuffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  new Int16Array(wavBuffer, 44).set(samples);

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

/**
 * Crop any audio blob to maxSeconds and return a WAV blob.
 * If the audio is already shorter, it is returned as-is (converted to WAV).
 */
export async function cropAudioToSeconds(blob: Blob, maxSeconds: number): Promise<{ blob: Blob; cropped: boolean }> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await blob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const cropped = audioBuffer.duration > maxSeconds;
  return { blob: encodeWAV(audioBuffer, maxSeconds), cropped };
}

/**
 * Convert WebM audio blob to WAV format using Web Audio API
 */
export async function convertWebMToWAV(webmBlob: Blob): Promise<Blob> {
  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Convert blob to array buffer
  const arrayBuffer = await webmBlob.arrayBuffer();
  
  // Decode audio data
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  return encodeWAV(audioBuffer);
}

