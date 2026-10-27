import { create } from 'zustand';
import {
  DEFAULT_STUDIO_SETTINGS,
  type AppSettings,
  type StudioShortcuts,
} from '@verse-studio/shared';

export type SettingsTabId = 'general' | 'recording' | 'shortcuts' | 'voiceAi' | 'googleDrive';

export interface SettingsState {
  settings: AppSettings;
  activeTab: SettingsTabId;
  isModalOpen: boolean;
  recordingShortcutKey: keyof StudioShortcuts | null;
  shortcutConflict: string | null;

  // Actions
  initialize: () => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setShortcut: (key: keyof StudioShortcuts, binding: string) => boolean;
  resetShortcutsToDefaults: () => void;
  setActiveTab: (tab: SettingsTabId) => void;
  setIsModalOpen: (open: boolean) => void;
  setRecordingShortcutKey: (key: keyof StudioShortcuts | null) => void;
}

const STORAGE_KEY = 'verse_studio_app_settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_STUDIO_SETTINGS },
  activeTab: 'general',
  isModalOpen: false,
  recordingShortcutKey: null,
  shortcutConflict: null,

  initialize: async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const res = await chrome.storage.local.get([STORAGE_KEY]);
        if (res[STORAGE_KEY]) {
          set({ settings: { ...DEFAULT_STUDIO_SETTINGS, ...res[STORAGE_KEY] } });
          return;
        }
      }

      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          set({ settings: { ...DEFAULT_STUDIO_SETTINGS, ...JSON.parse(raw) } });
        }
      }
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
  },

  updateSettings: (partial) => {
    const nextSettings = { ...get().settings, ...partial };
    set({ settings: nextSettings });

    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [STORAGE_KEY]: nextSettings });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings));
      }
    } catch (e) {
      console.warn('Failed to persist settings', e);
    }
  },

  setShortcut: (key, binding) => {
    const { settings } = get();
    // Conflict detection: check if another action already uses this hotkey
    const existingEntry = Object.entries(settings.shortcuts).find(
      ([k, v]) => k !== key && v.toLowerCase() === binding.toLowerCase()
    );

    if (existingEntry) {
      set({
        shortcutConflict: `Hotkey "${binding}" is already assigned to "${existingEntry[0]}".`,
      });
      return false;
    }

    const nextShortcuts = {
      ...settings.shortcuts,
      [key]: binding,
    };

    get().updateSettings({ shortcuts: nextShortcuts });
    set({ shortcutConflict: null, recordingShortcutKey: null });
    return true;
  },

  resetShortcutsToDefaults: () => {
    get().updateSettings({ shortcuts: { ...DEFAULT_STUDIO_SETTINGS.shortcuts } });
    set({ shortcutConflict: null, recordingShortcutKey: null });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setRecordingShortcutKey: (key) => set({ recordingShortcutKey: key, shortcutConflict: null }),
}));
