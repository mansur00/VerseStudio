import React from 'react';
import { cn } from '../../utils/cn';
import {
  DragDropIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  Mic01Icon,
  Camera01Icon,
  VolumeOffIcon,
  CameraOff01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';

export interface MiniControllerProps {
  status: 'idle' | 'recording' | 'paused';
  timeFormatted: string;
  micMuted?: boolean;
  cameraOff?: boolean;
  onTogglePause?: () => void;
  onStop?: () => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  className?: string;
  onGripMouseDown?: (e: React.MouseEvent) => void;
}

/**
 * Mini Controller matches Figma Component 11:187 (Studio Components)
 * Floating recorder bar (Document Picture-in-Picture / overlay)
 * Container: 8px 12px padding, 8px gap, bg/elevated (#292A31), border/default (#383942), 9999px radius
 */
export const MiniController: React.FC<MiniControllerProps> = ({
  status,
  timeFormatted,
  micMuted = false,
  cameraOff = false,
  onTogglePause,
  onStop,
  onToggleMic,
  onToggleCamera,
  className,
  onGripMouseDown,
}) => {
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';

  return (
    <div
      role="toolbar"
      aria-label="Recording Controller"
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-full select-none shadow-xl shrink-0',
        'bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]',
        className
      )}
    >
      {/* 1. Drag Handle */}
      <div
        onMouseDown={onGripMouseDown}
        className="w-5 h-5 flex items-center justify-center text-[var(--color-text-tertiary)] cursor-grab active:cursor-grabbing hover:text-[var(--color-text-secondary)] select-none"
        title="Drag to move controller"
      >
        <HugeIcon icon={DragDropIcon} size={16} />
      </div>

      {/* 2. Status Dot & Elapsed Timer */}
      <div className="flex items-center gap-2 pl-1 pr-2">
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full shrink-0',
            isRecording && 'bg-[var(--color-record-default)] animate-pulse',
            isPaused && 'bg-[var(--color-warning-default)]',
            !isRecording && !isPaused && 'bg-[var(--color-text-disabled)]'
          )}
        />
        <span className="font-mono text-sm font-normal text-[var(--color-text-primary)] tracking-tight">
          {timeFormatted || '00:00:00'}
        </span>
      </div>

      {/* 3. Divider */}
      <span className="w-px h-5 bg-[var(--color-border-default)]" />

      {/* 4. Pause / Resume / Record Action */}
      {isRecording ? (
        <button
          type="button"
          onClick={onTogglePause}
          aria-label="Pause Recording"
          title="Pause (Alt+P)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <HugeIcon icon={PauseIcon} size={18} />
        </button>
      ) : isPaused ? (
        <button
          type="button"
          onClick={onTogglePause}
          aria-label="Resume Recording"
          title="Resume (Alt+P)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-warning-default)] hover:bg-[var(--color-bg-hover)] active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <HugeIcon icon={PlayIcon} size={18} />
        </button>
      ) : null}

      {/* 5. Stop Recording Button */}
      {(isRecording || isPaused) && (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop Recording"
          title="Stop Recording"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:border-[var(--color-record-default)] hover:text-[var(--color-record-default)] active:scale-95 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <HugeIcon icon={StopIcon} size={18} />
        </button>
      )}

      {/* 6. Divider */}
      <span className="w-px h-5 bg-[var(--color-border-default)]" />

      {/* 7. Mic Toggle */}
      <button
        type="button"
        onClick={onToggleMic}
        aria-label={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        title={micMuted ? 'Unmute Mic' : 'Mute Mic'}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] active:scale-95',
          micMuted
            ? 'text-[var(--color-record-default)] bg-[var(--color-record-subtle)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
        )}
      >
        <HugeIcon icon={micMuted ? VolumeOffIcon : Mic01Icon} size={18} />
      </button>

      {/* 8. Camera Toggle */}
      <button
        type="button"
        onClick={onToggleCamera}
        aria-label={cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        title={cameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] active:scale-95',
          cameraOff
            ? 'text-[var(--color-record-default)] bg-[var(--color-record-subtle)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
        )}
      >
        <HugeIcon icon={cameraOff ? CameraOff01Icon : Camera01Icon} size={18} />
      </button>
    </div>
  );
};

