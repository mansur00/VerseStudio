import React, { useState } from 'react';
import {
  Modal,
  Button,
  StatusChip,
  HugeIcon,
} from '@verse-studio/ui';
import {
  SparklesIcon,
  Alert01Icon,
  ComputerIcon,
  Mic01Icon,
  Camera01Icon,
  ArrowRight01Icon,
  Shield01Icon,
  RotateLeft01Icon,
  Folder01Icon,
  Link01Icon,
} from '@hugeicons/core-free-icons';
import { getTranslation, type SupportedLanguage } from '@verse-studio/shared';
import { useAuthStore } from './authStore';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: SupportedLanguage;
  onFinish?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  lang = 'en',
  onFinish,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 'denied'>(1);
  const [selectedGoal, setSelectedGoal] = useState<string>('tutorials');
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);

  // Permission states
  const [screenGranted, setScreenGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(false);

  const t = getTranslation(lang);
  const { completeOnboarding } = useAuthStore();

  // Handle Google Drive Connection (Step 2)
  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    await new Promise((res) => setTimeout(res, 800));
    setDriveConnected(true);
    setIsConnectingDrive(false);
    setStep(3);
  };

  // Handle Permissions Request (Step 3)
  const handleRequestPermissions = async () => {
    setIsCheckingPermissions(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMicGranted(true);
        setCameraGranted(true);
        stream.getTracks().forEach((track) => track.stop());
      } else {
        setMicGranted(true);
        setCameraGranted(true);
      }

      setScreenGranted(true);
      setIsCheckingPermissions(false);
    } catch {
      setIsCheckingPermissions(false);
      setStep('denied');
    }
  };

  // Complete Onboarding & Save
  const handleComplete = async () => {
    await completeOnboarding(selectedGoal, driveConnected);
    onFinish?.();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (step === 3 && (micGranted || screenGranted)) {
            handleComplete();
          } else {
            onClose();
          }
        }
      }}
      hideHeader={true}
      size="lg"
      className="max-w-xl p-6 sm:p-8 bg-[var(--color-bg-canvas)] border border-[var(--color-border-default)] rounded-3xl"
    >
      <div className="space-y-6">
        {/* Progress Step Indicator (Figma 3-pill bar + Step X of 3) */}
        {step !== 'denied' && (
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-1 rounded-full transition-colors ${
                  step >= 1 ? 'bg-[var(--color-brand-default)]' : 'bg-[var(--color-border-default)]'
                }`}
              />
              <div
                className={`w-8 h-1 rounded-full transition-colors ${
                  step >= 2 ? 'bg-[var(--color-brand-default)]' : 'bg-[var(--color-border-default)]'
                }`}
              />
              <div
                className={`w-8 h-1 rounded-full transition-colors ${
                  step >= 3 ? 'bg-[var(--color-brand-default)]' : 'bg-[var(--color-border-default)]'
                }`}
              />
            </div>
            <span className="text-xs text-[var(--color-text-tertiary)] font-mono font-medium">
              Step {step} of 3
            </span>
          </div>
        )}

        {/* ================= STEP 1: GOAL SELECTION (Screen 04) ================= */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] font-h2 tracking-tight">
                What do you want to record?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                Choose your primary use case to optimize your default studio layout.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              {[
                {
                  id: 'tutorials',
                  title: t.onboarding.goalTutorials,
                  desc: 'High-definition software tutorials with auto-zoom and cursor spotlight',
                  icon: SparklesIcon,
                },
                {
                  id: 'meetings',
                  title: t.onboarding.goalMeetings,
                  desc: 'Quick asynchronous video messages with teleprompter and instant sharing',
                  icon: ComputerIcon,
                },
                {
                  id: 'content',
                  title: t.onboarding.goalContent,
                  desc: 'YouTube, course lectures, and demos with bilingual Bangla AI subtitles',
                  icon: Camera01Icon,
                },
              ].map((item) => {
                const isSelected = selectedGoal === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGoal(item.id)}
                    className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[var(--color-brand-default)] bg-[var(--color-bg-surface)] ring-1 ring-[var(--color-brand-default)]'
                        : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)]'
                          : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <HugeIcon icon={item.icon} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                        {item.title}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              className="w-full h-11 rounded-xl text-sm font-semibold mt-3"
              onClick={() => setStep(2)}
              trailingIcon={<HugeIcon icon={ArrowRight01Icon} size={16} />}
            >
              Continue to Step 2
            </Button>
          </div>
        )}

        {/* ================= STEP 2: CONNECT GOOGLE DRIVE (Screen 05 / media_1793299763723_4b779313) ================= */}
        {step === 2 && (
          <div className="space-y-6 text-center">
            {/* Big Circular Google Drive Badge (Figma Screen 05) */}
            <div className="w-16 h-16 rounded-full border-2 border-[var(--color-brand-default)] flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.2 16.5L3.5 8.5L8.5 0.5H18L13 8.5L8.2 16.5Z"
                  fill="#A3E635"
                />
                <path
                  d="M15.5 16.5H23.5L18.5 8.5H10.5L15.5 16.5Z"
                  fill="#84CC16"
                />
                <path
                  d="M8.2 16.5L12 23.5H22L18.2 16.5H8.2Z"
                  fill="#65A30D"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] font-h2 tracking-tight">
                Save recordings to your Google Drive
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                Your recordings live in your own Drive, so you control the storage and who can watch.
              </p>
            </div>

            {/* 3 Bullet Rows with Dark Rounded-xl Icon Badges (Figma Screen 05) */}
            <div className="space-y-3.5 text-left pt-2">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#292A31] border border-[#383942] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
                  <HugeIcon icon={Folder01Icon} size={18} />
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-snug">
                  VerseStudio creates one folder in your Drive and saves recordings there.
                </p>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#292A31] border border-[#383942] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
                  <HugeIcon icon={Shield01Icon} size={18} />
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-snug">
                  It can only see files it creates. It cannot read the rest of your Drive.
                </p>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#292A31] border border-[#383942] flex items-center justify-center text-[var(--color-text-secondary)] shrink-0">
                  <HugeIcon icon={Link01Icon} size={18} />
                </div>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-snug">
                  Disconnect any time in Settings. Your files stay in Drive.
                </p>
              </div>
            </div>

            {/* Primary Action Button: Continue with Google */}
            <div className="pt-3 space-y-3">
              <Button
                variant="primary"
                className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5"
                onClick={handleConnectDrive}
                disabled={isConnectingDrive}
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
                <span>{isConnectingDrive ? 'Connecting to Drive...' : 'Continue with Google'}</span>
              </Button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors block mx-auto pt-1"
              >
                Skip, save to this device only
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PERMISSIONS (Screen 06) ================= */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] font-h2 tracking-tight">
                Permissions & Hardware
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                VerseStudio needs display capture and microphone access to record in up to 4K 60 FPS.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {/* Screen capture card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
                    <HugeIcon icon={ComputerIcon} size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t.onboarding.screenPermission}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      Required for 4K display, window, and tab capture
                    </div>
                  </div>
                </div>
                <StatusChip
                  status={screenGranted ? 'active' : 'default'}
                  label={screenGranted ? 'Granted' : 'Pending'}
                  size="sm"
                />
              </div>

              {/* Microphone access card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
                    <HugeIcon icon={Mic01Icon} size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t.onboarding.micPermission}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      For audio commentary and AI speech recognition
                    </div>
                  </div>
                </div>
                <StatusChip
                  status={micGranted ? 'active' : 'default'}
                  label={micGranted ? 'Granted' : 'Pending'}
                  size="sm"
                />
              </div>

              {/* Webcam access card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]">
                    <HugeIcon icon={Camera01Icon} size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t.onboarding.cameraPermission}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      For round camera bubble and split-screen mode
                    </div>
                  </div>
                </div>
                <StatusChip
                  status={cameraGranted ? 'active' : 'default'}
                  label={cameraGranted ? 'Granted' : 'Pending'}
                  size="sm"
                />
              </div>
            </div>

            {micGranted && cameraGranted && screenGranted ? (
              <Button
                variant="primary"
                className="w-full h-11 rounded-xl text-sm font-semibold mt-3"
                onClick={handleComplete}
                trailingIcon={<HugeIcon icon={Shield01Icon} size={16} />}
              >
                {t.onboarding.launchStudio}
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full h-11 rounded-xl text-sm font-semibold mt-3"
                onClick={handleRequestPermissions}
                disabled={isCheckingPermissions}
                trailingIcon={<HugeIcon icon={ArrowRight01Icon} size={16} />}
              >
                {isCheckingPermissions ? 'Requesting Permissions...' : t.onboarding.grantPermissions}
              </Button>
            )}
          </div>
        )}

        {/* ================= SCREEN 18: PERMISSION DENIED RECOVERY ================= */}
        {step === 'denied' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <HugeIcon icon={Alert01Icon} size={18} className="shrink-0" />
                <span>Camera or Microphone Access Blocked</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t.permissions.deniedDesc}
              </p>
            </div>

            <div className="space-y-3 text-xs text-[var(--color-text-secondary)] pl-1">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[11px] font-bold shrink-0">
                  1
                </span>
                <span>{t.permissions.step1}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[11px] font-bold shrink-0">
                  2
                </span>
                <span>{t.permissions.step2}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[11px] font-bold shrink-0">
                  3
                </span>
                <span>{t.permissions.step3}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setStep(3)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1 h-11 rounded-xl"
                onClick={() => {
                  setStep(3);
                  handleRequestPermissions();
                }}
                leadingIcon={<HugeIcon icon={RotateLeft01Icon} size={16} />}
              >
                {t.permissions.retry}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
