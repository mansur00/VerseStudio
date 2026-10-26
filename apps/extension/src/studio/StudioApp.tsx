import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Toggle,
  StatusChip,
  RecordButton,
  Modal,
} from '@verse-studio/ui';
import { getTranslation, type SupportedLanguage, type RecordingLayout } from '@verse-studio/shared';
import {
  Monitor,
  Layout,
  Camera,
  Settings,
  Folder,
  Sun,
  Moon,
  Layers,
  Crosshair,
  KeyRound,
  EyeOff,
  ZoomIn,
  FileText,
  Volume2,
} from 'lucide-react';

export const StudioApp: React.FC = () => {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'settings'>('studio');
  const [layout, setLayout] = useState<RecordingLayout>('screen-camera');
  const [isRecording, setIsRecording] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Active Live Tools
  const [tools, setTools] = useState({
    laser: false,
    spotlight: false,
    keystroke: true,
    privacy: false,
    autoZoom: true,
    teleprompter: false,
  });

  const t = getTranslation(lang);

  // Sync theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const toggleTool = (toolKey: keyof typeof tools) => {
    setTools((prev) => ({ ...prev, [toolKey]: !prev[toolKey] }));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col">
      {/* Studio Top Navigation Bar */}
      <header className="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)]">
              <span className="font-extrabold text-[var(--color-text-on-brand)] text-base">V</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                {t.common.appName}
              </h1>
              <div className="flex items-center gap-2">
                <StatusChip
                  status={isRecording ? 'recording' : 'active'}
                  label={isRecording ? t.recording.recording : 'Studio Ready'}
                />
                <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                  4K 60FPS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Navigation */}
        <nav className="flex items-center gap-1 bg-[var(--color-bg-hover)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {t.library.title}
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                lang === 'en'
                  ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('bn')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all font-bangla ${
                lang === 'bn'
                  ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              বাং
            </button>
          </div>

          {/* Theme Switcher */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Toggle theme"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>

          {/* Settings Trigger */}
          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </IconButton>
        </div>
      </header>

      {/* Main Studio Viewport */}
      {activeTab === 'studio' ? (
        <main className="flex-1 flex flex-col items-center justify-between p-8 max-w-6xl mx-auto w-full">
          {/* Layout & Source Selector Bar */}
          <div className="flex items-center justify-between w-full bg-[var(--color-bg-surface)] p-3 rounded-xl border border-[var(--color-border-default)] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider px-2">
                {t.setup.layout}:
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant={layout === 'screen-only' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLayout('screen-only')}
                  leadingIcon={<Monitor className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutScreenOnly}
                </Button>
                <Button
                  variant={layout === 'screen-camera' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLayout('screen-camera')}
                  leadingIcon={<Layers className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutScreenCamera}
                </Button>
                <Button
                  variant={layout === 'split-50-50' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLayout('split-50-50')}
                  leadingIcon={<Layout className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutSplit}
                </Button>
                <Button
                  variant={layout === 'camera-only' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setLayout('camera-only')}
                  leadingIcon={<Camera className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutCameraOnly}
                </Button>
              </div>
            </div>

            {/* Live Tool Toggles */}
            <div className="flex items-center gap-2 border-l border-[var(--color-border-subtle)] pl-4">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                Tools:
              </span>
              <IconButton
                variant={tools.laser ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t.recording.tools.laser}
                title={t.recording.tools.laser}
                onClick={() => toggleTool('laser')}
              >
                <Crosshair className="w-4 h-4" />
              </IconButton>
              <IconButton
                variant={tools.keystroke ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t.recording.tools.keystroke}
                title={t.recording.tools.keystroke}
                onClick={() => toggleTool('keystroke')}
              >
                <KeyRound className="w-4 h-4" />
              </IconButton>
              <IconButton
                variant={tools.privacy ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t.recording.tools.privacy}
                title={t.recording.tools.privacy}
                onClick={() => toggleTool('privacy')}
              >
                <EyeOff className="w-4 h-4" />
              </IconButton>
              <IconButton
                variant={tools.autoZoom ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t.recording.tools.autoZoom}
                title={t.recording.tools.autoZoom}
                onClick={() => toggleTool('autoZoom')}
              >
                <ZoomIn className="w-4 h-4" />
              </IconButton>
              <IconButton
                variant={tools.teleprompter ? 'primary' : 'ghost'}
                size="sm"
                aria-label={t.recording.tools.teleprompter}
                title={t.recording.tools.teleprompter}
                onClick={() => toggleTool('teleprompter')}
              >
                <FileText className="w-4 h-4" />
              </IconButton>
            </div>
          </div>

          {/* Studio Preview Stage Canvas */}
          <div className="relative w-full aspect-video max-h-[560px] my-6 rounded-2xl overflow-hidden bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xl flex items-center justify-center">
            {/* Mock Screen Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E2028] to-[#121316] flex flex-col items-center justify-center p-8 text-center">
              <Monitor className="w-16 h-16 text-[var(--color-text-tertiary)] mb-3 opacity-40 animate-pulse" />
              <h2 className="text-xl font-semibold text-[var(--color-text-secondary)]">
                {t.setup.selectSource}
              </h2>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1 max-w-md">
                Click Record below to choose your screen, window or tab. Studio supports up to 4K 60FPS.
              </p>
            </div>

            {/* Draggable Camera Bubble Preview */}
            {(layout === 'screen-camera' || layout === 'camera-only') && cameraEnabled && (
              <div
                className={`absolute z-10 transition-all ${
                  layout === 'camera-only'
                    ? 'inset-0 w-full h-full rounded-none'
                    : 'bottom-6 right-6 w-44 h-44 rounded-full border-4 border-[var(--color-brand-default)] shadow-2xl overflow-hidden'
                } bg-[var(--color-bg-elevated)] flex flex-col items-center justify-center`}
              >
                <Camera className="w-8 h-8 text-[var(--color-brand-default)] mb-1" />
                <span className="text-xs text-[var(--color-text-secondary)]">Face Camera</span>
              </div>
            )}

            {/* Active Live Tools Overlay Indicator */}
            {tools.laser && (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[var(--color-accent-laser)]/20 border border-[var(--color-accent-laser)] text-[var(--color-accent-laser)] px-3 py-1 rounded-full text-xs font-semibold">
                <Crosshair className="w-3.5 h-3.5" />
                Laser Tool Active
              </div>
            )}
          </div>

          {/* Studio Bottom Recording Controls Bar */}
          <div className="w-full bg-[var(--color-bg-surface)] p-4 rounded-2xl border border-[var(--color-border-default)] shadow-lg flex items-center justify-between">
            {/* Media Toggles & Mic Level */}
            <div className="flex items-center gap-6">
              <Toggle
                label={t.setup.mic}
                checked={micEnabled}
                onCheckedChange={setMicEnabled}
              />
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                <div className="w-24 h-2 rounded-full bg-[var(--color-bg-hover)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-brand-default)] transition-all duration-75"
                    style={{ width: micEnabled ? '65%' : '0%' }}
                  />
                </div>
              </div>

              <div className="h-6 w-[1px] bg-[var(--color-border-subtle)]" />

              <Toggle
                label={t.setup.camera}
                checked={cameraEnabled}
                onCheckedChange={setCameraEnabled}
              />
            </div>

            {/* Central Record Button */}
            <div className="flex items-center gap-4">
              <RecordButton
                status={isRecording ? 'recording' : 'idle'}
                onClick={() => setIsRecording(!isRecording)}
              />
              <div className="text-left">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {isRecording ? t.recording.stop : t.setup.startRecording}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {isRecording ? '00:04:12 • 4K 60FPS' : 'Alt + R to start'}
                </p>
              </div>
            </div>

            {/* Google Drive Status & Cloud Indicator */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-[var(--color-text-primary)]">
                  {t.common.driveConnected}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  Saving directly to Drive
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/30 flex items-center justify-center">
                <Folder className="w-4 h-4 text-[var(--color-brand-default)]" />
              </div>
            </div>
          </div>
        </main>
      ) : activeTab === 'library' ? (
        /* Library View */
        <main className="flex-1 max-w-5xl mx-auto w-full p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">{t.library.title}</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Your recordings stored safely in your Google Drive
              </p>
            </div>
          </div>

          <div className="text-center py-20 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-12">
            <Folder className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t.library.emptyTitle}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md mx-auto">
              {t.library.emptySubtitle}
            </p>
            <Button
              variant="primary"
              className="mt-6"
              onClick={() => setActiveTab('studio')}
            >
              Start Your First Recording
            </Button>
          </div>
        </main>
      ) : null}

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title={t.settings.title}
        confirmText={t.common.done}
        onConfirm={() => setSettingsOpen(false)}
      >
        <div className="space-y-5 text-left">
          <Toggle
            label={t.settings.reduceMotion}
            description="Disable spring animations and camera morphs"
            checked={false}
            onCheckedChange={() => {}}
          />
          <div className="h-[1px] bg-[var(--color-border-subtle)]" />
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-1.5">
              Recording Quality Preset
            </label>
            <div className="flex gap-2">
              <Button variant="primary" size="sm">4K Ultra HD (60 FPS)</Button>
              <Button variant="secondary" size="sm">1440p (60 FPS)</Button>
              <Button variant="secondary" size="sm">1080p (30 FPS)</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
