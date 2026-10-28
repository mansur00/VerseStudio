import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  MoreVerticalIcon,
  ArrowUpRight01Icon,
  Share01Icon,
  Edit01Icon,
  Delete01Icon,
  PlayIcon,
  GlobeIcon,
  LockIcon,
  RotateLeft01Icon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';
import { StatusChip } from '../StatusChip/StatusChip';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { cn } from '../../utils/cn';
import type { DriveRecordingItem } from '@verse-studio/shared';

export interface RecordingCardProps {
  item: DriveRecordingItem;
  onPlay?: (item: DriveRecordingItem) => void;
  onOpenDrive?: (item: DriveRecordingItem) => void;
  onShare?: (item: DriveRecordingItem) => void;
  onRename?: (item: DriveRecordingItem) => void;
  onToggleVisibility?: (item: DriveRecordingItem) => void;
  onMoveToTrash?: (item: DriveRecordingItem) => void;
  onRetryUpload?: (item: DriveRecordingItem) => void;
  className?: string;
}

export const RecordingCard: React.FC<RecordingCardProps> = ({
  item,
  onPlay,
  onOpenDrive,
  onShare,
  onRename,
  onToggleVisibility,
  onMoveToTrash,
  onRetryUpload,
  className,
}) => {
  // Format seconds to mm:ss or hh:mm:ss
  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Format bytes to MB or GB
  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const isUploading = item.status === 'uploading';
  const isFailed = item.status === 'failed';

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-xl overflow-hidden transition-all duration-200 border text-left',
        'bg-[var(--color-bg-surface)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:shadow-lg',
        className
      )}
    >
      {/* Thumbnail / Video Preview Area */}
      <div
        className="relative aspect-video w-full bg-[var(--color-bg-elevated)] overflow-hidden cursor-pointer select-none"
        onClick={() => !isUploading && onPlay?.(item)}
      >
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-hover)] text-[var(--color-text-tertiary)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-surface)]/80 flex items-center justify-center text-[var(--color-text-primary)] shadow-sm backdrop-blur-sm group-hover:scale-110 group-hover:text-[var(--color-brand-default)] transition-all">
              <HugeIcon icon={PlayIcon} size={18} className="ml-0.5" />
            </div>
          </div>
        )}

        {/* Top Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <StatusChip
            status={item.status}
            label={
              item.status === 'shared'
                ? 'Shared'
                : item.status === 'private'
                ? 'Private'
                : item.status === 'uploading'
                ? 'Uploading'
                : 'Failed'
            }
            size="sm"
          />

          <span className="font-code text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm border border-white/10 uppercase">
            {item.resolution} {item.fps}FPS
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-white font-code text-[11px] font-medium backdrop-blur-sm">
          {formatDuration(item.durationSeconds)}
        </div>
      </div>

      {/* Uploading progress bar */}
      {isUploading && (
        <div className="px-3 pt-2 pb-1 space-y-1 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)]">
          <ProgressBar
            value={item.uploadProgress || 0}
            variant="brand"
            showPercentage={true}
          />
        </div>
      )}

      {/* Failed Upload Retry banner */}
      {isFailed && (
        <div className="px-3 py-1.5 flex items-center justify-between bg-[var(--color-error-subtle)] border-b border-[var(--color-error-default)]/30 text-[var(--color-error-default)] font-caption">
          <span>Upload interrupted</span>
          <button
            type="button"
            onClick={() => onRetryUpload?.(item)}
            className="flex items-center gap-1 font-semibold hover:underline"
          >
            <HugeIcon icon={RotateLeft01Icon} size={14} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Content & Actions */}
      <div className="p-3.5 flex items-start justify-between gap-2 flex-1">
        <div className="min-w-0 flex-1">
          <h3
            title={item.name}
            onClick={() => !isUploading && onPlay?.(item)}
            className="font-label-m font-semibold text-[var(--color-text-primary)] truncate cursor-pointer hover:text-[var(--color-brand-default)] transition-colors"
          >
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 font-caption text-[var(--color-text-tertiary)]">
            <span>{item.createdAt}</span>
            <span>•</span>
            <span>{formatBytes(item.sizeBytes)}</span>
          </div>
        </div>

        {/* Dropdown Menu Options */}
        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <button
              type="button"
              className={cn(
                'p-1.5 rounded-lg border border-transparent transition-colors text-[var(--color-text-tertiary)] outline-none',
                'hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-subtle)]',
                'focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]'
              )}
              aria-label={`Options for ${item.name}`}
            >
              <HugeIcon icon={MoreVerticalIcon} size={16} />
            </button>
          </DropdownMenuPrimitive.Trigger>

          <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
              align="end"
              sideOffset={4}
              className={cn(
                'z-50 w-48 rounded-xl p-1 shadow-xl border border-[var(--color-border-default)]',
                'bg-[var(--color-bg-surface)] backdrop-blur-md text-[var(--color-text-primary)]',
                'animate-in fade-in-0 zoom-in-95'
              )}
            >
              {item.driveFileId && (
                <DropdownMenuPrimitive.Item
                  onSelect={() => onOpenDrive?.(item)}
                  className="flex items-center gap-2 px-2.5 py-1.5 font-label-s rounded-lg cursor-pointer outline-none text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                >
                  <HugeIcon icon={ArrowUpRight01Icon} size={14} className="text-[var(--color-text-tertiary)]" />
                  <span>Open in Drive</span>
                </DropdownMenuPrimitive.Item>
              )}

              <DropdownMenuPrimitive.Item
                onSelect={() => onShare?.(item)}
                className="flex items-center gap-2 px-2.5 py-1.5 font-label-s rounded-lg cursor-pointer outline-none text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              >
                <HugeIcon icon={Share01Icon} size={14} className="text-[var(--color-text-tertiary)]" />
                <span>Share & QR Code</span>
              </DropdownMenuPrimitive.Item>

              <DropdownMenuPrimitive.Item
                onSelect={() => onToggleVisibility?.(item)}
                className="flex items-center gap-2 px-2.5 py-1.5 font-label-s rounded-lg cursor-pointer outline-none text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              >
                {item.status === 'shared' ? (
                  <>
                    <HugeIcon icon={LockIcon} size={14} className="text-[var(--color-text-tertiary)]" />
                    <span>Make Private</span>
                  </>
                ) : (
                  <>
                    <HugeIcon icon={GlobeIcon} size={14} className="text-[var(--color-text-tertiary)]" />
                    <span>Make Public</span>
                  </>
                )}
              </DropdownMenuPrimitive.Item>

              <DropdownMenuPrimitive.Item
                onSelect={() => onRename?.(item)}
                className="flex items-center gap-2 px-2.5 py-1.5 font-label-s rounded-lg cursor-pointer outline-none text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
              >
                <HugeIcon icon={Edit01Icon} size={14} className="text-[var(--color-text-tertiary)]" />
                <span>Rename</span>
              </DropdownMenuPrimitive.Item>

              <div className="h-px bg-[var(--color-border-subtle)] my-1" />

              <DropdownMenuPrimitive.Item
                onSelect={() => onMoveToTrash?.(item)}
                className="flex items-center gap-2 px-2.5 py-1.5 font-label-s rounded-lg cursor-pointer outline-none text-[var(--color-danger-default)] hover:bg-[var(--color-danger-default)]/10"
              >
                <HugeIcon icon={Delete01Icon} size={14} />
                <span>Move to Trash</span>
              </DropdownMenuPrimitive.Item>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        </DropdownMenuPrimitive.Root>
      </div>
    </div>
  );
};
