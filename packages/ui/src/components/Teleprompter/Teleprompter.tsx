'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../utils/cn';
import {
  RotateLeft01Icon,
  Cancel01Icon,
  GripVerticalIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface TeleprompterProps {
  isOpen: boolean;
  onClose: () => void;
  defaultText?: string;
  isBangla?: boolean;
  className?: string;
  onGripMouseDown?: (e: React.MouseEvent) => void;
  onLanguageChange?: (lang: 'en' | 'bn') => void;
}

const DEFAULT_SCRIPT_EN = `1. 4K 60 FPS studio screen recording with camera bubble.
2. Real-time Bangla speech to English subtitles.
3. Resumable Google Drive cloud integration without risking memory crashes.

Let's dive in and review the canvas controls!`;

const DEFAULT_SCRIPT_BN = `১. ৪কে ৬০ এফপিএস স্টুডিও স্ক্রিন রেকর্ডিং ও ক্যামেরা বাবল।
২. রিয়েল-টাইম বাংলা স্পিচ থেকে ইংরেজি সাবটাইটেল।
৩. মেমোরি ক্র্যাশ ছাড়াই গুগল ড্রাইভে সরাসরি ক্লাউড ইন্টিগ্রেশন।

চলুন ক্যানভাস ও স্টুডিও টুলসগুলো বিস্তারিত দেখে নেওয়া যাক!`;

export const Teleprompter: React.FC<TeleprompterProps> = ({
  isOpen,
  onClose,
  defaultText,
  isBangla = false,
  className,
  onGripMouseDown,
  onLanguageChange,
}) => {
  const [currentLang, setCurrentLang] = useState<'en' | 'bn'>(isBangla ? 'bn' : 'en');
  const [script, setScript] = useState(
    defaultText || (isBangla ? DEFAULT_SCRIPT_BN : DEFAULT_SCRIPT_EN)
  );
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState(2); // 1x to 4x multiplier
  const [fontSize, setFontSize] = useState(18); // 14px to 32px

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync external isBangla prop if changed
  useEffect(() => {
    setCurrentLang(isBangla ? 'bn' : 'en');
  }, [isBangla]);

  // Autoscroll animation loop
  useEffect(() => {
    if (!isScrolling || !textareaRef.current) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const delta = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const el = textareaRef.current;
      if (el) {
        // Speed multiplier * 25 px per second
        const pxPerSec = speed * 25;
        el.scrollTop += delta * pxPerSec;

        // Stop if end of text reached
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
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
  }, [isScrolling, speed]);

  const handleReset = () => {
    setIsScrolling(false);
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
    }
  };

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'bn' : 'en';
    setCurrentLang(nextLang);
    onLanguageChange?.(nextLang);

    // Swap default text if user hasn't heavily modified it
    if (script === DEFAULT_SCRIPT_EN || script === DEFAULT_SCRIPT_BN) {
      setScript(nextLang === 'bn' ? DEFAULT_SCRIPT_BN : DEFAULT_SCRIPT_EN);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Teleprompter Overlay"
      className={cn(
        'w-[360px] sm:w-[400px] bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-subtle)] shadow-2xl shadow-black/60',
        'flex flex-col select-none overflow-hidden transition-all',
        className
      )}
    >
      {/* Teleprompter HUD Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          <div
            onMouseDown={onGripMouseDown}
            className="p-1 -ml-1 text-[#808191] hover:text-white cursor-grab active:cursor-grabbing rounded transition-colors"
            title="Drag Teleprompter HUD"
          >
            <HugeIcon icon={GripVerticalIcon} size={15} />
          </div>

          <span className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight">
            Teleprompter HUD
          </span>

          <span className="px-1.5 py-0.5 rounded bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-mono text-[11px] font-bold tracking-tight">
            Alt+T
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Switcher Button */}
          <button
            type="button"
            onClick={handleToggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#272832] border border-[#383944] text-xs font-semibold text-white hover:bg-[#343542] transition-colors"
            title={`Switch to ${currentLang === 'en' ? 'Bangla' : 'English'}`}
          >
            <svg
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 8l6 6" />
              <path d="M4 14h8" />
              <path d="M2 5h12" />
              <path d="M7 2h1" />
              <path d="M22 22l-5-10-5 10" />
              <path d="M14 18h6" />
            </svg>
            <span>{currentLang === 'en' ? 'EN' : 'BN'}</span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close teleprompter"
            className="p-1 rounded-md text-[#808191] hover:text-white hover:bg-[#272832] transition-colors"
          >
            <HugeIcon icon={Cancel01Icon} size={15} />
          </button>
        </div>
      </div>

      {/* Main Text Reading / Inset Box */}
      <div className="p-3">
        <div className="relative bg-[#16171C] border border-[#2B2C35] rounded-xl p-3.5 h-[190px] flex flex-col overflow-hidden">
          <textarea
            ref={textareaRef}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            style={{ fontSize: `${fontSize}px` }}
            className={cn(
              'w-full h-full bg-transparent text-[var(--color-text-primary)] font-medium resize-none outline-none leading-relaxed',
              'overflow-y-auto pr-1',
              '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#3A3B47] [&::-webkit-scrollbar-thumb]:rounded-full',
              currentLang === 'bn' ? 'font-bangla leading-loose' : 'font-sans'
            )}
            placeholder={
              currentLang === 'bn'
                ? 'এখানে আপনার স্ক্রিপ্ট টাইপ করুন...'
                : 'Type or paste your script here...'
            }
            spellCheck={false}
          />
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center justify-between px-3.5 pb-3 select-none gap-2">
        {/* Play/Pause & Reset Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsScrolling(!isScrolling)}
            title={isScrolling ? 'Pause scrolling' : 'Start scrolling'}
            aria-label={isScrolling ? 'Pause scrolling' : 'Start scrolling'}
            className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] flex items-center justify-center font-bold shadow-md hover:bg-[var(--color-brand-hover)] active:scale-95 transition-all"
          >
            {isScrolling ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <path d="M7 4.5v15c0 .8.9 1.3 1.6.9l12-7.5c.7-.4.7-1.4 0-1.8l-12-7.5c-.7-.4-1.6.1-1.6.9z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reset to top"
            aria-label="Reset to top"
            className="w-8 h-8 rounded-lg bg-[#272832] border border-[#383944] text-[#B9BAC4] hover:text-white hover:bg-[#343542] flex items-center justify-center transition-all active:scale-95"
          >
            <HugeIcon icon={RotateLeft01Icon} size={15} />
          </button>
        </div>

        {/* Speed Multiplier & Slider */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-[#B9BAC4]">
            {/* Speedometer gauge icon */}
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 14l3-3" />
              <path d="M3.34 19a10 10 0 1 1 17.32 0" />
            </svg>
            <span className="font-mono text-xs font-semibold text-[#B9BAC4] min-w-[20px]">
              {speed}x
            </span>
          </div>

          <SliderPrimitive.Root
            value={[speed]}
            onValueChange={(val) => setSpeed(val[0])}
            min={1}
            max={4}
            step={0.5}
            aria-label="Scroll speed"
            className="relative flex items-center select-none touch-none w-16 sm:w-20 h-5 cursor-pointer"
          >
            <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-[#2E303A] overflow-hidden">
              <SliderPrimitive.Range className="absolute h-full bg-[var(--color-brand-default)]" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block w-3.5 h-3.5 rounded-full bg-[var(--color-brand-default)] shadow focus:outline-none hover:scale-110 active:scale-95 transition-transform" />
          </SliderPrimitive.Root>
        </div>

        {/* Font Size & Slider */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-bold text-xs text-[#B9BAC4] select-none font-sans px-0.5">
            T
          </span>

          <SliderPrimitive.Root
            value={[fontSize]}
            onValueChange={(val) => setFontSize(val[0])}
            min={14}
            max={32}
            step={2}
            aria-label="Font size"
            className="relative flex items-center select-none touch-none w-16 sm:w-20 h-5 cursor-pointer"
          >
            <SliderPrimitive.Track className="relative h-1.5 grow rounded-full bg-[#2E303A] overflow-hidden">
              <SliderPrimitive.Range className="absolute h-full bg-[var(--color-brand-default)]" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block w-3.5 h-3.5 rounded-full bg-[var(--color-brand-default)] shadow focus:outline-none hover:scale-110 active:scale-95 transition-transform" />
          </SliderPrimitive.Root>
        </div>
      </div>
    </div>
  );
};
