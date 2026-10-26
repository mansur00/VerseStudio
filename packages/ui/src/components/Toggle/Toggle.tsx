import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../utils/cn';

export interface ToggleProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}) => {
  const switchId = id || React.useId();

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      {label || description ? (
        <label htmlFor={switchId} className="flex flex-col cursor-pointer select-none">
          {label && (
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {description}
            </span>
          )}
        </label>
      ) : null}

      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'w-11 h-6 bg-[var(--color-bg-active)] rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] disabled:opacity-50 disabled:cursor-not-allowed',
          checked && 'bg-[var(--color-brand-default)]'
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block w-5 h-5 bg-white rounded-full transition-transform duration-150 will-change-transform translate-x-0.5',
            checked && 'translate-x-[22px] bg-[var(--color-bg-canvas)]'
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
};
