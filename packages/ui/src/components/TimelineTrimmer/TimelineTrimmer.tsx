'use client';

import React, { useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';

export interface TimelineTrimmerProps {
  duration: number; // in seconds
  currentTime: number; // current playhead in seconds
  startTime: number; // trim start in seconds
  endTime: number; // trim end in seconds
  onSeek: (time: number) => void;
  onTrimChange: (start: number, end: number) => void;
  className?: string;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  const mm = mins.toString().padStart(2, '0');
  const ss = secs.toString().padStart(2, '0');
  return `${mm}:${ss}.${ms}`;
}

export const TimelineTrimmer: React.FC<TimelineTrimmerProps> = ({
  duration,
  currentTime,
  startTime,
  endTime,
  onSeek,
  onTrimChange,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const safeDuration = Math.max(1, duration);
  const startPercent = (startTime / safeDuration) * 100;
  const endPercent = (endTime / safeDuration) * 100;
  const playheadPercent = (currentTime / safeDuration) * 100;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: 'start' | 'end' | 'playhead') => {
      e.preventDefault();
      e.stopPropagation();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();

      const onPointerMove = (moveEvent: PointerEvent) => {
        const clientX = moveEvent.clientX;
        const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const newTime = (relativeX / rect.width) * safeDuration;

        if (type === 'start') {
          const clamped = Math.min(newTime, endTime - 0.5);
          onTrimChange(Math.max(0, clamped), endTime);
        } else if (type === 'end') {
          const clamped = Math.max(newTime, startTime + 0.5);
          onTrimChange(startTime, Math.min(safeDuration, clamped));
        } else if (type === 'playhead') {
          onSeek(Math.max(0, Math.min(safeDuration, newTime)));
        }
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [safeDuration, startTime, endTime, onSeek, onTrimChange]
  );

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newTime = (relativeX / rect.width) * safeDuration;
    onSeek(newTime);
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5 select-none', className)}>
      {/* Timestamps Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono text-[var(--color-text-secondary)]">
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-brand-default)] font-semibold">Start:</span>
          <span>{formatTime(startTime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-text-primary)] font-semibold">Playhead:</span>
          <span>{formatTime(currentTime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[var(--color-brand-default)] font-semibold">End:</span>
          <span>{formatTime(endTime)}</span>
        </div>
      </div>

      {/* Visual Timeline Track */}
      <div
        ref={containerRef}
        onClick={handleTrackClick}
        className="relative h-11 sm:h-12 bg-[var(--color-bg-hover)] rounded-xl border border-[var(--color-border-default)] cursor-pointer overflow-hidden p-1 flex items-center"
      >
        {/* Waveform / Filmstrip Placeholder Stripes */}
        <div className="absolute inset-0 opacity-15 flex items-center justify-around pointer-events-none px-2">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-[var(--color-text-primary)] rounded-full"
              style={{ height: `${20 + ((i * 17) % 60)}%` }}
            />
          ))}
        </div>

        {/* Inactive Dimmed Left Region */}
        <div
          className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none"
          style={{ width: `${startPercent}%` }}
        />

        {/* Selected Active Trim Region */}
        <div
          className="absolute top-0 bottom-0 bg-[var(--color-brand-default)]/20 border-y-2 border-[var(--color-brand-default)] pointer-events-none"
          style={{
            left: `${startPercent}%`,
            width: `${Math.max(0, endPercent - startPercent)}%`,
          }}
        />

        {/* Inactive Dimmed Right Region */}
        <div
          className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none"
          style={{ width: `${100 - endPercent}%` }}
        />

        {/* Start Handle */}
        <div
          role="slider"
          aria-label="Trim Start"
          aria-valuenow={startTime}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
          className="absolute top-0 bottom-0 w-4 bg-[var(--color-brand-default)] rounded-l-lg cursor-ew-resize flex items-center justify-center shadow-lg z-20 hover:brightness-110 active:scale-95 transition-transform"
          style={{ left: `calc(${startPercent}% - 8px)` }}
        >
          <div className="w-0.5 h-6 bg-[var(--color-text-on-brand)] rounded-full" />
        </div>

        {/* End Handle */}
        <div
          role="slider"
          aria-label="Trim End"
          aria-valuenow={endTime}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
          className="absolute top-0 bottom-0 w-4 bg-[var(--color-brand-default)] rounded-r-lg cursor-ew-resize flex items-center justify-center shadow-lg z-20 hover:brightness-110 active:scale-95 transition-transform"
          style={{ left: `calc(${endPercent}% - 8px)` }}
        >
          <div className="w-0.5 h-6 bg-[var(--color-text-on-brand)] rounded-full" />
        </div>

        {/* Current Playhead Scrubber */}
        <div
          role="slider"
          aria-label="Playhead position"
          aria-valuenow={currentTime}
          onPointerDown={(e) => handlePointerDown(e, 'playhead')}
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-30 flex flex-col items-center pointer-events-auto"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-3.5 h-3.5 bg-white rounded-full -mt-1 shadow-md border-2 border-[var(--color-brand-default)]" />
        </div>
      </div>
    </div>
  );
};
