'use client';

import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../utils/cn';

export interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  ariaLabel = 'Slider',
}) => {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative flex items-center select-none touch-none w-full h-5 cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] overflow-hidden">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--color-brand-default)] shadow-[var(--glow-brand)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'block w-4 h-4 rounded-full bg-white shadow-md border-2 border-[var(--color-brand-default)]',
          'transition-transform hover:scale-110 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-default)]'
        )}
      />
    </SliderPrimitive.Root>
  );
};
