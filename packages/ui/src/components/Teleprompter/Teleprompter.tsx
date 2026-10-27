'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  GripVertical,
  Type,
  Gauge,
  Edit3,
  Check,
} from 'lucide-react';
import { Slider } from '../Slider/Slider';

export interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  defaultText?: string;
  isBangla?: boolean;
  className?: string;
}

const DEFAULT_SCRIPT_EN = `Welcome to VerseStudio 4K Pro.
Today we are demonstrating studio-grade screen recording at 60 frames per second.
Notice how smooth the cursor spotlight and live tools feel.
With automatic Bangla-to-English AI dubbing, creating bilingual content has never been easier.
Thank you for watching, and let's explore the post-studio editor.`;

const DEFAULT_SCRIPT_BN = `ভার্সস্টুডিও ৪কে প্রো-তে আপনাকে স্বাগতম।
আজ আমরা ৬০ ফ্রেম প্রতি সেকেন্ডে স্টুডিও-মানের স্ক্রিন রেকর্ডিং প্রদর্শন করছি।
দেখুন কার্সার স্পটলাইট এবং লাইভ টুলস কতটা সাবলীলভাবে কাজ করে।
স্বয়ংক্রিয় বাংলা থেকে ইংরেজি এআই ডাবিংয়ের মাধ্যমে দ্বিভাষিক কনটেন্ট তৈরি এখন অত্যন্ত সহজ।
আমাদের সাথে থাকার জন্য ধন্যবাদ, এবার চলুন পোস্ট-স্টুডিও এডিটরটি ঘুরে দেখি।`;

export const Teleprompter: React.FC<TeleprompterProps> = ({
  isOpen,
  onClose,
  defaultText,
  isBangla = false,
  className,
}) => {
  const [script, setScript] = useState(
    defaultText || (isBangla ? DEFAULT_SCRIPT_BN : DEFAULT_SCRIPT_EN)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState([30]); // px per second
  const [fontSize, setFontSize] = useState([20]); // px
  const [activeLineIndex, setActiveLineIndex] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const lines = script.split('\n').filter((l) => l.trim().length > 0);

  // Autoscroll animation loop
  useEffect(() => {
    if (!isScrolling || !scrollContainerRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTop += delta * speed[0];

        // Calculate active line from scrollTop
        const lineHeight = fontSize[0] * 1.8;
        const currentLine = Math.floor(container.scrollTop / lineHeight);
        setActiveLineIndex(Math.min(lines.length - 1, Math.max(0, currentLine)));

        // Stop if end of text reached
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
          setIsScrolling(false);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isScrolling, speed, fontSize, lines.length]);

  const handleReset = () => {
    setIsScrolling(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setActiveLineIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Teleprompter Overlay"
      className={cn(
        'w-[380px] bg-[var(--color-bg-surface)]/95 backdrop-blur-xl rounded-2xl border border-[var(--color-border-default)] shadow-2xl',
        'flex flex-col select-none overflow-hidden transition-all',
        className
      )}
    >
      {/* Teleprompter Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)]/40">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-[var(--color-text-tertiary)] cursor-grab" />
          <span className="text-xs font-bold text-[var(--color-text-primary)]">
            Teleprompter
          </span>
          {isBangla && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-bangla font-semibold">
              বাংলা
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Save Script' : 'Edit Script'}
            className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
          >
            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close teleprompter"
            className="p-1 rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Reading Viewport / Editor */}
      <div className="relative h-[220px] p-4 overflow-hidden">
        {/* Subtle reading focal guide overlay */}
        <div className="absolute top-[35%] left-0 right-0 h-10 bg-[var(--color-brand-default)]/5 border-y border-[var(--color-brand-default)]/20 pointer-events-none" />

        {isEditing ? (
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full h-full bg-transparent text-sm text-[var(--color-text-primary)] resize-none focus:outline-none font-sans"
            placeholder="Type or paste your teleprompter script here..."
          />
        ) : (
          <div
            ref={scrollContainerRef}
            className="w-full h-full overflow-y-auto no-scrollbar scroll-smooth flex flex-col gap-3 py-16"
          >
            {lines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <p
                  key={idx}
                  style={{ fontSize: `${fontSize[0]}px` }}
                  className={cn(
                    'transition-colors duration-200 leading-relaxed font-medium',
                    isBangla && 'font-bangla leading-loose',
                    isActive
                      ? 'text-[var(--color-brand-default)] font-bold scale-[1.02] origin-left'
                      : 'text-[var(--color-text-secondary)] opacity-60'
                  )}
                >
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Control Footer */}
      <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col gap-2.5">
        {/* Sliders: Speed and Font Size */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-[var(--color-text-secondary)]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Speed
              </span>
              <span className="font-mono">{speed[0]}</span>
            </div>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={10}
              max={100}
              step={5}
              ariaLabel="Scroll speed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Type className="w-3 h-3" /> Size
              </span>
              <span className="font-mono">{fontSize[0]}px</span>
            </div>
            <Slider
              value={fontSize}
              onValueChange={setFontSize}
              min={14}
              max={32}
              step={2}
              ariaLabel="Font size"
            />
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={() => setIsScrolling(!isScrolling)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] text-xs font-bold shadow-[var(--glow-brand)] active:scale-95 transition-transform"
          >
            {isScrolling ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start Scroll
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
