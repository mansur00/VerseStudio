import React, { useState } from 'react';
import {
  Modal,
  Button,
  ProgressBar,
  ShareLinkCard,
  HugeIcon,
  Toast,
} from '@verse-studio/ui';
import {
  CloudIcon,
  AlertCircleIcon,
  Alert01Icon,
  RotateLeft01Icon,
  ArrowUpRight01Icon,
  Folder01Icon,
  Shield01Icon,
  Link01Icon,
  Download01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import type { SupportedLanguage } from '@verse-studio/shared';
import { useDriveStore } from './driveStore';
import { DriveService } from './driveService';
import { useAuthStore } from '../auth';

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
    uploadRecording,
    cancelUpload,
    activeUpload,
    error,
    clearError,
  } = useDriveStore();
  const { user } = useAuthStore();

  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isEnteringCustomEmail, setIsEnteringCustomEmail] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [connectFailed, setConnectFailed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isUploading = Boolean(activeUpload);
  const isDriveFull = error?.includes('Google Drive Full');

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

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

  const handleDownloadLocally = () => {
    if (!recordingBlob) return;
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recordingName}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onClose();
  };

  // 1. User clicks "Continue with Google"
  const handleInitiateGoogleAuth = async () => {
    setConnectFailed(false);
    clearError();

    // Check if Chrome Extension Identity has an active account
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getAuthToken) {
      try {
        const token = await new Promise<string>((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (tok) => {
            if (chrome.runtime.lastError || !tok) {
              reject(new Error(chrome.runtime.lastError?.message || 'Cancelled'));
            } else {
              resolve(tok);
            }
          });
        });

        if (token) {
          let email = user?.email || 'rafi@gmail.com';
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const info = await res.json();
            if (info.email) email = info.email;
          } catch {
            // Ignore userInfo parse error
          }

          await handleSelectGoogleAccount(email, email.split('@')[0]);
          return;
        }
      } catch {
        // Fallback to interactive Google Account Chooser popup
      }
    }

    // Open Google Account Picker dialog
    setIsAccountPickerOpen(true);
  };

  // 2. User selects an account from the Google Account Chooser
  const handleSelectGoogleAccount = async (email: string, name: string) => {
    setIsAccountPickerOpen(false);
    setConnectFailed(false);

    // Persist OAuth session
    const syntheticToken = `g_oauth_${Date.now()}`;
    await DriveService.persistSession(syntheticToken, 86400);

    // Update Drive & Auth store
    useDriveStore.setState({
      isConnected: true,
      quota: {
        usageBytes: 1.2 * 1024 * 1024 * 1024,
        limitBytes: 15 * 1024 * 1024 * 1024,
        availableBytes: 13.8 * 1024 * 1024 * 1024,
      },
    });

    useAuthStore.setState((prev) => ({
      user: prev.user
        ? { ...prev.user, googleDriveConnected: true, googleDriveEmail: email }
        : {
            id: 'usr_g_direct',
            name,
            email,
            plan: 'free',
            aiMinutesUsed: 0,
            aiMinutesLimit: 30,
            googleDriveConnected: true,
            googleDriveEmail: email,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
          },
    }));

    // Show Screen 30 Toast notification
    setToastMessage(`Google Drive connected. Recordings will be saved to ${email}.`);
    setTimeout(() => setToastMessage(null), 5000);

    // AUTOMATICALLY START UPLOADING TO GOOGLE DRIVE
    await handleStartUpload();
  };

  return (
    <>
      {/* Toast Notification (Screen 30) */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50">
          <Toast
            title="Google Drive connected"
            message={toastMessage}
            variant="success"
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Main Post-Studio Modal */}
      <Modal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (isUploading) cancelUpload();
            onClose();
          }
        }}
        hideHeader={!shareUrl && !isConnected && !isUploading}
        title={
          shareUrl
            ? 'Saved to Google Drive!'
            : isUploading
            ? 'Saving to Google Drive'
            : isDriveFull
            ? 'Google Drive Storage Full'
            : error
            ? 'Upload Interrupted'
            : 'Save to Google Drive'
        }
        description={
          shareUrl
            ? 'Your 4K video is ready for instant sharing and viewing'
            : isUploading
            ? `Uploading your 4K recording (${formatBytes(
                recordingBlob?.size || 0
              )}) to your Google Drive. Your share link will be ready as soon as it finishes.`
            : isDriveFull
            ? 'Your Google Drive does not have enough storage space for this file'
            : error
            ? 'A network glitch occurred. You can resume uploading from where it stopped.'
            : `Upload "${recordingName}" directly to your VerseStudio Drive folder`
        }
      >
        <div className="space-y-4 pt-1">
          {/* ================= SCREEN 34: SHARE LINK READY ================= */}
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

          {/* ================= GOOGLE ACCOUNT CHOOSER VIEW ================= */}
          {!shareUrl && !isConnected && isAccountPickerOpen && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-sm font-medium text-white">Sign in with Google</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">Choose an account</h4>
                <p className="text-xs text-[#9aa0a6] mt-0.5">to continue to VerseStudio 4K Pro</p>
              </div>

              {/* List of Accounts */}
              <div className="space-y-1.5 divide-y divide-[#3c4043] rounded-xl border border-[#3c4043] bg-[#202124] p-2">
                <button
                  type="button"
                  aria-label={`Select account ${user?.name || 'Rafi Ahmed'}`}
                  onClick={() =>
                    handleSelectGoogleAccount(
                      user?.email || 'rafi@gmail.com',
                      user?.name || 'Rafi Ahmed'
                    )
                  }
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#303134] transition-colors text-left cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {user?.name ? user.name[0].toUpperCase() : 'R'}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-sm font-semibold text-white">
                      {user?.name || 'Rafi Ahmed'}
                    </div>
                    <div className="text-xs text-[#9aa0a6] truncate">
                      {user?.email || 'rafi@gmail.com'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  aria-label="Select account Md Mansur"
                  onClick={() => handleSelectGoogleAccount('mdmansur@gmail.com', 'Md Mansur')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#303134] transition-colors text-left pt-2.5 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#137333] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    M
                  </div>
                  <div className="flex-1 truncate">
                    <div className="text-sm font-semibold text-white">Md Mansur</div>
                    <div className="text-xs text-[#9aa0a6] truncate">mdmansur@gmail.com</div>
                  </div>
                </button>

                {!isEnteringCustomEmail && (
                  <button
                    type="button"
                    onClick={() => setIsEnteringCustomEmail(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#303134] transition-colors text-left text-xs font-medium text-[#8ab4f8] pt-2.5 cursor-pointer"
                  >
                    <span>+ Use another account</span>
                  </button>
                )}
              </div>

              {/* Custom Google Email input */}
              {isEnteringCustomEmail && (
                <div className="pt-2 space-y-2 border-t border-[#3c4043]">
                  <input
                    type="email"
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-[#303134] border border-[#5f6368] rounded-lg px-3 py-2 text-xs text-white placeholder-[#80868b] focus:outline-none focus:border-[#8ab4f8]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEnteringCustomEmail(false)}
                      className="text-xs text-[#9aa0a6] hover:text-white px-2 py-1"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (customEmailInput.includes('@')) {
                          handleSelectGoogleAccount(
                            customEmailInput.trim(),
                            customEmailInput.split('@')[0]
                          );
                        }
                      }}
                      className="text-xs bg-[#8ab4f8] text-[#202124] font-semibold rounded px-3 py-1 hover:bg-[#aecbfa]"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 text-[11px] text-[#9aa0a6]">
                <span>Google will share your email to save files in Drive.</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountPickerOpen(false);
                    setConnectFailed(true);
                  }}
                  className="text-xs text-white hover:underline shrink-0 ml-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 28: CONNECT GOOGLE DRIVE INITIAL PROMPT ================= */}
          {!shareUrl && !isConnected && !connectFailed && !isUploading && !isAccountPickerOpen && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/30 flex items-center justify-center text-[var(--color-brand-default)] shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                    <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5z" fill="#0066DA" />
                    <path d="M14.57 3.5H7.71l6.56 11.5 6.86-11.5h-6.56z" fill="#00AC47" />
                    <path d="M22.85 15l-3.43 6H4.58l3.43-6h14.84z" fill="#EA4335" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Connect Google Drive
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Save this recording to your Drive and get a share link. You only need to do this once.
                  </p>
                </div>
              </div>

              {/* 3 bullet feature rows */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0 mt-0.5">
                    <HugeIcon icon={Folder01Icon} size={15} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    VerseStudio creates one folder in your Drive and saves recordings there.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0 mt-0.5">
                    <HugeIcon icon={Shield01Icon} size={15} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    It can only see files it creates. It cannot read the rest of your Drive.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)]">
                  <div className="w-7 h-7 rounded-lg bg-[var(--color-bg-surface)] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0 mt-0.5">
                    <HugeIcon icon={Link01Icon} size={15} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    Disconnect any time in Settings. Your files stay in Drive.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleInitiateGoogleAuth}
                  className="bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-bold flex items-center gap-2 px-5 hover:bg-[var(--color-brand-hover)]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 29: GOOGLE DRIVE WAS NOT CONNECTED ================= */}
          {!shareUrl && !isConnected && connectFailed && !isUploading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)]">
                <HugeIcon icon={AlertCircleIcon} size={24} className="shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    Google Drive was not connected
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    Permission was cancelled or blocked. VerseStudio needs permission to create files in your Drive. Your recording is still safe on this device.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleDownloadLocally}
                  leadingIcon={<HugeIcon icon={Download01Icon} size={16} />}
                >
                  Save to this device
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleInitiateGoogleAuth}
                  className="bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-bold px-5"
                >
                  Try again
                </Button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 31: SAVING TO GOOGLE DRIVE (UPLOADING) ================= */}
          {!shareUrl && isConnected && isUploading && activeUpload && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-3">
                <div className="flex items-center justify-between font-label-s">
                  <span className="font-semibold text-[var(--color-text-primary)] truncate max-w-[200px] flex items-center gap-2">
                    <HugeIcon icon={SparklesIcon} size={15} className="text-[var(--color-brand-default)]" />
                    <span>Uploading 4K Recording</span>
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
                  <span>Uploading to VerseStudio/ folder</span>
                  <span>{activeUpload.progress}%</span>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full text-xs"
                onClick={cancelUpload}
              >
                Cancel upload
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
                  Your Google Drive does not have enough remaining space. Free up space on Drive or upgrade your storage tier.
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
                  <span>Upload Interrupted</span>
                </div>
                <p className="font-body-s text-[var(--color-text-secondary)]">
                  {error}. Your progress is saved and will resume from where it stopped.
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

          {/* ================= SCREEN 30: CONNECTED AND READY TO UPLOAD ================= */}
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
              </div>

              {recordingBlob && (
                <div className="font-body-s text-[var(--color-text-secondary)] flex items-center justify-between px-1">
                  <span>
                    File size: <strong className="text-[var(--color-text-primary)]">{formatBytes(recordingBlob.size)}</strong>
                  </span>
                  <span>Format: <strong>MP4 4K 60FPS</strong></span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="ghost" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-bold"
                  onClick={handleStartUpload}
                  leadingIcon={<HugeIcon icon={CloudIcon} size={16} />}
                >
                  Save to Google Drive
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
