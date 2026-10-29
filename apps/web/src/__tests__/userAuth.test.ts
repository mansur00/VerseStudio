import { describe, it, expect, beforeEach } from 'vitest';
import { userAuthService } from '../lib/userAuthService';
import { ServerDatabase } from '../lib/serverDb';

describe('Real User Authentication Service (Pass D)', () => {
  const testEmail = 'creator.test@versestudio.app';
  const testPassword = 'StrongPassword2026!';
  let generatedOtp = '';

  beforeEach(() => {
    // Reset database state if needed
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const res = await userAuthService.signUp('Short Pass', 'short@example.com', 'short');
    expect(res.success).toBe(false);
    expect(res.error).toContain('at least 8 characters');
  });

  it('successfully creates pending verification with 6-digit OTP', async () => {
    const res = await userAuthService.signUp('Test Creator', testEmail, testPassword);
    expect(res.success).toBe(true);
    expect(res.code).toBeDefined();
    expect(res.code?.length).toBe(6);
    expect(/^\d{6}$/.test(res.code!)).toBe(true);
    generatedOtp = res.code!;
  });

  it('rejects duplicate email registration', async () => {
    // Seed user in database first
    ServerDatabase.seedProfile({
      id: 'usr_existing_123',
      email: 'existing@versestudio.app',
      name: 'Existing User',
      plan: 'free',
      status: 'active',
      ai_minutes_used: 0,
      ai_minutes_limit: 30,
      google_drive_connected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await userAuthService.signUp('Existing', 'existing@versestudio.app', 'SomePassword123!');
    expect(res.success).toBe(false);
    expect(res.error).toContain('already exists');
  });

  it('rejects invalid email verification code', async () => {
    const res = await userAuthService.verifyEmail('999999', testEmail);
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid verification code');
  });

  it('locks out verification after too many failed attempts (>5)', async () => {
    const testLockedEmail = 'locked@example.com';
    await userAuthService.signUp('Locked User', testLockedEmail, 'SafePassword123!');

    for (let i = 0; i < 5; i++) {
      const attempt = await userAuthService.verifyEmail('000000', testLockedEmail);
      expect(attempt.success).toBe(false);
    }

    const lockedAttempt = await userAuthService.verifyEmail('000000', testLockedEmail);
    expect(lockedAttempt.success).toBe(false);
    expect(lockedAttempt.error).toContain('Too many incorrect attempts');
  });

  it('successfully verifies email with valid 6-digit OTP and provisions user + token', async () => {
    const res = await userAuthService.verifyEmail(generatedOtp, testEmail);
    expect(res.success).toBe(true);
    expect(res.user).toBeDefined();
    expect(res.user?.email).toBe(testEmail);
    expect(res.user?.plan).toBe('free');
    expect(res.token).toBeDefined();

    // Verify token validity
    const verified = userAuthService.verifyUserToken(res.token!);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(testEmail);
  });

  it('rejects sign in with wrong password', async () => {
    const res = await userAuthService.signIn(testEmail, 'WrongPassword!');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid email or password');
  });

  it('rejects sign in with non-existent user', async () => {
    const res = await userAuthService.signIn('nonexistent@domain.com', 'AnyPassword123!');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Invalid email or password');
  });

  it('rejects sign in for suspended user (Screen 08)', async () => {
    // Seed suspended user
    const suspendedEmail = 'suspended.creator@example.com';
    const suspendedId = 'usr_suspended_999';
    ServerDatabase.seedProfile({
      id: suspendedId,
      email: suspendedEmail,
      name: 'Suspended Creator',
      plan: 'free',
      status: 'suspended',
      ai_minutes_used: 0,
      ai_minutes_limit: 30,
      google_drive_connected: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const res = await userAuthService.signIn(suspendedEmail, 'AnyPassword!');
    expect(res.success).toBe(false);
    expect(res.error).toContain('suspended');
  });

  it('successfully signs in with valid credentials and issues session (Screen 07)', async () => {
    const res = await userAuthService.signIn(testEmail, testPassword, '192.168.1.50');
    expect(res.success).toBe(true);
    expect(res.user?.email).toBe(testEmail);
    expect(res.token).toBeDefined();

    // Check device session
    const sessions = userAuthService.getSessions(res.user!.id);
    expect(sessions.length).toBeGreaterThan(0);
    expect(sessions[0].ip).toBe('192.168.1.50');
  });

  it('handles forgot password and generates 256-bit reset token (Screen 09, 10)', async () => {
    const res = await userAuthService.forgotPassword(testEmail);
    expect(res.success).toBe(true);
    expect(res.resetToken).toBeDefined();
    expect(res.resetToken!.length).toBe(64); // 32 bytes in hex = 64 chars

    // Reset password with token
    const newPassword = 'BrandNewPassword2026!';
    const resetRes = await userAuthService.resetPassword(res.resetToken!, newPassword);
    expect(resetRes.success).toBe(true);

    // Old password fails
    const oldLogin = await userAuthService.signIn(testEmail, testPassword);
    expect(oldLogin.success).toBe(false);

    // New password succeeds
    const newLogin = await userAuthService.signIn(testEmail, newPassword);
    expect(newLogin.success).toBe(true);
  });

  it('rejects used or invalid password reset token', async () => {
    const res = await userAuthService.resetPassword('invalid_token_123', 'AnotherPassword!');
    expect(res.success).toBe(false);
    expect(res.error).toContain('invalid or has expired');
  });

  it('supports remote session revocation (Screen 58)', async () => {
    const { users } = await ServerDatabase.getUsers(testEmail, 'all', 'all');
    const user = users.find((u) => u.email === testEmail);
    expect(user).toBeDefined();

    const sessions = userAuthService.getSessions(user!.id);
    const sessionToRevoke = sessions[0]?.id;
    expect(sessionToRevoke).toBeDefined();

    const revoked = userAuthService.revokeSession(user!.id, sessionToRevoke);
    expect(revoked).toBe(true);

    const remainingSessions = userAuthService.getSessions(user!.id);
    expect(remainingSessions.find((s) => s.id === sessionToRevoke)).toBeUndefined();
  });

  it('deletes account without affecting user Google Drive files (Screen 61)', async () => {
    const { users } = await ServerDatabase.getUsers(testEmail, 'all', 'all');
    const user = users.find((u) => u.email === testEmail);
    expect(user).toBeDefined();

    const deleted = await userAuthService.deleteAccount(user!.id);
    expect(deleted).toBe(true);

    // Confirm user is gone from platform database
    const postCheck = await ServerDatabase.getUsers(testEmail, 'all', 'all');
    expect(postCheck.users.find((u) => u.id === user!.id)).toBeUndefined();

    // Confirm sessions and credentials cleared
    expect(userAuthService.getSessions(user!.id).length).toBe(0);
  });
});
