import React from 'react';
import { cn } from '../../utils/cn';
import {
  MonitorIcon,
  Camera01Icon,
  Layers01Icon,
  Layout01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export type StudioLayout = 'screen-only' | 'camera-only' | 'screen-camera' | 'split-50-50';

export interface LayoutSwitcherProps {
  value: StudioLayout;
  onChange: (layout: StudioLayout) => void;
  className?: string;
  labels?: {
    screenOnly?: string;
    cameraOnly?: string;
    screenCamera?: string;
    split5050?: string;
  };
}

/**
 * Layout Switcher matches Figma Component 10:143 (Studio Components)
 * 4 layouts: Screen Only, Camera Only, Screen + Camera Bubble, Split 50/50
 * Container: 4px padding, 4px gap, bg/surface (#222329), border/default (#383942), 12px radius
 * Active segment: 44x36px, brand/subtle (#26400A) fill, brand/default (#A3E635) icon
 */
export const LayoutSwitcher: React.FC<LayoutSwitcherProps> = ({
  value,
  onChange,
  className,
  labels = {
    screenOnly: 'Screen Only',
    cameraOnly: 'Camera Only',
    screenCamera: 'Screen + Camera Bubble',
    split5050: 'Split 50/50',
  },
}) => {
  const options: Array<{
    id: StudioLayout;
    label: string;
    icon: any;
    shortcut: string;
  }> = [
    {
      id: 'screen-only',
      label: labels.screenOnly || 'Screen Only',
      icon: MonitorIcon,
      shortcut: '1',
    },
    {
      id: 'camera-only',
      label: labels.cameraOnly || 'Camera Only',
      icon: Camera01Icon,
      shortcut: '2',
    },
    {
      id: 'screen-camera',
      label: labels.screenCamera || 'Screen + Camera Bubble',
      icon: Layers01Icon,
      shortcut: '3',
    },
    {
      id: 'split-50-50',
      label: labels.split5050 || 'Split 50/50',
      icon: Layout01Icon,
      shortcut: '4',
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Recording Layout"
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-xl shrink-0 select-none',
        'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-sm',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            title={`${option.label} (${option.shortcut})`}
            onClick={() => onChange(option.id)}
            className={cn(
              'w-11 h-9 rounded-lg flex items-center justify-center transition-all duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
              isSelected
                ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
            )}
          >
            <HugeIcon icon={option.icon} size={20} />
          </button>
        );
      })}
    </div>
  );
};

