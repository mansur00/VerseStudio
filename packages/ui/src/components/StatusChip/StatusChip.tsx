import React from 'react';
import { cn } from '../../utils/cn';
import { Circle, Globe, Lock, Loader2, AlertCircle } from 'lucide-react';

export type StatusType = 'recording' | 'shared' | 'private' | 'uploading' | 'failed' | 'active';

export interface StatusChipProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, className }) => {
  const configs = {
    recording: {
      defaultLabel: 'Recording',
      icon: <Circle className="w-2.5 h-2.5 fill-[var(--color-record-default)] text-[var(--color-record-default)] animate-pulse" />,
      bg: 'bg-[var(--color-record-subtle)]',
      text: 'text-[var(--color-record-default)]',
      border: 'border-[var(--color-record-default)]/30',
    },
    shared: {
      defaultLabel: 'Shared',
      icon: <Globe className="w-3 h-3 text-[var(--color-brand-default)]" />,
      bg: 'bg-[var(--color-brand-subtle)]',
      text: 'text-[var(--color-brand-default)]',
      border: 'border-[var(--color-brand-default)]/30',
    },
    private: {
      defaultLabel: 'Private',
      icon: <Lock className="w-3 h-3 text-[var(--color-text-tertiary)]" />,
      bg: 'bg-[var(--color-bg-hover)]',
      text: 'text-[var(--color-text-secondary)]',
      border: 'border-[var(--color-border-subtle)]',
    },
    uploading: {
      defaultLabel: 'Uploading...',
      icon: <Loader2 className="w-3 h-3 text-sky-400 animate-spin" />,
      bg: 'bg-sky-950/40',
      text: 'text-sky-300',
      border: 'border-sky-500/30',
    },
    failed: {
      defaultLabel: 'Failed',
      icon: <AlertCircle className="w-3 h-3 text-[var(--color-error-default)]" />,
      bg: 'bg-[var(--color-error-subtle)]',
      text: 'text-[var(--color-error-default)]',
      border: 'border-[var(--color-error-default)]/30',
    },
    active: {
      defaultLabel: 'Active',
      icon: <Circle className="w-2.5 h-2.5 fill-[var(--color-success-default)] text-[var(--color-success-default)]" />,
      bg: 'bg-[var(--color-success-subtle)]',
      text: 'text-[var(--color-success-default)]',
      border: 'border-[var(--color-success-default)]/30',
    },
  };

  const config = configs[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
