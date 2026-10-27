'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Button, StatusChip } from '@verse-studio/ui';
import { ModerationReport } from '@verse-studio/shared';
import { MOCK_MODERATION_REPORTS } from '../../../data/mockAdminData';

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ModerationReport[]>(MOCK_MODERATION_REPORTS);

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
                    <Clock className="w-3 h-3" />
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
                    <ExternalLink className="w-3.5 h-3.5" />
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
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Block Page</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(rep.id, 'dismissed')}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
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
