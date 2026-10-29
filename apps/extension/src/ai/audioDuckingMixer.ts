/**
 * VerseStudio 4K Pro — Client-Side Audio Ducking Mixer
 * Implements mixed voice: ducks original Bangla audio track to ~20% volume
 * under 100% English neural AI voice track.
 */

export async function mixAudioWithDucking(
  originalAudioBlob: Blob,
  englishVoiceBlob: Blob,
  banglaVolume = 0.2, // ~20%
  englishVolume = 1.0  // 100%
): Promise<Blob> {
  const AudioCtx = (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) as typeof AudioContext;

  if (!AudioCtx) {
    // Non-browser / test environment fallback: returns merged synthetic blob
    const buf1 = await originalAudioBlob.arrayBuffer();
    const buf2 = await englishVoiceBlob.arrayBuffer();
    return new Blob([buf1, buf2], { type: 'audio/webm' });
  }

  const audioCtx = new AudioCtx();
  try {
    const origBuffer = await audioCtx.decodeAudioData(await originalAudioBlob.arrayBuffer());
    const engBuffer = await audioCtx.decodeAudioData(await englishVoiceBlob.arrayBuffer());

    const maxDuration = Math.max(origBuffer.duration, engBuffer.duration);
    const sampleRate = origBuffer.sampleRate || 44100;
    const numberOfChannels = Math.max(origBuffer.numberOfChannels, engBuffer.numberOfChannels, 2);

    const offlineCtx = new OfflineAudioContext(
      numberOfChannels,
      Math.ceil(sampleRate * maxDuration),
      sampleRate
    );

    // 1. Original Bangla Track Ducked to 20%
    const origSource = offlineCtx.createBufferSource();
    origSource.buffer = origBuffer;
    const origGain = offlineCtx.createGain();
    origGain.gain.setValueAtTime(banglaVolume, 0);
    origSource.connect(origGain);
    origGain.connect(offlineCtx.destination);

    // 2. English Neural Track at 100%
    const engSource = offlineCtx.createBufferSource();
    engSource.buffer = engBuffer;
    const engGain = offlineCtx.createGain();
    engGain.gain.setValueAtTime(englishVolume, 0);
    engSource.connect(engGain);
    engGain.connect(offlineCtx.destination);

    origSource.start(0);
    engSource.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    return audioBufferToWavBlob(renderedBuffer);
  } catch (err) {
    console.warn('Web Audio offline mixing failed, returning raw combined track:', err);
    return new Blob([await originalAudioBlob.arrayBuffer(), await englishVoiceBlob.arrayBuffer()], {
      type: 'audio/webm',
    });
  } finally {
    audioCtx.close().catch(() => {});
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16);         // 16 for PCM
  setUint16(1);          // Linear PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2);              // block align
  setUint16(16);                         // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
