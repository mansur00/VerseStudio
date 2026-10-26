import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string; // Accessible name required by WCAG
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bg-canvas)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-text-primary)] active:scale-95';

    const sizeStyles = {
      sm: 'w-8 h-8 rounded-sm p-1.5',
      md: 'w-10 h-10 rounded-md p-2',
      lg: 'w-12 h-12 rounded-lg p-2.5',
    };

    const variantStyles = {
      primary:
        'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-pressed)] shadow-sm hover:shadow-[var(--glow-brand)]',
      secondary:
        'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-bg-active)]',
      ghost:
        'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]',
      danger:
        'bg-[var(--color-danger-default)] text-white hover:bg-[var(--color-danger-hover)] active:bg-[var(--color-danger-pressed)]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
