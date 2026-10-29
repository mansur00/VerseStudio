'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface WallpaperOption {
  id: string;
  name: string;
  value: string; // CSS background value or color
  previewStyle: React.CSSProperties;
}

/**
 * Wallpapers defined in Figma Screens 14 (36:1508 to 36:1518) & Component 34:592
 */
export const DEFAULT_WALLPAPERS: WallpaperOption[] = [
  {
    id: 'studio-green',
    name: 'Studio Deep Green',
    value: 'linear-gradient(127deg, rgba(48, 69, 31, 1) 0%, rgba(31, 31, 43, 1) 74%)',
    previewStyle: { background: 'linear-gradient(127deg, #30451F 0%, #1F1F2B 74%)' },
  },
  {
    id: 'mesh-lime',
    name: 'Lime Accent',
    value: 'linear-gradient(135deg, rgba(163, 230, 53, 1) 0%, rgba(54, 83, 20, 1) 80%)',
    previewStyle: { background: 'linear-gradient(135deg, #A3E635 0%, #365314 80%)' },
  },
  {
    id: 'velvet-purple',
    name: 'Velvet Purple',
    value: 'linear-gradient(135deg, rgba(134, 119, 255, 1) 0%, rgba(35, 30, 99, 1) 80%)',
    previewStyle: { background: 'linear-gradient(135deg, #8677FF 0%, #231E63 80%)' },
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Glow',
    value: 'linear-gradient(135deg, rgba(255, 138, 91, 1) 0%, rgba(122, 31, 92, 1) 80%)',
    previewStyle: { background: 'linear-gradient(135deg, #FF8A5B 0%, #7A1F5C 80%)' },
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    value: 'linear-gradient(135deg, rgba(34, 211, 238, 1) 0%, rgba(11, 58, 99, 1) 80%)',
    previewStyle: { background: 'linear-gradient(135deg, #22D3EE 0%, #0B3A63 80%)' },
  },
  {
    id: 'dark-charcoal',
    name: 'Dark Charcoal',
    value: 'linear-gradient(135deg, rgba(92, 92, 102, 1) 0%, rgba(27, 27, 31, 1) 80%)',
    previewStyle: { background: 'linear-gradient(135deg, #5C5C66 0%, #1B1B1F 80%)' },
  },
];

export interface WallpaperSwatchProps {
  selectedId: string;
  onSelect: (id: string, value: string) => void;
  options?: WallpaperOption[];
  className?: string;
}

/**
 * Wallpaper Swatch matches Figma Component 34:592
 * 12px border radius, 2px lime border and check badge when selected
 */
export const WallpaperSwatch: React.FC<WallpaperSwatchProps> = ({
  selectedId,
  onSelect,
  options = DEFAULT_WALLPAPERS,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2.5 flex-wrap', className)}>
      {options.map((option) => {
        const isSelected = selectedId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id, option.value)}
            title={option.name}
            aria-label={`Select ${option.name} wallpaper`}
            className={cn(
              'relative w-12 h-12 rounded-xl overflow-hidden transition-all duration-150 select-none outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
              isSelected
                ? 'border-2 border-[var(--color-brand-default)] shadow-[var(--glow-brand)] scale-[1.04]'
                : 'border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:scale-[1.02]'
            )}
            style={option.previewStyle}
          >
            {isSelected && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-brand-default)] flex items-center justify-center shadow-xs">
                <HugeIcon icon={Tick02Icon} size={11} className="text-[var(--color-text-on-brand)]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
