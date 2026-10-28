'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  id,
  className,
  disabled,
  ...props
}) => {
  const generatedId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="flex flex-col gap-1.5 text-left w-full">
      {label && (
        <label
          htmlFor={generatedId}
          className="font-label-s text-[var(--color-text-secondary)] select-none"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={generatedId}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error
              ? `${generatedId}-error`
              : helperText
              ? `${generatedId}-helper`
              : undefined
          }
          className={cn(
            'w-full appearance-none rounded-xl px-3.5 py-2.5 font-body-s bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-input)] pr-10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[var(--color-error-default)] focus:ring-[var(--color-error-default)]',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] py-1 font-body-s"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-tertiary)] flex items-center">
          <HugeIcon icon={ArrowDown01Icon} size={18} />
        </span>
      </div>

      {error ? (
        <p id={`${generatedId}-error`} className="font-caption text-[var(--color-error-default)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${generatedId}-helper`} className="font-caption text-[var(--color-text-tertiary)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
