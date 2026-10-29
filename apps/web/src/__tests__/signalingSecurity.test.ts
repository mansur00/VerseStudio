import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { signalingDb } from '../lib/signalingStore';

describe('Phone Camera Signaling: Security, TTL & Rate Limiting Acceptance Tests', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Enforces >= 128-bit cryptographically secure token on room creation', () => {
    const room = signalingDb.createOrTouchRoom('VS-TEST1');
    expect(room.token).toBeDefined();
    // 32 hex chars = 16 bytes = 128 bits
    expect(room.token.length).toBeGreaterThanOrEqual(32);
    expect(room.token).toMatch(/^[0-9a-f]{32,}$/i);
    expect(room.code).toBe('VS-TEST1');
  });

  it('2. Enforces 10-minute strict TTL and rejects expired sessions with 410', () => {
    const code = 'VS-EXPIRE';
    const room = signalingDb.createOrTouchRoom(code);

    // Initial check within TTL
    const lookup1 = signalingDb.findRoom(code, false);
    expect(lookup1.room).toBeDefined();

    // Fast-forward beyond 10-minute TTL
    room.expiresAt = Date.now() - 1000; // Expired 1 second ago

    const lookup2 = signalingDb.findRoom(code, false);
    expect(lookup2.room).toBeUndefined();
    expect(lookup2.status).toBe(410);
    expect(lookup2.error).toContain('10-minute TTL');
  });

  it('3. Enforces attempt limits on short manual code (max 5 attempts before lockout)', () => {
    const code = 'VS-LIMIT';
    signalingDb.createOrTouchRoom(code);

    // 5 attempts are allowed
    for (let i = 1; i <= 5; i++) {
      const res = signalingDb.findRoom(code, true);
      expect(res.room).toBeDefined();
      expect(res.room?.attemptCount).toBe(i);
    }

    // 6th attempt exceeds limit and invalidates room with 429
    const failedRes = signalingDb.findRoom(code, true);
    expect(failedRes.room).toBeUndefined();
    expect(failedRes.status).toBe(429);
    expect(failedRes.error).toContain('Maximum pairing attempts (5) exceeded');

    // Room is deleted from store for security
    const postCheck = signalingDb.findRoom(code, false);
    expect(postCheck.status).toBe(404);
  });

  it('4. Enforces per-IP rate limiting (rejects when exceeding max requests)', () => {
    const testIp = '192.168.1.100';

    // Send 120 allowed requests
    for (let i = 0; i < 120; i++) {
      const check = signalingDb.checkRateLimit(testIp);
      expect(check.allowed).toBe(true);
    }

    // 121st request triggers rate limit
    const overLimit = signalingDb.checkRateLimit(testIp);
    expect(overLimit.allowed).toBe(false);
    expect(overLimit.retryAfter).toBeGreaterThan(0);
  });

  it('5. Configures dynamic TURN servers from environment variables', () => {
    const originalTurn = process.env.TURN_SERVER_URL;
    process.env.TURN_SERVER_URL = 'turn:turn.versestudio.app:3478';
    process.env.TURN_USERNAME = 'vs_turn_user';
    process.env.TURN_CREDENTIAL = 'vs_turn_secret_credential';

    const iceServers = signalingDb.getIceServers();
    const customTurn = iceServers.find((s) => s.urls === 'turn:turn.versestudio.app:3478');

    expect(customTurn).toBeDefined();
    expect(customTurn?.username).toBe('vs_turn_user');
    expect(customTurn?.credential).toBe('vs_turn_secret_credential');

    if (originalTurn) {
      process.env.TURN_SERVER_URL = originalTurn;
    } else {
      delete process.env.TURN_SERVER_URL;
    }
  });

  it('6. Supports bidirectional signaling queues between host and client', () => {
    const code = 'VS-EXCH';
    signalingDb.createOrTouchRoom(code);

    // Host sends offer
    const hostPost = signalingDb.postMessage(code, 'host', { type: 'OFFER_TEST' });
    expect(hostPost.ok).toBe(true);

    // Client polls offer
    const clientPoll = signalingDb.pollMessages(code, 'client');
    expect(clientPoll.messages).toHaveLength(1);
    expect(clientPoll.messages[0].type).toBe('OFFER_TEST');

    // Client sends answer
    const clientPost = signalingDb.postMessage(code, 'client', { type: 'ANSWER_TEST' });
    expect(clientPost.ok).toBe(true);

    // Host polls answer
    const hostPoll = signalingDb.pollMessages(code, 'host');
    expect(hostPoll.messages).toHaveLength(1);
    expect(hostPoll.messages[0].type).toBe('ANSWER_TEST');
  });
});

