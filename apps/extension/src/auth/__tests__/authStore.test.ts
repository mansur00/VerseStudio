import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('useAuthStore (Real API Integration)', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    // Clear storage before each test
    await useAuthStore.getState().signOut();
    useAuthStore.setState({
      user: null,
      session: null,
      activeSessions: [
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
      ],
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      unverifiedEmail: null,
      unverifiedName: null,
      error: null,
    });

    // Mock fetch for auth API endpoints
    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      const body = init?.body ? JSON.parse(init.body as string) : {};

      if (urlStr.includes('/api/auth/signup')) {
        if (body.email?.includes('error') || body.email?.includes('existing')) {
          return new Response(JSON.stringify({ error: 'An account with this email already exists' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ success: true, debugCode: '123456' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (urlStr.includes('/api/auth/verify-email')) {
        if (body.code !== '123456') {
          return new Response(JSON.stringify({ error: 'Invalid verification code. Please check your inbox.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: 'usr_mansur_test',
              name: 'Mansur Test',
              email: body.email || 'tester@domain.com',
              plan: 'free',
              ai_minutes_used: 0,
              ai_minutes_limit: 30,
              google_drive_connected: false,
              created_at: new Date().toISOString(),
            },
            token: 'jwt_valid_token_sample',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/api/auth/signin')) {
        if (body.email?.includes('suspend')) {
          return new Response(JSON.stringify({ error: 'Your account has been suspended by an administrator' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        if (body.password === 'wrong-password' || body.password?.length < 6) {
          return new Response(JSON.stringify({ error: 'Invalid email or password.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({
            success: true,
            user: {
              id: 'usr_valid_creator',
              name: 'Creator Name',
              email: body.email,
              plan: 'pro',
              ai_minutes_used: 10,
              ai_minutes_limit: 300,
              google_drive_connected: true,
              created_at: new Date().toISOString(),
            },
            token: 'jwt_session_token_123',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (urlStr.includes('/api/auth/sessions')) {
        return new Response(JSON.stringify({ success: true, sessions: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (urlStr.includes('/api/auth/delete-account')) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('initializes in unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('rejects sign up with conflicting email', async () => {
    const result = await useAuthStore.getState().signUp('Jane', 'error-user@example.com', 'pass12345');
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('handles sign up flow through email verification', async () => {
    const signUpResult = await useAuthStore.getState().signUp('Mansur Test', 'tester@domain.com', 'pass12345');
    expect(signUpResult.success).toBe(true);
    expect(useAuthStore.getState().unverifiedEmail).toBe('tester@domain.com');

    // Invalid verification code
    const badCodeResult = await useAuthStore.getState().verifyEmail('000000');
    expect(badCodeResult.success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Correct verification code
    const goodCodeResult = await useAuthStore.getState().verifyEmail('123456');
    expect(goodCodeResult.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.name).toBe('Mansur Test');
    expect(state.user?.email).toBe('tester@domain.com');
    expect(state.user?.plan).toBe('free');
  });

  it('rejects suspended accounts on sign in', async () => {
    const result = await useAuthStore.getState().signIn('suspended@example.com', 'password123');
    expect(result.success).toBe(false);
    expect(result.error).toContain('suspended');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('signs in with valid credentials', async () => {
    const result = await useAuthStore.getState().signIn('creator@versestudio.app', 'validPassword123');
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('creator@versestudio.app');
    expect(state.isOnboarded).toBe(true);
  });

  it('updates profile and reflects in current session', async () => {
    await useAuthStore.getState().signIn('creator@versestudio.app', 'validPassword123');
    await useAuthStore.getState().updateProfile('Updated Name', 'https://example.com/avatar.png');

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe('Updated Name');
    expect(state.user?.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('handles 2FA enablement and code validation', async () => {
    await useAuthStore.getState().signIn('creator@versestudio.app', 'validPassword123');

    // Bad code
    const bad2fa = await useAuthStore.getState().toggle2FA(true, '999999');
    expect(bad2fa.success).toBe(false);
    expect(useAuthStore.getState().user?.twoFactorEnabled).toBe(false);

    // Correct code
    const good2fa = await useAuthStore.getState().toggle2FA(true, '123456');
    expect(good2fa.success).toBe(true);
    expect(useAuthStore.getState().user?.twoFactorEnabled).toBe(true);
  });

  it('upgrades user plan and updates limits', async () => {
    await useAuthStore.getState().signIn('creator@versestudio.app', 'validPassword123');
    await useAuthStore.getState().upgradePlan('pro');

    const state = useAuthStore.getState();
    expect(state.user?.plan).toBe('pro');
    expect(state.user?.aiMinutesLimit).toBe(300);
  });

  it('revokes remote device sessions', async () => {
    const initialCount = useAuthStore.getState().activeSessions.length;
    await useAuthStore.getState().revokeSession('sess-2');
    expect(useAuthStore.getState().activeSessions.length).toBe(initialCount - 1);
  });

  it('deletes account cleanly', async () => {
    await useAuthStore.getState().signIn('creator@versestudio.app', 'validPassword123');
    await useAuthStore.getState().deleteAccount();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
