import React from 'react';
import type { SubtitleMode } from '@verse-studio/shared';

export interface LiveSubtitleProps {
  mode: SubtitleMode;
  banglaText?: string;
  englishText?: string;
  isListening?: boolean;
  className?: string;
}

export const LiveSubtitle: React.FC<LiveSubtitleProps> = ({
  mode,
  banglaText,
  englishText,
  isListening = false,
  className = '',
}) => {
  if (mode === 'off' || (!banglaText && !englishText && !isListening)) {
    return null;
  }

  const showBangla = (mode === 'bilingual') && Boolean(banglaText);
  const showEnglish = (mode === 'bilingual' || mode === 'english-only') && Boolean(englishText);

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Live Subtitles"
      className={`pointer-events-none select-none max-w-2xl mx-auto flex flex-col items-center gap-1.5 transition-all duration-200 ${className}`}
    >
      <div className="bg-black/80 backdrop-blur-md border border-white/15 px-5 py-2.5 rounded-xl shadow-2xl flex flex-col items-center text-center gap-1">
        {/* Bengali text line */}
        {showBangla && (
          <p className="font-bangla text-base md:text-lg font-medium text-[var(--color-brand-default)] tracking-wide leading-relaxed">
            {banglaText}
          </p>
        )}

        {/* English translated line */}
        {showEnglish && (
          <p className="text-sm md:text-base font-semibold text-white tracking-normal leading-snug">
            {englishText}
          </p>
        )}

        {/* Listening indicator when no text yet */}
        {!showBangla && !showEnglish && isListening && (
          <div className="flex items-center gap-2 py-0.5">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-default)] animate-pulse" />
            <span className="text-xs font-medium text-white/70">
              Listening & translating Bangla speech...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
