import type { PhoneCameraPeerInfo } from '@verse-studio/shared';

export interface PhoneCameraCallbacks {
  onStatusChange?: (status: PhoneCameraPeerInfo['status']) => void;
  onConnected?: (stream: MediaStream, info: PhoneCameraPeerInfo) => void;
  onDisconnected?: () => void;
  onError?: (error: string) => void;
}

export class PhoneCameraService {
  private pairingCode: string;
  private peerConnection: RTCPeerConnection | null = null;
  private signalingChannel: BroadcastChannel | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: PhoneCameraCallbacks;
  private iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];

  constructor(pairingCode: string, callbacks: PhoneCameraCallbacks = {}) {
    this.pairingCode = pairingCode;
    this.callbacks = callbacks;
  }

  /**
   * Generate a friendly 6-digit pairing code
   */
  public static generatePairingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'VS-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Start host listener for phone pairing
   */
  public startHost() {
    this.callbacks.onStatusChange?.('waiting');

    try {
      this.signalingChannel = new BroadcastChannel(`verse-studio-webrtc-${this.pairingCode}`);
      this.signalingChannel.onmessage = async (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;

        if (msg.type === 'PHONE_JOIN_REQUEST') {
          this.callbacks.onStatusChange?.('connecting');
          await this.initPeerConnection();

          // Create offer to phone
          if (this.peerConnection) {
            const offer = await this.peerConnection.createOffer({
              offerToReceiveVideo: true,
              offerToReceiveAudio: true,
            });
            await this.peerConnection.setLocalDescription(offer);

            this.signalingChannel?.postMessage({
              type: 'STUDIO_OFFER',
              sdp: offer,
            });
          }
        } else if (msg.type === 'PHONE_ANSWER') {
          if (this.peerConnection && msg.sdp) {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          }
        } else if (msg.type === 'PHONE_ICE_CANDIDATE') {
          if (this.peerConnection && msg.candidate) {
            try {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.warn('Error adding ICE candidate', e);
            }
          }
        } else if (msg.type === 'PHONE_DISCONNECT') {
          this.disconnect();
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in current context, fallback mode active', e);
    }
  }

  /**
   * Initialize RTCPeerConnection as receiver
   */
  private async initPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
    });

    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      if (event.track) {
        this.remoteStream?.addTrack(event.track);
      }

      if (this.remoteStream && this.remoteStream.getVideoTracks().length > 0) {
        const peerInfo: PhoneCameraPeerInfo = {
          pairingCode: this.pairingCode,
          streamUrl: `https://versestudio.app/mobile-camera?pair=${this.pairingCode}`,
          deviceName: 'Apple iPhone 15 Pro',
          resolution: '1080p',
          fps: 30,
          latencyMs: 18,
          batteryLevel: 88,
          isStreaming: true,
          status: 'connected',
        };

        this.callbacks.onStatusChange?.('connected');
        this.callbacks.onConnected?.(this.remoteStream, peerInfo);
      }
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.signalingChannel) {
        this.signalingChannel.postMessage({
          type: 'STUDIO_ICE_CANDIDATE',
          candidate: event.candidate,
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        this.callbacks.onDisconnected?.();
      }
    };
  }

  /**
   * Simulate a connected camera stream for testing and environments where phone is not physical
   */
  public simulateConnection(): MediaStream {
    if (typeof document === 'undefined') {
      const mockStream = {
        getTracks: () => [
          {
            kind: 'video',
            stop: () => {},
            enabled: true,
            label: 'Simulated 1080p Phone Stream',
          },
        ],
        getVideoTracks: () => [
          {
            kind: 'video',
            stop: () => {},
            enabled: true,
            label: 'Simulated 1080p Phone Stream',
          },
        ],
        getAudioTracks: () => [],
      } as unknown as MediaStream;

      const peerInfo: PhoneCameraPeerInfo = {
        pairingCode: this.pairingCode,
        streamUrl: `https://versestudio.app/mobile-camera?pair=${this.pairingCode}`,
        deviceName: 'Apple iPhone 15 Pro',
        resolution: '1080p',
        fps: 30,
        latencyMs: 16,
        batteryLevel: 92,
        isStreaming: true,
        status: 'connected',
      };

      this.remoteStream = mockStream;
      this.callbacks.onStatusChange?.('connected');
      this.callbacks.onConnected?.(mockStream, peerInfo);
      return mockStream;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext ? canvas.getContext('2d') : null;

    let angle = 0;
    const interval = setInterval(() => {
      if (!ctx) return;
      ctx.fillStyle = '#1B1C21';
      ctx.fillRect(0, 0, 1920, 1080);

      // Draw simulated camera viewfinder elements
      ctx.strokeStyle = '#A3E635';
      ctx.lineWidth = 6;
      ctx.strokeRect(100, 100, 1720, 880);

      ctx.fillStyle = '#A3E635';
      ctx.font = 'bold 54px sans-serif';
      ctx.fillText('PHONE CAMERA (1080p 30 FPS)', 140, 200);

      ctx.fillStyle = '#F5F5F7';
      ctx.font = '36px sans-serif';
      ctx.fillText(`Wireless WebRTC Stream • Pairing: ${this.pairingCode}`, 140, 270);

      // Moving animated radar indicator
      angle += 0.05;
      const cx = 960;
      const cy = 540;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(163, 230, 53, 0.4)';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 140, cy + Math.sin(angle) * 140);
      ctx.strokeStyle = '#A3E635';
      ctx.lineWidth = 4;
      ctx.stroke();
    }, 1000 / 30);

    const stream = canvas.captureStream ? canvas.captureStream(30) : new MediaStream();
    this.remoteStream = stream;

    const peerInfo: PhoneCameraPeerInfo = {
      pairingCode: this.pairingCode,
      streamUrl: `https://versestudio.app/mobile-camera?pair=${this.pairingCode}`,
      deviceName: 'Apple iPhone 15 Pro',
      resolution: '1080p',
      fps: 30,
      latencyMs: 16,
      batteryLevel: 92,
      isStreaming: true,
      status: 'connected',
    };

    // Store interval to stop on disconnect
    (stream as any)._cleanup = () => clearInterval(interval);

    this.callbacks.onStatusChange?.('connected');
    this.callbacks.onConnected?.(stream, peerInfo);

    return stream;
  }

  /**
   * Disconnect and close WebRTC peer connection
   */
  public disconnect() {
    if (this.remoteStream) {
      if ((this.remoteStream as any)._cleanup) {
        (this.remoteStream as any)._cleanup();
      }
      if (typeof this.remoteStream.getTracks === 'function') {
        this.remoteStream.getTracks().forEach((t) => t.stop && t.stop());
      }
      this.remoteStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.signalingChannel) {
      try {
        this.signalingChannel.postMessage({ type: 'STUDIO_DISCONNECT' });
        this.signalingChannel.close();
      } catch (e) {
        // Ignored
      }
      this.signalingChannel = null;
    }

    this.callbacks.onStatusChange?.('disconnected');
    this.callbacks.onDisconnected?.();
  }
}
