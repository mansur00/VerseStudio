/**
 * VerseStudio 4K Pro — Web Audio Mixing Graph
 * Combines system audio from screen capture and microphone input into a unified master track.
 * Provides real-time volume analysis for the visual mic meter.
 */

export interface AudioMixerOptions {
  micStream?: MediaStream | null;
  displayAudioStream?: MediaStream | null;
  onMicLevel?: (level: number) => void; // 0 to 100
}

export class AudioMixer {
  private audioCtx: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private displaySource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private displayGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  private micLevelCallback?: (level: number) => void;
  private animFrameId: number | null = null;
  private isDisposed: boolean = false;

  constructor(options: AudioMixerOptions = {}) {
    this.micLevelCallback = options.onMicLevel;
    this.init(options);
  }

  private init(options: AudioMixerOptions) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioCtxClass();
    this.destination = this.audioCtx.createMediaStreamDestination();

    // Setup Microphone path
    if (options.micStream && options.micStream.getAudioTracks().length > 0) {
      this.micSource = this.audioCtx.createMediaStreamSource(options.micStream);
      this.micGain = this.audioCtx.createGain();
      this.micGain.gain.value = 1.0;

      // Analyser for UI volume meter
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;

      this.micSource.connect(this.micGain);
      this.micGain.connect(this.analyser);
      this.micGain.connect(this.destination);

      this.startLevelLoop();
    }

    // Setup Display Audio path (System / Tab Audio)
    if (options.displayAudioStream && options.displayAudioStream.getAudioTracks().length > 0) {
      this.displaySource = this.audioCtx.createMediaStreamSource(options.displayAudioStream);
      this.displayGain = this.audioCtx.createGain();
      this.displayGain.gain.value = 1.0;

      this.displaySource.connect(this.displayGain);
      this.displayGain.connect(this.destination);
    }
  }

  private startLevelLoop() {
    if (!this.analyser || !this.micLevelCallback) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const checkLevel = () => {
      if (this.isDisposed || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalize roughly 0 to 100%
      const level = Math.min(100, Math.round((average / 128) * 100));

      this.micLevelCallback?.(level);
      this.animFrameId = requestAnimationFrame(checkLevel);
    };

    this.animFrameId = requestAnimationFrame(checkLevel);
  }

  /**
   * Set microphone volume or mute (0.0 to 1.0)
   */
  setMicVolume(volume: number) {
    if (this.micGain && this.audioCtx) {
      this.micGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
    }
  }

  /**
   * Set display/system audio volume (0.0 to 1.0)
   */
  setDisplayVolume(volume: number) {
    if (this.displayGain && this.audioCtx) {
      this.displayGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioCtx.currentTime);
    }
  }

  /**
   * Returns mixed destination audio stream to pass to MediaRecorder
   */
  getMixedStream(): MediaStream | null {
    return this.destination ? this.destination.stream : null;
  }

  /**
   * Cleans up audio context and stops animation loop
   */
  dispose() {
    this.isDisposed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
    }
    this.micLevelCallback?.(0);
  }
}
