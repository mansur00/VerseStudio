import React, { useState, useEffect } from 'react';
import {
  Settings01Icon,
  PreferenceHorizontalIcon,
  KeyboardIcon,
  SparklesIcon,
  CloudIcon,
  Tick01Icon,
  Alert01Icon,
  RotateLeft01Icon,
  VolumeHighIcon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons';
import {
  Modal,
  Button,
  Input,
  Tabs,
  Toggle,
  ProgressBar,
  KeyboardShortcutPill,
  StatusChip,
  HugeIcon,
} from '@verse-studio/ui';
import {
  getTranslation,
  type SupportedLanguage,
  type RecordingResolution,
  type RecordingFPS,
  type StudioShortcuts,
  type VoicePersona,
  type SubtitleMode,
} from '@verse-studio/shared';
import { useSettingsStore, type SettingsTabId } from './settingsStore';
import { useAuthStore } from '../auth/authStore';
import { useDriveStore } from '../drive/driveStore';
import { DriveService } from '../drive/driveService';

export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onThemeChange: (theme: 'dark' | 'light') => void;
  onOpenUpgrade?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  lang,
  onLanguageChange,
  onThemeChange,
  onOpenUpgrade,
}) => {
  const {
    settings,
    activeTab,
    recordingShortcutKey,
    shortcutConflict,
    updateSettings,
    setShortcut,
    resetShortcutsToDefaults,
    setActiveTab,
    setRecordingShortcutKey,
  } = useSettingsStore();

  const authStore = useAuthStore();
  const { user } = authStore;
  const { isConnected: isDriveConnected, quota, connectDrive, disconnectDrive } = useDriveStore();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [customClientId, setCustomClientId] = useState('');
  const [clientIdSaved, setClientIdSaved] = useState(false);

  useEffect(() => {
    DriveService.getClientId().then((id) => {
      if (id) setCustomClientId(id);
    });
  }, []);

  const t = getTranslation(lang);

  const shortcutLabels: Record<keyof StudioShortcuts, string> = {
    startStopRecording: t.settings.shortcuts.startStop,
    pauseResumeRecording: t.settings.shortcuts.pauseResume,
    toggleSpotlight: t.settings.shortcuts.spotlight,
    toggleLaser: t.settings.shortcuts.laser,
    toggleKeystrokes: t.settings.shortcuts.keystroke,
    togglePrivacyBlur: t.settings.shortcuts.privacy,
    toggleTeleprompter: t.settings.shortcuts.teleprompter,
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: keyof StudioShortcuts) => {
    e.preventDefault();
    if (e.key === 'Escape') {
      setRecordingShortcutKey(null);
      return;
    }

    const modifiers: string[] = [];
    if (e.altKey) modifiers.push('Alt');
    if (e.ctrlKey) modifiers.push('Ctrl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.metaKey) modifiers.push('Cmd');

    // Only record if key is a letter/number/symbol
    const mainKey = e.key.toUpperCase();
    if (['ALT', 'CONTROL', 'SHIFT', 'META'].includes(mainKey)) {
      return;
    }

    const combo = modifiers.length > 0 ? `${modifiers.join('+')}+${mainKey}` : mainKey;
    setShortcut(key, combo);
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={t.settings.title}
        description="Configure recording quality, global hotkeys, AI dubbing, and cloud storage."
        size="lg"
      >
        <div className="space-y-5 pt-1">
          {/* Settings Tabs Header */}
          <Tabs
            items={[
              { id: 'general', label: t.settings.tabs.general, icon: <HugeIcon icon={Settings01Icon} size={14} /> },
              { id: 'recording', label: t.settings.tabs.recording, icon: <HugeIcon icon={PreferenceHorizontalIcon} size={14} /> },
              { id: 'shortcuts', label: t.settings.tabs.shortcuts, icon: <HugeIcon icon={KeyboardIcon} size={14} /> },
              { id: 'voiceAi', label: t.settings.tabs.voiceAi, icon: <HugeIcon icon={SparklesIcon} size={14} /> },
              { id: 'googleDrive', label: t.settings.tabs.googleDrive, icon: <HugeIcon icon={CloudIcon} size={14} /> },
            ]}
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as SettingsTabId)}
          />

          {/* Tab 1: General (Screen 48) */}
          {activeTab === 'general' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {/* Language selection */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.general.language}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.general.languageDesc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-elevated)] p-1 rounded-lg border border-[var(--color-border-subtle)] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onLanguageChange('en');
                      updateSettings({ language: 'en' });
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      lang === 'en'
                        ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLanguageChange('bn');
                      updateSettings({ language: 'bn' });
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold font-bangla transition-all ${
                      lang === 'bn'
                        ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              {/* Theme selection */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.general.theme}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.general.themeDesc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-elevated)] p-1 rounded-lg border border-[var(--color-border-subtle)] shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onThemeChange('dark');
                      updateSettings({ theme: 'dark' });
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      settings.theme === 'dark'
                        ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {t.settings.general.dark}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onThemeChange('light');
                      updateSettings({ theme: 'light' });
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      settings.theme === 'light'
                        ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {t.settings.general.light}
                  </button>
                </div>
              </div>

              {/* Reduce motion toggle */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.general.reduceMotion}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.general.reduceMotionDesc}
                  </p>
                </div>
                <Toggle
                  checked={settings.reduceMotion}
                  onCheckedChange={(checked) => updateSettings({ reduceMotion: checked })}
                  aria-label={t.settings.general.reduceMotion}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Recording (Screen 49) */}
          {activeTab === 'recording' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {/* Quality Resolution */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      {t.settings.recording.resolution}
                    </h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] uppercase">
                      Pro 4K
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.recording.resolutionDesc}
                  </p>
                </div>
                <select
                  value={settings.resolution}
                  onChange={(e) => updateSettings({ resolution: e.target.value as RecordingResolution })}
                  className="bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand-default)]"
                >
                  <option value="4k">4K (3840 × 2160)</option>
                  <option value="1440p">1440p (2560 × 1440)</option>
                  <option value="1080p">1080p (1920 × 1080)</option>
                </select>
              </div>

              {/* Target FPS */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.recording.fps}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.recording.fpsDesc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-elevated)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
                  {([60, 30] as RecordingFPS[]).map((fpsVal) => (
                    <button
                      key={fpsVal}
                      type="button"
                      onClick={() => updateSettings({ fps: fpsVal })}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        settings.fps === fpsVal
                          ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {fpsVal} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Format Container */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.recording.format}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.recording.formatDesc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--color-bg-elevated)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
                  {(['webm', 'mp4'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => updateSettings({ videoFormat: fmt })}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase transition-all ${
                        settings.videoFormat === fmt
                          ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Bitrate */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.recording.audioBitrate}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.recording.audioBitrateDesc}
                  </p>
                </div>
                <select
                  value={settings.audioBitrateKbps}
                  onChange={(e) => updateSettings({ audioBitrateKbps: Number(e.target.value) })}
                  className="bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand-default)]"
                >
                  <option value={320}>320 kbps (Studio)</option>
                  <option value={192}>192 kbps (Standard)</option>
                  <option value={128}>128 kbps (Compact)</option>
                </select>
              </div>

              {/* Safe disk chunking */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.recording.safeChunking}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.recording.safeChunkingDesc}
                  </p>
                </div>
                <StatusChip status="active" label="IndexedDB 5s" />
              </div>
            </div>
          )}

          {/* Tab 3: Shortcuts (Screen 50) */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t.settings.shortcuts.desc}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<HugeIcon icon={RotateLeft01Icon} size={14} />}
                  onClick={resetShortcutsToDefaults}
                >
                  {t.settings.shortcuts.resetDefaults}
                </Button>
              </div>

              {/* Conflict warning */}
              {shortcutConflict && (
                <div className="p-3 rounded-xl border border-[var(--color-warning-default)]/40 bg-[var(--color-warning-subtle)] flex items-center gap-2.5 text-xs text-[var(--color-warning-default)]">
                  <HugeIcon icon={Alert01Icon} size={16} className="shrink-0" />
                  <span>{shortcutConflict}</span>
                </div>
              )}

              {/* Shortcut bindings list */}
              <div className="divide-y divide-[var(--color-border-subtle)] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden">
                {(Object.keys(settings.shortcuts) as Array<keyof StudioShortcuts>).map((key) => {
                  const isRecording = recordingShortcutKey === key;
                  const currentBinding = settings.shortcuts[key];

                  return (
                    <div
                      key={key}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                      <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {shortcutLabels[key]}
                      </span>

                      <div>
                        {isRecording ? (
                          <input
                            autoFocus
                            placeholder={t.settings.shortcuts.pressKey}
                            onKeyDown={(e) => handleKeyDown(e, key)}
                            onBlur={() => setRecordingShortcutKey(null)}
                            className="text-xs font-mono px-3 py-1.5 rounded-md border border-[var(--color-brand-default)] bg-[var(--color-bg-elevated)] text-[var(--color-brand-default)] animate-pulse focus:outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRecordingShortcutKey(key)}
                            className="group flex items-center gap-1.5 focus:outline-none"
                            title="Click to rebind hotkey"
                          >
                            <KeyboardShortcutPill
                              keys={currentBinding.split('+')}
                              size="sm"
                              className="group-hover:border-[var(--color-brand-default)] transition-colors cursor-pointer"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Voice & AI (Screen 51) */}
          {activeTab === 'voiceAi' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {/* Persona selector */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <HugeIcon icon={VolumeHighIcon} size={16} className="text-[var(--color-brand-default)]" />
                    <span>{t.settings.voiceAi.persona}</span>
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.voiceAi.personaDesc}
                  </p>
                </div>
                <select
                  value={settings.aiVoicePersona}
                  onChange={(e) => updateSettings({ aiVoicePersona: e.target.value as VoicePersona })}
                  className="bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand-default)]"
                >
                  <option value="natural-female">Aria • Natural Female (US)</option>
                  <option value="studio-male">Guy • Studio Male (UK)</option>
                  <option value="warm-narrator">Christopher • Warm Narrator</option>
                </select>
              </div>

              {/* Subtitle mode default */}
              <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.settings.voiceAi.subtitles}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {t.settings.voiceAi.subtitlesDesc}
                  </p>
                </div>
                <select
                  value={settings.aiDefaultSubtitles}
                  onChange={(e) => updateSettings({ aiDefaultSubtitles: e.target.value as SubtitleMode })}
                  className="bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--color-brand-default)]"
                >
                  <option value="bilingual">Bilingual (Bangla + English)</option>
                  <option value="english-only">English Only</option>
                  <option value="off">Off by Default</option>
                </select>
              </div>

              {/* Monthly AI Quota */}
              <div className="p-4 rounded-xl border border-[var(--color-brand-default)]/40 bg-[var(--color-bg-elevated)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                      <HugeIcon icon={SparklesIcon} size={16} className="text-[var(--color-brand-default)]" />
                      <span>{t.settings.voiceAi.quotaTitle}</span>
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {t.settings.voiceAi.quotaDesc}
                    </p>
                  </div>
                  <StatusChip status="pro" label={user?.plan === 'pro' ? 'Pro 300 Min' : 'Free 30 Min'} />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[var(--color-text-secondary)]">Minutes Used</span>
                    <span className="font-mono text-[var(--color-text-primary)]">
                      {user?.aiMinutesUsed || 5} / {user?.aiMinutesLimit || 30} mins
                    </span>
                  </div>
                  <ProgressBar
                    value={((user?.aiMinutesUsed || 5) / (user?.aiMinutesLimit || 30)) * 100}
                    variant="brand"
                  />
                </div>

                {user?.plan !== 'pro' && onOpenUpgrade && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full mt-2"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenUpgrade();
                    }}
                  >
                    {t.settings.voiceAi.upgradeToPro}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Tab 5: Google Drive (Screens 52–55) */}
          {activeTab === 'googleDrive' && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {isDriveConnected ? (
                /* Connected State (Screen 52) */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-[var(--color-brand-default)] bg-[var(--color-bg-surface)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]">
                          <HugeIcon icon={CloudIcon} size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                            {user?.googleDriveEmail || user?.email || 'drive.user@gmail.com'}
                          </h4>
                          <span className="text-xs text-[var(--color-brand-default)] font-medium flex items-center gap-1 mt-0.5">
                            <HugeIcon icon={Tick01Icon} size={14} />
                            <span>{t.settings.drive.connectedStatus}</span>
                          </span>
                        </div>
                      </div>
                      <StatusChip status="shared" label="drive.file Scope" />
                    </div>

                    {/* Storage Quota */}
                    <div className="pt-2 border-t border-[var(--color-border-subtle)] space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[var(--color-text-secondary)]">
                          {t.settings.drive.quotaUsed}
                        </span>
                        <span className="font-mono text-[var(--color-text-primary)]">
                          {quota
                            ? `${(quota.usageBytes / (1024 * 1024 * 1024)).toFixed(1)} GB of ${(
                                quota.limitBytes /
                                (1024 * 1024 * 1024)
                              ).toFixed(0)} GB`
                            : '1.2 GB of 15 GB'}
                        </span>
                      </div>
                      <ProgressBar
                        value={
                          quota
                            ? (quota.usageBytes / quota.limitBytes) * 100
                            : 8
                        }
                        variant="brand"
                      />
                    </div>
                  </div>

                  {/* Auto-Save Toggle */}
                  <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                        {t.settings.drive.autoSave}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {t.settings.drive.autoSaveDesc}
                      </p>
                    </div>
                    <Toggle
                      checked={settings.enableAutoSaveDrive}
                      onCheckedChange={(checked) => updateSettings({ enableAutoSaveDrive: checked })}
                      aria-label={t.settings.drive.autoSave}
                    />
                  </div>

                  {/* Google OAuth Client Configuration (Custom or Default) */}
                  <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                        Google Cloud OAuth Client ID
                      </h4>
                      <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                        drive.file scope
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-secondary)]">
                      Configure your Google Cloud Project OAuth Client ID to authenticate directly or use VerseStudio managed authentication.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        value={customClientId}
                        onChange={(e) => setCustomClientId(e.target.value)}
                        placeholder="e.g. 123456789-abc.apps.googleusercontent.com"
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          DriveService.setClientId(customClientId.trim());
                          setClientIdSaved(true);
                          setTimeout(() => setClientIdSaved(false), 2000);
                        }}
                      >
                        {clientIdSaved ? 'Saved!' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  {/* Disconnect trigger */}
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                        Unlink Cloud Storage
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Your files in Drive will remain completely untouched.
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowDisconnectConfirm(true)}
                    >
                      {t.settings.drive.disconnect}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Disconnected State (Screen 53) */
                <div className="p-6 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto text-[var(--color-brand-default)]">
                    <HugeIcon icon={CloudIcon} size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                      Connect Your Google Drive
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto mt-1">
                      Store massive 4K recordings directly in your private Drive folder without local storage limits.
                    </p>
                  </div>

                  {/* Optional Custom Google OAuth Client ID before connecting */}
                  <div className="p-3.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] text-left space-y-1.5 max-w-md mx-auto">
                    <label className="text-[11px] font-bold text-[var(--color-text-primary)] block">
                      Google OAuth Client ID (Optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={customClientId}
                        onChange={(e) => setCustomClientId(e.target.value)}
                        placeholder="Google Cloud Web Client ID"
                        className="text-xs font-mono"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          DriveService.setClientId(customClientId.trim());
                          setClientIdSaved(true);
                          setTimeout(() => setClientIdSaved(false), 2000);
                        }}
                      >
                        {clientIdSaved ? 'Saved' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    leadingIcon={<HugeIcon icon={ArrowUpRight01Icon} size={16} />}
                    onClick={async () => {
                      const success = await connectDrive();
                      if (success) {
                        await authStore.setDriveConnected(true);
                      }
                    }}
                  >
                    {t.settings.drive.connect}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end pt-3 border-t border-[var(--color-border-subtle)]">
            <Button variant="primary" size="sm" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Screen 55: Disconnect Confirm Modal */}
      <Modal
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
        title={t.settings.drive.disconnectTitle}
        description={t.settings.drive.disconnectDesc}
        size="sm"
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowDisconnectConfirm(false)}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await disconnectDrive();
              await authStore.setDriveConnected(false);
              setShowDisconnectConfirm(false);
            }}
          >
            {t.settings.drive.disconnect}
          </Button>
        </div>
      </Modal>
    </>
  );
};
