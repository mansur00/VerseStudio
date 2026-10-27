import React from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  className,
}) => {
  const icons = {
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" aria-hidden="true" />,
    success: <CheckCircle2 className="w-5 h-5 text-[var(--color-success-default)] shrink-0" aria-hidden="true" />,
    warning: <AlertTriangle className="w-5 h-5 text-[var(--color-warning-default)] shrink-0" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-[var(--color-error-default)] shrink-0" aria-hidden="true" />,
  };

  const borders = {
    info: 'border-[var(--color-border-default)]',
    success: 'border-[var(--color-success-default)]/30',
    warning: 'border-[var(--color-warning-default)]/30',
    error: 'border-[var(--color-error-default)]/30',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 p-3.5 rounded-lg bg-[var(--color-bg-surface)] border shadow-xl',
        borders[variant],
        'transition-all duration-200 select-none max-w-sm w-full',
        className
      )}
    >
      {icons[variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{title}</p>
        {message && (
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            {message}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-bold text-[var(--color-brand-default)] hover:underline shrink-0 px-2 py-1 rounded bg-[var(--color-bg-hover)]"
        >
          {actionLabel}
        </button>
      )}
      {onClose && (
        <button
          onClick={onClose}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-0.5 rounded"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
