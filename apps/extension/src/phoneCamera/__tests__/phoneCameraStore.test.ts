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

  it('generates a valid VS-XXXX pairing code format', () => {
    const code = PhoneCameraService.generatePairingCode();
    expect(code).toMatch(/^VS-[A-Z0-9]{4}$/);
  });

  it('starts a pairing session and updates store to waiting state', () => {
    const store = usePhoneCameraStore.getState();
    store.startPairingSession();

    const s = usePhoneCameraStore.getState();
    expect(s.status).toBe('waiting');
    expect(s.pairingCode).toMatch(/^VS-[A-Z0-9]{4}$/);
    expect(s.streamUrl).toContain('mobile-camera?pair=');
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
});
