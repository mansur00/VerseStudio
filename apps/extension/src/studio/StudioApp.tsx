import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  IconButton,
  StatusChip,
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
  type ToolPaletteState,
  DEFAULT_WALLPAPERS,
} from '@verse-studio/ui';
import { getTranslation, type SupportedLanguage, type RecordingLayout } from '@verse-studio/shared';
import {
  Monitor,
  Layout,
  Camera,
  Layers,
  Settings,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Move,
  Share2,
} from 'lucide-react';

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

export const StudioApp: React.FC = () => {
  // App State & Preferences
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<'studio' | 'post-studio'>('studio');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Engine & Device State
  const [engine, setEngine] = useState<CaptureEngine | null>(null);
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [hasScreenSource, setHasScreenSource] = useState(false);

  const [availableCameras, setAvailableCameras] = useState<DeviceInfo[]>([]);
  const [availableMics, setAvailableMics] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');

  // Compositor Styling State
  const [layout, setLayout] = useState<RecordingLayout>('screen-camera');
  const [wallpaperId, setWallpaperId] = useState('mesh-lime');
  const [wallpaperVal, setWallpaperVal] = useState(DEFAULT_WALLPAPERS[0].value);
  const [padding, setPadding] = useState<number>(32);
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
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimRange, setTrimRange] = useState({ start: 0, end: 0 });
  const [isPlaying, setIsPlaying] = useState(false);

  // Modals & Exporting State
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Phase 3 Auth & Onboarding State
  const authStore = useAuthStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>('sign-in');
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [activeAccountModal, setActiveAccountModal] = useState<AccountModalType>(null);

  // DOM References
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
        padding,
        borderRadius: radius,
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
      const canvas = newEngine.compositor.getCanvas();
      canvas.className = 'w-full h-full object-contain rounded-xl shadow-2xl';
      canvasContainerRef.current.appendChild(canvas);
      newEngine.compositor.start();
    }

    // Initialize Document PiP Mini Controller
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
    });

    // Check for crash recovery session
    RecordingStorage.checkRecoverableSession().then((session) => {
      if (session) {
        setRecoverableSession(session);
      }
    });

    // Initialize Auth session
    useAuthStore.getState().initialize().then(() => {
      const s = useAuthStore.getState();
      if (s.isAuthenticated && !s.isOnboarded) {
        setOnboardingModalOpen(true);
      }
    });

    return () => {
      newEngine.dispose();
      miniControllerRef.current?.close();
    };
  }, []);

  // Sync Compositor settings when UI changes
  useEffect(() => {
    if (!engine) return;
    engine.compositor.config.wallpaper = wallpaperVal;
    engine.compositor.config.padding = padding;
    engine.compositor.config.borderRadius = radius;
    engine.compositor.setLayout(layout);
  }, [engine, wallpaperVal, padding, radius, layout]);

  // Handle Source Selection
  const handleSelectScreen = async () => {
    if (!engine) return;
    try {
      await engine.selectScreenSource();
      setHasScreenSource(true);
    } catch (e) {
      // User cancelled picker
    }
  };

  // Handle Camera Toggle & Selection
  const handleToggleCamera = async () => {
    if (!engine) return;
    const nextState = !cameraEnabled;
    setCameraEnabled(nextState);
    await engine.setCamera(nextState, selectedCamera);
  };

  const handleSelectCamera = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (cameraEnabled && engine) {
      await engine.setCamera(true, deviceId);
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
  const handleStartRecordingClick = () => {
    if (status === 'recording' || status === 'paused') {
      handleStopRecording();
      return;
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
    if (data) {
      setRecordingBlob(data.blob);
      const url = URL.createObjectURL(data.blob);
      if (previewVideoRef.current) {
        previewVideoRef.current.src = url;
      }
      const durSecs = (data.meta.durationMs || 1000) / 1000;
      setVideoDuration(durSecs);
      setTrimRange({ start: 0, end: durSecs });
      setView('post-studio');
    }
  };

  // Recover interrupted crash recording
  const handleRecoverSession = async () => {
    if (!recoverableSession) return;
    const data = await RecordingStorage.getRecordingBlob(recoverableSession.id);
    if (data) {
      setRecordingBlob(data.blob);
      setCurrentRecordingId(recoverableSession.id);
      const durSecs = Math.max(1, (data.meta.durationMs || 5000) / 1000);
      setVideoDuration(durSecs);
      setTrimRange({ start: 0, end: durSecs });
      setView('post-studio');
      setRecoverableSession(null);
    }
  };

  // Export handlers
  const handleExportWebM = async () => {
    if (!recordingBlob) return;
    const filename = `VerseStudio_4K_${Date.now()}`;
    await ExportMuxer.exportWebM(recordingBlob, filename);
  };

  const handleExportMP4 = async () => {
    if (!recordingBlob) return;
    const filename = `VerseStudio_4K_${Date.now()}`;
    setExportProgress({ stage: 'analyzing', percentage: 10 });
    try {
      await ExportMuxer.exportMP4(recordingBlob, filename, (p) => {
        setExportProgress(p);
      });
      setTimeout(() => setExportProgress(null), 1500);
    } catch (e) {
      console.error('MP4 export failed:', e);
      setExportProgress(null);
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
      video.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col select-none">
      {/* Countdown Fullscreen Overlay */}
      {showCountdown && (
        <CountdownOverlay
          onComplete={onCountdownComplete}
          onCancel={() => setShowCountdown(false)}
        />
      )}

      {/* Recover Interrupted Recording Banner */}
      {recoverableSession && view === 'studio' && (
        <div className="bg-[var(--color-brand-subtle)] border-b border-[var(--color-brand-default)]/40 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-brand-default)]">
            <AlertTriangle className="w-4 h-4" />
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
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-warning-default)]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
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

      {/* Studio Header Bar */}
      <header className="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)]">
              <span className="font-black text-[var(--color-text-on-brand)] text-base">V</span>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
                {t.common.appName}
              </h1>
              <div className="flex items-center gap-2">
                <StatusChip
                  status={status === 'recording' ? 'recording' : 'active'}
                  label={
                    status === 'recording'
                      ? `${t.recording.recording} (${formatTime(elapsedMs)})`
                      : status === 'paused'
                      ? `${t.recording.paused} (${formatTime(elapsedMs)})`
                      : 'Studio Ready'
                  }
                />
                <span className="text-xs text-[var(--color-text-tertiary)] font-mono font-medium">
                  4K 60FPS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Studio / Post-Studio View Switcher */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-hover)] p-1 rounded-lg border border-[var(--color-border-subtle)]">
          <button
            onClick={() => setView('studio')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'studio'
                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            Studio
          </button>
          <button
            disabled={!recordingBlob}
            onClick={() => setView('post-studio')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              view === 'post-studio'
                ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] shadow-sm'
                : recordingBlob
                ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-disabled)] cursor-not-allowed opacity-50'
            }`}
          >
            {t.postStudio.title.split(' ')[0]}
          </button>
        </div>

        {/* Language, Theme & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-0.5">
            <button
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

          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Toggle theme"
            onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>

          {/* User Account Menu / Sign In */}
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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setAuthModalView('sign-in');
                setAuthModalOpen(true);
              }}
            >
              Sign In
            </Button>
          )}

          <IconButton
            variant="secondary"
            size="sm"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </IconButton>
        </div>
      </header>

      {/* Main Content Area */}
      {view === 'studio' ? (
        <main className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full gap-5 overflow-hidden">
          {/* Top Controls Toolbar */}
          <div className="flex items-center justify-between bg-[var(--color-bg-surface)] p-3 rounded-xl border border-[var(--color-border-default)] shadow-sm shrink-0">
            {/* Screen Source & Layouts */}
            <div className="flex items-center gap-3">
              <Button
                variant={hasScreenSource ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleSelectScreen}
                leadingIcon={<Monitor className="w-4 h-4" />}
              >
                {hasScreenSource ? 'Display Connected' : t.setup.selectSource}
              </Button>

              <div className="h-6 w-px bg-[var(--color-border-subtle)]" />

              <div className="flex items-center gap-1">
                <Button
                  variant={layout === 'screen-only' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('screen-only')}
                  leadingIcon={<Monitor className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutScreenOnly}
                </Button>
                <Button
                  variant={layout === 'screen-camera' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('screen-camera')}
                  leadingIcon={<Layers className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutScreenCamera}
                </Button>
                <Button
                  variant={layout === 'split-50-50' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('split-50-50')}
                  leadingIcon={<Layout className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutSplit}
                </Button>
                <Button
                  variant={layout === 'camera-only' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('camera-only')}
                  leadingIcon={<Camera className="w-3.5 h-3.5" />}
                >
                  {t.setup.layoutCameraOnly}
                </Button>
              </div>
            </div>

            {/* Hardware: Camera & Microphone */}
            <div className="flex items-center gap-3 border-l border-[var(--color-border-subtle)] pl-4">
              {/* Mic Controls */}
              <div className="flex items-center gap-2">
                <IconButton
                  variant={micMuted ? 'ghost' : 'secondary'}
                  size="sm"
                  aria-label={micMuted ? 'Unmute Mic' : 'Mute Mic'}
                  onClick={handleToggleMic}
                >
                  {micMuted ? (
                    <VolumeX className="w-4 h-4 text-[var(--color-error-default)]" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[var(--color-brand-default)]" />
                  )}
                </IconButton>
                <MicLevel level={micLevel} muted={micMuted} showIcon={false} />
                {availableMics.length > 0 && (
                  <select
                    value={selectedMic}
                    onChange={(e) => handleSelectMic(e.target.value)}
                    className="bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] rounded-md px-1.5 py-1 max-w-[110px] truncate focus:outline-none focus:border-[var(--color-brand-default)]"
                    aria-label="Microphone Selection"
                  >
                    {availableMics.map((m) => (
                      <option key={m.deviceId} value={m.deviceId}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Camera Toggle & Selection */}
              <div className="flex items-center gap-1.5">
                <IconButton
                  variant={cameraEnabled ? 'primary' : 'ghost'}
                  size="sm"
                  aria-label="Toggle camera"
                  onClick={handleToggleCamera}
                >
                  <Camera className="w-4 h-4" />
                </IconButton>
                {cameraEnabled && availableCameras.length > 0 && (
                  <select
                    value={selectedCamera}
                    onChange={(e) => handleSelectCamera(e.target.value)}
                    className="bg-[var(--color-bg-hover)] text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] rounded-md px-1.5 py-1 max-w-[110px] truncate focus:outline-none focus:border-[var(--color-brand-default)]"
                    aria-label="Camera Selection"
                  >
                    {availableCameras.map((c) => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Phase 2: Live Tools Toolbar */}
            <div className="flex items-center gap-2 border-l border-[var(--color-border-subtle)] pl-4">
              <ToolPalette tools={tools} onToggleTool={toggleTool} showGrip={false} />
            </div>
          </div>

          {/* Central Live Compositor Canvas Viewport */}
          <div className="flex-1 relative flex items-center justify-center bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-default)] p-4 shadow-inner min-h-[420px] overflow-hidden">
            <div
              ref={canvasContainerRef}
              className="w-full h-full max-h-[640px] flex items-center justify-center"
            />

            {/* Floating Live Tool Palette inside viewport */}
            <div className="absolute top-6 right-6 z-20">
              <ToolPalette tools={tools} onToggleTool={toggleTool} showGrip={true} />
            </div>

            {/* Floating Teleprompter inside viewport */}
            {teleprompterOpen && (
              <div className="absolute top-6 left-6 z-30">
                <Teleprompter
                  isOpen={teleprompterOpen}
                  onClose={() => toggleTool('teleprompter')}
                  isBangla={lang === 'bn'}
                />
              </div>
            )}

            {/* In-viewport camera bubble drag instruction */}
            {layout === 'screen-camera' && !teleprompterOpen && (
              <div className="absolute bottom-6 left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-[var(--color-text-secondary)] border border-white/10 pointer-events-none">
                <Move className="w-3 h-3 text-[var(--color-brand-default)]" />
                <span>Draggable Camera Bubble Enabled</span>
              </div>
            )}
          </div>

          {/* Bottom Bar: Frame Customization & Recording Trigger */}
          <div className="flex items-center justify-between bg-[var(--color-bg-surface)] px-6 py-3.5 rounded-xl border border-[var(--color-border-default)] shadow-sm shrink-0">
            {/* Wallpaper & Frame Options */}
            <div className="flex items-center gap-6">
              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                  Backdrop Frame:
                </span>
                <WallpaperSwatch
                  selectedId={wallpaperId}
                  onSelect={(id, val) => {
                    setWallpaperId(id);
                    setWallpaperVal(val);
                  }}
                />
              </div>

              <div className="h-8 w-px bg-[var(--color-border-subtle)]" />

              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                  Frame Inset:
                </span>
                <div className="flex items-center gap-1">
                  {[0, 16, 32, 48].map((px) => (
                    <button
                      key={px}
                      onClick={() => setPadding(px)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-all ${
                        padding === px
                          ? 'border-[var(--color-brand-default)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-bold'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]'
                      }`}
                    >
                      {px}px
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1.5">
                  Radius:
                </span>
                <div className="flex items-center gap-1">
                  {[0, 12, 24].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadius(r)}
                      className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-all ${
                        radius === r
                          ? 'border-[var(--color-brand-default)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-bold'
                          : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]'
                      }`}
                    >
                      {r}px
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Big Record Button & Controls */}
            <div className="flex items-center gap-4">
              {(status === 'recording' || status === 'paused') && (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-[var(--color-text-primary)]">
                    {formatTime(elapsedMs)}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (status === 'recording') engine?.pauseRecording();
                      else engine?.resumeRecording();
                    }}
                  >
                    {status === 'recording' ? t.recording.pause : t.recording.resume}
                  </Button>
                </div>
              )}

              <RecordButton
                status={status === 'recording' ? 'recording' : status === 'paused' ? 'paused' : 'idle'}
                onClick={handleStartRecordingClick}
              />
            </div>
          </div>
        </main>
      ) : (
        /* Post-Studio Viewport (Screens 23, 24, 26, 27) */
        <main className="flex-1 flex flex-col p-8 max-w-6xl mx-auto w-full gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {t.postStudio.title}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Review your 4K 60FPS recording, trim boundaries, and export locally or to Google Drive.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => setView('studio')}
              >
                Record Another
              </Button>
              <Button
                variant="danger"
                size="sm"
                leadingIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDiscardConfirm(true)}
              >
                Discard
              </Button>
            </div>
          </div>

          {/* Video Preview Player */}
          <div className="relative aspect-video max-h-[500px] bg-black rounded-2xl overflow-hidden border border-[var(--color-border-default)] shadow-2xl flex items-center justify-center">
            <video
              ref={previewVideoRef}
              className="w-full h-full object-contain"
              onTimeUpdate={() => {
                if (previewVideoRef.current) {
                  setCurrentTime(previewVideoRef.current.currentTime);
                }
              }}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Big Center Play/Pause button */}
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--color-brand-default)] flex items-center justify-center shadow-[var(--glow-brand)] group-hover:scale-105 transition-transform">
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-[var(--color-text-on-brand)] text-[var(--color-text-on-brand)]" />
                ) : (
                  <Play className="w-8 h-8 fill-[var(--color-text-on-brand)] text-[var(--color-text-on-brand)] ml-1" />
                )}
              </div>
            </button>
          </div>

          {/* Interactive Timeline Trimmer */}
          <div className="bg-[var(--color-bg-surface)] p-5 rounded-xl border border-[var(--color-border-default)]">
            <TimelineTrimmer
              duration={videoDuration}
              currentTime={currentTime}
              startTime={trimRange.start}
              endTime={trimRange.end}
              onSeek={(time) => {
                if (previewVideoRef.current) {
                  previewVideoRef.current.currentTime = time;
                  setCurrentTime(time);
                }
              }}
              onTrimChange={(start, end) => setTrimRange({ start, end })}
            />
          </div>

          {/* Export Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Export */}
            <div className="bg-[var(--color-bg-surface)] p-5 rounded-xl border border-[var(--color-border-default)] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  {t.postStudio.exportLocal}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Download instantly in native 4K WebM or containerized MP4 format with audio sync.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button
                  variant="primary"
                  size="sm"
                  leadingIcon={<Download className="w-4 h-4" />}
                  onClick={handleExportWebM}
                >
                  Download WebM (Instant)
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leadingIcon={<Download className="w-4 h-4" />}
                  onClick={handleExportMP4}
                >
                  Export MP4 (4K)
                </Button>
              </div>
            </div>

            {/* Google Drive Preview Card */}
            <div className="bg-[var(--color-bg-surface)] p-5 rounded-xl border border-[var(--color-border-default)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {t.postStudio.saveDrive}
                  </h3>
                  <StatusChip status="private" label="Ready for Phase 4" />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Upload seamlessly to your Google Drive (`VerseStudio` folder) and generate a shareable watch link.
                </p>
              </div>

              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  leadingIcon={<Share2 className="w-4 h-4" />}
                  disabled
                >
                  Connect Drive in Phase 4
                </Button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 4K Video Export Progress Modal (Screen 26) */}
      <Modal
        open={exportProgress !== null}
        onOpenChange={() => {}}
        title="Exporting 4K 60FPS Video"
      >
        <div className="py-4 flex flex-col gap-4">
          <ProgressBar
            value={exportProgress?.percentage || 0}
            label={
              exportProgress?.stage === 'analyzing'
                ? 'Analyzing video streams...'
                : exportProgress?.stage === 'muxing'
                ? 'Muxing 4K frames with mp4-muxer...'
                : exportProgress?.stage === 'finalizing'
                ? 'Finalizing video container...'
                : 'Export complete!'
            }
          />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Please keep this tab open while 4K video frames are containerized with full fidelity.
          </p>
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

      {/* Settings Modal Placeholder */}
      <Modal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title={t.settings.title}
      >
        <div className="py-2 flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span>{t.settings.language}</span>
            <div className="flex gap-1">
              <Button size="sm" variant={lang === 'en' ? 'primary' : 'ghost'} onClick={() => setLang('en')}>
                English
              </Button>
              <Button size="sm" variant={lang === 'bn' ? 'primary' : 'ghost'} onClick={() => setLang('bn')}>
                বাংলা
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>{t.settings.theme}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            >
              {theme === 'dark' ? t.settings.dark : t.settings.light}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Phase 3 Auth & Onboarding Modals */}
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

      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        lang={lang}
      />

      <AccountModals
        activeModal={activeAccountModal}
        onClose={() => setActiveAccountModal(null)}
        lang={lang}
        onOpenUpgrade={() => setActiveAccountModal('upgrade')}
        onOpenDelete={() => setActiveAccountModal('delete')}
      />
    </div>
  );
};
