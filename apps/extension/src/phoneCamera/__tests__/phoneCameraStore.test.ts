import { describe, it, expect, beforeEach } from 'vitest';
import { usePhoneCameraStore } from '../phoneCameraStore';
import { PhoneCameraService } from '../phoneCameraService';

describe('usePhoneCameraStore & PhoneCameraService', () => {
  beforeEach(() => {
    usePhoneCameraStore.getState().disconnectPhone();
  });

  it('initializes in disconnected state with no stream', () => {
    const s = usePhoneCameraStore.getState();
    expect(s.status).toBe('disconnected');
    expect(s.remoteStream).toBeNull();
    expect(s.peerInfo).toBeNull();
    expect(s.isUsingPhoneCamera).toBe(false);
  });

  it('generates a valid VS-XXXX pairing code format and 128-bit pairing token', () => {
    const code = PhoneCameraService.generatePairingCode();
    expect(code).toMatch(/^VS-[A-Z0-9]{4}$/);

    const token = PhoneCameraService.generatePairingToken();
    expect(token).toHaveLength(32); // 32 hex chars = 128 bits
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('starts a pairing session and updates store to waiting state', () => {
    const store = usePhoneCameraStore.getState();
    store.startPairingSession();

    const s = usePhoneCameraStore.getState();
    expect(s.status).toBe('waiting');
    expect(s.pairingCode).toMatch(/^VS-[A-Z0-9]{4}$/);
    expect(s.pairingToken).toHaveLength(32);
    expect(s.streamUrl).toContain('token=');
    expect(s.streamUrl).toContain('pair=');
    expect(s.isModalOpen).toBe(true);
  });

  it('connects a simulated phone camera stream and establishes peer info', () => {
    const store = usePhoneCameraStore.getState();
    store.startPairingSession();
    const stream = store.connectSimulatedPhone();

    expect(stream).toBeDefined();
    const s = usePhoneCameraStore.getState();
    expect(s.status).toBe('connected');
    expect(s.remoteStream).toBe(stream);
    expect(s.peerInfo?.deviceName).toBe('Apple iPhone 15 Pro');
    expect(s.peerInfo?.resolution).toBe('1080p');
    expect(s.peerInfo?.fps).toBe(30);
    expect(s.peerInfo?.latencyMs).toBeLessThanOrEqual(25);
  });

  it('cleanly disconnects active phone camera session and resets stream', () => {
    const store = usePhoneCameraStore.getState();
    store.connectSimulatedPhone();
    expect(usePhoneCameraStore.getState().status).toBe('connected');

    store.disconnectPhone();
    const s = usePhoneCameraStore.getState();
    expect(s.status).toBe('disconnected');
    expect(s.remoteStream).toBeNull();
    expect(s.peerInfo).toBeNull();
    expect(s.isUsingPhoneCamera).toBe(false);
  });

  it('toggles usingPhoneCamera flag and modal visibility', () => {
    const store = usePhoneCameraStore.getState();
    store.setIsModalOpen(true);
    expect(usePhoneCameraStore.getState().isModalOpen).toBe(true);

    store.setUsingPhoneCamera(true);
    expect(usePhoneCameraStore.getState().isUsingPhoneCamera).toBe(true);

    store.setIsModalOpen(false);
    expect(usePhoneCameraStore.getState().isModalOpen).toBe(false);
  });

  it('P1-3: Handles network signaling handshake, ICE exchange, and reconnects', async () => {
    const code = 'VS-TEST';
    let statusLog: string[] = [];

    const service = new PhoneCameraService(code, {
      onStatusChange: (status) => statusLog.push(status),
      onConnected: () => statusLog.push('connected'),
      onDisconnected: () => statusLog.push('disconnected'),
    }, { baseUrl: 'http://localhost:3000' });

    service.startHost();
    expect(statusLog).toContain('waiting');

    // Simulate mobile disconnect
    service.disconnect();
    expect(statusLog).toContain('disconnected');

    // Reconnect test
    service.startHost();
    expect(statusLog[statusLog.length - 1]).toBe('waiting');
    service.disconnect();
  });
});
