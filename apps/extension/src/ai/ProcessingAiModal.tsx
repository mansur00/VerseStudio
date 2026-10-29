import React from 'react';
import {
  SparklesIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  VolumeHighIcon,
  File01Icon,
  AiTranslateIcon,
} from '@hugeicons/core-free-icons';
import { Modal, ProgressBar, Button, HugeIcon } from '@verse-studio/ui';
import { useAIStore } from './aiStore';
import { useAuthStore } from '../auth/authStore';

export interface ProcessingAiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgradeClick?: () => void;
}

export const ProcessingAiModal: React.FC<ProcessingAiModalProps> = ({
  open,
  onOpenChange,
  onUpgradeClick,
}) => {
  const { processingState, quotaExceededWarning, cancelProcessing } = useAIStore();
  const { user } = useAuthStore();

  const isCompleted = processingState.status === 'completed';
  const isError = processingState.status === 'error';

  const steps = [
    {
      id: 'transcribing',
      label: 'Bengali Audio Speech Recognition',
      desc: 'Accurately transcribing native Bengali speech into text...',
      icon: <HugeIcon icon={AiTranslateIcon} size={16} />,
      active: processingState.status === 'transcribing',
      done: processingState.progress > 30,
    },
    {
      id: 'translating',
      label: 'English Translation & Alignment',
      desc: 'Translating Bengali idioms and context into clean English...',
      icon: <HugeIcon icon={SparklesIcon} size={16} />,
      active: processingState.status === 'translating',
      done: processingState.progress > 60,
    },
    {
      id: 'generating-voice',
      label: 'English Neural Voice Synthesis',
      desc: 'Synthesizing studio-grade natural voiceover audio...',
      icon: <HugeIcon icon={VolumeHighIcon} size={16} />,
      active: processingState.status === 'generating-voice',
      done: processingState.progress > 85,
    },
    {
      id: 'generating-guide',
      label: 'Step-by-Step Guide Assembly',
      desc: 'Aligning click timestamps with translated spoken guidance...',
      icon: <HugeIcon icon={File01Icon} size={16} />,
      active: processingState.status === 'generating-guide',
      done: isCompleted,
    },
  ];

  return (
    <Modal
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isCompleted && !isError) {
          cancelProcessing();
        }
        onOpenChange(isOpen);
      }}
      title="Bilingual AI Voice & Subtitles"
      description="VerseStudio AI synthesizes an English dub and aligns synchronized captions."
      size="md"
    >
      <div className="space-y-6 pt-2">
        {/* Quota Exceeded Alert */}
        {quotaExceededWarning && (
          <div className="p-4 rounded-xl border border-[var(--color-warning-default)]/40 bg-[var(--color-warning-subtle)] flex items-start gap-3">
            <HugeIcon icon={AlertCircleIcon} size={20} className="text-[var(--color-warning-default)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-label-s font-bold text-[var(--color-warning-default)]">
                AI Minutes Quota Exceeded
              </h4>
              <p className="font-body-s text-[var(--color-text-secondary)] mt-1">
                You have used {user?.aiMinutesUsed || 30} of {user?.aiMinutesLimit || 30} minutes on your current plan.
                Upgrade to Pro for 300 monthly minutes.
              </p>
              {onUpgradeClick && (
                <Button
                  size="sm"
                  variant="primary"
                  className="mt-3"
                  onClick={() => {
                    onOpenChange(false);
                    onUpgradeClick();
                  }}
                >
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Error Details Banner */}
        {isError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)] text-[var(--color-error-default)] text-xs"
          >
            <HugeIcon icon={AlertCircleIcon} size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">AI Synthesis Notice</p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {processingState.error || 'Could not connect to the VerseStudio AI dubbing server. Verify network connectivity or configure API credentials in Settings.'}
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar & Status Text */}
        {!quotaExceededWarning && !isError && (
          <div>
            <div className="flex items-center justify-between font-label-s mb-2">
              <span className="text-[var(--color-text-primary)]">
                {isCompleted
                  ? 'All AI Assets Ready'
                  : processingState.activeStepText || 'Processing...'}
              </span>
              <span className="font-code text-[var(--color-brand-default)]">
                {processingState.progress}%
              </span>
            </div>
            <ProgressBar
              value={processingState.progress}
              variant="brand"
            />
          </div>
        )}

        {/* Step pipeline list */}
        <div className="space-y-3">
          {steps.map((s) => (
            <div
              key={s.id}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                s.active
                  ? 'border-[var(--color-brand-default)] bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-brand-default)]/50'
                  : s.done
                  ? 'border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]'
                  : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg border ${
                    s.done
                      ? 'bg-[var(--color-brand-subtle)] border-[var(--color-brand-default)] text-[var(--color-brand-default)]'
                      : s.active
                      ? 'bg-[var(--color-brand-subtle)] border-[var(--color-brand-default)] text-[var(--color-brand-default)] animate-pulse'
                      : 'bg-[var(--color-bg-hover)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {s.icon}
                </div>
                <div>
                  <h5 className="font-label-s font-bold text-[var(--color-text-primary)]">
                    {s.label}
                  </h5>
                  <p className="font-caption text-[var(--color-text-secondary)] mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>

              <div>
                {s.done ? (
                  <HugeIcon icon={CheckmarkCircle01Icon} size={16} className="text-[var(--color-brand-default)]" />
                ) : s.active ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand-default)] block animate-ping" />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          {isCompleted ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          ) : isError ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                cancelProcessing();
                onOpenChange(false);
              }}
            >
              Dismiss
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                cancelProcessing();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
