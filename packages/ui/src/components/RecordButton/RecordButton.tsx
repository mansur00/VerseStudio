import React from 'react';
import { cn } from '../../utils/cn';
import { StopIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface RecordButtonProps {
  status: 'idle' | 'recording' | 'paused';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const RecordButton: React.FC<RecordButtonProps> = ({
  status,
  onClick,
  disabled = false,
  className,
}) => {
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';

  const label = isRecording
    ? 'Stop Recording'
    : isPaused
    ? 'Resume Recording'
    : 'Start Recording';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-record-default)]/40',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
        isRecording
          ? 'bg-[var(--color-record-default)] shadow-[var(--glow-record)] ring-4 ring-[var(--color-record-default)]/30 animate-pulse'
          : 'bg-[var(--color-record-default)] hover:bg-[var(--color-danger-hover)] shadow-md hover:shadow-[var(--glow-record)]',
        className
      )}
    >
      {isRecording ? (
        <HugeIcon icon={StopIcon} size={24} className="text-white fill-current" />
      ) : isPaused ? (
        <HugeIcon icon={PlayIcon} size={24} className="text-white fill-current ml-0.5" />
      ) : (
        <span className="w-5 h-5 rounded-full bg-white" />
      )}
    </button>
  );
};
