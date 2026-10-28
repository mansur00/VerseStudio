import React, { useState } from 'react';
import {
  SmartPhone01Icon,
  Copy01Icon,
  Tick01Icon,
  ArrowUpRight01Icon,
  Wifi01Icon,
  SparklesIcon,
  FlashIcon,
  BatteryCharging01Icon,
  VideoReplayIcon,
} from '@hugeicons/core-free-icons';
import { Modal, Button, StatusChip, HugeIcon } from '@verse-studio/ui';
import { usePhoneCameraStore } from './phoneCameraStore';

export interface PhoneCameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseAsCamera?: (stream: MediaStream) => void;
}

export const PhoneCameraModal: React.FC<PhoneCameraModalProps> = ({
  open,
  onOpenChange,
  onUseAsCamera,
}) => {
  const {
    status,
    pairingCode,
    streamUrl,
    peerInfo,
    remoteStream,
    connectSimulatedPhone,
    disconnectPhone,
  } = usePhoneCameraStore();

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(streamUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pairingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleUseCamera = () => {
    if (remoteStream) {
      onUseAsCamera?.(remoteStream);
      usePhoneCameraStore.getState().setUsingPhoneCamera(true);
      onOpenChange(false);
    }
  };

  const isConnected = status === 'connected' && Boolean(remoteStream);

  // SVG QR Code generator representation
  const renderQrCode = () => (
    <div className="p-3 bg-white rounded-2xl shadow-md border border-[var(--color-border-subtle)] flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-36 h-36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="QR Code to connect phone"
      >
        <rect width="100" height="100" fill="white" />
        {/* Top-left marker */}
        <rect x="8" y="8" width="24" height="24" rx="4" fill="#1B1C21" />
        <rect x="13" y="13" width="14" height="14" rx="2" fill="white" />
        <rect x="17" y="17" width="6" height="6" rx="1" fill="#1B1C21" />
        {/* Top-right marker */}
        <rect x="68" y="8" width="24" height="24" rx="4" fill="#1B1C21" />
        <rect x="73" y="13" width="14" height="14" rx="2" fill="white" />
        <rect x="77" y="17" width="6" height="6" rx="1" fill="#1B1C21" />
        {/* Bottom-left marker */}
        <rect x="8" y="68" width="24" height="24" rx="4" fill="#1B1C21" />
        <rect x="13" y="73" width="14" height="14" rx="2" fill="white" />
        <rect x="17" y="77" width="6" height="6" rx="1" fill="#1B1C21" />
        {/* Synthetic high-density QR modules */}
        <rect x="36" y="12" width="5" height="5" fill="#1B1C21" />
        <rect x="45" y="16" width="6" height="6" fill="#1B1C21" />
        <rect x="55" y="12" width="5" height="5" fill="#1B1C21" />
        <rect x="36" y="24" width="6" height="6" fill="#1B1C21" />
        <rect x="48" y="26" width="5" height="5" fill="#1B1C21" />
        <rect x="12" y="38" width="6" height="6" fill="#1B1C21" />
        <rect x="22" y="44" width="5" height="5" fill="#1B1C21" />
        <rect x="34" y="40" width="7" height="7" fill="#84CC16" />
        <rect x="45" y="42" width="10" height="10" rx="2" fill="#1B1C21" />
        <rect x="60" y="38" width="6" height="6" fill="#1B1C21" />
        <rect x="72" y="42" width="5" height="5" fill="#1B1C21" />
        <rect x="84" y="38" width="6" height="6" fill="#1B1C21" />
        <rect x="14" y="54" width="5" height="5" fill="#1B1C21" />
        <rect x="24" y="56" width="6" height="6" fill="#1B1C21" />
        <rect x="36" y="54" width="6" height="6" fill="#1B1C21" />
        <rect x="46" y="58" width="8" height="8" fill="#1B1C21" />
        <rect x="62" y="54" width="6" height="6" fill="#84CC16" />
        <rect x="74" y="56" width="6" height="6" fill="#1B1C21" />
        <rect x="38" y="72" width="6" height="6" fill="#1B1C21" />
        <rect x="48" y="76" width="5" height="5" fill="#1B1C21" />
        <rect x="58" y="70" width="6" height="6" fill="#1B1C21" />
        <rect x="70" y="74" width="7" height="7" fill="#1B1C21" />
        <rect x="82" y="70" width="6" height="6" fill="#1B1C21" />
        <rect x="42" y="86" width="6" height="6" fill="#1B1C21" />
        <rect x="54" y="84" width="6" height="6" fill="#1B1C21" />
        <rect x="68" y="86" width="6" height="6" fill="#84CC16" />
        <rect x="80" y="84" width="6" height="6" fill="#1B1C21" />
      </svg>
    </div>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isConnected ? 'Phone Camera Connected' : 'Connect Smartphone Camera'}
      description={
        isConnected
          ? 'Live 1080p 30 FPS stream linked wirelessly via WebRTC.'
          : 'Stream your smartphone camera at 1080p 30 FPS directly into your studio recording.'
      }
      size="md"
    >
      <div className="space-y-5 pt-1">
        {/* Screen 16: Connected State */}
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[var(--color-brand-default)] bg-[var(--color-bg-elevated)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/40 text-[var(--color-brand-default)]">
                    <HugeIcon icon={SmartPhone01Icon} size={24} />
                  </div>
                  <div>
                    <h4 className="font-label-m font-bold text-[var(--color-text-primary)]">
                      {peerInfo?.deviceName || 'Apple iPhone 15 Pro'}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-caption text-[var(--color-text-secondary)] font-medium">
                        Paired with {pairingCode}
                      </span>
                    </div>
                  </div>
                </div>

                <StatusChip status="active" label="1080p 30 FPS" />
              </div>

              {/* Connection diagnostics badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--color-border-subtle)] font-caption">
                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <HugeIcon icon={Wifi01Icon} size={14} className="text-[var(--color-brand-default)]" />
                  <span>Latency: {peerInfo?.latencyMs || 18}ms</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <HugeIcon icon={FlashIcon} size={14} className="text-[var(--color-accent-laser)]" />
                  <span>Quality: Excellent</span>
                </div>
                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <HugeIcon icon={BatteryCharging01Icon} size={14} className="text-[var(--color-brand-default)]" />
                  <span>Battery: {peerInfo?.batteryLevel || 90}%</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  disconnectPhone();
                }}
              >
                Disconnect Phone
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leadingIcon={<HugeIcon icon={VideoReplayIcon} size={16} />}
                  onClick={handleUseCamera}
                >
                  Use as Studio Camera
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Screen 15: Waiting State */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
              {/* QR Code */}
              <div className="shrink-0">{renderQrCode()}</div>

              {/* Instructions & 6-digit code */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div>
                  <span className="font-caption uppercase tracking-wider font-bold text-[var(--color-text-secondary)]">
                    Pairing Code
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <span className="font-timer text-2xl font-black text-[var(--color-brand-default)] tracking-wider px-3 py-1 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-subtle)]">
                      {pairingCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                      aria-label="Copy Pairing Code"
                    >
                      {copiedCode ? <HugeIcon icon={Tick01Icon} size={16} className="text-[var(--color-brand-default)]" /> : <HugeIcon icon={Copy01Icon} size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-caption uppercase tracking-wider font-bold text-[var(--color-text-secondary)]">
                    Mobile Stream URL
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <input
                      readOnly
                      value={streamUrl}
                      className="font-code text-xs bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] px-2.5 py-1.5 rounded-md border border-[var(--color-border-subtle)] w-full max-w-[200px] truncate"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="p-1.5 rounded-md bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                      aria-label="Copy Mobile URL"
                    >
                      {copiedUrl ? <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" /> : <HugeIcon icon={Copy01Icon} size={14} />}
                    </button>
                    <a
                      href={streamUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]"
                      aria-label="Open in new tab"
                    >
                      <HugeIcon icon={ArrowUpRight01Icon} size={14} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Waiting status indicator */}
            <div className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-between font-body-s">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-default)] animate-ping" />
                <span className="font-medium font-label-s">Waiting for smartphone to connect...</span>
              </div>

              {/* Dev/demo simulation trigger */}
              <button
                type="button"
                onClick={() => {
                  const simStream = connectSimulatedPhone();
                  onUseAsCamera?.(simStream);
                }}
                className="font-caption font-semibold text-[var(--color-brand-default)] hover:underline flex items-center gap-1"
              >
                <HugeIcon icon={SparklesIcon} size={12} />
                <span>Simulate Connection</span>
              </button>
            </div>

            {/* Wi-Fi advisory notice */}
            <p className="font-caption text-[var(--color-text-tertiary)] flex items-center gap-1.5 justify-center">
              <HugeIcon icon={Wifi01Icon} size={14} className="text-[var(--color-brand-default)]" />
              <span>Ensure both devices are on the same Wi-Fi network for optimal latency.</span>
            </p>

            <div className="flex items-center justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
