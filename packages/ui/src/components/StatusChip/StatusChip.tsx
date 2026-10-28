import React from 'react';
import { cn } from '../../utils/cn';
import { GlobeIcon, LockIcon, Loading03Icon, AlertCircleIcon, SparklesIcon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export type StatusType = 'recording' | 'shared' | 'private' | 'uploading' | 'failed' | 'active' | 'pro' | 'default';

export interface StatusChipProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label, size = 'md', className }) => {
  const configs = {
    recording: {
      defaultLabel: 'Recording',
      icon: <span className="w-2 h-2 rounded-full bg-[var(--color-record-default)] animate-pulse" />,
      bg: 'bg-[var(--color-record-subtle)]',
      text: 'text-[var(--color-record-default)]',
      border: 'border-[var(--color-record-default)]/30',
    },
    shared: {
      defaultLabel: 'Shared',
      icon: <HugeIcon icon={GlobeIcon} size={14} className="text-[var(--color-brand-default)]" />,
      bg: 'bg-[var(--color-brand-subtle)]',
      text: 'text-[var(--color-brand-default)]',
      border: 'border-[var(--color-brand-default)]/30',
    },
    private: {
      defaultLabel: 'Private',
      icon: <HugeIcon icon={LockIcon} size={14} className="text-[var(--color-text-tertiary)]" />,
      bg: 'bg-[var(--color-bg-hover)]',
      text: 'text-[var(--color-text-secondary)]',
      border: 'border-[var(--color-border-subtle)]',
    },
    uploading: {
      defaultLabel: 'Uploading...',
      icon: <span className="animate-spin flex items-center"><HugeIcon icon={Loading03Icon} size={14} className="text-sky-400" /></span>,
      bg: 'bg-sky-950/40',
      text: 'text-sky-300',
      border: 'border-sky-500/30',
    },
    failed: {
      defaultLabel: 'Failed',
      icon: <HugeIcon icon={AlertCircleIcon} size={14} className="text-[var(--color-error-default)]" />,
      bg: 'bg-[var(--color-error-subtle)]',
      text: 'text-[var(--color-error-default)]',
      border: 'border-[var(--color-error-default)]/30',
    },
    active: {
      defaultLabel: 'Active',
      icon: <span className="w-2 h-2 rounded-full bg-[var(--color-success-default)]" />,
      bg: 'bg-[var(--color-success-subtle)]',
      text: 'text-green-800 dark:text-[var(--color-success-default)] font-medium',
      border: 'border-[var(--color-success-default)]/30',
    },
    pro: {
      defaultLabel: 'PRO',
      icon: <HugeIcon icon={SparklesIcon} size={14} className="text-[var(--color-brand-default)]" />,
      bg: 'bg-[var(--color-brand-subtle)]',
      text: 'text-[var(--color-brand-default)] font-bold',
      border: 'border-[var(--color-brand-default)]/40',
    },
    default: {
      defaultLabel: 'Active',
      icon: null,
      bg: 'bg-[var(--color-bg-hover)]',
      text: 'text-[var(--color-text-secondary)]',
      border: 'border-[var(--color-border-subtle)]',
    },
  };

  const config = configs[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium border select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.icon ? <span aria-hidden="true">{config.icon}</span> : null}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
