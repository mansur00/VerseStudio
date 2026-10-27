import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';
import { DEFAULT_STUDIO_SETTINGS } from '@verse-studio/shared';

describe('useSettingsStore (Phase 7 Settings)', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_STUDIO_SETTINGS },
      activeTab: 'general',
      isModalOpen: false,
      recordingShortcutKey: null,
      shortcutConflict: null,
    });
  });

  it('initializes with default studio settings', () => {
    const s = useSettingsStore.getState();
    expect(s.settings.language).toBe('en');
    expect(s.settings.theme).toBe('dark');
    expect(s.settings.resolution).toBe('4k');
    expect(s.settings.fps).toBe(60);
    expect(s.settings.audioBitrateKbps).toBe(320);
    expect(s.settings.shortcuts.startStopRecording).toBe('Alt+R');
  });

  it('updates partial settings correctly', () => {
    const store = useSettingsStore.getState();
    store.updateSettings({
      language: 'bn',
      resolution: '1440p',
      reduceMotion: true,
    });

    const s = useSettingsStore.getState();
    expect(s.settings.language).toBe('bn');
    expect(s.settings.resolution).toBe('1440p');
    expect(s.settings.reduceMotion).toBe(true);
  });

  it('rebinds a shortcut successfully', () => {
    const store = useSettingsStore.getState();
    const success = store.setShortcut('toggleSpotlight', 'Alt+W');

    expect(success).toBe(true);
    const s = useSettingsStore.getState();
    expect(s.settings.shortcuts.toggleSpotlight).toBe('Alt+W');
    expect(s.shortcutConflict).toBeNull();
  });

  it('detects shortcut conflict and rejects duplicate hotkey assignment', () => {
    const store = useSettingsStore.getState();
    // Alt+R is already assigned to startStopRecording
    const success = store.setShortcut('toggleLaser', 'Alt+R');

    expect(success).toBe(false);
    const s = useSettingsStore.getState();
    expect(s.settings.shortcuts.toggleLaser).toBe('Alt+L'); // Remains unchanged
    expect(s.shortcutConflict).toContain('already assigned');
  });

  it('resets shortcuts back to default values', () => {
    const store = useSettingsStore.getState();
    store.setShortcut('toggleSpotlight', 'Alt+Z');
    expect(useSettingsStore.getState().settings.shortcuts.toggleSpotlight).toBe('Alt+Z');

    store.resetShortcutsToDefaults();
    expect(useSettingsStore.getState().settings.shortcuts.toggleSpotlight).toBe('Alt+S');
    expect(useSettingsStore.getState().shortcutConflict).toBeNull();
  });

  it('switches active settings tab and modal open state', () => {
    const store = useSettingsStore.getState();
    store.setActiveTab('recording');
    store.setIsModalOpen(true);

    const s = useSettingsStore.getState();
    expect(s.activeTab).toBe('recording');
    expect(s.isModalOpen).toBe(true);
  });
});
