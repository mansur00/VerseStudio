'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowUpRight01Icon,
  Share01Icon,
  Download01Icon,
  File01Icon,
  SubtitleIcon,
  Tick01Icon,
  Alert01Icon,
  PlayIcon,
  PauseIcon,
  VolumeHighIcon,
  VolumeOffIcon,
  Maximize01Icon,
  ViewIcon,
  Calendar01Icon,
  LockIcon,
  ArrowLeft01Icon,
  SparklesIcon,
  HelpCircleIcon,
  HardDriveIcon,
} from '@hugeicons/core-free-icons';
import { Button, StatusChip, HugeIcon } from '@verse-studio/ui';
import { SharedRecordingData } from '@verse-studio/shared';
import { MOCK_SHARED_RECORDINGS } from '../../../data/mockSharedRecordings';

export default function SharedWatchPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : 'demo-recording';

  const [recording, setRecording] = useState<SharedRecordingData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  useEffect(() => {
    // Check mock database or generate fallback metadata
    if (MOCK_SHARED_RECORDINGS[id]) {
      setRecording(MOCK_SHARED_RECORDINGS[id]);
    } else {
      // Dynamic fallback for any recording ID
      setRecording({
        id,
        title: `Recording ${id.slice(0, 12)}`,
        driveFileId: id,
        driveEmbedUrl: '',
        driveViewUrl: `https://drive.google.com/file/d/${id}/view`,
        durationSeconds: 180,
        resolution: '4k',
        fps: 60,
        authorName: 'VerseStudio Creator',
        createdAt: new Date().toISOString(),
        viewsCount: 1,
        guideMarkdown: '# Step-by-Step Guide\n\nRecorded with VerseStudio 4K Pro.',
      });
    }
  }, [id]);

  if (!recording) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-canvas)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-default)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Screen 47: Link Unavailable / Blocked / Removed State
  if (recording.isBlocked || recording.isPrivate) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col justify-between p-6 sm:p-12">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center font-black text-black text-base shadow-[var(--glow-brand)]">
              V
            </div>
            <span className="font-bold text-lg tracking-tight group-hover:text-[var(--color-brand-default)] transition-colors">
              VerseStudio <span className="text-[var(--color-brand-default)] text-xs font-mono font-normal">4K Pro</span>
            </span>
          </Link>
        </header>

        <main className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)]/30 text-[var(--color-error-default)] flex items-center justify-center mx-auto mb-6 shadow-lg">
            {recording.isBlocked ? (
              <HugeIcon icon={Alert01Icon} size={32} />
            ) : (
              <HugeIcon icon={LockIcon} size={32} />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            {recording.isBlocked ? 'Recording Blocked by Moderation' : 'Recording Is Private'}
          </h1>

          <p className="text-sm text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            {recording.isBlocked
              ? 'This recording has been removed or restricted due to a moderation review or community guideline report.'
              : 'This recording is set to private by the author or access permissions have been modified in Google Drive.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <HugeIcon icon={ArrowLeft01Icon} size={16} />
                Return to VerseStudio
              </Button>
            </Link>
            <Link href="https://support.google.com/drive" target="_blank" className="w-full sm:w-auto">
              <Button variant="ghost" className="w-full flex items-center justify-center gap-2">
                <HugeIcon icon={HelpCircleIcon} size={16} />
                Help Center
              </Button>
            </Link>
          </div>
        </main>

        <footer className="text-center text-xs text-[var(--color-text-tertiary)] py-4">
          VerseStudio 4K Pro • Cloud Screen Recording with Google Drive Storage
        </footer>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadGuide = () => {
    if (!recording.guideMarkdown) return;
    const blob = new Blob([recording.guideMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/\s+/g, '_')}_guide.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSrt = () => {
    if (!recording.subtitlesVtt) return;
    const blob = new Blob([recording.subtitlesVtt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.title.replace(/\s+/g, '_')}_captions.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center font-black text-black text-base shadow-[var(--glow-brand)]">
              V
            </div>
            <span className="font-bold text-base tracking-tight hidden sm:inline">
              VerseStudio <span className="text-[var(--color-brand-default)] text-xs font-mono font-normal">4K Pro</span>
            </span>
          </Link>

          {/* Hosted on Google Drive Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-xs font-medium text-[var(--color-text-secondary)]">
            <HugeIcon icon={HardDriveIcon} size={14} className="text-blue-400" />
            <span>Hosted on Google Drive</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            {language === 'en' ? 'বাংলা (BN)' : 'English (EN)'}
          </button>

          {/* Copy Share Link */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5"
          >
            {copiedLink ? <HugeIcon icon={Tick01Icon} size={16} className="text-[var(--color-brand-default)]" /> : <HugeIcon icon={Share01Icon} size={16} />}
            <span className="hidden sm:inline">{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </Button>

          {/* Open in Google Drive */}
          <a
            href={recording.driveViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button
              variant="secondary"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <HugeIcon icon={ArrowUpRight01Icon} size={16} />
              <span>Open in Drive</span>
            </Button>
          </a>
        </div>
      </header>

      {/* Main Studio Player Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Video Player & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Container */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-[var(--color-border-default)] shadow-2xl group flex items-center justify-center">
            {recording.driveEmbedUrl ? (
              <iframe
                src={recording.driveEmbedUrl}
                title={recording.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-[var(--color-bg-canvas)]">
                {/* 4K Visual Canvas Mock */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#1B1C21] via-[#222329] to-[#292A31] flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-20 h-20 rounded-full bg-[var(--color-brand-default)]/10 border border-[var(--color-brand-default)]/30 text-[var(--color-brand-default)] flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <HugeIcon icon={PauseIcon} size={32} /> : <HugeIcon icon={PlayIcon} size={32} className="translate-x-0.5" />}
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                      {isPlaying ? 'Streaming from Google Drive (4K 60FPS)' : 'Click to stream 4K recording'}
                    </p>
                  </div>
                </div>

                {/* Subtitle Overlay if enabled */}
                {ccEnabled && (
                  <div className="absolute bottom-16 left-6 right-6 text-center pointer-events-none z-20">
                    <div className="inline-block px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 shadow-xl max-w-2xl text-left">
                      <p className="text-sm text-[var(--color-brand-default)] font-semibold font-['Hind_Siliguri',sans-serif]">
                        আজকে আমরা দেখব কিভাবে ক্লাউডে ৪কে ভিডিও স্ট্রিম ডিপ্লয় করতে হয়।
                      </p>
                      <p className="text-xs text-white/90 font-medium mt-0.5">
                        Today we will see how to deploy 4K video streaming to cloud infrastructure.
                      </p>
                    </div>
                  </div>
                )}

                {/* Player Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-center justify-between gap-4 z-20">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-1.5 rounded-lg text-white hover:text-[var(--color-brand-default)] transition-colors"
                      aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <HugeIcon icon={PauseIcon} size={20} /> : <HugeIcon icon={PlayIcon} size={20} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 rounded-lg text-white hover:text-[var(--color-brand-default)] transition-colors"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <HugeIcon icon={VolumeOffIcon} size={20} /> : <HugeIcon icon={VolumeHighIcon} size={20} />}
                    </button>

                    <span className="text-xs font-mono text-white/80">
                      {formatDuration(currentTime)} / {formatDuration(recording.durationSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* CC Subtitles Toggle */}
                    <button
                      type="button"
                      onClick={() => setCcEnabled(!ccEnabled)}
                      className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                        ccEnabled
                          ? 'bg-[var(--color-brand-default)] text-black shadow-sm'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      title="Toggle Bangla-to-English Subtitles"
                    >
                      CC
                    </button>

                    {/* Fullscreen Button */}
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-white hover:text-[var(--color-brand-default)] transition-colors"
                      aria-label="Fullscreen"
                    >
                      <HugeIcon icon={Maximize01Icon} size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recording Metadata Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                  {recording.title}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <HugeIcon icon={Calendar01Icon} size={14} />
                    <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HugeIcon icon={ViewIcon} size={14} />
                    <span>{recording.viewsCount.toLocaleString()} views</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-mono font-semibold border border-[var(--color-brand-default)]/30">
                    {recording.resolution.toUpperCase()} {recording.fps}FPS
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadSrt}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <HugeIcon icon={SubtitleIcon} size={14} className="text-[var(--color-brand-default)]" />
                  <span>.SRT Subtitles</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadGuide}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <HugeIcon icon={Download01Icon} size={14} />
                  <span>Tutorial .MD</span>
                </Button>
              </div>
            </div>

            {/* Author Profile Card */}
            <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-brand-default)] text-black font-bold flex items-center justify-center text-sm">
                  {recording.authorName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {recording.authorName}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Recorded with VerseStudio 4K Pro Studio Tab
                  </p>
                </div>
              </div>

              <StatusChip status="pro" label="PRO CREATOR" size="sm" />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Step-by-Step AI Guide Viewer */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-4">
              <div className="flex items-center gap-2">
                <HugeIcon icon={File01Icon} size={16} className="text-[var(--color-brand-default)]" />
                <h2 className="text-sm font-bold tracking-tight">Step-by-Step AI Guide</h2>
              </div>
              <button
                type="button"
                onClick={handleDownloadGuide}
                className="text-xs font-semibold text-[var(--color-brand-default)] hover:underline flex items-center gap-1"
              >
                <HugeIcon icon={Download01Icon} size={14} />
                Download
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[560px] pr-2 space-y-4 text-xs leading-relaxed text-[var(--color-text-secondary)] font-sans">
              <div className="p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] mb-3">
                <div className="flex items-center gap-2 text-[var(--color-brand-default)] font-semibold mb-1">
                  <HugeIcon icon={SparklesIcon} size={14} />
                  <span>Automated AI Compilation</span>
                </div>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  Generated in real-time from mouse clicks, keyboard triggers, and Bangla-to-English speech transcript.
                </p>
              </div>

              <div className="prose prose-invert prose-xs max-w-none">
                <pre className="p-3 rounded-lg bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] font-mono text-[11px] text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {recording.guideMarkdown}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-4 px-6 text-center text-xs text-[var(--color-text-tertiary)] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© 2026 VerseStudio 4K Pro. All recordings stored directly on user-owned Google Drive.</span>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:text-[var(--color-text-primary)] transition-colors">
            Admin Portal
          </Link>
          <Link href="https://support.google.com/drive" target="_blank" className="hover:text-[var(--color-text-primary)] transition-colors">
            Drive Privacy
          </Link>
        </div>
      </footer>
    </div>
  );
}
