import { create } from 'zustand';
import type {
  UserProfile,
  UserSession,
  UserDeviceSession,
  UserPlan,
} from '@verse-studio/shared';

const STORAGE_KEY = 'verse_studio_auth_session_v1';
const ONBOARDED_KEY = 'verse_studio_onboarded_v1';

interface AuthState {
  user: UserProfile | null;
  session: UserSession | null;
  activeSessions: UserDeviceSession[];
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isLoading: boolean;
  unverifiedEmail: string | null;
  unverifiedName: string | null;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (goal: string, driveConnected: boolean) => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  toggle2FA: (enabled: boolean, code?: string) => Promise<{ success: boolean; error?: string }>;
  upgradePlan: (plan: UserPlan) => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_ACTIVE_SESSIONS: UserDeviceSession[] = [
  {
    id: 'sess-current',
    browser: 'Chrome 125 (macOS)',
    os: 'macOS Sonoma',
    ip: '103.145.74.12',
    location: 'Dhaka, Bangladesh',
    isCurrent: true,
    lastActive: 'Active now',
  },
  {
    id: 'sess-2',
    browser: 'Chrome 124 (Windows)',
    os: 'Windows 11',
    ip: '103.145.74.88',
    location: 'Dhaka, Bangladesh',
    isCurrent: false,
    lastActive: '2 days ago',
  },
];

// Chrome storage helper with local fallback
async function readStorage<T>(key: string): Promise<T | null> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve((result[key] as T) || null);
      });
    });
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    const val = window.localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : null;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  activeSessions: DEFAULT_ACTIVE_SESSIONS,
  isAuthenticated: false,
  isOnboarded: false,
  isLoading: true,
  unverifiedEmail: null,
  unverifiedName: null,
  error: null,

  initialize: async () => {
    try {
      const storedSession = await readStorage<UserSession>(STORAGE_KEY);
      const storedOnboarded = await readStorage<boolean>(ONBOARDED_KEY);

      if (storedSession && storedSession.user) {
        set({
          user: storedSession.user,
          session: storedSession,
          isAuthenticated: true,
          isOnboarded: Boolean(storedOnboarded),
          isLoading: false,
        });
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isOnboarded: false,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  signUp: async (name: string, email: string, _password?: string) => {
    set({ isLoading: true, error: null });
    // Simulate server response
    await new Promise((res) => setTimeout(res, 400));

    if (email.toLowerCase().includes('error')) {
      const errorMsg = 'An account with this email already exists';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    set({
      unverifiedEmail: email,
      unverifiedName: name,
      isLoading: false,
    });
    return { success: true };
  },

  verifyEmail: async (code: string) => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 400));

    if (code !== '123456') {
      const errorMsg = 'Invalid verification code. Please check your inbox.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    const email = get().unverifiedEmail || 'creator@versestudio.app';
    const name = get().unverifiedName || email.split('@')[0];
    const newUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: name,
      email: email,
      plan: 'free',
      aiMinutesUsed: 0,
      aiMinutesLimit: 30,
      googleDriveConnected: false,
      createdAt: new Date().toISOString(),
    };

    const newSession: UserSession = {
      user: newUser,
      token: 'jwt_' + Math.random().toString(36).substring(2, 12),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await writeStorage(STORAGE_KEY, newSession);
    set({
      user: newUser,
      session: newSession,
      isAuthenticated: true,
      unverifiedEmail: null,
      unverifiedName: null,
      isLoading: false,
    });

    return { success: true };
  },

  resendVerificationCode: async () => {
    await new Promise((res) => setTimeout(res, 300));
    return true;
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 400));

    if (email.toLowerCase().includes('suspend')) {
      const errorMsg = 'This account has been suspended. Please contact support.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    if (password === 'wrong-password' || password.length < 6) {
      const errorMsg = 'Invalid email or password.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    const user: UserProfile = {
      id: 'usr_mansur_pro',
      name: 'Mansur Developer',
      email: email,
      plan: 'pro',
      aiMinutesUsed: 14,
      aiMinutesLimit: 300,
      googleDriveConnected: true,
      googleDriveEmail: email,
      twoFactorEnabled: false,
      createdAt: '2024-01-15T00:00:00.000Z',
    };

    const session: UserSession = {
      user,
      token: 'jwt_mock_token_777',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await writeStorage(STORAGE_KEY, session);
    await writeStorage(ONBOARDED_KEY, true);

    set({
      user,
      session,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    return { success: true };
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 600));

    const user: UserProfile = {
      id: 'usr_google_creator',
      name: 'Google Creator',
      email: 'creator@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      plan: 'pro',
      aiMinutesUsed: 22,
      aiMinutesLimit: 300,
      googleDriveConnected: true,
      googleDriveEmail: 'creator@gmail.com',
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
    };

    const session: UserSession = {
      user,
      token: 'jwt_google_oauth_token',
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await writeStorage(STORAGE_KEY, session);
    await writeStorage(ONBOARDED_KEY, true);

    set({
      user,
      session,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    return { success: true };
  },

  forgotPassword: async (_email: string) => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 400));
    set({ isLoading: false });
    return { success: true };
  },

  resetPassword: async () => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 500));
    set({ isLoading: false });
    return { success: true };
  },

  completeOnboarding: async (_goal: string, driveConnected: boolean) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        googleDriveConnected: driveConnected,
      };
      const updatedSession = get().session ? { ...get().session!, user: updatedUser } : null;
      await writeStorage(STORAGE_KEY, updatedSession);
      set({ user: updatedUser, session: updatedSession });
    }
    await writeStorage(ONBOARDED_KEY, true);
    set({ isOnboarded: true });
  },

  updateProfile: async (name: string, avatarUrl?: string) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: UserProfile = {
      ...currentUser,
      name,
      avatarUrl: avatarUrl || currentUser.avatarUrl,
    };

    const updatedSession = get().session ? { ...get().session!, user: updatedUser } : null;
    await writeStorage(STORAGE_KEY, updatedSession);
    set({ user: updatedUser, session: updatedSession });
  },

  changePassword: async (_currentPassword: string, _newPassword: string) => {
    set({ isLoading: true, error: null });
    await new Promise((res) => setTimeout(res, 500));
    set({ isLoading: false });
    return { success: true };
  },

  toggle2FA: async (enabled: boolean, code?: string) => {
    if (enabled && code !== '123456' && code !== undefined) {
      return { success: false, error: 'Invalid 2FA authentication code' };
    }

    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, twoFactorEnabled: enabled };
      const updatedSession = get().session ? { ...get().session!, user: updatedUser } : null;
      await writeStorage(STORAGE_KEY, updatedSession);
      set({ user: updatedUser, session: updatedSession });
    }
    return { success: true };
  },

  upgradePlan: async (plan: UserPlan) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser: UserProfile = {
      ...currentUser,
      plan,
      aiMinutesLimit: plan === 'pro' ? 300 : 30,
    };

    const updatedSession = get().session ? { ...get().session!, user: updatedUser } : null;
    await writeStorage(STORAGE_KEY, updatedSession);
    set({ user: updatedUser, session: updatedSession });
  },

  revokeSession: async (sessionId: string) => {
    const currentSessions = get().activeSessions;
    set({
      activeSessions: currentSessions.filter((s) => s.id !== sessionId),
    });
  },

  deleteAccount: async () => {
    await writeStorage(STORAGE_KEY, null);
    await writeStorage(ONBOARDED_KEY, null);
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnboarded: false,
    });
  },

  signOut: async () => {
    await writeStorage(STORAGE_KEY, null);
    set({
      user: null,
      session: null,
      isAuthenticated: false,
    });
  },

  clearError: () => set({ error: null }),
}));
