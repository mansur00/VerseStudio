import React, { forwardRef, useId } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Tick01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';
import { cn } from '../../utils/cn';

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  label?: React.ReactNode;
  hint?: string;
  error?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, required, id, label, hint, error, className }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const errorId = `${checkboxId}-error`;
    const hintId = `${checkboxId}-hint`;

    return (
      <div className={cn('flex items-start gap-2.5 text-left', className)}>
        <CheckboxPrimitive.Root
          ref={ref}
          id={checkboxId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'peer h-5 w-5 shrink-0 mt-0.5 rounded-md border border-[var(--color-border-input)] bg-[var(--color-bg-surface)] transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-bg-canvas)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-[var(--color-brand-default)] data-[state=checked]:border-[var(--color-brand-default)] data-[state=checked]:text-[var(--color-text-on-brand)]',
            'data-[state=indeterminate]:bg-[var(--color-brand-default)] data-[state=indeterminate]:border-[var(--color-brand-default)] data-[state=indeterminate]:text-[var(--color-text-on-brand)]',
            error && 'border-[var(--color-error-default)] focus-visible:ring-[var(--color-error-default)]'
          )}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
            {checked === 'indeterminate' ? (
              <span className="w-2.5 h-0.5 bg-current rounded-full" />
            ) : (
              <HugeIcon icon={Tick01Icon} size={14} />
            )}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>

        {label ? (
          <div className="flex flex-col gap-0.5 leading-tight">
            <label
              htmlFor={checkboxId}
              className={cn(
                'text-sm font-medium text-[var(--color-text-primary)] cursor-pointer select-none',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </label>
            {error ? (
              <p id={errorId} className="text-xs text-[var(--color-error-default)]">
                {error}
              </p>
            ) : hint ? (
              <p id={hintId} className="text-xs text-[var(--color-text-tertiary)]">
                {hint}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
