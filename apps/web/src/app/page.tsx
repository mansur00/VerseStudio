import { Button, HugeIcon } from '@verse-studio/ui';
import {
  ComputerIcon,
  CloudIcon,
  SparklesIcon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Header */}
      <header className="h-16 border-b border-[var(--color-border-subtle)] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)]">
            <span className="font-extrabold text-[var(--color-text-on-brand)] text-base">V</span>
          </div>
          <span className="font-bold text-lg text-[var(--color-text-primary)]">
            VerseStudio <span className="text-[var(--color-brand-default)]">4K Pro</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/admin">
            <Button variant="ghost" size="sm">Admin Portal</Button>
          </a>
          <Button variant="primary" size="sm">Install Chrome Extension</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/30 text-[var(--color-brand-default)] text-xs font-semibold mb-8">
          <HugeIcon icon={SparklesIcon} size={14} />
          Next-Gen 4K 60FPS Screen Recording Studio
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[var(--color-text-primary)] max-w-3xl leading-tight">
          Record in 4K. Dub in English AI. Save to your own <span className="text-[var(--color-brand-default)]">Google Drive</span>.
        </h1>

        <p className="text-lg text-[var(--color-text-secondary)] mt-6 max-w-2xl leading-relaxed">
          High-performance Manifest V3 screen recording studio with live tools, round camera bubble, auto-zoom, and automated Bangla-to-English AI voice & subtitles.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Button size="lg" variant="primary">
            Get Started Free
          </Button>
          <Button size="lg" variant="secondary">
            View Live Demo
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left w-full">
          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
            <HugeIcon icon={ComputerIcon} size={32} className="text-[var(--color-brand-default)] mb-4" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">4K 60FPS Studio</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Fluid 60FPS capture with spring layout morphing, draggable face bubble, and live presentation tools.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
            <HugeIcon icon={SparklesIcon} size={32} className="text-[var(--color-brand-default)] mb-4" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Bilingual AI Dubbing</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Live Bangla-to-English subtitles and 1-click English neural voice dubbing or 20/80 background mix.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
            <HugeIcon icon={CloudIcon} size={32} className="text-[var(--color-brand-default)] mb-4" />
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">Zero Storage Lock-in</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              Resumable chunked upload straight to your personal Google Drive with instant shareable links.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-subtle)] py-8 px-8 text-center text-xs text-[var(--color-text-tertiary)] flex justify-between items-center">
        <span>© 2026 VerseStudio 4K Pro. All rights reserved.</span>
        <div className="flex items-center gap-2">
          <HugeIcon icon={Shield01Icon} size={16} className="text-[var(--color-success-default)]" />
          <span>WCAG 2.2 AA Accessible • Google Drive File Scope Verified</span>
        </div>
      </footer>
    </div>
  );
}
