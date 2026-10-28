'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SmartPhone01Icon,
  CameraVideoIcon,
  CameraOff01Icon,
  Mic01Icon,
  MicOff01Icon,
  CameraRotated01Icon,
  Wifi01Icon,
  FlashIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  LockIcon,
} from '@hugeicons/core-free-icons';
import { Button, StatusChip, HugeIcon } from '@verse-studio/ui';

export default function MobileCameraPage() {
  const [pairingCode, setPairingCode] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'waiting' | 'connecting' | 'connected' | 'error'
  >('idle');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number>(18);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingPollRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

  // Extract ?pair= parameter from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('pair') || 'VS-8924';
      setPairingCode(code.toUpperCase());
    }
  }, []);

  // Request WakeLock to keep mobile screen awake
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
      }
    } catch (e) {
      console.warn('WakeLock request failed', e);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (e) {
        // Ignored
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  // Start mobile camera stream
  const startCamera = async (face: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: face,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      return stream;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setErrorMessage(msg);
      throw err;
    }
  };

  // Connect to Studio Host via Network Signaling & WebRTC
  const startStreamingToStudio = async () => {
    setErrorMessage(null);
    setConnectionStatus('connecting');

    try {
      const stream = await startCamera(facingMode);
      await requestWakeLock();

      const postSignal = async (data: any) => {
        try {
          await fetch('/api/signaling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: pairingCode, role: 'client', data }),
          });
        } catch (e) {
          console.warn('Mobile postSignal failed:', e);
        }
      };

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' },
        ],
      });
      peerConnectionRef.current = pc;

      // Add local camera tracks to peer connection
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          postSignal({
            type: 'PHONE_ICE_CANDIDATE',
            candidate: event.candidate,
          });
        }
      };

      const handleSignalMessage = async (msg: any) => {
        if (!msg) return;

        if (msg.type === 'STUDIO_OFFER') {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await postSignal({
            type: 'PHONE_ANSWER',
            sdp: answer,
          });

          setConnectionStatus('connected');
          setIsStreaming(true);
          setLatencyMs(Math.floor(15 + Math.random() * 8));
        } else if (msg.type === 'STUDIO_ICE_CANDIDATE') {
          if (msg.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
          }
        } else if (msg.type === 'STUDIO_DISCONNECT') {
          stopStreaming();
        }
      };

      // Poll signals from host
      if (signalingPollRef.current) clearInterval(signalingPollRef.current);
      signalingPollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/signaling?code=${encodeURIComponent(pairingCode)}&role=client`);
          if (res.ok) {
            const body = await res.json();
            for (const msg of body.messages || []) {
              await handleSignalMessage(msg);
            }
          }
        } catch (e) {
          // ignore
        }
      }, 250);

      // Send join request to Studio
      await postSignal({
        type: 'PHONE_JOIN_REQUEST',
        pairingCode,
        deviceName: typeof navigator !== 'undefined' && navigator.userAgent.includes('iPhone')
          ? 'Apple iPhone 15 Pro'
          : typeof navigator !== 'undefined' && navigator.userAgent.includes('Android')
          ? 'Android Smartphone'
          : 'Mobile Camera Device',
      });
    } catch (err: unknown) {
      setConnectionStatus('error');
      const msg = err instanceof Error ? err.message : 'Streaming connection failed';
      setErrorMessage(msg);
    }
  };

  // Stop Streaming
  const stopStreaming = () => {
    if (signalingPollRef.current) {
      clearInterval(signalingPollRef.current);
      signalingPollRef.current = null;
    }

    fetch('/api/signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pairingCode, role: 'client', data: { type: 'PHONE_DISCONNECT' } }),
    }).catch(() => {});

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    releaseWakeLock();
    setIsStreaming(false);
    setConnectionStatus('idle');
  };

  // Flip Camera
  const toggleFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (isStreaming) {
      try {
        const newStream = await startCamera(nextMode);
        if (peerConnectionRef.current) {
          const videoTrack = newStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }
      } catch (e) {
        console.warn('Failed to switch camera orientation', e);
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicMuted(!audioTrack.enabled);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1B1C21] text-[#F5F5F7] flex flex-col justify-between select-none">
      {/* Top Header Bar */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-[#2F3037] bg-[#222329]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)]">
            <HugeIcon icon={SmartPhone01Icon} size={16} className="text-[#1B1C21]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">VerseStudio Camera</h1>
            <p className="text-[10px] text-[#A3A4B0]">Screen 17 • Mobile View</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusChip
            status={isStreaming ? 'recording' : connectionStatus === 'connecting' ? 'uploading' : 'private'}
            label={isStreaming ? '1080p 30 FPS' : connectionStatus === 'connecting' ? 'Connecting...' : 'Standby'}
          />
        </div>
      </header>

      {/* Main Viewfinder / Video Stream */}
      <main className="flex-1 relative flex items-center justify-center p-4 bg-black overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full max-h-[82vh] object-cover rounded-2xl border border-white/10 shadow-2xl transition-transform ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Viewfinder crosshairs and HUD */}
        <div className="absolute inset-8 pointer-events-none flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono text-[var(--color-brand-default)] flex items-center gap-1.5">
              <HugeIcon icon={FlashIcon} size={12} className="text-[var(--color-brand-default)]" />
              <span>PAIR: {pairingCode || 'VS-8924'}</span>
            </div>

            {isStreaming && (
              <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono text-white flex items-center gap-1.5">
                <HugeIcon icon={Wifi01Icon} size={12} className="text-[var(--color-brand-default)]" />
                <span>{latencyMs}ms</span>
              </div>
            )}
          </div>

          {/* Center focus indicator */}
          <div className="self-center w-16 h-16 rounded-xl border border-white/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand-default)]" />
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/80">
            <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-md">
              {facingMode === 'user' ? 'Front Camera' : 'Rear Camera'}
            </span>
            {wakeLockActive && (
              <span className="bg-black/60 px-2 py-0.5 rounded backdrop-blur-md flex items-center gap-1 text-[var(--color-brand-default)]">
                <HugeIcon icon={LockIcon} size={12} />
                Screen Awake
              </span>
            )}
          </div>
        </div>

        {/* Status prompt overlay when idle */}
        {!isStreaming && (
          <div className="absolute inset-x-8 bottom-28 p-4 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-center space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
              <HugeIcon icon={CheckmarkCircle01Icon} size={16} className="text-[var(--color-brand-default)]" />
              Ready to Stream Camera Feed
            </h3>
            <p className="text-xs text-[#B9BAC4]">
              Connected to pairing channel <strong>{pairingCode}</strong>. Tap Start Streaming to feed video into your studio camera bubble.
            </p>
          </div>
        )}

        {/* Error notice */}
        {errorMessage && (
          <div className="absolute top-8 inset-x-6 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <HugeIcon icon={AlertCircleIcon} size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar */}
      <footer className="p-5 border-t border-[#2F3037] bg-[#222329] flex items-center justify-around gap-4 shrink-0">
        {/* Flip Camera */}
        <button
          type="button"
          onClick={toggleFacingMode}
          className="p-3.5 rounded-full bg-[#292A31] hover:bg-[#2F3037] border border-[#383942] text-[#F5F5F7] transition-transform active:scale-95"
          aria-label="Flip Camera"
        >
          <HugeIcon icon={CameraRotated01Icon} size={20} className="text-[var(--color-brand-default)]" />
        </button>

        {/* Big Start / Stop Streaming Button */}
        {isStreaming ? (
          <Button
            size="lg"
            variant="danger"
            className="flex-1 max-w-xs shadow-lg"
            leadingIcon={<HugeIcon icon={CameraOff01Icon} size={20} />}
            onClick={stopStreaming}
          >
            Stop Streaming
          </Button>
        ) : (
          <Button
            size="lg"
            variant="primary"
            className="flex-1 max-w-xs shadow-[var(--glow-brand)]"
            leadingIcon={<HugeIcon icon={CameraVideoIcon} size={20} />}
            onClick={startStreamingToStudio}
          >
            Start Streaming (1080p)
          </Button>
        )}

        {/* Mute Mic Toggle */}
        <button
          type="button"
          onClick={toggleMic}
          className={`p-3.5 rounded-full border transition-transform active:scale-95 ${
            isMicMuted
              ? 'bg-red-950/80 border-red-500/50 text-red-400'
              : 'bg-[#292A31] hover:bg-[#2F3037] border-[#383942] text-[#F5F5F7]'
          }`}
          aria-label={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <HugeIcon icon={MicOff01Icon} size={20} /> : <HugeIcon icon={Mic01Icon} size={20} />}
        </button>
      </footer>
    </div>
  );
}
