import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  variant?: 'brand' | 'record' | 'neutral';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  sublabel,
  variant = 'brand',
  showPercentage = true,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  const barColors = {
    brand: 'bg-[var(--color-brand-default)] shadow-[var(--glow-brand)]',
    record: 'bg-[var(--color-record-default)] shadow-[var(--glow-record)]',
    neutral: 'bg-[var(--color-text-secondary)]',
  };

  return (
    <div
      className={cn('w-full flex flex-col gap-1.5', className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progress'}
    >
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-[var(--color-text-primary)]">{label}</span>
          {showPercentage && (
            <span className="text-[var(--color-text-secondary)] font-mono">{clamped}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2.5 bg-[var(--color-bg-hover)] rounded-full overflow-hidden p-0.5 border border-[var(--color-border-subtle)]">
        <div
          className={cn('h-full rounded-full transition-all duration-300 ease-out', barColors[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {sublabel && (
        <span className="text-[11px] text-[var(--color-text-tertiary)]">{sublabel}</span>
      )}
    </div>
  );
};
