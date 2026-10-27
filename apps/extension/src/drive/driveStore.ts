import { create } from 'zustand';
import type { DriveRecordingItem } from '@verse-studio/shared';
import { DriveService, type DriveQuota } from './driveService';

const LOCAL_RECORDINGS_KEY = 'verse_studio_drive_library_v1';

interface ActiveUploadSession {
  recordingId: string;
  name: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  abortController?: AbortController;
  error?: string;
}

interface DriveState {
  isConnected: boolean;
  quota: DriveQuota | null;
  recordings: DriveRecordingItem[];
  trashedItem: DriveRecordingItem | null;
  activeUpload: ActiveUploadSession | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  filterStatus: 'all' | 'shared' | 'private';

  // Actions
  initialize: () => Promise<void>;
  connectDrive: () => Promise<boolean>;
  disconnectDrive: () => Promise<void>;
  uploadRecording: (
    recordingId: string,
    name: string,
    blob: Blob,
    durationSeconds: number,
    resolution?: '4k' | '1440p' | '1080p'
  ) => Promise<{ success: boolean; shareUrl?: string; error?: string }>;
  cancelUpload: () => void;
  toggleVisibility: (id: string, makePublic: boolean) => Promise<void>;
  renameRecording: (id: string, newName: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreTrashedItem: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: 'all' | 'shared' | 'private') => void;
  clearError: () => void;
}

const DEFAULT_RECORDINGS: DriveRecordingItem[] = [
  {
    id: 'rec_demo_1',
    name: 'VerseStudio 4K Product Walkthrough',
    driveFileId: 'drv_sample_01',
    shareUrl: 'https://versestudio.app/watch/drv_sample_01',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    durationSeconds: 254, // 04:14
    sizeBytes: 420 * 1024 * 1024, // 420 MB
    createdAt: 'Oct 24, 2026',
    status: 'shared',
    resolution: '4k',
    fps: 60,
  },
  {
    id: 'rec_demo_2',
    name: 'Design System & Tokens Review',
    driveFileId: 'drv_sample_02',
    shareUrl: 'https://versestudio.app/watch/drv_sample_02',
    durationSeconds: 98, // 01:38
    sizeBytes: 160 * 1024 * 1024, // 160 MB
    createdAt: 'Oct 25, 2026',
    status: 'private',
    resolution: '4k',
    fps: 60,
  },
];

async function readStorage<T>(key: string): Promise<T | null> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res) => resolve((res[key] as T) || null));
    });
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  }
  return null;
}

async function writeStorage<T>(key: string, value: T | null): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      if (value === null) {
        chrome.storage.local.remove([key], () => resolve());
      } else {
        chrome.storage.local.set({ [key]: value }, () => resolve());
      }
    });
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

export const useDriveStore = create<DriveState>((set, get) => ({
  isConnected: true,
  quota: null,
  recordings: DEFAULT_RECORDINGS,
  trashedItem: null,
  activeUpload: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterStatus: 'all',

  initialize: async () => {
    set({ isLoading: true });
    try {
      const stored = await readStorage<DriveRecordingItem[]>(LOCAL_RECORDINGS_KEY);
      const items = stored && stored.length > 0 ? stored : DEFAULT_RECORDINGS;
      const quota = await DriveService.getStorageQuota();

      set({
        recordings: items,
        quota,
        isConnected: true,
        isLoading: false,
      });
    } catch {
      set({ isConnected: false, isLoading: false });
    }
  },

  connectDrive: async () => {
    set({ isLoading: true, error: null });
    try {
      await DriveService.getAccessToken(true);
      const quota = await DriveService.getStorageQuota();
      set({ isConnected: true, quota, isLoading: false });
      return true;
    } catch (err: any) {
      set({ isConnected: false, isLoading: false, error: err.message || 'Failed to connect Google Drive' });
      return false;
    }
  },

  disconnectDrive: async () => {
    await DriveService.disconnect();
    set({ isConnected: false, quota: null });
  },

  uploadRecording: async (
    recordingId: string,
    name: string,
    blob: Blob,
    durationSeconds: number,
    resolution = '4k'
  ) => {
    const abortController = new AbortController();

    set({
      activeUpload: {
        recordingId,
        name,
        progress: 0,
        uploadedBytes: 0,
        totalBytes: blob.size,
        abortController,
      },
      error: null,
    });

    // Create pending library item
    const pendingItem: DriveRecordingItem = {
      id: recordingId,
      name,
      durationSeconds,
      sizeBytes: blob.size,
      createdAt: 'Just now',
      status: 'uploading',
      uploadProgress: 0,
      resolution,
      fps: 60,
    };

    const currentList = get().recordings;
    set({ recordings: [pendingItem, ...currentList] });

    try {
      const result = await DriveService.uploadVideoResumable({
        name,
        blob,
        signal: abortController.signal,
        onProgress: (pct, uploaded, total) => {
          set((state) => ({
            activeUpload: state.activeUpload
              ? { ...state.activeUpload, progress: pct, uploadedBytes: uploaded, totalBytes: total }
              : null,
            recordings: state.recordings.map((r) =>
              r.id === recordingId ? { ...r, uploadProgress: pct } : r
            ),
          }));
        },
      });

      const completedItem: DriveRecordingItem = {
        ...pendingItem,
        status: 'shared',
        driveFileId: result.fileId,
        shareUrl: result.shareUrl,
        uploadProgress: 100,
      };

      const updatedList = get().recordings.map((r) =>
        r.id === recordingId ? completedItem : r
      );

      await writeStorage(LOCAL_RECORDINGS_KEY, updatedList);
      set({
        recordings: updatedList,
        activeUpload: null,
      });

      return { success: true, shareUrl: result.shareUrl };
    } catch (err: any) {
      const isCancelled = err.message?.includes('cancelled');
      if (isCancelled) {
        // Remove pending item on user cancellation
        const pruned = get().recordings.filter((r) => r.id !== recordingId);
        set({ recordings: pruned, activeUpload: null });
        return { success: false, error: 'Cancelled' };
      }

      // Mark as failed with retry action
      const failedItem: DriveRecordingItem = {
        ...pendingItem,
        status: 'failed',
      };
      const updatedList = get().recordings.map((r) =>
        r.id === recordingId ? failedItem : r
      );
      set({
        recordings: updatedList,
        activeUpload: null,
        error: err.message || 'Upload failed',
      });
      return { success: false, error: err.message };
    }
  },

  cancelUpload: () => {
    const upload = get().activeUpload;
    if (upload && upload.abortController) {
      upload.abortController.abort();
    }
  },

  toggleVisibility: async (id: string, makePublic: boolean) => {
    const item = get().recordings.find((r) => r.id === id);
    if (!item) return;

    if (item.driveFileId) {
      if (makePublic) {
        await DriveService.setFilePublic(item.driveFileId);
      } else {
        await DriveService.setFilePrivate(item.driveFileId);
      }
    }

    const updated = get().recordings.map((r) =>
      r.id === id ? { ...r, status: (makePublic ? 'shared' : 'private') as any } : r
    );
    await writeStorage(LOCAL_RECORDINGS_KEY, updated);
    set({ recordings: updated });
  },

  renameRecording: async (id: string, newName: string) => {
    const item = get().recordings.find((r) => r.id === id);
    if (item?.driveFileId) {
      await DriveService.renameFile(item.driveFileId, newName);
    }
    const updated = get().recordings.map((r) =>
      r.id === id ? { ...r, name: newName } : r
    );
    await writeStorage(LOCAL_RECORDINGS_KEY, updated);
    set({ recordings: updated });
  },

  moveToTrash: async (id: string) => {
    const item = get().recordings.find((r) => r.id === id);
    if (!item) return;

    if (item.driveFileId) {
      await DriveService.moveToTrash(item.driveFileId);
    }

    const updated = get().recordings.filter((r) => r.id !== id);
    await writeStorage(LOCAL_RECORDINGS_KEY, updated);
    set({
      recordings: updated,
      trashedItem: item,
    });
  },

  restoreTrashedItem: async () => {
    const trashed = get().trashedItem;
    if (!trashed) return;

    if (trashed.driveFileId) {
      await DriveService.restoreFromTrash(trashed.driveFileId);
    }

    const updated = [trashed, ...get().recordings];
    await writeStorage(LOCAL_RECORDINGS_KEY, updated);
    set({
      recordings: updated,
      trashedItem: null,
    });
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setFilterStatus: (status: 'all' | 'shared' | 'private') => set({ filterStatus: status }),
  clearError: () => set({ error: null }),
}));
