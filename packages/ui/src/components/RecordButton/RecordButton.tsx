import React from 'react';
import { cn } from '../../utils/cn';
import { PauseIcon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface RecordButtonProps {
  status: 'idle' | 'recording' | 'paused';
  size?: 'lg' | 'md';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * RecordButton matches Figma Component 10:25 (Studio Components)
 * Idle: dark surface, border/strong (4A4B55), red dot
 * Recording: dark surface, red border, Glow/Record, red stop square
 * Paused: dark surface, amber border, amber pause icon
 */
export const RecordButton: React.FC<RecordButtonProps> = ({
  status,
  size = 'lg',
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

  const isLg = size === 'lg';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full transition-all duration-200 select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-canvas)]',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        isLg ? 'w-16 h-16' : 'w-12 h-12',
        // State styles from Figma 10:25
        !isRecording && !isPaused && [
          'bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-strong)]',
          'hover:border-[var(--color-record-default)] hover:scale-[1.03] active:scale-[0.97]',
        ],
        isRecording && [
          'bg-[var(--color-bg-surface)] border-2 border-[var(--color-record-default)] shadow-[var(--glow-record)]',
          'hover:brightness-110 active:scale-[0.97]',
        ],
        isPaused && [
          'bg-[var(--color-bg-surface)] border-2 border-[var(--color-warning-default)]',
          'hover:brightness-110 active:scale-[0.97]',
        ],
        className
      )}
    >
      {isRecording ? (
        <span
          className={cn(
            'bg-[var(--color-record-default)] shrink-0',
            isLg ? 'w-[23px] h-[23px] rounded-[4px]' : 'w-[17px] h-[17px] rounded-[3px]'
          )}
        />
      ) : isPaused ? (
        <HugeIcon
          icon={PauseIcon}
          size={isLg ? 28 : 22}
          className="text-[var(--color-warning-default)] shrink-0"
        />
      ) : (
        <span
          className={cn(
            'rounded-full bg-[var(--color-record-default)] shrink-0 transition-transform duration-150',
            isLg ? 'w-8 h-8' : 'w-6 h-6'
          )}
        />
      )}
    </button>
  );
};
