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
  
  // Get audio data
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  
  // Convert Float32Array to Int16Array (WAV format)
  const samples = new Int16Array(length * numberOfChannels);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Convert float (-1.0 to 1.0) to 16-bit integer
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      samples[i * numberOfChannels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
  }
  
  // Create WAV file
  const wavBuffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(wavBuffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // byte rate
  view.setUint16(32, numberOfChannels * 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // Write samples
  const samplesView = new Int16Array(wavBuffer, 44);
  samplesView.set(samples);
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}
