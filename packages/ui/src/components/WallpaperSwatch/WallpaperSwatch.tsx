'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

export interface WallpaperOption {
  id: string;
  name: string;
  value: string; // CSS background value or color
  previewStyle: React.CSSProperties;
}

export const DEFAULT_WALLPAPERS: WallpaperOption[] = [
  {
    id: 'mesh-lime',
    name: 'Lime Mesh',
    value: 'radial-gradient(circle at 20% 20%, rgba(163, 230, 53, 0.25) 0%, #1B1C21 80%)',
    previewStyle: { background: 'radial-gradient(circle at 20% 20%, #A3E635 0%, #1B1C21 80%)' },
  },
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    value: 'radial-gradient(circle at 80% 20%, rgba(34, 211, 238, 0.25) 0%, #1B1C21 80%)',
    previewStyle: { background: 'radial-gradient(circle at 80% 20%, #22D3EE 0%, #1B1C21 80%)' },
  },
  {
    id: 'sunset-amber',
    name: 'Sunset Amber',
    value: 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.25) 0%, #1B1C21 80%)',
    previewStyle: { background: 'radial-gradient(circle at 50% 10%, #F59E0B 0%, #1B1C21 80%)' },
  },
  {
    id: 'velvet-purple',
    name: 'Velvet Purple',
    value: 'radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.25) 0%, #1B1C21 80%)',
    previewStyle: { background: 'radial-gradient(circle at 70% 80%, #A855F7 0%, #1B1C21 80%)' },
  },
  {
    id: 'pure-carbon',
    name: 'Carbon Surface',
    value: '#222329',
    previewStyle: { background: '#222329' },
  },
  {
    id: 'transparent',
    name: 'Transparent / Clean',
    value: 'transparent',
    previewStyle: {
      backgroundImage:
        'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
      backgroundSize: '8px 8px',
      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
    },
  },
];

export interface WallpaperSwatchProps {
  selectedId: string;
  onSelect: (id: string, value: string) => void;
  options?: WallpaperOption[];
  className?: string;
}

export const WallpaperSwatch: React.FC<WallpaperSwatchProps> = ({
  selectedId,
  onSelect,
  options = DEFAULT_WALLPAPERS,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
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
              'relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all duration-150 transform hover:scale-105',
              isSelected
                ? 'border-[var(--color-brand-default)] ring-2 ring-[var(--color-brand-default)]/40 shadow-[var(--glow-brand)]'
                : 'border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]'
            )}
            style={option.previewStyle}
          >
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
