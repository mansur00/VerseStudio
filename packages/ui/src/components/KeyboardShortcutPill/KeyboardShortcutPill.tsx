'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface KeyboardShortcutPillProps {
  keys: string[];
  size?: 'sm' | 'lg';
  className?: string;
}

export const KeyboardShortcutPill: React.FC<KeyboardShortcutPillProps> = ({
  keys,
  size = 'sm',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono font-medium text-[var(--color-text-secondary)] select-none',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      {keys.map((k, idx) => (
        <kbd
          key={idx}
          className={cn(
            'inline-flex items-center justify-center rounded bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] shadow-sm font-semibold',
            size === 'sm' ? 'px-1.5 py-0.5 min-w-[18px] text-[10px]' : 'px-2 py-1 min-w-[24px] text-xs'
          )}
        >
          {k}
        </kbd>
      ))}
    </span>
  );
};
