import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  IconButton,
  RecordButton,
  Modal,
  MicLevel,
  ProgressBar,
  WallpaperSwatch,
  CountdownOverlay,
  TimelineTrimmer,
  ToolPalette,
  Teleprompter,
  UserMenu,
  LiveSubtitle,
  AudioTrackSelector,
  LayoutSwitcher,
  CameraBubble,
  MiniController as MiniControllerBar,
  KeyboardShortcutPill,
  Toggle,
  Slider,
  Select,
  HugeIcon,
  cn,
  type ToolPaletteState,
  DEFAULT_WALLPAPERS,
} from '@verse-studio/ui';
import {
  getTranslation,
  type SupportedLanguage,
  type RecordingLayout,
  type DriveRecordingItem,
} from '@verse-studio/shared';
import {
  CameraOff01Icon,
  Settings01Icon,
  Sun01Icon,
  Moon01Icon,
  VolumeHighIcon,
  VolumeOffIcon,
  PlayIcon,
  PauseIcon,
  Download01Icon,
  Delete01Icon,
  RotateLeft01Icon,
  Alert01Icon,
  CloudIcon,
  SparklesIcon,
  File01Icon,
  AiTranscribeAudioIcon,
  SmartPhone01Icon,
  GoBackward5SecIcon,
  GoForward5SecIcon,
  FullScreenIcon,
  Mic01Icon,
  TranslateIcon,
} from '@hugeicons/core-free-icons';

import { CaptureEngine, DeviceInfo, RecordingStatus } from '../recording/captureEngine';
import { RecordingStorage, StoredRecordingMeta } from '../recording/storage';
import { ExportMuxer, ExportProgress } from '../recording/exportMuxer';
import { MiniController } from '../recording/miniController';
import {
  useAuthStore,
  AuthModal,
  OnboardingModal,
  AccountModals,
  type AccountModalType,
  type AuthModalView,
} from '../auth';
import {
  useDriveStore,
  LibraryView,
  PostStudioDriveModal,
} from '../drive';
import {
  useAIStore,
  ProcessingAiModal,
  GuidePreviewModal,
} from '../ai';
import {
  usePhoneCameraStore,
  PhoneCameraModal,
} from '../phoneCamera';
import {
  useSettingsStore,
  SettingsModal,
} from '../settings';

/**
 * Clean Figma Mockup Dashboard (Figma Screen 12 Nodes 17:31-17:47)
 * Shown inside the Captured Window container prior to screen connection
 */
const FigmaDashboardMockup: React.FC<{ onSelect: () => void }> = ({ onSelect }) => (
  <div
    onClick={onSelect}
    className="w-full h-full bg-[var(--color-bg-surface)] flex flex-col overflow-hidden select-none cursor-pointer group"
  >
    {/* Title bar with traffic light window dots */}
    <div className="h-10 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] flex items-center px-4 justify-between shrink-0">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D4F]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
      </div>
      <div className="w-64 h-5 rounded-full bg-[var(--color-border-default)] flex items-center justify-center opacity-80">
        <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">https://example.com/recording-source</span>
      </div>
      <div className="w-12" />
    </div>

    {/* Body */}
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar wireframe */}
      <div className="w-36 bg-[var(--color-bg-elevated)] p-3 border-r border-[var(--color-border-subtle)] space-y-2 hidden sm:block">
        <div className="w-16 h-3 rounded bg-[var(--color-border-default)] mb-3" />
        <div className="w-full h-6 rounded bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/30" />
        <div className="w-20 h-5 rounded bg-[var(--color-bg-hover)]" />
        <div className="w-24 h-5 rounded bg-[var(--color-bg-hover)]" />
      </div>

      {/* Main mockup canvas */}
      <div className="flex-1 p-5 space-y-4 flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-h3 text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">
              Dashboard
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-medium">
              Click anywhere to connect display
            </span>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Recordings</span>
              <p className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">24 videos</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Storage</span>
              <p className="text-sm sm:text-base font-bold text-[var(--color-brand-default)]">Google Drive</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-1">
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Quality</span>
              <p className="text-sm sm:text-base font-bold text-[var(--color-text-primary)]">4K · 60 FPS</p>
            </div>
          </div>

          {/* Wireframe content lines */}
          <div className="space-y-2 opacity-50">
            <div className="w-3/4 h-2.5 rounded-full bg-[var(--color-border-default)]" />
            <div className="w-1/2 h-2.5 rounded-full bg-[var(--color-border-default)]" />
            <div className="w-2/3 h-2.5 rounded-full bg-[var(--color-border-default)]" />
          </div>
        </div>

        <div className="text-center py-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-semibold text-xs shadow-[var(--glow-brand)] group-hover:scale-105 transition-transform">
            Select Screen, Window, or Tab to Record
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const StudioApp: React.FC = () => {
  // App State & Preferences
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<'studio' | 'post-studio' | 'library'>('studio');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showDriveUploadModal, setShowDriveUploadModal] = useState(false);

  // Engine & Device State
  const [engine, setEngine] = useState<CaptureEngine | null>(null);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [hasScreenSource, setHasScreenSource] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const [availableCameras, setAvailableCameras] = useState<DeviceInfo[]>([]);
  const [availableMics, setAvailableMics] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');

  // Sidebar Settings Tabs (Figma Screen 12, 13, 14: Capture | Camera | Look)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'capture' | 'camera' | 'look'>('capture');
  const [sourceType, setSourceType] = useState<'screen' | 'window' | 'tab'>('screen');
  const [cameraShape, setCameraShape] = useState<'circle' | 'rounded'>('circle');
  const [bubbleSize, setBubbleSize] = useState<number>(140);
  const [bubblePosition, setBubblePosition] = useState<{ x: number; y: number }>({ x: 0.82, y: 0.78 });
  const [mirrorCamera, setMirrorCamera] = useState<boolean>(false);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [systemAudio, setSystemAudio] = useState<boolean>(true);
  const [dropShadow, setDropShadow] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(2.0);
  const [clickRipple, setClickRipple] = useState<boolean>(true);

  // Compositor Styling State
  const [layout, setLayout] = useState<RecordingLayout>('screen-camera');
  const [wallpaperId, setWallpaperId] = useState('studio-green');
  const [wallpaperVal, setWallpaperVal] = useState(DEFAULT_WALLPAPERS[0].value);
  const [padding, setPadding] = useState<number>(48);
  const [radius, setRadius] = useState<number>(24);

  // Countdown Overlay
  const [showCountdown, setShowCountdown] = useState(false);

  // Phase 2 Live Tools State
  const [tools, setTools] = useState<ToolPaletteState>({
    laser: false,
    spotlight: false,
    keystroke: true,
    privacy: false,
    autoZoom: true,
    teleprompter: false,
  });
  const [teleprompterOpen, setTeleprompterOpen] = useState(false);
  const [showLongRecordingWarning, setShowLongRecordingWarning] = useState(false);

  // Crash Recovery
  const [recoverableSession, setRecoverableSession] = useState<StoredRecordingMeta | null>(null);

  // Post-Studio Recording Data
  const [currentRecordingId, setCurrentRecordingId] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewMuted, setPreviewMuted] = useState(false);

  // Modals & Exporting State
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const exportAbortRef = useRef<AbortController | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Phase 3 Auth & Onboarding State
  const authStore = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('sign-in');
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [activeAccountModal, setActiveAccountModal] = useState<AccountModalType>(null);

  // Phase 5 Bilingual AI State
  const aiStore = useAIStore();
  const [previewSubtitlesActive, setPreviewSubtitlesActive] = useState(true);

  // Phase 6 Phone Camera State
  const phoneCameraStore = usePhoneCameraStore();

  // DOM References
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const miniControllerRef = useRef<MiniController | null>(null);

  const t = getTranslation(lang);

  // Synchronize document theme and language attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Synchronize recording blob with video preview object URL
  useEffect(() => {
    if (recordingBlob) {
      const url = URL.createObjectURL(recordingBlob);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [recordingBlob]);

  // Ensure preview video element loads the new source whenever it mounts or url changes
  useEffect(() => {
    if (previewVideoRef.current && previewUrl) {
      previewVideoRef.current.src = previewUrl;
      previewVideoRef.current.load();
    }
  }, [previewUrl, view]);

  // Format Milliseconds into HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize Capture Engine and Enumerate Devices
  useEffect(() => {
    const newEngine = new CaptureEngine(
      {
        width: 3840,
        height: 2160,
        fps: 60,
        wallpaper: wallpaperVal,
        padding: Math.round(padding * (3840 / 960)),
        borderRadius: Math.round(radius * (3840 / 960)),
      },
      {
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
          miniControllerRef.current?.update(
            newStatus === 'recording' || newStatus === 'paused',
            newStatus === 'paused',
            formatTime(newEngine.getElapsedMs()),
            newEngine.micMuted
          );
        },
        onTimeUpdate: (ms) => {
          setElapsedMs(ms);
          useAIStore.getState().updateLiveCueForTimestamp(ms / 1000);
          miniControllerRef.current?.update(
            true,
            false,
            formatTime(ms),
            newEngine.micMuted
          );
        },
        onMicLevel: (lvl) => setMicLevel(lvl),
        onError: (err) => console.error('[Engine Error]', err),
      }
    );

    setEngine(newEngine);

    // Mount compositor canvas to viewport
    if (canvasContainerRef.current) {
      canvasContainerRef.current.innerHTML = '';
      const canvasEl = newEngine.compositor.getCanvas();
      canvasEl.className = 'w-full h-full object-contain pointer-events-none';
      canvasContainerRef.current.appendChild(canvasEl);
    }

    // Initialize Document PiP MiniController
    miniControllerRef.current = new MiniController({
      onPauseResume: () => {
        if (newEngine.getStatus() === 'recording') {
          newEngine.pauseRecording();
        } else if (newEngine.getStatus() === 'paused') {
          newEngine.resumeRecording();
        }
      },
      onStop: async () => {
        const id = await newEngine.stopRecording();
        miniControllerRef.current?.close();
        handleRecordingStopped(id);
      },
      onToggleMic: () => {
        const isMuted = newEngine.toggleMicMute();
        setMicMuted(isMuted);
      },
    });

    // Enumerate hardware devices
    CaptureEngine.getAvailableDevices().then(({ cameras, mics }) => {
      setAvailableCameras(cameras);
      setAvailableMics(mics);
      if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
      if (mics.length > 0) setSelectedMic(mics[0].deviceId);

      // Auto-connect default camera & microphone
      newEngine.setCamera(true, cameras[0]?.deviceId)
        .then(() => setCameraStream(newEngine.getCameraStream()))
        .catch(() => {});
      newEngine.setMicrophone(true, mics[0]?.deviceId).catch(() => {});
    });

    // Wire Phone Camera store to update engine when connected
    const unsubPhoneCamera = usePhoneCameraStore.subscribe((state) => {
      if (state.isUsingPhoneCamera && state.remoteStream) {
        newEngine.compositor.setCameraSource(state.remoteStream);
      }
    });

    // Initialize Auth, Google Drive library & settings
    useAuthStore.getState().initialize();
    useDriveStore.getState().initialize();
    useSettingsStore.getState().initialize();

    // Check for crash recovery session
    RecordingStorage.checkRecoverableSession().then((session) => {
      if (session) setRecoverableSession(session);
    });

    return () => {
      unsubPhoneCamera();
      newEngine.dispose();
      miniControllerRef.current?.close();
    };
  }, []);

  // Sync canvas container ref whenever view switches back to studio
  useEffect(() => {
    if (view === 'studio' && canvasContainerRef.current && engine) {
      canvasContainerRef.current.innerHTML = '';
      const canvasEl = engine.compositor.getCanvas();
      canvasEl.className = 'w-full h-full object-contain pointer-events-none';
      canvasContainerRef.current.appendChild(canvasEl);
    }
  }, [view, engine, hasScreenSource]);

  // Update compositor configuration when styling changes
  useEffect(() => {
    if (!engine) return;
    engine.compositor.config.wallpaper = wallpaperVal;
    engine.compositor.config.padding = Math.round(padding * (3840 / 960));
    engine.compositor.config.borderRadius = Math.round(radius * (3840 / 960));
    engine.compositor.config.cameraBubbleSize = Math.round(bubbleSize * (3840 / 960));
    engine.compositor.setLayout(layout);
  }, [engine, wallpaperVal, padding, radius, bubbleSize, layout]);

  // Handle Source Selection with displaySurface hint
  const handleSelectSourceByType = async (surfaceTypeTarget: 'screen' | 'window' | 'tab') => {
    setSourceType(surfaceTypeTarget);
    if (!engine) return;
    try {
      const surface = surfaceTypeTarget === 'screen' ? 'monitor' : surfaceTypeTarget === 'window' ? 'window' : 'browser';
      const stream = await engine.selectScreenSource(surface);
      if (stream) {
        setHasScreenSource(true);
        setScreenStream(stream);
      }
    } catch {
      // User cancelled picker
    }
  };

  // Handle Layout Switcher
  const handleLayoutChange = (newLayout: RecordingLayout) => {
    setLayout(newLayout);
    if (engine) {
      engine.compositor.setLayout(newLayout);
    }
  };

  // Handle Bubble Position Change
  const handleBubblePositionChange = (pos: { x: number; y: number }) => {
    setBubblePosition(pos);
    if (engine) {
      engine.compositor.setCameraBubblePosition(pos.x, pos.y);
    }
  };

  // Handle Camera Toggle & Selection
  const handleToggleCamera = async () => {
    if (!engine) return;
    const nextState = !cameraEnabled;
    setCameraEnabled(nextState);
    await engine.setCamera(nextState, selectedCamera);
    setCameraStream(nextState ? engine.getCameraStream() : null);
  };

  const handleSelectCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (cameraEnabled && engine) {
      await engine.setCamera(true, deviceId);
      setCameraStream(engine.getCameraStream());
    }
  };

  // Handle Microphone Toggle & Selection
  const handleToggleMic = () => {
    if (!engine) return;
    const nextMuted = engine.toggleMicMute();
    setMicMuted(nextMuted);
  };

  const handleSelectMic = async (deviceId: string) => {
    setSelectedMic(deviceId);
    if (engine) {
      await engine.setMicrophone(!micMuted, deviceId);
    }
  };

  // Phase 2 Live Tools Toggle Handler
  const toggleTool = (tool: keyof ToolPaletteState) => {
    setTools((prev) => {
      const nextVal = !prev[tool];
      const nextTools = { ...prev, [tool]: nextVal };
      if (tool === 'teleprompter') {
        setTeleprompterOpen(nextVal);
      }
      // Broadcast to active tab content script
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_LIVE_TOOL',
              tool,
              state: nextVal,
            }).catch(() => {});
          }
        });
      }
      return nextTools;
    });
  };

  // Screen 22: Long Recording Advisory trigger (30+ minutes)
  useEffect(() => {
    if (elapsedMs >= 30 * 60 * 1000 && !showLongRecordingWarning) {
      setShowLongRecordingWarning(true);
    }
  }, [elapsedMs, showLongRecordingWarning]);

  // Start Countdown and Recording
  const handleStartRecordingClick = async () => {
    if (status === 'recording' || status === 'paused') {
      handleStopRecording();
      return;
    }

    // Wake up Web Audio context on user gesture
    await engine?.resumeAudio();

    // If layout requires screen capture and none has been selected yet, prompt user immediately
    if (layout !== 'camera-only' && (!hasScreenSource || !engine?.getScreenStream())) {
      try {
        const surface = sourceType === 'screen' ? 'monitor' : sourceType === 'window' ? 'window' : 'browser';
        const stream = await engine?.selectScreenSource(surface);
        if (stream) {
          setHasScreenSource(true);
          setScreenStream(stream);
        } else {
          return;
        }
      } catch {
        // User cancelled picker
        return;
      }
    }

    setShowCountdown(true);
  };

  const onCountdownComplete = async () => {
    setShowCountdown(false);
    if (!engine) return;
    const recId = await engine.startRecording();
    setCurrentRecordingId(recId);
    // Request Document PiP window
    await miniControllerRef.current?.open();
  };

  const handleStopRecording = async () => {
    if (!engine) return;
    const recId = await engine.stopRecording();
    miniControllerRef.current?.close();
    handleRecordingStopped(recId);
  };

  const handleRecordingStopped = async (recId: string) => {
    setCurrentRecordingId(recId);
    const data = await RecordingStorage.getRecordingBlob(recId);
    if (data && data.blob.size > 0) {
      setRecordingBlob(data.blob);
      const durSecs = Math.max(1, (data.meta.durationMs || 1000) / 1000);
      setVideoDuration(durSecs);
      setTrimRange({ start: 0, end: durSecs });
      setCurrentTime(0);
      setIsPlaying(false);
      setView('post-studio');
    }
  };

  // Recover interrupted crash recording
  const handleRecoverSession = async () => {
    if (!recoverableSession) return;
    const data = await RecordingStorage.getRecordingBlob(recoverableSession.id);
    if (data && data.blob.size > 0) {
      setRecordingBlob(data.blob);
      setCurrentRecordingId(recoverableSession.id);
      const durSecs = Math.max(1, (data.meta.durationMs || 5000) / 1000);
      setVideoDuration(durSecs);
      setTrimRange({ start: 0, end: durSecs });
      setCurrentTime(0);
      setIsPlaying(false);
      setView('post-studio');
      setRecoverableSession(null);
    }
  };

  // Load a recording from the Library for playback & trimming
  const handleLoadLibraryRecording = async (item: DriveRecordingItem) => {
    setCurrentRecordingId(item.id);
    const data = await RecordingStorage.getRecordingBlob(item.id);
    if (data && data.blob.size > 0) {
      setRecordingBlob(data.blob);
      const durSecs = (data.meta.durationMs || item.durationSeconds * 1000) / 1000;
      setVideoDuration(durSecs);
      setTrimRange({ start: 0, end: durSecs });
      setCurrentTime(0);
      setIsPlaying(false);
      setView('post-studio');
    }
  };

  // Switch to Post-Studio and auto-load stored or library recording if empty
  const handleOpenPostStudio = async () => {
    if (recordingBlob) {
      setView('post-studio');
      return;
    }
    try {
      const sessions = await RecordingStorage.getAllSessions();
      if (sessions && sessions.length > 0) {
        const latest = sessions[sessions.length - 1];
        const data = await RecordingStorage.getRecordingBlob(latest.id);
        if (data && data.blob.size > 0) {
          setRecordingBlob(data.blob);
          setCurrentRecordingId(latest.id);
          const durSecs = Math.max(1, (data.meta.durationMs || 5000) / 1000);
          setVideoDuration(durSecs);
          setTrimRange({ start: 0, end: durSecs });
          setCurrentTime(0);
          setIsPlaying(false);
          setView('post-studio');
          return;
        }
      }
    } catch {
      // Fallback
    }

    const libraryItems = useDriveStore.getState().recordings;
    if (libraryItems.length > 0) {
      await handleLoadLibraryRecording(libraryItems[0]);
    }
  };

  // Export handlers
  const handleExportWebM = async () => {
    if (!recordingBlob) return;
    const filename = `VerseStudio_4K_${Date.now()}`;
    const controller = new AbortController();
    exportAbortRef.current = controller;
    setExportProgress({ stage: 'analyzing', percentage: 10 });
    try {
      await ExportMuxer.exportWebM(
        recordingBlob,
        filename,
        trimRange,
        (p) => setExportProgress(p),
        controller.signal
      );
      setTimeout(() => setExportProgress(null), 1500);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('WebM export failed:', e);
      }
      setExportProgress(null);
    } finally {
      exportAbortRef.current = null;
    }
  };

  const handleExportMP4 = async () => {
    if (!recordingBlob) return;
    const filename = `VerseStudio_4K_${Date.now()}`;
    const controller = new AbortController();
    exportAbortRef.current = controller;
    setExportProgress({ stage: 'analyzing', percentage: 10 });
    try {
      await ExportMuxer.exportMP4(
        recordingBlob,
        filename,
        trimRange,
        (p) => setExportProgress(p),
        controller.signal
      );
      setTimeout(() => setExportProgress(null), 1500);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('MP4 export failed:', e);
      }
      setExportProgress(null);
    } finally {
      exportAbortRef.current = null;
    }
  };

  // Video Preview Playback controls
  const togglePlay = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col select-none">
      {/* Countdown Fullscreen Overlay (Figma Screen 19) */}
      {showCountdown && (
        <CountdownOverlay
          onComplete={onCountdownComplete}
          onCancel={() => setShowCountdown(false)}
        />
      )}

      {/* Recover Interrupted Recording Banner */}
      {recoverableSession && view === 'studio' && (
        <div className="bg-[var(--color-brand-subtle)] border-b border-[var(--color-brand-default)]/40 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-label-s text-[var(--color-brand-default)]">
            <HugeIcon icon={Alert01Icon} size={16} />
            <span>Interrupted recording recovered from crash: {recoverableSession.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handleRecoverSession}>
              Review & Save Recording
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                RecordingStorage.deleteSession(recoverableSession.id);
                setRecoverableSession(null);
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Screen 22: Long Recording Advisory Banner */}
      {showLongRecordingWarning && (
        <div className="bg-[var(--color-warning-subtle)] border-b border-[var(--color-warning-default)]/40 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-label-s text-[var(--color-warning-default)]">
            <HugeIcon icon={Alert01Icon} size={16} className="shrink-0" />
            <span>
              <strong>Advisory:</strong> Recording duration has reached 30+ minutes. All chunks are continuously written to IndexedDB disk storage without RAM accumulation.
            </span>
          </div>
          <button
            onClick={() => setShowLongRecordingWarning(false)}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Bar (Figma Screen 12 Node 17:4) */}
      <header className="h-16 px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center justify-between shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center shrink-0">
            <span className="w-4 h-4 rounded-full bg-[var(--color-bg-canvas)] flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-[var(--color-record-default)]" />
            </span>
          </div>
          <h1 className="font-h4 text-lg sm:text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            VerseStudio
          </h1>
          <div className="hidden min-[720px]:inline-block px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)] text-xs font-medium">
            4K · 60 FPS
          </div>
        </div>

        {/* View Switcher: Studio | Post-Studio | Library */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[var(--color-bg-hover)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
          <button
            type="button"
            onClick={() => setView('studio')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              view === 'studio'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Studio
          </button>
          <button
            type="button"
            onClick={handleOpenPostStudio}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              view === 'post-studio'
                ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="hidden min-[720px]:inline">Post-Studio</span>
            <span className="min-[720px]:hidden">Post</span>
          </button>
          <button
            type="button"
            onClick={() => setView('library')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
              view === 'library'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Library
          </button>
        </div>

        {/* Actions (Figma Screen 12 Node 17:13) */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-0.5">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all ${
                lang === 'en'
                  ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2 py-1 text-xs rounded font-medium transition-all font-bangla ${
                lang === 'bn'
                  ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              বাং
            </button>
          </div>

          {/* Theme Toggle */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Toggle theme"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <HugeIcon icon={Sun01Icon} size={16} /> : <HugeIcon icon={Moon01Icon} size={16} />}
          </IconButton>

          {/* Settings Button (Figma 17:14) */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <HugeIcon icon={Settings01Icon} size={18} />
          </IconButton>

          {/* User Avatar Button (Figma 51:3366) */}
          {authStore.isAuthenticated && authStore.user ? (
            <UserMenu
              user={{
                name: authStore.user.name,
                email: authStore.user.email,
                avatarUrl: authStore.user.avatarUrl,
                plan: authStore.user.plan,
              }}
              onOpenProfile={() => setActiveAccountModal('profile')}
              onOpenSecurity={() => setActiveAccountModal('security')}
              onOpenPlan={() => setActiveAccountModal('plan')}
              onOpenHelp={() => setActiveAccountModal('help')}
              onSignOut={() => authStore.signOut()}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalView('sign-in');
                setAuthModalOpen(true);
              }}
              className="w-7 h-7 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)] font-medium text-xs flex items-center justify-center border border-[var(--color-brand-default)]/30 hover:border-[var(--color-brand-default)] transition-colors"
              title="Sign in / Profile"
            >
              RA
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Viewport (Figma Screen 12, 13, 14, 20) */}
      {view === 'studio' ? (
        <main className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden w-full bg-[var(--color-bg-canvas)]">
          {/* Left: Main Stage / Preview (Figma 17:29) */}
          <section className="flex-1 h-full flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="flex-1 w-full flex items-center justify-center">
              {/* Central Preview Canvas (Figma 17:30) */}
              <div
                ref={previewContainerRef}
                style={{
                  background: wallpaperVal,
                  borderRadius: '24px',
                }}
                className="w-full max-w-[960px] aspect-video max-h-[540px] relative overflow-hidden flex items-center justify-center border border-[var(--color-border-default)] shadow-2xl transition-all duration-300"
              >
                {/* Inner Window Frame with padding */}
                <div
                  style={{
                    padding: `${padding}px`,
                  }}
                  className="w-full h-full flex items-center justify-center relative pointer-events-auto"
                >
                  {/* Captured Window (Figma 17:31) */}
                  <div
                    style={{
                      borderRadius: `${radius}px`,
                      boxShadow: dropShadow ? 'var(--shadow-xl)' : 'none',
                    }}
                    className={cn(
                      'w-full h-full relative overflow-hidden flex items-center justify-center border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] transition-all',
                      !hasScreenSource && layout !== 'camera-only' && 'cursor-pointer'
                    )}
                    onClick={() => {
                      if (!hasScreenSource && layout !== 'camera-only') {
                        handleSelectSourceByType(sourceType);
                      }
                    }}
                  >
                    {/* Camera Only layout */}
                    {layout === 'camera-only' ? (
                      <div className="w-full h-full relative bg-[var(--color-bg-elevated)] flex items-center justify-center">
                        {cameraEnabled && (phoneCameraStore.remoteStream || engine?.getCameraStream()) ? (
                          <video
                            autoPlay
                            playsInline
                            muted
                            ref={(el) => {
                              if (el) {
                                el.srcObject = phoneCameraStore.remoteStream || engine?.getCameraStream() || null;
                                el.play().catch(() => {});
                              }
                            }}
                            className={cn('w-full h-full object-cover', mirrorCamera && 'scale-x-[-1]')}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3">
                            <HugeIcon icon={CameraOff01Icon} size={48} className="text-[var(--color-text-tertiary)]" />
                            <span className="text-sm font-medium text-[var(--color-text-secondary)]">Camera Off</span>
                          </div>
                        )}
                      </div>
                    ) : layout === 'split-50-50' ? (
                      /* Split 50/50 Layout */
                      <div className="w-full h-full flex items-center">
                        <div className="w-1/2 h-full border-r border-[var(--color-border-default)] relative overflow-hidden bg-black flex items-center justify-center">
                          {hasScreenSource && (screenStream || engine?.getScreenStream()) ? (
                            <video
                              autoPlay
                              playsInline
                              muted
                              ref={(el) => {
                                if (el) {
                                  el.srcObject = screenStream || engine?.getScreenStream() || null;
                                  el.play().catch(() => {});
                                }
                              }}
                              className="w-full h-full object-contain pointer-events-none"
                            />
                          ) : (
                            <FigmaDashboardMockup onSelect={() => handleSelectSourceByType(sourceType)} />
                          )}
                        </div>
                        <div className="w-1/2 h-full relative overflow-hidden bg-[var(--color-bg-elevated)] flex items-center justify-center">
                          {cameraEnabled && (phoneCameraStore.remoteStream || cameraStream || engine?.getCameraStream()) ? (
                            <video
                              autoPlay
                              playsInline
                              muted
                              ref={(el) => {
                                if (el) {
                                  el.srcObject = phoneCameraStore.remoteStream || cameraStream || engine?.getCameraStream() || null;
                                  el.play().catch(() => {});
                                }
                              }}
                              className={cn('w-full h-full object-cover', mirrorCamera && 'scale-x-[-1]')}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <HugeIcon icon={CameraOff01Icon} size={36} className="text-[var(--color-text-tertiary)]" />
                              <span className="text-xs text-[var(--color-text-secondary)]">Camera Off</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Screen Only or Screen + Camera Bubble */
                      <div className="w-full h-full relative flex items-center justify-center bg-black">
                        {hasScreenSource && (screenStream || engine?.getScreenStream()) ? (
                          <video
                            autoPlay
                            playsInline
                            muted
                            ref={(el) => {
                              if (el) {
                                el.srcObject = screenStream || engine?.getScreenStream() || null;
                                el.play().catch(() => {});
                              }
                            }}
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <FigmaDashboardMockup onSelect={() => handleSelectSourceByType(sourceType)} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Camera Bubble Overlay (Figma 17:48 / 10:177) */}
                  {layout === 'screen-camera' && (
                    <CameraBubble
                      shape={cameraShape}
                      size={bubbleSize}
                      isOff={!cameraEnabled}
                      mirrored={mirrorCamera}
                      videoStream={phoneCameraStore.remoteStream || cameraStream || engine?.getCameraStream() || null}
                      position={bubblePosition}
                      onPositionChange={handleBubblePositionChange}
                      boundsRef={previewContainerRef}
                    />
                  )}
                </div>

                {/* Overlaid REC Badge during recording (Figma 17:229) */}
                {(status === 'recording' || status === 'paused') && (
                  <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#4A1517] border border-[var(--color-record-default)] shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-record-default)] animate-pulse" />
                    <span className="text-xs font-bold text-[#FF6B6B] tracking-wide">REC</span>
                    <span className="font-mono text-xs text-[#F5F5F7] font-medium tracking-tight">
                      {formatTime(elapsedMs)}
                    </span>
                  </div>
                )}

                {/* Floating Tool Palette during recording (Figma 35:879) */}
                {(status === 'recording' || status === 'paused') && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-4 z-30 shadow-2xl">
                    <ToolPalette tools={tools} onToggleTool={toggleTool} showGrip={true} />
                  </div>
                )}

                {/* Floating Teleprompter inside preview (Figma 17:233) */}
                {teleprompterOpen && (
                  <div className="absolute top-4 left-6 z-40 max-w-sm">
                    <Teleprompter
                      isOpen={teleprompterOpen}
                      onClose={() => toggleTool('teleprompter')}
                      isBangla={lang === 'bn'}
                    />
                  </div>
                )}

                {/* Floating Live Subtitles during recording (Figma 35:943) */}
                {(status === 'recording' || status === 'paused') && aiStore.subtitleMode !== 'off' && (
                  <div className="absolute bottom-6 inset-x-6 z-30 flex justify-center pointer-events-none">
                    <LiveSubtitle
                      mode={aiStore.subtitleMode}
                      banglaText={
                        aiStore.currentLiveCue?.banglaText || 'আজকে আমরা মূল বিষয়গুলো শিখব।'
                      }
                      englishText={
                        aiStore.currentLiveCue?.englishText || 'Today we are going to learn the basics.'
                      }
                      isListening={status === 'recording'}
                    />
                  </div>
                )}

                {/* Floating Mini Controller during recording (Figma 17:312) */}
                {(status === 'recording' || status === 'paused') && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                    <MiniControllerBar
                      status={status}
                      timeFormatted={formatTime(elapsedMs)}
                      micMuted={micMuted}
                      cameraOff={!cameraEnabled}
                      onTogglePause={() => {
                        if (status === 'recording') engine?.pauseRecording();
                        else engine?.resumeRecording();
                      }}
                      onStop={handleStopRecording}
                      onToggleMic={handleToggleMic}
                      onToggleCamera={handleToggleCamera}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Layout Switcher & Explanatory Caption (Figma 17:58 & 17:107) */}
            <div className="flex flex-col items-center gap-2 mt-4 shrink-0">
              <LayoutSwitcher value={layout} onChange={handleLayoutChange} />
              <p className="text-sm font-normal text-[var(--color-text-tertiary)] text-center">
                {layout === 'screen-camera'
                  ? 'Screen + Camera Bubble. Drag the bubble anywhere on the canvas.'
                  : layout === 'screen-only'
                  ? 'Screen Only. Full display recording without camera overlay.'
                  : layout === 'camera-only'
                  ? 'Camera Only. High-definition presenter recording.'
                  : 'Split 50/50. Screen presentation and camera side by side.'}
              </p>
            </div>
          </section>

          {/* Right: Settings Panel (Figma 17:108) */}
          <aside className="w-full lg:w-[360px] h-full bg-[var(--color-bg-surface)] border-t lg:border-t-0 lg:border-l border-[var(--color-border-subtle)] flex flex-col shrink-0 shadow-lg">
            {/* Sidebar Tabs (Figma 35:862) */}
            <div className="px-5 pt-3 border-b border-[var(--color-border-subtle)] shrink-0">
              <div className="flex items-center gap-6">
                {(['capture', 'camera', 'look'] as const).map((tabKey) => {
                  const isActive = activeSidebarTab === tabKey;
                  const label =
                    tabKey === 'capture'
                      ? 'Capture'
                      : tabKey === 'camera'
                      ? 'Camera'
                      : 'Look';
                  return (
                    <button
                      key={tabKey}
                      type="button"
                      onClick={() => setActiveSidebarTab(tabKey)}
                      className={cn(
                        'py-3 text-sm font-medium transition-all relative border-b-2 outline-none',
                        isActive
                          ? 'border-[var(--color-brand-default)] text-[var(--color-text-primary)] font-semibold'
                          : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Tab Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* TAB 1: CAPTURE (Figma Screen 12) */}
              {activeSidebarTab === 'capture' && (
                <>
                  {/* SOURCE SECTION */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      SOURCE
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-[var(--color-bg-canvas)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
                      {(['screen', 'window', 'tab'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleSelectSourceByType(type)}
                          className={cn(
                            'py-1.5 text-xs font-medium rounded capitalize transition-all',
                            sourceType === type
                              ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-xs font-semibold'
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                      <span>Status:</span>
                      <span className={hasScreenSource ? 'text-[var(--color-success-default)] font-medium' : 'text-[var(--color-text-tertiary)]'}>
                        {hasScreenSource ? 'Display Connected (4K)' : 'No display stream'}
                      </span>
                    </div>
                  </div>

                  {/* AUDIO SECTION */}
                  <div className="space-y-4 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      AUDIO
                    </span>

                    {/* Microphone Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={Mic01Icon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Microphone</span>
                      </div>
                      <Toggle
                        checked={!micMuted}
                        onCheckedChange={() => handleToggleMic()}
                      />
                    </div>

                    {/* Live Mic Level Row (Figma 82:5514) */}
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pl-7">
                      <span>Mic input level</span>
                      <MicLevel level={micLevel} muted={micMuted} showIcon={false} />
                    </div>

                    {/* System Audio Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={VolumeHighIcon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">System audio</span>
                      </div>
                      <Toggle
                        checked={systemAudio}
                        onCheckedChange={(val) => setSystemAudio(val)}
                      />
                    </div>

                    {/* Bangla to English Subtitles Toggle (Figma 17:143) */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={TranslateIcon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          Bangla to English subtitles
                        </span>
                      </div>
                      <Toggle
                        checked={aiStore.subtitleMode !== 'off'}
                        onCheckedChange={(checked) => aiStore.setSubtitleMode(checked ? 'bilingual' : 'off')}
                      />
                    </div>
                  </div>

                  {/* EFFECTS SECTION (Figma 17:156) */}
                  <div className="space-y-4 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      EFFECTS
                    </span>

                    {/* Auto Cinematic Zoom */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={SparklesIcon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Auto cinematic zoom</span>
                      </div>
                      <Toggle
                        checked={tools.autoZoom}
                        onCheckedChange={() => toggleTool('autoZoom')}
                      />
                    </div>

                    {/* Cursor Spotlight */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={Sun01Icon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Cursor spotlight</span>
                      </div>
                      <Toggle
                        checked={tools.spotlight}
                        onCheckedChange={() => toggleTool('spotlight')}
                      />
                    </div>

                    {/* Keystroke Display */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 h-4 rounded bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] flex items-center justify-center text-[9px] font-mono font-bold text-[var(--color-text-secondary)]">K</span>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Keystroke display</span>
                      </div>
                      <Toggle
                        checked={tools.keystroke}
                        onCheckedChange={() => toggleTool('keystroke')}
                      />
                    </div>

                    {/* Privacy Shield */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={Moon01Icon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Privacy shield</span>
                      </div>
                      <Toggle
                        checked={tools.privacy}
                        onCheckedChange={() => toggleTool('privacy')}
                      />
                    </div>

                    {/* Teleprompter */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <HugeIcon icon={File01Icon} size={18} className="text-[var(--color-text-secondary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">Teleprompter (not recorded)</span>
                      </div>
                      <Toggle
                        checked={tools.teleprompter}
                        onCheckedChange={() => toggleTool('teleprompter')}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: CAMERA (Figma Screen 13) */}
              {activeSidebarTab === 'camera' && (
                <>
                  {/* CAMERA SOURCE */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      CAMERA SOURCE
                    </span>
                    <Select
                      options={
                        availableCameras.length > 0
                          ? availableCameras.map((c) => ({ value: c.deviceId, label: c.label || 'Webcam' }))
                          : [{ value: 'default', label: 'FaceTime HD Camera' }]
                      }
                      value={selectedCamera}
                      onChange={(e) => handleSelectCamera(e.target.value)}
                    />

                    {/* Phone Camera Button (Figma 36:1274) */}
                    <button
                      type="button"
                      onClick={() => {
                        if (phoneCameraStore.status === 'connected' && phoneCameraStore.remoteStream) {
                          phoneCameraStore.setIsModalOpen(true);
                        } else {
                          phoneCameraStore.startPairingSession();
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] hover:border-[var(--color-brand-default)] transition-colors text-sm font-medium text-[var(--color-text-primary)]"
                    >
                      <HugeIcon icon={SmartPhone01Icon} size={16} className="text-[var(--color-brand-default)]" />
                      <span>{phoneCameraStore.isUsingPhoneCamera ? 'Connected: Phone Camera' : 'Use phone camera (wireless)'}</span>
                    </button>

                    {/* Mirror Camera Toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Mirror camera</span>
                      <Toggle
                        checked={mirrorCamera}
                        onCheckedChange={(val) => setMirrorCamera(val)}
                      />
                    </div>
                  </div>

                  {/* BUBBLE SIZE & SHAPE */}
                  <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                        BUBBLE SIZE
                      </span>
                      <span className="font-mono text-xs text-[var(--color-text-secondary)]">{bubbleSize} px</span>
                    </div>
                    <Slider
                      value={[bubbleSize]}
                      min={96}
                      max={240}
                      step={8}
                      onValueChange={([v]) => setBubbleSize(v)}
                    />

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Bubble shape</span>
                      <div className="flex items-center gap-1 bg-[var(--color-bg-canvas)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
                        <button
                          type="button"
                          onClick={() => setCameraShape('circle')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded font-medium transition-all',
                            cameraShape === 'circle'
                              ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-xs font-semibold'
                              : 'text-[var(--color-text-secondary)]'
                          )}
                        >
                          Circle
                        </button>
                        <button
                          type="button"
                          onClick={() => setCameraShape('rounded')}
                          className={cn(
                            'px-2.5 py-1 text-xs rounded font-medium transition-all',
                            cameraShape === 'rounded'
                              ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-xs font-semibold'
                              : 'text-[var(--color-text-secondary)]'
                          )}
                        >
                          Rounded
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* MICROPHONE IN CAMERA TAB */}
                  <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      MICROPHONE
                    </span>
                    <Select
                      options={
                        availableMics.length > 0
                          ? availableMics.map((m) => ({ value: m.deviceId, label: m.label || 'Microphone' }))
                          : [{ value: 'default', label: 'Default Microphone' }]
                      }
                      value={selectedMic}
                      onChange={(e) => handleSelectMic(e.target.value)}
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Noise suppression</span>
                      <Toggle
                        checked={noiseSuppression}
                        onCheckedChange={(val) => setNoiseSuppression(val)}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] pt-1">
                      <span>Mic input level</span>
                      <MicLevel level={micLevel} muted={micMuted} showIcon={false} />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: LOOK (Figma Screen 14) */}
              {activeSidebarTab === 'look' && (
                <>
                  {/* WALLPAPER SECTION */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      WALLPAPER
                    </span>
                    <WallpaperSwatch
                      selectedId={wallpaperId}
                      onSelect={(id, val) => {
                        setWallpaperId(id);
                        setWallpaperVal(val);
                      }}
                    />
                  </div>

                  {/* FRAME SECTION */}
                  <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      FRAME
                    </span>

                    {/* Padding slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-primary)] font-medium">Padding</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">{padding} px</span>
                      </div>
                      <Slider
                        value={[padding]}
                        min={0}
                        max={64}
                        step={8}
                        onValueChange={([v]) => setPadding(v)}
                      />
                    </div>

                    {/* Corner radius slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-primary)] font-medium">Corner radius</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">{radius} px</span>
                      </div>
                      <Slider
                        value={[radius]}
                        min={0}
                        max={32}
                        step={4}
                        onValueChange={([v]) => setRadius(v)}
                      />
                    </div>

                    {/* Drop shadow toggle */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Drop shadow</span>
                      <Toggle
                        checked={dropShadow}
                        onCheckedChange={(val) => setDropShadow(val)}
                      />
                    </div>
                  </div>

                  {/* CURSOR AND MOTION */}
                  <div className="space-y-3 pt-2 border-t border-[var(--color-border-subtle)]">
                    <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                      CURSOR AND MOTION
                    </span>

                    {/* Zoom level */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-primary)] font-medium">Zoom level</span>
                        <span className="font-mono text-[var(--color-text-secondary)]">{zoomLevel.toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={[zoomLevel * 10]}
                        min={10}
                        max={30}
                        step={1}
                        onValueChange={([v]) => setZoomLevel(v / 10)}
                      />
                    </div>

                    {/* Click ripple toggle */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Click ripple</span>
                      <Toggle
                        checked={clickRipple}
                        onCheckedChange={(val) => setClickRipple(val)}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Record Area (Figma Screen 12 Node 17:201) */}
            <div className="p-5 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex items-center gap-4 shrink-0">
              <RecordButton
                size="lg"
                status={status === 'recording' ? 'recording' : status === 'paused' ? 'paused' : 'idle'}
                onClick={handleStartRecordingClick}
              />
              <div className="flex flex-col gap-1">
                <h4 className="font-h4 text-lg font-semibold text-[var(--color-text-primary)] leading-none">
                  {status === 'recording'
                    ? (lang === 'bn' ? 'রেকর্ডিং চলছে...' : 'Recording...')
                    : status === 'paused'
                    ? (lang === 'bn' ? 'রেকর্ডিং স্থগিত' : 'Recording paused')
                    : (lang === 'bn' ? 'রেকর্ডিং শুরু করুন' : 'Start recording')}
                </h4>
                <div className="flex items-center gap-1">
                  <KeyboardShortcutPill keys={['Alt', 'R']} size="sm" />
                </div>
              </div>
            </div>
          </aside>
        </main>
      ) : view === 'post-studio' ? (
        /* Post-Studio Viewport (Screens 23, 24, 26, 27) */
        <main className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full gap-4 sm:gap-5 overflow-y-auto pb-24">
          <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="font-h2 font-bold text-[var(--color-text-primary)]">
                {t.postStudio.title}
              </h2>
              <p className="font-body-s text-[var(--color-text-secondary)] mt-0.5">
                Review your 4K 60FPS recording, trim boundaries, and export locally or to Google Drive.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<HugeIcon icon={RotateLeft01Icon} size={16} />}
                responsiveIconOnly
                title="Record Another"
                onClick={() => setView('studio')}
              >
                Record Another
              </Button>
              <Button
                variant="danger"
                size="sm"
                leadingIcon={<HugeIcon icon={Delete01Icon} size={16} />}
                responsiveIconOnly
                title="Discard"
                onClick={() => setShowDiscardConfirm(true)}
              >
                Discard
              </Button>
            </div>
          </div>

          {/* Video Preview Player with Full Stream Loading & Controls */}
          <div className="relative aspect-video max-h-[240px] sm:max-h-[320px] lg:max-h-[380px] w-full bg-black rounded-2xl overflow-hidden border border-[var(--color-border-default)] shadow-xl flex items-center justify-center group shrink-0">
            <video
              ref={previewVideoRef}
              src={previewUrl || undefined}
              className="w-full h-full object-contain"
              playsInline
              preload="auto"
              muted={previewMuted}
              onLoadedMetadata={() => {
                if (previewVideoRef.current) {
                  const d = previewVideoRef.current.duration;
                  if (d && !isNaN(d) && isFinite(d) && d > 0) {
                    setVideoDuration(d);
                    if (trimRange.end === 0 || trimRange.end > d) {
                      setTrimRange({ start: 0, end: d });
                    }
                  }
                }
              }}
              onTimeUpdate={() => {
                if (previewVideoRef.current) {
                  const t = previewVideoRef.current.currentTime;
                  setCurrentTime(t);
                  aiStore.updateLiveCueForTimestamp(t);
                  if (trimRange.end > 0 && t >= trimRange.end) {
                    previewVideoRef.current.pause();
                    previewVideoRef.current.currentTime = trimRange.start;
                    setIsPlaying(false);
                  }
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => {
                setIsPlaying(false);
                if (previewVideoRef.current) {
                  previewVideoRef.current.currentTime = trimRange.start;
                }
              }}
            />

            {/* Subtitles CC Toggle & Audio Mute on preview player */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMuted((prev) => !prev)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] font-label-s bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all whitespace-nowrap"
                aria-label={previewMuted ? 'Unmute audio' : 'Mute audio'}
                title={previewMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {previewMuted ? <HugeIcon icon={VolumeOffIcon} size={14} className="text-[var(--color-record-default)]" /> : <HugeIcon icon={VolumeHighIcon} size={14} className="text-[var(--color-brand-default)]" />}
                <span className="hidden min-[720px]:inline">{previewMuted ? 'Muted' : 'Audio'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewSubtitlesActive((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border font-label-s transition-all whitespace-nowrap ${
                  previewSubtitlesActive
                    ? 'bg-[var(--color-brand-subtle)] border-[var(--color-brand-default)] text-[var(--color-brand-default)] shadow-sm'
                    : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
                aria-label={previewSubtitlesActive ? 'Subtitles On' : 'Subtitles Off'}
                title={previewSubtitlesActive ? 'Subtitles On' : 'Subtitles Off'}
              >
                <HugeIcon icon={AiTranscribeAudioIcon} size={14} />
                <span className="hidden min-[720px]:inline">CC {previewSubtitlesActive ? 'On' : 'Off'}</span>
              </button>
            </div>

            {/* Subtitles Overlay over player */}
            {previewSubtitlesActive && aiStore.currentLiveCue && (
              <div className="absolute bottom-14 sm:bottom-16 inset-x-4 sm:inset-x-6 z-10 flex justify-center pointer-events-none">
                <LiveSubtitle
                  mode={aiStore.subtitleMode}
                  banglaText={aiStore.currentLiveCue.banglaText}
                  englishText={aiStore.currentLiveCue.englishText}
                />
              </div>
            )}

            {/* Big Center Play/Pause button */}
            <button
              type="button"
              onClick={togglePlay}
              className={`absolute inset-0 flex items-center justify-center transition-all ${
                isPlaying ? 'opacity-0 group-hover:opacity-100 bg-black/10' : 'opacity-100 bg-black/30'
              }`}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)] group-hover:scale-105 transition-transform">
                {isPlaying ? (
                  <HugeIcon icon={PauseIcon} size={28} className="fill-[var(--color-text-on-brand)] text-[var(--color-text-on-brand)]" />
                ) : (
                  <HugeIcon icon={PlayIcon} size={28} className="fill-[var(--color-text-on-brand)] text-[var(--color-text-on-brand)] ml-1" />
                )}
              </div>
            </button>

            {/* In-Player Bottom Control Strip */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 sm:p-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1 sm:p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-white transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <HugeIcon icon={PauseIcon} size={16} /> : <HugeIcon icon={PlayIcon} size={16} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewVideoRef.current) {
                      const newT = Math.max(trimRange.start, previewVideoRef.current.currentTime - 5);
                      previewVideoRef.current.currentTime = newT;
                      setCurrentTime(newT);
                    }
                  }}
                  className="p-1 sm:p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-white transition-colors"
                  title="Rewind 5s"
                  aria-label="Rewind 5 seconds"
                >
                  <HugeIcon icon={GoBackward5SecIcon} size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewVideoRef.current) {
                      const newT = Math.min(trimRange.end || videoDuration, previewVideoRef.current.currentTime + 5);
                      previewVideoRef.current.currentTime = newT;
                      setCurrentTime(newT);
                    }
                  }}
                  className="p-1 sm:p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-white transition-colors"
                  title="Forward 5s"
                  aria-label="Forward 5 seconds"
                >
                  <HugeIcon icon={GoForward5SecIcon} size={16} />
                </button>

                <span className="font-mono text-xs text-white/90 ml-1">
                  {formatTime(currentTime * 1000)} / {formatTime(videoDuration * 1000)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (previewVideoRef.current) {
                    if (document.fullscreenElement) {
                      document.exitFullscreen().catch(() => {});
                    } else {
                      previewVideoRef.current.requestFullscreen().catch(() => {});
                    }
                  }
                }}
                className="p-1 sm:p-1.5 rounded-md hover:bg-[var(--color-bg-hover)] text-white transition-colors"
                title="Fullscreen"
                aria-label="Fullscreen"
              >
                <HugeIcon icon={FullScreenIcon} size={16} />
              </button>
            </div>
          </div>

          {/* Timeline Trimmer (Screen 24) */}
          <div className="bg-[var(--color-bg-surface)] p-3 sm:p-4.5 rounded-2xl border border-[var(--color-border-default)] shadow-sm space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-label-s text-[var(--color-text-secondary)]">
                Trim Range: {formatTime(trimRange.start * 1000)} — {formatTime(trimRange.end * 1000)}
              </span>
              <span className="font-mono text-xs text-[var(--color-brand-default)] font-semibold">
                Duration: {formatTime((trimRange.end - trimRange.start) * 1000)}
              </span>
            </div>
            <TimelineTrimmer
              duration={videoDuration}
              currentTime={currentTime}
              startTime={trimRange.start}
              endTime={trimRange.end}
              onSeek={(time) => {
                if (previewVideoRef.current) {
                  previewVideoRef.current.currentTime = time;
                }
              }}
              onTrimChange={(start, end) => {
                setTrimRange({ start, end });
                if (previewVideoRef.current) {
                  previewVideoRef.current.currentTime = start;
                }
              }}
            />
          </div>

          {/* Audio Tracks & AI Voice Generation (Screen 24) */}
          <div className="bg-[var(--color-bg-surface)] p-3.5 sm:p-4.5 rounded-2xl border border-[var(--color-border-default)] shadow-sm space-y-3.5 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-label-m font-semibold text-[var(--color-text-primary)]">
                  Audio & Voice Tracks
                </h3>
                <p className="font-caption text-[var(--color-text-secondary)]">
                  Select playback audio: Native Bengali recording, synthesized English AI voice, or studio mixed ducking.
                </p>
              </div>

              {/* Generate AI Voice Button */}
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<HugeIcon icon={SparklesIcon} size={16} className="text-[var(--color-brand-default)]" />}
                title="Process AI Voice & Guide"
                onClick={() => {
                  aiStore.startProcessingAI(
                    `VerseStudio_${new Date().toISOString().slice(0, 10)}`,
                    videoDuration || 60
                  );
                }}
              >
                <span className="hidden min-[720px]:inline">Process AI Voice & Guide</span>
                <span className="min-[720px]:hidden">AI Voice</span>
              </Button>
            </div>

            <AudioTrackSelector
              value={aiStore.selectedAudioTrack}
              onChange={(track) => aiStore.setSelectedAudioTrack(track)}
            />
          </div>

          {/* Export Actions & Google Drive Save */}
          <div className="bg-[var(--color-bg-surface)] p-3.5 sm:p-5 rounded-2xl border border-[var(--color-border-default)] shadow-md flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Local Export Buttons */}
              <Button
                variant="primary"
                size="md"
                leadingIcon={<HugeIcon icon={Download01Icon} size={18} />}
                onClick={handleExportMP4}
                title="Export MP4 (4K)"
              >
                <span className="hidden min-[720px]:inline">Export MP4 (4K)</span>
                <span className="min-[720px]:hidden">MP4</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                leadingIcon={<HugeIcon icon={Download01Icon} size={18} />}
                onClick={handleExportWebM}
                title="Export WebM"
              >
                <span className="hidden min-[720px]:inline">Export WebM</span>
                <span className="min-[720px]:hidden">WebM</span>
              </Button>
              <Button
                variant="ghost"
                size="md"
                leadingIcon={<HugeIcon icon={File01Icon} size={18} />}
                onClick={() => aiStore.setIsGuideModalOpen(true)}
                responsiveIconOnly
                title="Step-by-Step Guide"
              >
                Step-by-Step Guide
              </Button>
            </div>

            {/* Cloud Sync to User's Own Google Drive */}
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                leadingIcon={<HugeIcon icon={CloudIcon} size={18} />}
                onClick={() => {
                  setShowDriveUploadModal(true);
                }}
                title="Save to Google Drive"
              >
                <span className="hidden min-[720px]:inline">Save to Google Drive</span>
                <span className="min-[720px]:hidden">Save to Drive</span>
              </Button>
            </div>
          </div>
        </main>
      ) : (
        /* Cloud Library Viewport (Screens 35, 36, 37, 38, 39) */
        <LibraryView
          lang={lang}
          onNewRecording={() => setView('studio')}
          onPlayRecording={(item) => handleLoadLibraryRecording(item)}
        />
      )}

      {/* Exporting 4K Progress Modal (Screen 26) */}
      <Modal
        open={!!exportProgress}
        onOpenChange={(open) => {
          if (!open) {
            if (exportAbortRef.current) {
              exportAbortRef.current.abort();
            }
            setExportProgress(null);
          }
        }}
        title="Exporting 4K 60FPS Video"
      >
        <div className="space-y-4 py-2">
          <p className="font-body-s text-[var(--color-text-secondary)]">
            Merging 4K frames, trimming boundaries, and muxing multi-track audio streams.
          </p>
          <ProgressBar value={exportProgress?.percentage || 0} />
          <div className="flex items-center justify-between font-caption text-[var(--color-text-tertiary)]">
            <span className="capitalize">Stage: {exportProgress?.stage || 'processing'}...</span>
            <span className="font-mono font-semibold">{exportProgress?.percentage || 0}%</span>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (exportAbortRef.current) {
                  exportAbortRef.current.abort();
                }
                setExportProgress(null);
              }}
            >
              Cancel Export
            </Button>
          </div>
        </div>
      </Modal>

      {/* Discard Confirmation Modal (Screen 27) */}
      <Modal
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
        title="Discard Recording?"
      >
        <div className="py-3 flex flex-col gap-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Are you sure you want to discard this recording? This will permanently delete the local chunks from your browser.
          </p>
          <div className="flex items-center justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => setShowDiscardConfirm(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (currentRecordingId) {
                  await RecordingStorage.deleteSession(currentRecordingId);
                }
                setRecordingBlob(null);
                setShowDiscardConfirm(false);
                setView('studio');
              }}
            >
              {t.common.discard}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal (Screens 48 to 55) */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        lang={lang}
        onLanguageChange={setLang}
        onThemeChange={setTheme}
        onOpenUpgrade={() => setActiveAccountModal('upgrade')}
      />

      {/* Auth Modal (Screens 01, 02, 07, 08, 09, 10, 11) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        lang={lang}
        onSuccess={() => {
          if (!authStore.isOnboarded) {
            setOnboardingModalOpen(true);
          }
        }}
      />

      {/* Onboarding Flow Modal (Screens 04, 05, 06) */}
      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        lang={lang}
      />

      {/* Account Settings Modals (Screens 57, 58, 59, 60, 61, 62) */}
      <AccountModals
        activeModal={activeAccountModal}
        onClose={() => setActiveAccountModal(null)}
        lang={lang}
        onOpenUpgrade={() => setActiveAccountModal('upgrade')}
        onOpenDelete={() => setActiveAccountModal('delete')}
      />

      {/* Google Drive Upload & Share Modal (Screens 28, 29, 30, 31, 32, 33, 34) */}
      <PostStudioDriveModal
        isOpen={showDriveUploadModal}
        onClose={() => setShowDriveUploadModal(false)}
        recordingId={currentRecordingId || 'rec_' + Date.now()}
        recordingBlob={recordingBlob}
        durationSeconds={Math.round(videoDuration)}
        recordingName={`VerseStudio_4K_${new Date().toISOString().slice(0, 10)}`}
        lang={lang}
      />

      {/* Bilingual AI Voice Processing Modal (Screen 23) */}
      <ProcessingAiModal
        open={aiStore.isProcessingModalOpen}
        onOpenChange={aiStore.setIsProcessingModalOpen}
        onUpgradeClick={() => setActiveAccountModal('upgrade')}
      />

      {/* Markdown & PDF Step-by-Step Guide Preview (Screen 25) */}
      <GuidePreviewModal
        open={aiStore.isGuideModalOpen}
        onOpenChange={aiStore.setIsGuideModalOpen}
      />

      {/* Phone Camera WebRTC Pairing Modal (Screens 15, 16) */}
      <PhoneCameraModal
        open={phoneCameraStore.isModalOpen}
        onOpenChange={(open) => {
          phoneCameraStore.setIsModalOpen(open);
          if (!open && phoneCameraStore.status === 'waiting') {
            phoneCameraStore.disconnectPhone();
          }
        }}
        onUseAsCamera={(stream) => {
          engine?.setCustomCameraStream(stream);
          setCameraEnabled(true);
        }}
      />
    </div>
  );
};
