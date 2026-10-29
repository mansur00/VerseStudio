'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import {
  Target01Icon,
  Sun01Icon,
  Key01Icon,
  ViewOffIcon,
  ZoomInAreaIcon,
  File01Icon,
  GripVerticalIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';
import { Tooltip } from '../Tooltip/Tooltip';

export interface ToolPaletteState {
  laser: boolean;
  spotlight: boolean;
  keystroke: boolean;
  privacy: boolean;
  autoZoom: boolean;
  teleprompter: boolean;
}

export interface ToolPaletteProps {
  tools: ToolPaletteState;
  onToggleTool: (tool: keyof ToolPaletteState) => void;
  className?: string;
  showGrip?: boolean;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  tools,
  onToggleTool,
  className,
  showGrip = true,
}) => {
  return (
    <div
      role="toolbar"
      aria-label="Studio Live Recording Tools"
      className={cn(
        'inline-flex items-center gap-1.5 p-1.5 rounded-xl bg-[var(--color-bg-surface)]',
        'border border-[var(--color-border-default)] shadow-2xl select-none',
        className
      )}
    >
      {showGrip && (
        <span
          className="cursor-grab text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] px-1 active:cursor-grabbing flex items-center"
          aria-hidden="true"
        >
          <HugeIcon icon={GripVerticalIcon} size={16} />
        </span>
      )}

      {/* Laser Pen */}
      <Tooltip content="Laser Pen (2s fade)" shortcut={['Alt', 'L']}>
        <button
          type="button"
          onClick={() => onToggleTool('laser')}
          aria-pressed={tools.laser}
          aria-label="Laser Pen"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            tools.laser
              ? 'bg-[var(--color-accent-laser)] text-black shadow-[0_0_12px_var(--color-accent-laser)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <HugeIcon icon={Target01Icon} size={18} />
        </button>
      </Tooltip>

      {/* Spotlight */}
      <Tooltip content="Spotlight focus" shortcut={['Alt', 'S']}>
        <button
          type="button"
          onClick={() => onToggleTool('spotlight')}
          aria-pressed={tools.spotlight}
          aria-label="Spotlight"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            tools.spotlight
              ? 'bg-[var(--color-warning-default)] text-black shadow-[0_0_12px_var(--color-warning-default)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <HugeIcon icon={Sun01Icon} size={18} />
        </button>
      </Tooltip>

      {/* Keystroke HUD */}
      <Tooltip content="Keystrokes HUD" shortcut={['Alt', 'K']}>
        <button
          type="button"
          onClick={() => onToggleTool('keystroke')}
          aria-pressed={tools.keystroke}
          aria-label="Keystroke Display HUD"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            tools.keystroke
              ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-[var(--glow-brand)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <HugeIcon icon={Key01Icon} size={18} />
        </button>
      </Tooltip>

      {/* Privacy Blur Shield */}
      <Tooltip content="Privacy Shield Blur" shortcut={['Alt', 'P']}>
        <button
          type="button"
          onClick={() => onToggleTool('privacy')}
          aria-pressed={tools.privacy}
          aria-label="Privacy Shield Blur"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            tools.privacy
              ? 'bg-[var(--color-record-default)] text-white shadow-[var(--glow-record)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <HugeIcon icon={ViewOffIcon} size={18} />
        </button>
      </Tooltip>

      {/* Auto Zoom */}
      <Tooltip content="Auto Zoom on click" shortcut={['Alt', 'Z']}>
        <button
          type="button"
          onClick={() => onToggleTool('autoZoom')}
          aria-pressed={tools.autoZoom}
          aria-label="Auto Zoom & Pan"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            tools.autoZoom
              ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-[var(--glow-brand)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <HugeIcon icon={ZoomInAreaIcon} size={18} />
        </button>
      </Tooltip>

      <div className="h-5 w-px bg-[var(--color-border-subtle)]" />

      {/* Teleprompter */}
      <Tooltip content="Teleprompter (Bangla & English)" shortcut={['Alt', 'T']}>
        <button
          type="button"
          onClick={() => onToggleTool('teleprompter')}
          aria-pressed={tools.teleprompter}
          aria-label="Teleprompter"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            tools.teleprompter
              ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-[var(--glow-brand)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <HugeIcon icon={File01Icon} size={18} />
        </button>
      </Tooltip>
    </div>
  );
};
