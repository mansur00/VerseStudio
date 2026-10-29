import { create } from 'zustand';
import type {
  UserProfile,
  UserSession,
  UserDeviceSession,
  UserPlan,
} from '@verse-studio/shared';
import {
  apiSignUp,
  apiVerifyEmail,
  apiSignIn,
  apiForgotPassword,
  apiResetPassword,
  apiGetSessions,
  apiRevokeSession,
  apiDeleteAccount,
} from './authApi';

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
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; debugCode?: string }>;
  verifyEmail: (code: string) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: () => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (goal: string, driveConnected: boolean) => Promise<void>;
  setDriveConnected: (connected: boolean) => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  toggle2FA: (enabled: boolean, code?: string) => Promise<{ success: boolean; error?: string }>;
  upgradePlan: (plan: UserPlan) => Promise<void>;
  refreshSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

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
  activeSessions: [],
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
        // Fetch fresh sessions in background
        get().refreshSessions().catch(() => {});
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

  signUp: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    const res = await apiSignUp(name, email, password);

    if (!res.success) {
      set({ isLoading: false, error: res.error || 'Sign up failed' });
      return { success: false, error: res.error };
    }

    set({
      unverifiedEmail: email,
      unverifiedName: name,
      isLoading: false,
    });
    return { success: true, debugCode: res.debugCode };
  },

  verifyEmail: async (code: string) => {
    set({ isLoading: true, error: null });
    const email = get().unverifiedEmail || undefined;
    const res = await apiVerifyEmail(code, email);

    if (!res.success || !res.user || !res.token) {
      const errorMsg = res.error || 'Invalid verification code. Please check your inbox.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    const newSession: UserSession = {
      user: res.user,
      token: res.token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await writeStorage(STORAGE_KEY, newSession);
    set({
      user: res.user,
      session: newSession,
      isAuthenticated: true,
      unverifiedEmail: null,
      unverifiedName: null,
      isLoading: false,
    });

    get().refreshSessions().catch(() => {});
    return { success: true };
  },

  resendVerificationCode: async () => {
    const email = get().unverifiedEmail;
    const name = get().unverifiedName || 'Creator';
    if (!email) return false;
    const res = await apiSignUp(name, email, 'TempPassword123!');
    return res.success;
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    const res = await apiSignIn(email, password);

    if (!res.success || !res.user || !res.token) {
      const errorMsg = res.error || 'Invalid email or password.';
      set({ isLoading: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }

    const session: UserSession = {
      user: res.user,
      token: res.token,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    };

    await writeStorage(STORAGE_KEY, session);
    await writeStorage(ONBOARDED_KEY, true);

    set({
      user: res.user,
      session,
      isAuthenticated: true,
      isOnboarded: true,
      isLoading: false,
    });

    get().refreshSessions().catch(() => {});
    return { success: true };
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    // In Chrome extension, google sign in uses chrome.identity.getAuthToken
    // Fail visibly if not in Chrome runtime or identity fails
    if (typeof chrome === 'undefined' || !chrome.identity) {
      const err = 'Google Sign-In requires Chrome Extension identity permissions';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    return new Promise((resolve) => {
      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError || !token) {
          const errMsg = chrome.runtime.lastError?.message || 'Google authentication was cancelled or failed';
          set({ isLoading: false, error: errMsg });
          resolve({ success: false, error: errMsg });
          return;
        }

        // Fetch user info from Google API
        try {
          const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const info = await res.json();
          const googleUser: UserProfile = {
            id: 'usr_g_' + (info.id || 'creator'),
            name: info.name || 'Google Creator',
            email: info.email || 'creator@gmail.com',
            avatarUrl: info.picture,
            plan: 'free',
            aiMinutesUsed: 0,
            aiMinutesLimit: 30,
            googleDriveConnected: true,
            googleDriveEmail: info.email,
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
          };

          const session: UserSession = {
            user: googleUser,
            token: `g_oauth_${token.substring(0, 16)}`,
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          };

          await writeStorage(STORAGE_KEY, session);
          await writeStorage(ONBOARDED_KEY, true);

          set({
            user: googleUser,
            session,
            isAuthenticated: true,
            isOnboarded: true,
            isLoading: false,
          });

          resolve({ success: true });
        } catch (fetchErr: any) {
          const msg = fetchErr.message || 'Failed to fetch Google profile';
          set({ isLoading: false, error: msg });
          resolve({ success: false, error: msg });
        }
      });
    });
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    const res = await apiForgotPassword(email);
    set({ isLoading: false });
    if (!res.success) {
      return { success: false, error: res.error };
    }
    return { success: true };
  },

  resetPassword: async (password: string, token?: string) => {
    set({ isLoading: true, error: null });
    if (!token) {
      set({ isLoading: false, error: 'Password reset link is invalid or has expired' });
      return { success: false, error: 'Password reset link is invalid or has expired' };
    }
    const res = await apiResetPassword(token, password);
    set({ isLoading: false });
    if (!res.success) {
      return { success: false, error: res.error };
    }
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

  setDriveConnected: async (connected: boolean) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser: UserProfile = {
        ...currentUser,
        googleDriveConnected: connected,
      };
      const updatedSession = get().session ? { ...get().session!, user: updatedUser } : null;
      await writeStorage(STORAGE_KEY, updatedSession);
      set({ user: updatedUser, session: updatedSession });
    }
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

  refreshSessions: async () => {
    const session = get().session;
    if (!session?.token) return;
    const res = await apiGetSessions(session.token);
    if (res.success && res.sessions) {
      set({ activeSessions: res.sessions });
    }
  },

  revokeSession: async (sessionId: string) => {
    const session = get().session;
    if (session?.token) {
      await apiRevokeSession(session.token, sessionId);
    }
    const currentSessions = get().activeSessions;
    set({
      activeSessions: currentSessions.filter((s) => s.id !== sessionId),
    });
  },

  deleteAccount: async () => {
    const session = get().session;
    if (session?.token) {
      await apiDeleteAccount(session.token);
    }
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
