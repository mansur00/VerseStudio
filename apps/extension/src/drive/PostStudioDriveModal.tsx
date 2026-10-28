import React, { useState } from 'react';
import {
  Modal,
  Button,
  ProgressBar,
  ShareLinkCard,
  StatusChip,
  HugeIcon,
} from '@verse-studio/ui';
import {
  CloudIcon,
  AlertCircleIcon,
  Alert01Icon,
  RotateLeft01Icon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons';
import type { SupportedLanguage } from '@verse-studio/shared';
import { useDriveStore } from './driveStore';

export interface PostStudioDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordingId: string;
  recordingBlob: Blob | null;
  durationSeconds: number;
  recordingName?: string;
  lang?: SupportedLanguage;
}

export const PostStudioDriveModal: React.FC<PostStudioDriveModalProps> = ({
  isOpen,
  onClose,
  recordingId,
  recordingBlob,
  durationSeconds,
  recordingName = 'VerseStudio 4K Recording',
  lang: _lang = 'en',
}) => {
  const {
    isConnected,
    connectDrive,
    uploadRecording,
    cancelUpload,
    activeUpload,
    error,
    clearError,
  } = useDriveStore();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isDriveConnecting, setIsDriveConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const isUploading = Boolean(activeUpload);
  const isDriveFull = error?.includes('Google Drive Full');

  const handleStartUpload = async () => {
    if (!recordingBlob) return;
    clearError();
    const result = await uploadRecording(
      recordingId,
      recordingName,
      recordingBlob,
      durationSeconds,
      '4k'
    );

    if (result.success && result.shareUrl) {
      setShareUrl(result.shareUrl);
    }
  };

  const handleConnect = async () => {
    setIsDriveConnecting(true);
    setConnectError(null);
    const success = await connectDrive();
    setIsDriveConnecting(false);
    if (!success) {
      setConnectError('Could not establish Google Drive authorization.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (isUploading) cancelUpload();
          onClose();
        }
      }}
      title={
        shareUrl
          ? 'Saved to Google Drive!'
          : !isConnected
          ? 'Save to Google Drive'
          : isUploading
          ? 'Uploading to Google Drive...'
          : isDriveFull
          ? 'Google Drive Storage Full'
          : error
          ? 'Upload Interrupted'
          : 'Save to Google Drive'
      }
      description={
        shareUrl
          ? 'Your 4K video is ready for instant sharing and viewing'
          : !isConnected
          ? 'Connect your personal Google Drive to save and share this 4K recording'
          : isUploading
          ? 'Uploading 8 MB chunked slices with resumable network fault tolerance'
          : isDriveFull
          ? 'Your Google Drive does not have enough storage space for this file'
          : error
          ? 'A network glitch occurred. You can resume uploading from where it stopped.'
          : `Upload "${recordingName}" directly to your VerseStudio Drive folder`
      }
    >
      <div className="space-y-5 pt-1">
        {/* ================= SCREEN 34: SHARE LINK GENERATED ================= */}
        {shareUrl && (
          <div className="space-y-4">
            <ShareLinkCard
              shareUrl={shareUrl}
              isPublic={true}
              onOpenInDrive={() => {
                window.open(shareUrl, '_blank');
              }}
            />
            <Button variant="primary" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {/* ================= SCREEN 28 & 29: CONNECT DRIVE PROMPT / FAILED ================= */}
        {!shareUrl && !isConnected && (
          <div className="space-y-4">
            {connectError && (
              <div
                role="alert"
                className="flex items-center gap-2 p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] font-label-s"
              >
                <HugeIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
                <span>{connectError}</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-2 font-body-s text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)] font-label-s">
                <HugeIcon icon={CloudIcon} size={16} className="text-[var(--color-brand-default)]" />
                <span>Zero Cloud Storage Fees</span>
              </div>
              <p>
                VerseStudio streams and saves recordings straight to your own Google Drive using per-file permissions (<code className="font-code text-[var(--color-brand-default)]">drive.file</code>). We never hold or store your media.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleConnect}
                disabled={isDriveConnecting}
              >
                <HugeIcon icon={CloudIcon} size={16} />
                <span>{isDriveConnecting ? 'Connecting...' : 'Connect Google Drive'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 31: UPLOADING RESUMABLE CHUNKS ================= */}
        {!shareUrl && isConnected && isUploading && activeUpload && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-3">
              <div className="flex items-center justify-between font-label-s">
                <span className="font-semibold text-[var(--color-text-primary)] truncate max-w-[200px]">
                  {activeUpload.name}
                </span>
                <span className="font-code font-medium text-[var(--color-text-secondary)]">
                  {formatBytes(activeUpload.uploadedBytes)} / {formatBytes(activeUpload.totalBytes)}
                </span>
              </div>

              <ProgressBar
                value={activeUpload.progress}
                variant="brand"
                showPercentage={true}
              />

              <div className="flex items-center justify-between font-caption text-[var(--color-text-tertiary)] pt-1">
                <span>Resumable 8 MB chunk pipeline</span>
                <span>{activeUpload.progress}% uploaded</span>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full text-xs"
              onClick={cancelUpload}
            >
              Cancel Upload
            </Button>
          </div>
        )}

        {/* ================= SCREEN 32: DRIVE FULL ERROR ================= */}
        {!shareUrl && isConnected && !isUploading && isDriveFull && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] space-y-2">
              <div className="flex items-center gap-2 font-semibold font-label-s">
                <HugeIcon icon={Alert01Icon} size={16} className="shrink-0" />
                <span>Google Drive Storage Quota Exceeded</span>
              </div>
              <p className="font-body-s text-[var(--color-text-secondary)]">
                Your Google Drive does not have enough remaining bytes to complete this 4K export. Free up space on Drive or upgrade your Google One tier.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Dismiss
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => window.open('https://one.google.com/storage', '_blank')}
                trailingIcon={<HugeIcon icon={ArrowUpRight01Icon} size={14} />}
              >
                Manage Drive Storage
              </Button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 33: UPLOAD FAILED WITH RETRY ================= */}
        {!shareUrl && isConnected && !isUploading && error && !isDriveFull && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] font-label-s space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <HugeIcon icon={AlertCircleIcon} size={16} className="shrink-0" />
                <span>Upload Failed</span>
              </div>
              <p className="font-body-s text-[var(--color-text-secondary)]">
                {error}. Your progress is saved and will resume from the last sent 8 MB chunk.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleStartUpload}
                leadingIcon={<HugeIcon icon={RotateLeft01Icon} size={16} />}
              >
                Resume Upload
              </Button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 30: READY TO UPLOAD ================= */}
        {!shareUrl && isConnected && !isUploading && !error && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]">
                  <HugeIcon icon={CloudIcon} size={16} />
                </div>
                <div>
                  <div className="font-label-s font-semibold text-[var(--color-text-primary)]">
                    Google Drive Connected
                  </div>
                  <div className="font-caption text-[var(--color-text-secondary)]">
                    Target folder: <span className="font-code text-[var(--color-brand-default)]">VerseStudio/</span>
                  </div>
                </div>
              </div>
              <StatusChip status="active" label="Ready" size="sm" />
            </div>

            {recordingBlob && (
              <div className="font-body-s text-[var(--color-text-secondary)] flex items-center justify-between px-1">
                <span>File size: <strong className="text-[var(--color-text-primary)]">{formatBytes(recordingBlob.size)}</strong></span>
                <span>Format: <strong>MP4 4K 60FPS</strong></span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleStartUpload}
                leadingIcon={<HugeIcon icon={CloudIcon} size={16} />}
              >
                Upload to Google Drive
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
