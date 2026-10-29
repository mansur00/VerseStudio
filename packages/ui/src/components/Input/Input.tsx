import React, { forwardRef, useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, leadingIcon, trailingIcon, disabled, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[var(--color-text-secondary)] select-none"
          >
            {label}
          </label>
        ) : null}

        <div className="relative flex items-center">
          {leadingIcon ? (
            <span className="absolute left-3 text-[var(--color-text-tertiary)] pointer-events-none flex items-center">
              {leadingIcon}
            </span>
          ) : null}

          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={cn(
              'w-full h-11 px-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)]',
              'border border-[var(--color-border-input)] rounded-xl text-sm transition-colors',
              'focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-1 focus:ring-[var(--color-border-focus)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-[var(--color-error-default)] focus:border-[var(--color-error-default)] focus:ring-[var(--color-error-default)]',
              leadingIcon && 'pl-10',
              trailingIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {trailingIcon ? (
            <span className="absolute right-3 text-[var(--color-text-tertiary)] flex items-center">
              {trailingIcon}
            </span>
          ) : null}
        </div>

        {error ? (
          <p id={errorId} className="text-xs text-[var(--color-error-default)] mt-0.5">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
