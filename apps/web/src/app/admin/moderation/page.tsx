'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  Time02Icon,
} from '@hugeicons/core-free-icons';
import { Button, StatusChip, HugeIcon } from '@verse-studio/ui';
import { ModerationReport } from '@verse-studio/shared';

const INITIAL_REPORTS: ModerationReport[] = [
  {
    id: 'rep_1',
    recordingId: 'rec_flagged_copyright_violation',
    recordingTitle: 'Unlicensed Movie Rip Screening',
    reportedByEmail: 'copyright@media-watch.org',
    reason: 'copyright',
    details: 'Pirated content stream reported',
    status: 'pending',
    createdAt: '2024-01-23T11:30:00Z',
  },
];

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>(INITIAL_REPORTS);

  const handleUpdateStatus = (id: string, newStatus: 'resolved' | 'dismissed') => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Moderation Queue (A08)
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Review community reports, copyright disputes, and privacy violation tickets on public share pages.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((rep) => {
          const isPending = rep.status === 'pending';
          return (
            <div
              key={rep.id}
              className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
            >
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--color-warning-subtle)] text-[var(--color-warning-default)] border border-[var(--color-warning-default)]/30 font-semibold">
                    {rep.reason.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                    <HugeIcon icon={Time02Icon} size={12} />
                    {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                  <StatusChip
                    status={rep.status === 'resolved' ? 'active' : rep.status === 'dismissed' ? 'private' : 'recording'}
                    label={rep.status.toUpperCase()}
                    size="sm"
                  />
                </div>

                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  {rep.recordingTitle}
                </h3>

                <p className="text-xs text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                  {rep.details}
                </p>

                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  Reported by: <span className="font-mono">{rep.reportedByEmail}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/watch/${rep.recordingId === 'rec_001' ? 'demo-recording' : rep.recordingId}`} target="_blank">
                  <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1.5">
                    <HugeIcon icon={ArrowUpRight01Icon} size={14} />
                    <span>Inspect</span>
                  </Button>
                </Link>

                {isPending && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUpdateStatus(rep.id, 'resolved')}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <HugeIcon icon={Shield01Icon} size={14} />
                      <span>Block Page</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(rep.id, 'dismissed')}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <HugeIcon icon={CheckmarkCircle01Icon} size={14} />
                      <span>Dismiss</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
