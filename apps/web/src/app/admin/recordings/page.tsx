'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search01Icon,
  ArrowUpRight01Icon,
  SparklesIcon,
  SubtitleIcon,
} from '@hugeicons/core-free-icons';
import { Button, StatusChip, Pagination, Select, Modal, HugeIcon } from '@verse-studio/ui';
import { AdminRecording } from '@verse-studio/shared';

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState<AdminRecording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [resolutionFilter, setResolutionFilter] = useState<'all' | '4k' | '1080p'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const [blockTarget, setBlockTarget] = useState<AdminRecording | null>(null);

  const loadRecordings = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/recordings?q=${encodeURIComponent(searchQuery)}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        const mapped: AdminRecording[] = (data.recordings || []).map((r: any) => ({
          id: r.id,
          title: r.title,
          userId: r.user_id,
          userName: 'Creator',
          userEmail: 'creator@versestudio.app',
          durationSeconds: r.duration_seconds || 180,
          resolution: r.resolution || '4k',
          fps: r.fps || 60,
          status: r.is_blocked ? 'blocked' : 'active',
          viewsCount: r.views_count || 0,
          driveFileId: r.drive_file_id,
          driveViewUrl: r.drive_view_url,
          hasAiSubtitles: true,
          hasAiVoice: true,
          createdAt: r.created_at,
        }));
        setRecordings(mapped);
      }
    } catch (e) {
      console.error('Failed to fetch recordings from DB API:', e);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const filtered = useMemo(() => {
    return recordings.filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesRes = resolutionFilter === 'all' || r.resolution === resolutionFilter;
      return matchesSearch && matchesStatus && matchesRes;
    });
  }, [recordings, searchQuery, statusFilter, resolutionFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleBlock = async () => {
    if (!blockTarget) return;
    const nextBlocked = blockTarget.status !== 'blocked';
    try {
      const res = await fetch('/api/admin/recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: blockTarget.id,
          isBlocked: nextBlocked,
          reason: nextBlocked ? 'Violates community guidelines' : 'Restored by admin',
        }),
      });
      if (res.ok) {
        setRecordings((prev) =>
          prev.map((r) =>
            r.id === blockTarget.id
              ? { ...r, status: nextBlocked ? 'blocked' : 'active' }
              : r
          )
        );
      }
    } catch (e) {
      console.error('Failed to toggle block:', e);
    }
    setBlockTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Recordings Directory (A07)
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Browse and moderate all 4K recordings hosted on creators&apos; Google Drive accounts.
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <HugeIcon icon={Search01Icon} size={16} className="text-[var(--color-text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recordings or author..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] text-xs rounded-xl pl-9 pr-4 py-2 border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-36">
            <Select
              options={[
                { value: 'all', label: 'All Resolutions' },
                { value: '4k', label: '4K Ultra HD' },
                { value: '1080p', label: '1080p HD' },
              ]}
              value={resolutionFilter}
              onChange={(e) => {
                setResolutionFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="w-36">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'blocked', label: 'Blocked' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Recordings Table */}
      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] text-[var(--color-text-tertiary)] font-medium">
                <th className="p-3.5">Recording Title</th>
                <th className="p-3.5">Creator</th>
                <th className="p-3.5">Resolution</th>
                <th className="p-3.5">Duration</th>
                <th className="p-3.5">AI Features</th>
                <th className="p-3.5">Views</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
              {paginated.map((rec) => (
                <tr key={rec.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="p-3.5 max-w-xs">
                    <p className="font-semibold text-[var(--color-text-primary)] truncate">
                      {rec.title}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono">
                      ID: {rec.id}
                    </p>
                  </td>

                  <td className="p-3.5">
                    <p className="font-medium text-[var(--color-text-primary)]">{rec.userName}</p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">{rec.userEmail}</p>
                  </td>

                  <td className="p-3.5">
                    <span className="font-mono px-2 py-0.5 rounded bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-semibold border border-[var(--color-brand-default)]/20">
                      {rec.resolution.toUpperCase()} {rec.fps}FPS
                    </span>
                  </td>

                  <td className="p-3.5 font-mono">{formatDuration(rec.durationSeconds)}</td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      {rec.hasSubtitles && (
                        <span className="p-1 rounded bg-[var(--color-bg-elevated)] text-[var(--color-brand-default)]" title="Bangla-to-English Subtitles">
                          <HugeIcon icon={SubtitleIcon} size={14} />
                        </span>
                      )}
                      {rec.hasAiDub && (
                        <span className="p-1 rounded bg-[var(--color-bg-elevated)] text-cyan-400" title="Neural English Dub">
                          <HugeIcon icon={SparklesIcon} size={14} />
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 font-mono">{rec.viewsCount.toLocaleString()}</td>

                  <td className="p-3.5">
                    <StatusChip
                      status={rec.status === 'active' ? 'shared' : 'failed'}
                      label={rec.status === 'active' ? 'Active' : 'Blocked'}
                      size="sm"
                    />
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/watch/${rec.id === 'rec_001' ? 'demo-recording' : rec.id}`} target="_blank">
                        <Button variant="ghost" size="sm" className="text-xs px-2 py-1">
                          <HugeIcon icon={ArrowUpRight01Icon} size={12} />
                        </Button>
                      </Link>

                      <Button
                        variant={rec.status === 'active' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => setBlockTarget(rec)}
                        className="text-xs px-2 py-1"
                      >
                        {rec.status === 'active' ? 'Block Page' : 'Unblock'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Screen A09: Block Shared Page Confirm Modal */}
      {blockTarget && (
        <Modal
          open={!!blockTarget}
          onOpenChange={(open) => !open && setBlockTarget(null)}
          title={blockTarget.status === 'active' ? 'Block Public Share Link' : 'Restore Public Share Link'}
          size="md"
        >
          <div className="space-y-4 text-xs text-[var(--color-text-secondary)]">
            <div className="p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)]/30 text-[var(--color-error-default)]">
              <p className="font-bold">
                {blockTarget.status === 'active'
                  ? 'Blocking this share link will display the "Link Unavailable" screen (Screen 47) to all public visitors.'
                  : 'Unblocking this link restores public watch page access for all visitors.'}
              </p>
              <p className="text-[11px] mt-1 text-[var(--color-text-secondary)]">
                Important: Under VerseStudio privacy principles, admins cannot delete or tamper with files inside the creator&apos;s personal Google Drive.
              </p>
            </div>

            <p className="font-medium text-[var(--color-text-primary)]">
              Target Recording: <span className="font-bold">{blockTarget.title}</span>
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setBlockTarget(null)}>
                Cancel
              </Button>
              <Button
                variant={blockTarget.status === 'active' ? 'danger' : 'primary'}
                onClick={handleToggleBlock}
              >
                {blockTarget.status === 'active' ? 'Confirm Block' : 'Confirm Restore'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
