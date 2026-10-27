/**
 * VerseStudio Core Domain Types
 */

export type RecordingResolution = '4k' | '1440p' | '1080p';
export type RecordingFPS = 30 | 60;

export type RecordingLayout = 
  | 'screen-only' 
  | 'camera-only' 
  | 'screen-camera' 
  | 'split-50-50';

export type RecordingStatus = 
  | 'idle' 
  | 'countdown' 
  | 'recording' 
  | 'paused' 
  | 'stopped';

export type SourceType = 'screen' | 'window' | 'tab';

export type PhoneCameraConnectionStatus = 'disconnected' | 'waiting' | 'connecting' | 'connected' | 'error';

export interface PhoneCameraPeerInfo {
  pairingCode: string;
  streamUrl: string;
  deviceName?: string;
  resolution: '1080p' | '720p';
  fps: number;
  latencyMs: number;
  batteryLevel?: number;
  isStreaming: boolean;
  status: PhoneCameraConnectionStatus;
  errorMessage?: string;
}

export type AudioTrackOption = 
  | 'original-bangla' 
  | 'english-ai' 
  | 'mixed';

export type SubtitleMode = 'bilingual' | 'english-only' | 'off';

export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  banglaText: string;
  englishText: string;
}

export interface ClickEventLog {
  timestamp: number; // in seconds
  x: number; // relative coordinate 0..1
  y: number; // relative coordinate 0..1
  targetTag?: string;
  targetText?: string;
  actionDescription?: string;
}

export interface GuideStep {
  stepNumber: number;
  timestamp: number;
  timeFormatted: string;
  title: string;
  description: string;
  banglaTranscript?: string;
  englishTranscript?: string;
}

export interface StepByStepGuide {
  title: string;
  createdAt: string;
  durationSeconds: number;
  steps: GuideStep[];
  markdownContent: string;
}

export interface AIProcessingState {
  status: 'idle' | 'transcribing' | 'translating' | 'generating-voice' | 'generating-guide' | 'completed' | 'error';
  progress: number; // 0 to 100
  activeStepText: string;
  error?: string;
}


export interface AudioMixSettings {
  micEnabled: boolean;
  systemAudioEnabled: boolean;
  selectedMicDeviceId?: string;
  micVolume: number; // 0 to 1
  systemVolume: number; // 0 to 1
}

export interface LiveToolsState {
  laserActive: boolean;
  spotlightActive: boolean;
  keystrokeHudActive: boolean;
  privacyBlurActive: boolean;
  autoZoomActive: boolean;
  teleprompterActive: boolean;
}

export interface TeleprompterConfig {
  text: string;
  scrollSpeed: number; // 1 to 10
  fontSize: number; // px
  isBangla: boolean;
}

export type DriveCardStatus = 'shared' | 'private' | 'uploading' | 'failed';

export interface DriveRecordingItem {
  id: string;
  name: string;
  driveFileId?: string;
  shareUrl?: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  sizeBytes: number;
  createdAt: string;
  status: DriveCardStatus;
  uploadProgress?: number; // 0 to 100
  resolution: RecordingResolution;
  fps: RecordingFPS;
}

export interface DriveQuota {
  limitBytes: number;
  usageBytes: number;
  availableBytes: number;
}

export type UserPlan = 'free' | 'pro';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: UserPlan;
  aiMinutesUsed: number;
  aiMinutesLimit: number;
  googleDriveConnected: boolean;
  googleDriveEmail?: string;
  twoFactorEnabled?: boolean;
  createdAt: string;
}

export interface UserSession {
  user: UserProfile;
  token: string;
  refreshToken?: string;
  expiresAt: number;
}

export interface UserDeviceSession {
  id: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
}

export interface TwoFactorState {
  enabled: boolean;
  secret?: string;
  qrCodeUri?: string;
  backupCodes?: string[];
}

export type AppTheme = 'dark' | 'light';
export type SupportedLanguage = 'en' | 'bn';
export type VoicePersona = 'natural-female' | 'studio-male' | 'warm-narrator';

export interface StudioShortcuts {
  startStopRecording: string;
  pauseResumeRecording: string;
  toggleSpotlight: string;
  toggleLaser: string;
  toggleKeystrokes: string;
  togglePrivacyBlur: string;
  toggleTeleprompter: string;
}

export interface AppSettings {
  language: SupportedLanguage;
  theme: AppTheme;
  reduceMotion: boolean;
  resolution: RecordingResolution;
  fps: RecordingFPS;
  videoFormat: 'webm' | 'mp4';
  audioBitrateKbps: number;
  safeChunkDurationSeconds: number;
  enableAutoSaveDrive: boolean;
  shortcuts: StudioShortcuts;
  aiVoicePersona: VoicePersona;
  aiDefaultSubtitles: SubtitleMode;
}

export const DEFAULT_STUDIO_SETTINGS: AppSettings = {
  language: 'en',
  theme: 'dark',
  reduceMotion: false,
  resolution: '4k',
  fps: 60,
  videoFormat: 'webm',
  audioBitrateKbps: 320,
  safeChunkDurationSeconds: 5,
  enableAutoSaveDrive: true,
  shortcuts: {
    startStopRecording: 'Alt+R',
    pauseResumeRecording: 'Alt+Space',
    toggleSpotlight: 'Alt+S',
    toggleLaser: 'Alt+L',
    toggleKeystrokes: 'Alt+K',
    togglePrivacyBlur: 'Alt+P',
    toggleTeleprompter: 'Alt+T',
  },
  aiVoicePersona: 'natural-female',
  aiDefaultSubtitles: 'bilingual',
};

