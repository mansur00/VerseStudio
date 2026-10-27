/**
 * VerseStudio 4K Pro — Capture & Recording Engine
 * Coordinates getDisplayMedia (4K60), getUserMedia (Camera/Mic), AudioMixer,
 * VideoCompositor, and chunked MediaRecorder streaming to IndexedDB.
 */

import { VideoCompositor, CompositorConfig } from './compositor';
import { AudioMixer } from './audioMixer';
import { RecordingStorage, StoredRecordingMeta } from './storage';

export type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'stopped';

export interface DeviceInfo {
  deviceId: string;
  label: string;
}

export interface CaptureEngineListeners {
  onStatusChange?: (status: RecordingStatus) => void;
  onTimeUpdate?: (elapsedMs: number) => void;
  onMicLevel?: (level: number) => void;
  onError?: (err: Error) => void;
}

export class CaptureEngine {
  private status: RecordingStatus = 'idle';
  private screenStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;

  public compositor: VideoCompositor;
  private audioMixer: AudioMixer | null = null;
  private mediaRecorder: MediaRecorder | null = null;

  private currentRecordingId: string | null = null;
  private chunkIndex: number = 0;
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private pauseStartTime: number = 0;
  private timerInterval: number | null = null;

  private listeners: CaptureEngineListeners = {};

  // Device selections
  public selectedCameraId: string = '';
  public selectedMicId: string = '';
  public micMuted: boolean = false;

  constructor(compositorConfig?: Partial<CompositorConfig>, listeners: CaptureEngineListeners = {}) {
    this.listeners = listeners;
    this.compositor = new VideoCompositor(compositorConfig);
  }

  public getStatus(): RecordingStatus {
    return this.status;
  }

  private setStatus(newStatus: RecordingStatus) {
    this.status = newStatus;
    this.listeners.onStatusChange?.(newStatus);
  }

  /**
   * Enumerate available video and audio devices
   */
  public static async getAvailableDevices(): Promise<{ cameras: DeviceInfo[]; mics: DeviceInfo[] }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      const mics = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
      return { cameras, mics };
    } catch (e) {
      console.warn('Failed to enumerate media devices:', e);
      return { cameras: [], mics: [] };
    }
  }

  /**
   * Request screen capture at up to 4K 60FPS
   */
  public async selectScreenSource(): Promise<MediaStream> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
    }

    // 4K 60FPS ideal constraints
    const constraints: DisplayMediaStreamOptions = {
      video: {
        width: { ideal: 3840, max: 3840 },
        height: { ideal: 2160, max: 2160 },
        frameRate: { ideal: 60, max: 60 },
        displaySurface: 'monitor',
      },
      audio: true, // System / tab audio capture
    };

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Handle user stopping stream from browser floating bar
      const videoTrack = this.screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          if (this.status === 'recording' || this.status === 'paused') {
            this.stopRecording();
          }
        });
      }

      this.compositor.setScreenSource(this.screenStream);
      this.compositor.start();
      return this.screenStream;
    } catch (err: any) {
      console.error('getDisplayMedia error:', err);
      this.listeners.onError?.(err);
      throw err;
    }
  }

  /**
   * Connect or reconnect Camera
   */
  public async setCamera(enabled: boolean, deviceId?: string) {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
      this.cameraStream = null;
      this.compositor.setCameraSource(null);
    }

    if (!enabled) return;

    try {
      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 },
        },
      });
      if (deviceId) this.selectedCameraId = deviceId;
      this.compositor.setCameraSource(this.cameraStream);
      this.compositor.start();
    } catch (err: any) {
      console.warn('Failed to access camera:', err);
      this.listeners.onError?.(err);
    }
  }

  /**
   * Set custom camera stream (e.g. from wireless Phone Camera WebRTC)
   */
  public setCustomCameraStream(stream: MediaStream | null) {
    if (this.cameraStream && this.cameraStream !== stream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
    }
    this.cameraStream = stream;
    this.compositor.setCameraSource(stream);
    if (stream) {
      this.compositor.start();
    }
  }

  /**
   * Connect or reconnect Microphone
   */
  public async setMicrophone(enabled: boolean, deviceId?: string) {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }

    if (!enabled) {
      this.micMuted = true;
      this.audioMixer?.setMicVolume(0);
      return;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (deviceId) this.selectedMicId = deviceId;
      this.micMuted = false;
      this.rebuildAudioMixer();
    } catch (err: any) {
      console.warn('Failed to access microphone:', err);
      this.listeners.onError?.(err);
    }
  }

  public toggleMicMute() {
    this.micMuted = !this.micMuted;
    this.audioMixer?.setMicVolume(this.micMuted ? 0 : 1.0);
    return this.micMuted;
  }

  private rebuildAudioMixer() {
    if (this.audioMixer) {
      this.audioMixer.dispose();
      this.audioMixer = null;
    }

    this.audioMixer = new AudioMixer({
      micStream: this.micStream,
      displayAudioStream: this.screenStream,
      onMicLevel: (lvl) => {
        this.listeners.onMicLevel?.(this.micMuted ? 0 : lvl);
      },
    });

    if (this.micMuted) {
      this.audioMixer.setMicVolume(0);
    }
  }

  /**
   * Start 4K Recording session
   */
  public async startRecording(recordingName?: string): Promise<string> {
    if (this.status === 'recording') return this.currentRecordingId!;

    // Ensure compositor is running
    this.compositor.start();

    // Rebuild audio mixing graph
    this.rebuildAudioMixer();

    // Combine composited video and mixed audio
    const compositedVideoTrack = this.compositor.getStream().getVideoTracks()[0];
    const mixedAudioTrack = this.audioMixer?.getMixedStream()?.getAudioTracks()[0];

    const tracks: MediaStreamTrack[] = [compositedVideoTrack];
    if (mixedAudioTrack) {
      tracks.push(mixedAudioTrack);
    }

    const combinedStream = new MediaStream(tracks);

    // Pick best supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    // Bitrate: 30 Mbps for 4K 60FPS
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 30_000_000,
    });

    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.currentRecordingId = recordingId;
    this.chunkIndex = 0;
    this.startTime = Date.now();
    this.pausedDuration = 0;

    // Save initial session metadata to IndexedDB
    const meta: StoredRecordingMeta = {
      id: recordingId,
      name: recordingName || `VerseStudio 4K Recording (${new Date().toLocaleTimeString()})`,
      createdAt: this.startTime,
      durationMs: 0,
      resolution: `${this.compositor.config.width}x${this.compositor.config.height}`,
      fps: this.compositor.config.fps,
      mimeType: selectedMime,
      isComplete: false,
    };
    await RecordingStorage.startSession(meta);

    recorder.ondataavailable = async (e) => {
      if (e.data && e.data.size > 0 && this.currentRecordingId) {
        const idx = this.chunkIndex++;
        await RecordingStorage.appendChunk(this.currentRecordingId, idx, e.data);
      }
    };

    // Timeslice: Flush chunks every 1000ms directly to IndexedDB
    recorder.start(1000);
    this.mediaRecorder = recorder;
    this.setStatus('recording');

    this.startTimerLoop();
    return recordingId;
  }

  public pauseRecording() {
    if (this.status !== 'recording' || !this.mediaRecorder) return;
    this.mediaRecorder.pause();
    this.pauseStartTime = Date.now();
    this.setStatus('paused');
  }

  public resumeRecording() {
    if (this.status !== 'paused' || !this.mediaRecorder) return;
    this.pausedDuration += Date.now() - this.pauseStartTime;
    this.mediaRecorder.resume();
    this.setStatus('recording');
  }

  public async stopRecording(): Promise<string> {
    if (this.status !== 'recording' && this.status !== 'paused') {
      return this.currentRecordingId || '';
    }

    this.stopTimerLoop();
    const finalElapsed = this.getElapsedMs();
    const recId = this.currentRecordingId!;

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        this.setStatus('stopped');
        resolve(recId);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        await RecordingStorage.finalizeSession(recId, finalElapsed);
        this.setStatus('stopped');
        resolve(recId);
      };

      this.mediaRecorder.stop();
    });
  }

  public getElapsedMs(): number {
    if (this.status === 'idle') return 0;
    const now = this.status === 'paused' ? this.pauseStartTime : Date.now();
    return Math.max(0, now - this.startTime - this.pausedDuration);
  }

  private startTimerLoop() {
    this.stopTimerLoop();
    this.timerInterval = window.setInterval(() => {
      this.listeners.onTimeUpdate?.(this.getElapsedMs());
    }, 250);
  }

  private stopTimerLoop() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public dispose() {
    this.stopTimerLoop();
    this.compositor.dispose();
    this.audioMixer?.dispose();
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((t) => t.stop());
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
    }
  }
}
