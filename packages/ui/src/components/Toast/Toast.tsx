import React from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  title,
  message,
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
        'flex items-start gap-3 p-4 rounded-lg bg-[var(--color-bg-surface)] border shadow-lg',
        borders[variant],
        'transition-all duration-200 select-none max-w-sm w-full',
        className
      )}
    >
      {icons[variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{title}</p>
        {message && (
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 leading-relaxed">
            {message}
          </p>
        )}
      </div>
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
