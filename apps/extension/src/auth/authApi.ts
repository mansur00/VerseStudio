import type { UserProfile, UserDeviceSession } from '@verse-studio/shared';

const getApiBase = () => {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== 'undefined' && (window as any).__VS_API_BASE__) {
    return (window as any).__VS_API_BASE__;
  }
  return 'http://localhost:3000';
};

export async function apiSignUp(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; debugCode?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Sign up failed' };
    }
    return { success: true, debugCode: data.debugCode };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error contacting auth server' };
  }
}

export async function apiVerifyEmail(
  code: string,
  email?: string
): Promise<{ success: boolean; error?: string; user?: UserProfile; token?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Verification failed' };
    }
    return {
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatarUrl: data.user.avatar_url,
        plan: data.user.plan || 'free',
        aiMinutesUsed: data.user.ai_minutes_used || 0,
        aiMinutesLimit: data.user.ai_minutes_limit || 30,
        googleDriveConnected: Boolean(data.user.google_drive_connected),
        googleDriveEmail: data.user.google_drive_email,
        twoFactorEnabled: Boolean(data.user.two_factor_enabled),
        createdAt: data.user.created_at,
      } : undefined,
      token: data.token,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error verifying email' };
  }
}

export async function apiSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: UserProfile; token?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Sign in failed' };
    }
    return {
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatarUrl: data.user.avatar_url,
        plan: data.user.plan || 'free',
        aiMinutesUsed: data.user.ai_minutes_used || 0,
        aiMinutesLimit: data.user.ai_minutes_limit || 30,
        googleDriveConnected: Boolean(data.user.google_drive_connected),
        googleDriveEmail: data.user.google_drive_email,
        twoFactorEnabled: Boolean(data.user.two_factor_enabled),
        createdAt: data.user.created_at,
      } : undefined,
      token: data.token,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error signing in' };
  }
}

export async function apiForgotPassword(
  email: string
): Promise<{ success: boolean; error?: string; debugToken?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Forgot password request failed' };
    }
    return { success: true, debugToken: data.debugToken };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function apiResetPassword(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Reset password failed' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function apiGetSessions(
  token: string
): Promise<{ success: boolean; sessions?: UserDeviceSession[]; error?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/sessions`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to fetch sessions' };
    }
    return { success: true, sessions: data.sessions };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function apiRevokeSession(
  token: string,
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/sessions?id=${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to revoke session' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function apiDeleteAccount(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${getApiBase()}/api/auth/delete-account`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to delete account' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
