import React from 'react';
import { cn } from '../../utils/cn';
import { Mic01Icon, MicOff01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface MicLevelProps {
  level: number; // 0 to 100
  muted?: boolean;
  className?: string;
  showIcon?: boolean;
}

export const MicLevel: React.FC<MicLevelProps> = ({
  level = 0,
  muted = false,
  className,
  showIcon = true,
}) => {
  const clampedLevel = Math.max(0, Math.min(100, Math.round(level)));

  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="meter"
      aria-label="Microphone input level"
      aria-valuenow={muted ? 0 : clampedLevel}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {showIcon && (
        <span className="text-[var(--color-text-secondary)]">
          {muted ? (
            <HugeIcon icon={MicOff01Icon} size={16} className="text-[var(--color-error-default)]" />
          ) : (
            <HugeIcon icon={Mic01Icon} size={16} className="text-[var(--color-text-primary)]" />
          )}
        </span>
      )}
      <div className="w-20 h-2 bg-[var(--color-bg-hover)] rounded-full overflow-hidden p-0.5 border border-[var(--color-border-subtle)] flex items-center">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-75',
            muted
              ? 'w-0'
              : clampedLevel > 85
              ? 'bg-[var(--color-error-default)] shadow-[0_0_8px_var(--color-error-default)]'
              : clampedLevel > 60
              ? 'bg-[var(--color-warning-default)]'
              : 'bg-[var(--color-brand-default)] shadow-[0_0_6px_var(--color-brand-default)]'
          )}
          style={{ width: `${muted ? 0 : clampedLevel}%` }}
        />
      </div>
    </div>
  );
};
