import React from 'react';
import { Mic, Sparkles, SlidersHorizontal, Check } from 'lucide-react';
import type { AudioTrackOption } from '@verse-studio/shared';

export interface AudioTrackSelectorProps {
  value: AudioTrackOption;
  onChange: (track: AudioTrackOption) => void;
  disabled?: boolean;
  className?: string;
}

interface TrackOptionConfig {
  id: AudioTrackOption;
  title: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
}

const TRACKS: TrackOptionConfig[] = [
  {
    id: 'original-bangla',
    title: 'Original Bangla',
    badge: 'Raw Mic',
    description: 'Pristine original microphone audio recording without AI synthesis.',
    icon: <Mic className="w-5 h-5 text-[var(--color-text-secondary)]" />,
  },
  {
    id: 'english-ai',
    title: 'English AI Voice',
    badge: 'Neural 100%',
    description: 'Full studio-grade neural voiceover translated directly from Bengali speech.',
    icon: <Sparkles className="w-5 h-5 text-[var(--color-brand-default)]" />,
  },
  {
    id: 'mixed',
    title: 'Bilingual Mix',
    badge: '20% BN / 80% EN',
    description: 'Subtle original Bangla audio ducked underneath crisp English AI translation.',
    icon: <SlidersHorizontal className="w-5 h-5 text-[var(--color-accent-laser)]" />,
  },
];

export const AudioTrackSelector: React.FC<AudioTrackSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <div
      role="radiogroup"
      aria-label="Audio Track Selection"
      className={`grid grid-cols-1 md:grid-cols-3 gap-3.5 ${className}`}
    >
      {TRACKS.map((t) => {
        const isSelected = value === t.id;

        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(t.id)}
            className={`relative p-4 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-3 ${
              isSelected
                ? 'border-[var(--color-brand-default)] bg-[var(--color-bg-elevated)] ring-1 ring-[var(--color-brand-default)] shadow-sm'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg border ${
                    isSelected
                      ? 'bg-[var(--color-brand-subtle)] border-[var(--color-brand-default)]/30'
                      : 'bg-[var(--color-bg-hover)] border-[var(--color-border-subtle)]'
                  }`}
                >
                  {t.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.title}
                  </h4>
                  <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] mt-0.5">
                    {t.badge}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-[var(--color-brand-default)] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-[var(--color-text-on-brand)] stroke-[3]" />
                </div>
              )}
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {t.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
