'use client';

import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../../utils/cn';
import { KeyboardShortcutPill } from '../KeyboardShortcutPill/KeyboardShortcutPill';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  shortcut?: string[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  shortcut,
  side = 'top',
  align = 'center',
  delayDuration = 200,
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 overflow-hidden rounded-lg bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)]',
              'border border-[var(--color-border-default)] shadow-xl animate-in fade-in-0 zoom-in-95',
              'flex items-center gap-2 select-none'
            )}
          >
            <span>{content}</span>
            {shortcut && shortcut.length > 0 && (
              <KeyboardShortcutPill keys={shortcut} size="sm" />
            )}
            <TooltipPrimitive.Arrow className="fill-[var(--color-border-default)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
