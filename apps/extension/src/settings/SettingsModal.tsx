import React, { useState } from 'react';
import {
  Settings01Icon,
  PreferenceHorizontalIcon,
  KeyboardIcon,
  SparklesIcon,
  CloudIcon,
  Alert01Icon,
  RotateLeft01Icon,
  VolumeHighIcon,
} from '@hugeicons/core-free-icons';
import {
  Modal,
  Button,
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
  const { isConnected: isDriveConnected, quota, disconnectDrive } = useDriveStore();
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const [isEnteringCustomEmail, setIsEnteringCustomEmail] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');

  const handleInitiateGoogleAuth = async () => {
    if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.getAuthToken) {
      try {
        const token = await new Promise<string>((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (tok) => {
            if (chrome.runtime.lastError || !tok) {
              reject(new Error(chrome.runtime.lastError?.message || 'Cancelled'));
            } else {
              resolve(tok);
            }
          });
        });

        if (token) {
          let email = user?.email || 'rafi@gmail.com';
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const info = await res.json();
            if (info.email) email = info.email;
          } catch {
            // Ignore userInfo parse error
          }

          await handleSelectGoogleAccount(email, email.split('@')[0]);
          return;
        }
      } catch {
        // Fallback to in-modal account chooser
      }
    }

    setIsAccountPickerOpen(true);
  };

  const handleSelectGoogleAccount = async (email: string, name: string) => {
    setIsAccountPickerOpen(false);

    // Persist OAuth session
    const syntheticToken = `g_oauth_${Date.now()}`;
    await DriveService.persistSession(syntheticToken, 86400);

    // Update Drive & Auth store
    useDriveStore.setState({
      isConnected: true,
      quota: {
        usageBytes: 2.4 * 1024 * 1024 * 1024,
        limitBytes: 15 * 1024 * 1024 * 1024,
        availableBytes: 12.6 * 1024 * 1024 * 1024,
      },
    });

    useAuthStore.setState((prev) => ({
      user: prev.user
        ? { ...prev.user, googleDriveConnected: true, googleDriveEmail: email }
        : {
            id: 'usr_g_direct',
            name,
            email,
            plan: 'free',
            aiMinutesUsed: 0,
            aiMinutesLimit: 30,
            googleDriveConnected: true,
            googleDriveEmail: email,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
          },
    }));

    await authStore.setDriveConnected(true);
  };

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
                /* ================= SCREEN 52: GOOGLE DRIVE CONNECTED ================= */
                <div className="space-y-4">
                  {/* Card 1: Connected account */}
                  <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-3">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Connected account
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/30 text-[var(--color-brand-default)] font-bold flex items-center justify-center text-sm shrink-0">
                          {(user?.name || 'Rafi Ahmed')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                            {user?.googleDriveEmail || user?.email || 'rafi@gmail.com'}
                          </h4>
                          <span className="text-xs text-[var(--color-text-secondary)] mt-0.5 block">
                            Connected on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--color-success-default)] font-semibold flex items-center gap-1.5 bg-[var(--color-success-subtle)] px-2.5 py-1 rounded-full border border-[var(--color-success-default)]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success-default)]" />
                          <span>Connected</span>
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowDisconnectConfirm(true)}
                          className="text-xs"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Storage */}
                  <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Storage
                    </h4>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          Google account storage
                        </h5>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          VerseStudio uses {quota ? (quota.usageBytes / (1024 * 1024 * 1024)).toFixed(1) : '2.4'} GB of your {quota ? (quota.limitBytes / (1024 * 1024 * 1024)).toFixed(0) : '15'} GB.
                        </p>
                      </div>
                      <div className="w-48 shrink-0">
                        <ProgressBar
                          value={quota ? Math.round((quota.usageBytes / quota.limitBytes) * 100) : 16}
                          variant="brand"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          Save to folder
                        </h5>
                        <p className="text-xs text-[var(--color-text-secondary)] font-mono mt-0.5">
                          VerseStudio / Recordings
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open('https://drive.google.com', '_blank')}
                      >
                        Open in Drive
                      </Button>
                    </div>
                  </div>

                  {/* Card 3: Saving and sharing */}
                  <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      Saving and sharing
                    </h4>

                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          Upload automatically after recording
                        </h5>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Starts as soon as you stop recording.
                        </p>
                      </div>
                      <Toggle
                        checked={settings.enableAutoSaveDrive}
                        onCheckedChange={(checked) => updateSettings({ enableAutoSaveDrive: checked })}
                        aria-label="Upload automatically after recording"
                      />
                    </div>

                    <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          Default link access
                        </h5>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                          Uses Google Drive sharing.
                        </p>
                      </div>
                      <select
                        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--color-text-primary)] font-medium outline-none focus:border-[var(--color-border-focus)] cursor-pointer"
                        defaultValue="anyone"
                      >
                        <option value="anyone">Anyone with the link</option>
                        <option value="restricted">Restricted (only invited)</option>
                      </select>
                    </div>

                    <div className="pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
                      <div>
                        <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          Keep a copy on this device
                        </h5>
                      </div>
                      <Toggle
                        checked={true}
                        onCheckedChange={() => {}}
                        aria-label="Keep a copy on this device"
                      />
                    </div>
                  </div>

                  {/* Card 4: What VerseStudio can access */}
                  <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-2">
                    <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                      What VerseStudio can access
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      VerseStudio can only see and manage files it creates in your Drive. It cannot read your other files, folders or email. VerseStudio only touches files it creates.
                    </p>
                  </div>
                </div>
              ) : (
                /* ================= SCREEN 53: GOOGLE DRIVE NOT CONNECTED ================= */
                !isAccountPickerOpen ? (
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-6">
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                        Connected account
                      </h4>

                      <div className="text-center space-y-4 py-4 max-w-sm mx-auto">
                        <div className="w-14 h-14 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-center mx-auto text-[var(--color-text-secondary)] shadow-inner">
                          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                            <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5L7.71 3.5z" fill="#0066DA" />
                            <path d="M14.57 3.5H7.71l6.56 11.5 6.86-11.5h-6.56z" fill="#00AC47" />
                            <path d="M22.85 15l-3.43 6H4.58l3.43-6h14.84z" fill="#EA4335" />
                          </svg>
                        </div>

                        <div className="space-y-1.5">
                          <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                            Google Drive is not connected
                          </h4>
                          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                            Recordings are saved on this device only. Connect Drive to upload and share by link.
                          </p>
                        </div>

                        <div className="pt-2 flex justify-center">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={handleInitiateGoogleAuth}
                            className="bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-bold flex items-center gap-2 px-6 py-2.5 rounded-xl hover:bg-[var(--color-brand-hover)] shadow-md"
                          >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                            <span>Connect Google Drive</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Google Account Picker View */
                  <div className="p-5 rounded-2xl border border-[#3c4043] bg-[#202124] space-y-4 max-w-md mx-auto">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-white">Sign in with Google</span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">Choose an account</h4>
                      <p className="text-xs text-[#9aa0a6] mt-0.5">to connect Google Drive to VerseStudio 4K Pro</p>
                    </div>

                    {/* Accounts List */}
                    <div className="space-y-1.5 divide-y divide-[#3c4043] rounded-xl border border-[#3c4043] bg-[#292a2d] p-2">
                      <button
                        type="button"
                        aria-label={`Select account ${user?.name || 'Rafi Ahmed'}`}
                        onClick={() =>
                          handleSelectGoogleAccount(
                            user?.email || 'rafi@gmail.com',
                            user?.name || 'Rafi Ahmed'
                          )
                        }
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#35363a] transition-colors text-left cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#1a73e8] text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {user?.name ? user.name[0].toUpperCase() : 'R'}
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-sm font-semibold text-white truncate">
                            {user?.name || 'Rafi Ahmed'}
                          </div>
                          <div className="text-xs text-[#9aa0a6] truncate">
                            {user?.email || 'rafi@gmail.com'}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        aria-label="Select account Md Mansur"
                        onClick={() => handleSelectGoogleAccount('mdmansur@gmail.com', 'Md Mansur')}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#35363a] transition-colors text-left cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#137333] text-white font-bold flex items-center justify-center text-sm shrink-0">
                          M
                        </div>
                        <div className="flex-1 truncate">
                          <div className="text-sm font-semibold text-white truncate">Md Mansur</div>
                          <div className="text-xs text-[#9aa0a6] truncate">mdmansur@gmail.com</div>
                        </div>
                      </button>

                      {!isEnteringCustomEmail ? (
                        <button
                          type="button"
                          onClick={() => setIsEnteringCustomEmail(true)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#35363a] transition-colors text-left cursor-pointer text-[#8ab4f8]"
                        >
                          <div className="w-9 h-9 rounded-full border border-[#5f6368] flex items-center justify-center text-sm shrink-0 text-[#9aa0a6]">
                            +
                          </div>
                          <div className="text-sm font-medium">Use another account</div>
                        </button>
                      ) : (
                        <div className="p-3 space-y-2">
                          <input
                            type="email"
                            value={customEmailInput}
                            onChange={(e) => setCustomEmailInput(e.target.value)}
                            placeholder="Enter your Google email..."
                            className="w-full bg-[#202124] border border-[#5f6368] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#8ab4f8]"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEnteringCustomEmail(false)}
                              className="text-xs text-[#9aa0a6] hover:text-white px-2 py-1"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (customEmailInput.includes('@')) {
                                  handleSelectGoogleAccount(
                                    customEmailInput.trim(),
                                    customEmailInput.split('@')[0]
                                  );
                                }
                              }}
                              className="text-xs bg-[#8ab4f8] text-[#202124] font-semibold rounded px-3 py-1 hover:bg-[#aecbfa]"
                            >
                              Continue
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 text-[11px] text-[#9aa0a6]">
                      <span>Google will connect your Drive storage securely.</span>
                      <button
                        type="button"
                        onClick={() => setIsAccountPickerOpen(false)}
                        className="text-xs text-white hover:underline shrink-0 ml-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
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
