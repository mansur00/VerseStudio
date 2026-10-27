import React, { useState } from 'react';
import {
  Modal,
  Button,
  StatusChip,
} from '@verse-studio/ui';
import {
  Sparkles,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Mic,
  Camera,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
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
    // Simulate OAuth consent flow with Google drive.file scope
    await new Promise((res) => setTimeout(res, 800));
    setDriveConnected(true);
    setIsConnectingDrive(false);
  };

  // Handle Permissions Request (Step 3)
  const handleRequestPermissions = async () => {
    setIsCheckingPermissions(true);
    try {
      // 1. Microphone & Camera access test
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMicGranted(true);
        setCameraGranted(true);
        // Release tracks immediately
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
      title={
        step === 1
          ? t.onboarding.step1Title
          : step === 2
          ? t.onboarding.step2Title
          : step === 3
          ? t.onboarding.step3Title
          : t.permissions.deniedTitle
      }
      description={
        step === 1
          ? t.onboarding.step1Subtitle
          : step === 2
          ? t.onboarding.step2Desc
          : step === 3
          ? t.onboarding.step3Desc
          : t.permissions.deniedDesc
      }
    >
      <div className="space-y-5 pt-1">
        {/* Progress Step Indicator (Only for steps 1-3) */}
        {step !== 'denied' && (
          <div className="flex items-center justify-between pb-1 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-2">
              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                  step === 1
                    ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)]'
                    : 'bg-[var(--color-bg-active)] text-[var(--color-text-primary)]'
                }`}
              >
                1
              </span>
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Goal</span>
              <div className="w-8 h-px bg-[var(--color-border-subtle)]" />

              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                  step === 2
                    ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)]'
                    : step > 2
                    ? 'bg-[var(--color-success-default)] text-white'
                    : 'bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)]'
                }`}
              >
                {step > 2 ? '✓' : '2'}
              </span>
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">Drive</span>
              <div className="w-8 h-px bg-[var(--color-border-subtle)]" />

              <span
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                  step === 3
                    ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)]'
                    : 'bg-[var(--color-bg-active)] text-[var(--color-text-tertiary)]'
                }`}
              >
                3
              </span>
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Permissions
              </span>
            </div>
            <span className="text-xs text-[var(--color-text-tertiary)] font-mono font-medium">
              Step {step} of 3
            </span>
          </div>
        )}

        {/* ================= STEP 1: GOAL SELECTION (Screen 04) ================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  id: 'tutorials',
                  title: t.onboarding.goalTutorials,
                  desc: 'High-definition software tutorials with auto-zoom and cursor spotlight',
                  icon: Sparkles,
                },
                {
                  id: 'meetings',
                  title: t.onboarding.goalMeetings,
                  desc: 'Quick asynchronous video messages with teleprompter and instant sharing',
                  icon: Monitor,
                },
                {
                  id: 'content',
                  title: t.onboarding.goalContent,
                  desc: 'YouTube, course lectures, and demos with bilingual Bangla AI subtitles',
                  icon: Camera,
                },
              ].map((item) => {
                const isSelected = selectedGoal === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGoal(item.id)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[var(--color-brand-default)] bg-[var(--color-brand-subtle)] ring-1 ring-[var(--color-brand-default)]'
                        : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)]'
                          : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
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
              className="w-full mt-2"
              onClick={() => setStep(2)}
              trailingIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Step 2
            </Button>
          </div>
        )}

        {/* ================= STEP 2: CONNECT GOOGLE DRIVE (Screen 05) ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Direct-to-Drive Architecture
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Only access to files created by VerseStudio (<code className="text-[11px] font-mono text-[var(--color-brand-default)]">drive.file</code>)
                  </p>
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-secondary)] space-y-1.5 pl-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-success-default)] shrink-0" />
                  <span>Unlimited 4K storage backed by your Google account</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-success-default)] shrink-0" />
                  <span>Never stored on external third-party media servers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-success-default)] shrink-0" />
                  <span>Instant sharable viewing links with one-click permissions</span>
                </div>
              </div>
            </div>

            {driveConnected ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-success-subtle)] border border-[var(--color-success-default)] text-[var(--color-success-default)]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-semibold">Google Drive Connected Successfully</span>
                </div>
                <StatusChip status="active" label="Active" size="sm" />
              </div>
            ) : (
              <Button
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleConnectDrive}
                disabled={isConnectingDrive}
              >
                <Cloud className="w-4 h-4" />
                <span>{isConnectingDrive ? 'Connecting to Google...' : t.onboarding.connectDrive}</span>
              </Button>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {t.onboarding.skipForNow}
              </button>

              <Button
                variant={driveConnected ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStep(3)}
                trailingIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Permissions
              </Button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: PERMISSIONS (Screen 06) ================= */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5">
              {/* Screen capture card */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t.onboarding.screenPermission}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      Required for 4K display and tab recording
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
                  <div className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]">
                    <Mic className="w-4 h-4" />
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
                  <div className="p-2 rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">
                      {t.onboarding.cameraPermission}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      For camera bubble and split-screen video
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
                className="w-full mt-2"
                onClick={handleComplete}
                trailingIcon={<ShieldCheck className="w-4 h-4" />}
              >
                {t.onboarding.launchStudio}
              </Button>
            ) : (
              <Button
                variant="primary"
                className="w-full mt-2"
                onClick={handleRequestPermissions}
                disabled={isCheckingPermissions}
                trailingIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isCheckingPermissions ? 'Requesting Permissions...' : t.onboarding.grantPermissions}
              </Button>
            )}
          </div>
        )}

        {/* ================= SCREEN 18: PERMISSION DENIED RECOVERY ================= */}
        {step === 'denied' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Camera or Microphone Access Blocked</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t.permissions.deniedDesc}
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-[var(--color-text-secondary)] pl-1">
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[11px] font-bold shrink-0">
                  1
                </span>
                <span>{t.permissions.step1}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[11px] font-bold shrink-0">
                  2
                </span>
                <span>{t.permissions.step2}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-bg-active)] text-[var(--color-text-primary)] text-[11px] font-bold shrink-0">
                  3
                </span>
                <span>{t.permissions.step3}</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setStep(3)}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setStep(3);
                  handleRequestPermissions();
                }}
                leadingIcon={<RefreshCw className="w-4 h-4" />}
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
