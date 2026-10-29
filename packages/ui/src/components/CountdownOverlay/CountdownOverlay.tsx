'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface CountdownOverlayProps {
  initialCount?: number;
  onComplete: () => void;
  onCancel: () => void;
  className?: string;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  initialCount = 3,
  onComplete,
  onCancel,
  className,
}) => {
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setAnimating(true);
    const animTimer = setTimeout(() => setAnimating(false), 800);

    if (count <= 1) {
      const doneTimer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => {
        clearTimeout(animTimer);
        clearTimeout(doneTimer);
      };
    }

    const timer = setTimeout(() => {
      setCount((prev) => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(animTimer);
      clearTimeout(timer);
    };
  }, [count, onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 select-none',
        className
      )}
      role="dialog"
      aria-label="Recording countdown"
      aria-modal="true"
    >
      <div className="relative flex flex-col items-center">
        {/* Glowing ring around number */}
        <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-[var(--color-brand-default)] shadow-[var(--glow-brand)] bg-[var(--color-bg-surface)]">
          <span
            key={count}
            className={cn(
              'text-7xl font-extrabold font-mono text-[var(--color-brand-default)] transition-all duration-300 transform',
              animating ? 'scale-125 opacity-100' : 'scale-100 opacity-90'
            )}
          >
            {count}
          </span>
        </div>

        <p className="mt-6 text-sm font-medium text-[var(--color-text-secondary)] tracking-wide uppercase">
          Recording starts in...
        </p>

        {/* Cancel Action */}
        <button
          type="button"
          onClick={onCancel}
          className="mt-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-xs font-semibold text-[var(--color-text-primary)] border border-[var(--color-border-default)] transition-all active:scale-95"
        >
          <HugeIcon icon={Cancel01Icon} size={14} />
          Cancel Countdown
        </button>
      </div>
    </div>
  );
};
