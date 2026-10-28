import React, { useState } from 'react';
import {
  RecordingCard,
  ShareLinkCard,
  Button,
  Input,
  Modal,
  Toast,
  ProgressBar,
  HugeIcon,
} from '@verse-studio/ui';
import {
  Search01Icon,
  CloudIcon,
  CloudOffIcon,
  VideoReplayIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { getTranslation, type SupportedLanguage, type DriveRecordingItem } from '@verse-studio/shared';
import { useDriveStore } from './driveStore';

export interface LibraryViewProps {
  lang?: SupportedLanguage;
  onNewRecording?: () => void;
  onPlayRecording?: (item: DriveRecordingItem) => void;
  className?: string;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  lang = 'en',
  onNewRecording,
  onPlayRecording,
  className,
}) => {
  const t = getTranslation(lang);
  const {
    isConnected,
    quota,
    recordings,
    trashedItem,
    isLoading,
    searchQuery,
    filterStatus,
    connectDrive,
    toggleVisibility,
    renameRecording,
    moveToTrash,
    restoreTrashedItem,
    setSearchQuery,
    setFilterStatus,
  } = useDriveStore();

  // Dialog states
  const [shareItem, setShareItem] = useState<DriveRecordingItem | null>(null);
  const [renameItem, setRenameItem] = useState<DriveRecordingItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [trashConfirmItem, setTrashConfirmItem] = useState<DriveRecordingItem | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Filter & Search logic
  const filteredRecordings = recordings.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterStatus === 'shared') return item.status === 'shared';
    if (filterStatus === 'private') return item.status === 'private';
    return true;
  });

  // Handle Rename
  const handleOpenRename = (item: DriveRecordingItem) => {
    setRenameItem(item);
    setRenameValue(item.name);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (renameItem && renameValue.trim()) {
      await renameRecording(renameItem.id, renameValue.trim());
      setRenameItem(null);
    }
  };

  // Handle Trash & Undo
  const handleConfirmTrash = async () => {
    if (trashConfirmItem) {
      await moveToTrash(trashConfirmItem.id);
      setTrashConfirmItem(null);
      setShowToast(true);
    }
  };

  const handleUndoTrash = async () => {
    await restoreTrashedItem();
    setShowToast(false);
  };

  // Format Storage Quota
  const formatGigabytes = (bytes?: number) => {
    if (!bytes) return '0 GB';
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className={`flex flex-col h-full max-w-7xl mx-auto w-full p-6 gap-6 ${className || ''}`}>
      {/* Top Header & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border-subtle)]">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            {t.library.title}
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            Cloud recordings saved directly in your personal Google Drive (<code className="text-[11px] font-mono text-[var(--color-brand-default)]">VerseStudio/</code>)
          </p>
        </div>

        {/* Right side: Drive Quota & New Recording Action */}
        <div className="flex items-center gap-3">
          {isConnected && quota && (
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                Drive Storage: <span className="text-[var(--color-text-primary)] font-semibold">{formatGigabytes(quota.usageBytes)}</span> of {formatGigabytes(quota.limitBytes)}
              </span>
              <div className="w-32 mt-1">
                <ProgressBar
                  value={Math.round((quota.usageBytes / quota.limitBytes) * 100)}
                  variant="brand"
                  showPercentage={false}
                />
              </div>
            </div>
          )}

          {onNewRecording && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNewRecording}
              leadingIcon={<HugeIcon icon={PlusSignIcon} size={16} />}
            >
              New Recording
            </Button>
          )}
        </div>
      </div>

      {/* ================= SCREEN 36: DRIVE DISCONNECTED ================= */}
      {!isConnected && (
        <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-center space-y-4 max-w-md mx-auto my-auto">
          <div className="w-16 h-16 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] flex items-center justify-center">
            <HugeIcon icon={CloudOffIcon} size={32} />
          </div>
          <div className="space-y-1">
            <h2 className="font-h4 font-bold text-[var(--color-text-primary)]">
              {t.library.driveDisconnectedTitle}
            </h2>
            <p className="font-body-s text-[var(--color-text-secondary)] leading-relaxed">
              {t.library.driveDisconnectedDesc}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => connectDrive()}
            leadingIcon={<HugeIcon icon={CloudIcon} size={16} />}
          >
            {t.library.reconnectDrive}
          </Button>
        </div>
      )}

      {/* Connected Library View */}
      {isConnected && (
        <>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="w-full sm:max-w-xs">
              <Input
                id="library-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recordings..."
                leadingIcon={<HugeIcon icon={Search01Icon} size={16} />}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-hover)] border border-[var(--color-border-subtle)] self-stretch sm:self-auto">
              {(['all', 'shared', 'private'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setFilterStatus(filter)}
                  className={`px-3 py-1.5 rounded-lg font-label-s capitalize transition-all ${
                    filterStatus === filter
                      ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* ================= SCREEN 37: LOADING SKELETON ================= */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-[var(--color-bg-elevated)]" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= SCREEN 35: EMPTY RECORDINGS ================= */}
          {!isLoading && recordings.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] flex items-center justify-center">
                <HugeIcon icon={VideoReplayIcon} size={28} />
              </div>
              <div className="space-y-1">
                <h2 className="font-h4 font-bold text-[var(--color-text-primary)]">
                  {t.library.emptyTitle}
                </h2>
                <p className="font-body-s text-[var(--color-text-secondary)] max-w-sm">
                  {t.library.emptySubtitle}
                </p>
              </div>
              {onNewRecording && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onNewRecording}
                  leadingIcon={<HugeIcon icon={PlusSignIcon} size={16} />}
                >
                  Start Recording
                </Button>
              )}
            </div>
          )}

          {/* ================= SCREEN 39: NO SEARCH RESULTS ================= */}
          {!isLoading && recordings.length > 0 && filteredRecordings.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3 my-auto">
              <HugeIcon icon={Search01Icon} size={40} className="text-[var(--color-text-tertiary)]" />
              <div className="space-y-1">
                <h3 className="font-label-m font-semibold text-[var(--color-text-primary)]">
                  No recordings found
                </h3>
                <p className="font-body-s text-[var(--color-text-secondary)]">
                  No video matches &quot;{searchQuery}&quot;. Try another search term or reset filters.
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
          )}

          {/* ================= SCREEN 38: RECORDINGS GRID ================= */}
          {!isLoading && filteredRecordings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRecordings.map((rec) => (
                <RecordingCard
                  key={rec.id}
                  item={rec}
                  onPlay={(item) => onPlayRecording?.(item)}
                  onOpenDrive={(item) => {
                    if (item.driveFileId) {
                      window.open(`https://drive.google.com/file/d/${item.driveFileId}/view`, '_blank');
                    }
                  }}
                  onShare={(item) => setShareItem(item)}
                  onRename={(item) => handleOpenRename(item)}
                  onToggleVisibility={(item) =>
                    toggleVisibility(item.id, item.status !== 'shared')
                  }
                  onMoveToTrash={(item) => setTrashConfirmItem(item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================= SCREEN 41 & 42: SHARE & QR CODE MODAL ================= */}
      {shareItem && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && setShareItem(null)}
          title={`Share "${shareItem.name}"`}
          description="Instant public viewing link and mobile QR code"
        >
          <ShareLinkCard
            shareUrl={shareItem.shareUrl || `https://versestudio.app/watch/${shareItem.id}`}
            isPublic={shareItem.status === 'shared'}
            onToggleVisibility={(isPub) => {
              toggleVisibility(shareItem.id, isPub);
              setShareItem({ ...shareItem, status: isPub ? 'shared' : 'private' });
            }}
            onOpenInDrive={() => {
              if (shareItem.driveFileId) {
                window.open(`https://drive.google.com/file/d/${shareItem.driveFileId}/view`, '_blank');
              }
            }}
          />
        </Modal>
      )}

      {/* ================= SCREEN 43: RENAME MODAL ================= */}
      {renameItem && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && setRenameItem(null)}
          title={t.library.rename}
          description="Update recording file name"
        >
          <form onSubmit={handleSaveRename} className="space-y-4 pt-1">
            <Input
              id="rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Recording name"
              autoFocus
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setRenameItem(null)}>
                {t.common.cancel}
              </Button>
              <Button type="submit" variant="primary">
                {t.common.save}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= SCREEN 44: MOVE TO TRASH CONFIRM MODAL ================= */}
      {trashConfirmItem && (
        <Modal
          open={true}
          onOpenChange={(open) => !open && setTrashConfirmItem(null)}
          title={t.library.moveToTrash}
          description={`Are you sure you want to move "${trashConfirmItem.name}" to Trash?`}
        >
          <div className="space-y-4 pt-1">
            <p className="text-xs text-[var(--color-text-secondary)]">
              This recording will be moved to your Google Drive Trash folder. You can undo this action immediately or restore it from Drive.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setTrashConfirmItem(null)}>
                {t.common.cancel}
              </Button>
              <Button variant="danger" onClick={handleConfirmTrash}>
                {t.library.moveToTrash}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= SCREEN 45: MOVED TO TRASH TOAST WITH UNDO ================= */}
      {showToast && trashedItem && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            title={t.library.movedToTrashSuccess}
            message={`"${trashedItem.name}"`}
            variant="warning"
            actionLabel={t.library.undo}
            onAction={handleUndoTrash}
            onClose={() => setShowToast(false)}
          />
        </div>
      )}
    </div>
  );
};
