import { create } from 'zustand';
import type { PhoneCameraPeerInfo, PhoneCameraConnectionStatus } from '@verse-studio/shared';
import { PhoneCameraService } from './phoneCameraService';
import { getMobileStreamBaseUrl } from '../config/env';

export interface PhoneCameraState {
  status: PhoneCameraConnectionStatus;
  pairingCode: string;
  pairingToken: string;
  streamUrl: string;
  peerInfo: PhoneCameraPeerInfo | null;
  remoteStream: MediaStream | null;
  isModalOpen: boolean;
  isUsingPhoneCamera: boolean;

  // Actions
  startPairingSession: () => void;
  connectSimulatedPhone: () => MediaStream;
  disconnectPhone: () => void;
  setIsModalOpen: (open: boolean) => void;
  setUsingPhoneCamera: (using: boolean) => void;
}

let activeService: PhoneCameraService | null = null;

export const usePhoneCameraStore = create<PhoneCameraState>((set, get) => ({
  status: 'disconnected',
  pairingCode: '',
  pairingToken: '',
  streamUrl: '',
  peerInfo: null,
  remoteStream: null,
  isModalOpen: false,
  isUsingPhoneCamera: false,

  startPairingSession: () => {
    if (activeService) {
      activeService.disconnect();
    }

    const code = PhoneCameraService.generatePairingCode();
    const token = PhoneCameraService.generatePairingToken();
    const mobileBase = getMobileStreamBaseUrl();
    const streamUrl = mobileBase
      ? `${mobileBase}?token=${token}&pair=${code}`
      : `?token=${token}&pair=${code}`;

    const service = new PhoneCameraService(code, {
      onStatusChange: (status) => set({ status }),
      onConnected: (stream, peerInfo) => {
        set({
          status: 'connected',
          remoteStream: stream,
          peerInfo,
        });
      },
      onDisconnected: () => {
        set({
          status: 'disconnected',
          remoteStream: null,
          peerInfo: null,
          isUsingPhoneCamera: false,
        });
      },
      onError: (err) => {
        console.warn('Phone camera service error:', err);
        set({ status: 'error' });
      },
    }, { token });

    activeService = service;
    service.startHost();

    set({
      status: 'waiting',
      pairingCode: code,
      pairingToken: token,
      streamUrl,
      peerInfo: null,
      remoteStream: null,
      isModalOpen: true,
    });
  },

  connectSimulatedPhone: () => {
    if (!activeService) {
      const code = get().pairingCode || PhoneCameraService.generatePairingCode();
      activeService = new PhoneCameraService(code, {
        onStatusChange: (status) => set({ status }),
        onConnected: (stream, peerInfo) => {
          set({
            status: 'connected',
            remoteStream: stream,
            peerInfo,
          });
        },
        onDisconnected: () => {
          set({
            status: 'disconnected',
            remoteStream: null,
            peerInfo: null,
            isUsingPhoneCamera: false,
          });
        },
      });
    }

    const stream = activeService.simulateConnection();
    return stream;
  },

  disconnectPhone: () => {
    if (activeService) {
      activeService.disconnect();
      activeService = null;
    }

    set({
      status: 'disconnected',
      remoteStream: null,
      peerInfo: null,
      isUsingPhoneCamera: false,
    });
  },

  setIsModalOpen: (open) => set({ isModalOpen: open }),
  setUsingPhoneCamera: (using) => set({ isUsingPhoneCamera: using }),
}));
