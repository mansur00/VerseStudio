import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';

describe('useAuthStore', () => {
  beforeEach(async () => {
    // Clear storage before each test
    await useAuthStore.getState().signOut();
    useAuthStore.setState({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      unverifiedEmail: null,
      unverifiedName: null,
      error: null,
    });
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

  it('supports Google OAuth sign in', async () => {
    const result = await useAuthStore.getState().signInWithGoogle();
    expect(result.success).toBe(true);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.googleDriveConnected).toBe(true);
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
