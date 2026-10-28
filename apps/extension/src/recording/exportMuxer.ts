/**
 * VerseStudio 4K Pro — Video Export & Muxing Engine
 * Supports instantaneous or trimmed WebM export and high-compatibility MP4 muxing with synchronized audio.
 */

import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer';

export interface TrimRange {
  start: number;
  end: number;
}

export interface ExportProgress {
  stage: 'analyzing' | 'muxing' | 'finalizing' | 'complete';
  percentage: number;
}

export class ExportMuxer {
  /**
   * Export as native WebM (Instant 0-transcode if untrimmed, or trimmed via WebCodecs & webm-muxer)
   */
  public static async exportWebM(
    videoBlob: Blob,
    filename: string,
    trimRange?: TrimRange,
    onProgress?: (p: ExportProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const trimStart = Math.max(0, trimRange?.start ?? 0);
    const isTrimmed = trimRange && (trimStart > 0.05 || (trimRange.end && trimRange.end > 0));

    // Instant direct download if not trimmed or if WebCodecs unavailable
    if (!isTrimmed || typeof VideoEncoder === 'undefined') {
      this.downloadBlob(videoBlob, filename.endsWith('.webm') ? filename : `${filename}.webm`);
      onProgress?.({ stage: 'complete', percentage: 100 });
      return;
    }

    const audioBuffer = await this.extractAudioBuffer(videoBlob);
    const { videoEl, width, height, duration, blobUrl } = await this.getVideoDimensionsAndDuration(videoBlob, audioBuffer);
    const trimEnd = Math.min(duration, trimRange?.end ?? duration);

    onProgress?.({ stage: 'analyzing', percentage: 10 });
    const trimmedDuration = Math.max(0.1, trimEnd - trimStart);
    const fps = 30;

    const target = new WebmTarget();
    const muxer = new WebmMuxer({
      target,
      video: {
        codec: 'V_VP8',
        width,
        height,
        frameRate: fps,
      },
      audio: audioBuffer
        ? {
            codec: 'A_OPUS',
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
          }
        : undefined,
      firstTimestampBehavior: 'offset',
    });

    onProgress?.({ stage: 'muxing', percentage: 20 });

    if (audioBuffer && typeof AudioEncoder !== 'undefined') {
      await this.encodeAudioOpus(audioBuffer, trimStart, trimEnd, muxer, signal);
    }

    await this.encodeVideo(videoEl, width, height, trimStart, trimmedDuration, fps, 'vp8', (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    }, onProgress, signal);

    onProgress?.({ stage: 'finalizing', percentage: 95 });
    muxer.finalize();
    URL.revokeObjectURL(blobUrl);

    const trimmedBlob = new Blob([target.buffer], { type: 'video/webm' });
    this.downloadBlob(trimmedBlob, filename.endsWith('.webm') ? filename : `${filename}.webm`);
    onProgress?.({ stage: 'complete', percentage: 100 });
  }

  /**
   * Export as MP4 container with synchronized AAC audio and H.264 video
   */
  public static async exportMP4(
    videoBlob: Blob,
    filename: string,
    trimRange?: TrimRange,
    onProgress?: (p: ExportProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    onProgress?.({ stage: 'analyzing', percentage: 10 });

    const audioBuffer = await this.extractAudioBuffer(videoBlob);
    const { videoEl, width, height, duration, blobUrl } = await this.getVideoDimensionsAndDuration(videoBlob, audioBuffer);

    const trimStart = Math.max(0, trimRange?.start ?? 0);
    const trimEnd = Math.min(duration, trimRange?.end ?? duration);
    const trimmedDuration = Math.max(0.1, trimEnd - trimStart);
    const fps = 30;

    onProgress?.({ stage: 'muxing', percentage: 20 });

    const target = new Mp4Target();
    const muxer = new Mp4Muxer({
      target,
      video: {
        codec: 'avc',
        width,
        height,
      },
      audio: audioBuffer
        ? {
            codec: 'aac',
            numberOfChannels: audioBuffer.numberOfChannels,
            sampleRate: audioBuffer.sampleRate,
          }
        : undefined,
      fastStart: 'in-memory',
      firstTimestampBehavior: 'offset',
    });

    if (typeof VideoEncoder !== 'undefined') {
      if (audioBuffer && typeof AudioEncoder !== 'undefined') {
        await this.encodeAudioAAC(audioBuffer, trimStart, trimEnd, muxer, signal);
      }

      const avcCodec = await this.getSupportedH264Codec(width, height, fps);
      await this.encodeVideo(videoEl, width, height, trimStart, trimmedDuration, fps, avcCodec, (chunk, meta) => {
        muxer.addVideoChunk(chunk, meta);
      }, onProgress, signal);
    }

    onProgress?.({ stage: 'finalizing', percentage: 95 });
    muxer.finalize();
    URL.revokeObjectURL(blobUrl);

    const mp4Blob = new Blob([target.buffer], { type: 'video/mp4' });
    this.downloadBlob(mp4Blob, filename.endsWith('.mp4') ? filename : `${filename}.mp4`);
    onProgress?.({ stage: 'complete', percentage: 100 });
  }

  private static async extractAudioBuffer(blob: Blob): Promise<AudioBuffer | null> {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      const audioCtx = new AudioCtx({ sampleRate: 48000 });
      const ab = await blob.arrayBuffer();
      const buffer = await audioCtx.decodeAudioData(ab.slice(0));
      audioCtx.close().catch(() => {});
      return buffer;
    } catch (e) {
      console.warn('Audio decoding skipped or failed:', e);
      return null;
    }
  }

  private static async getVideoDimensionsAndDuration(
    videoBlob: Blob,
    audioBuffer: AudioBuffer | null
  ): Promise<{
    videoEl: HTMLVideoElement;
    width: number;
    height: number;
    duration: number;
    blobUrl: string;
  }> {
    const videoEl = document.createElement('video');
    videoEl.preload = 'auto';
    videoEl.muted = true;
    videoEl.playsInline = true;
    const blobUrl = URL.createObjectURL(videoBlob);
    videoEl.src = blobUrl;

    await new Promise((resolve, reject) => {
      videoEl.onloadedmetadata = () => resolve(true);
      videoEl.onerror = () => reject(new Error('Failed to load video metadata for muxing'));
    });

    let duration = audioBuffer?.duration || videoEl.duration;
    if (!isFinite(duration) || duration <= 0) {
      videoEl.currentTime = 1e10;
      await new Promise((r) => {
        const onSeek = () => {
          videoEl.removeEventListener('seeked', onSeek);
          r(true);
        };
        videoEl.addEventListener('seeked', onSeek);
      });
      duration = videoEl.currentTime || 1;
      videoEl.currentTime = 0;
      await new Promise((r) => {
        const onSeek = () => {
          videoEl.removeEventListener('seeked', onSeek);
          r(true);
        };
        videoEl.addEventListener('seeked', onSeek);
      });
    }

    const width = videoEl.videoWidth || 1920;
    const height = videoEl.videoHeight || 1080;

    return { videoEl, width, height, duration, blobUrl };
  }

  private static async encodeAudioAAC(
    audioBuffer: AudioBuffer,
    trimStart: number,
    trimEnd: number,
    muxer: Mp4Muxer<Mp4Target>,
    signal?: AbortSignal
  ): Promise<void> {
    const encoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('AudioEncoder (AAC) error:', e),
    });

    encoder.configure({
      codec: 'mp4a.40.2',
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      bitrate: 128_000,
    });

    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const startSample = Math.floor(trimStart * sampleRate);
    const endSample = Math.min(audioBuffer.length, Math.floor(trimEnd * sampleRate));
    const totalSamples = Math.max(0, endSample - startSample);
    const chunkSize = 1024;

    for (let offset = 0; offset < totalSamples; offset += chunkSize) {
      if (signal?.aborted) throw new DOMException('Export aborted', 'AbortError');
      const currentChunk = Math.min(chunkSize, totalSamples - offset);
      const planarData = new Float32Array(currentChunk * numChannels);
      for (let ch = 0; ch < numChannels; ch++) {
        planarData.set(
          audioBuffer.getChannelData(ch).subarray(startSample + offset, startSample + offset + currentChunk),
          ch * currentChunk
        );
      }
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfFrames: currentChunk,
        numberOfChannels: numChannels,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planarData,
      });
      encoder.encode(audioData);
      audioData.close();
    }

    await encoder.flush();
    encoder.close();
  }

  private static async encodeAudioOpus(
    audioBuffer: AudioBuffer,
    trimStart: number,
    trimEnd: number,
    muxer: WebmMuxer<WebmTarget>,
    signal?: AbortSignal
  ): Promise<void> {
    const encoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.error('AudioEncoder (Opus) error:', e),
    });

    encoder.configure({
      codec: 'opus',
      numberOfChannels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      bitrate: 128_000,
    });

    const sampleRate = audioBuffer.sampleRate;
    const numChannels = audioBuffer.numberOfChannels;
    const startSample = Math.floor(trimStart * sampleRate);
    const endSample = Math.min(audioBuffer.length, Math.floor(trimEnd * sampleRate));
    const totalSamples = Math.max(0, endSample - startSample);
    const chunkSize = 960; // 20ms at 48kHz

    for (let offset = 0; offset < totalSamples; offset += chunkSize) {
      if (signal?.aborted) throw new DOMException('Export aborted', 'AbortError');
      const currentChunk = Math.min(chunkSize, totalSamples - offset);
      const planarData = new Float32Array(currentChunk * numChannels);
      for (let ch = 0; ch < numChannels; ch++) {
        planarData.set(
          audioBuffer.getChannelData(ch).subarray(startSample + offset, startSample + offset + currentChunk),
          ch * currentChunk
        );
      }
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate,
        numberOfFrames: currentChunk,
        numberOfChannels: numChannels,
        timestamp: Math.round((offset / sampleRate) * 1_000_000),
        data: planarData,
      });
      encoder.encode(audioData);
      audioData.close();
    }

    await encoder.flush();
    encoder.close();
  }

  private static async getSupportedH264Codec(width: number, height: number, fps: number): Promise<string> {
    const candidates = ['avc1.640034', 'avc1.4d0034', 'avc1.420034', 'avc1.4d002a', 'avc1.42001f'];
    for (const codec of candidates) {
      try {
        const support = await VideoEncoder.isConfigSupported({
          codec,
          width,
          height,
          bitrate: 12_000_000,
          framerate: fps,
        });
        if (support.supported) return codec;
      } catch (e) {
        // continue
      }
    }
    return 'avc1.640034';
  }

  private static async encodeVideo(
    videoEl: HTMLVideoElement,
    width: number,
    height: number,
    trimStart: number,
    trimmedDuration: number,
    fps: number,
    codec: string,
    onChunk: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void,
    onProgress?: (p: ExportProgress) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let encoderError: Error | null = null;
    const encoder = new VideoEncoder({
      output: onChunk,
      error: (e) => {
        encoderError = e;
        console.error('VideoEncoder error:', e);
      },
    });

    encoder.configure({
      codec,
      width,
      height,
      bitrate: 12_000_000,
      framerate: fps,
    });

    const totalFrames = Math.max(1, Math.round(trimmedDuration * fps));

    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) throw new DOMException('Export aborted', 'AbortError');
      if (encoderError) throw encoderError;
      if (encoder.state === 'closed') throw new Error('VideoEncoder closed unexpectedly');

      const targetTime = trimStart + (i / fps);
      if (Math.abs(videoEl.currentTime - targetTime) > 0.001) {
        videoEl.currentTime = targetTime;
        await new Promise((resolve) => {
          let timeoutId: any = null;
          const onSeeked = () => {
            if (timeoutId) clearTimeout(timeoutId);
            videoEl.removeEventListener('seeked', onSeeked);
            resolve(true);
          };
          timeoutId = setTimeout(() => {
            videoEl.removeEventListener('seeked', onSeeked);
            resolve(true);
          }, 100);
          videoEl.addEventListener('seeked', onSeeked);
        });
      }

      ctx.drawImage(videoEl, 0, 0, width, height);
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round((i / fps) * 1_000_000),
      });

      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      if (i % 10 === 0 || i === totalFrames - 1) {
        const pct = 20 + Math.round((i / totalFrames) * 72);
        onProgress?.({ stage: 'muxing', percentage: Math.min(92, pct) });
      }
    }

    await encoder.flush();
    encoder.close();
  }

  private static downloadBlob(blob: Blob, filename: string): void {
    if (typeof document === 'undefined') return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
