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
      icon: <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-record-default)] animate-pulse" />,
      bg: 'bg-[var(--color-record-subtle)]',
      text: 'text-[var(--color-record-default)]',
    },
    shared: {
      defaultLabel: 'Shared',
      icon: <HugeIcon icon={GlobeIcon} size={14} className="text-[var(--color-brand-default)]" />,
      bg: 'bg-[var(--color-brand-subtle)]',
      text: 'text-[var(--color-brand-default)]',
    },
    private: {
      defaultLabel: 'Private',
      icon: <HugeIcon icon={LockIcon} size={14} className="text-[var(--color-text-tertiary)]" />,
      bg: 'bg-[var(--color-bg-hover)]',
      text: 'text-[var(--color-text-secondary)]',
    },
    uploading: {
      defaultLabel: 'Uploading...',
      icon: <span className="animate-spin flex items-center"><HugeIcon icon={Loading03Icon} size={14} className="text-sky-400" /></span>,
      bg: 'bg-sky-950/60',
      text: 'text-sky-300',
    },
    failed: {
      defaultLabel: 'Failed',
      icon: <HugeIcon icon={AlertCircleIcon} size={14} className="text-[var(--color-error-default)]" />,
      bg: 'bg-[var(--color-error-subtle)]',
      text: 'text-[var(--color-error-default)]',
    },
    active: {
      defaultLabel: 'Active',
      icon: <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success-default)]" />,
      bg: 'bg-[var(--color-success-subtle)]',
      text: 'text-[var(--color-success-default)] font-medium',
    },
    pro: {
      defaultLabel: 'PRO',
      icon: <HugeIcon icon={SparklesIcon} size={14} className="text-[var(--color-brand-default)]" />,
      bg: 'bg-[var(--color-brand-subtle)]',
      text: 'text-[var(--color-brand-default)] font-bold',
    },
    default: {
      defaultLabel: 'Active',
      icon: null,
      bg: 'bg-[var(--color-bg-hover)]',
      text: 'text-[var(--color-text-secondary)]',
    },
  };

  const config = configs[status] || configs.default;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium select-none whitespace-nowrap shrink-0',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        config.bg,
        config.text,
        className
      )}
    >
      {config.icon ? <span aria-hidden="true">{config.icon}</span> : null}
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};
