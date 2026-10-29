'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  Time02Icon,
  InboxIcon,
} from '@hugeicons/core-free-icons';
import { Button, StatusChip, HugeIcon } from '@verse-studio/ui';

interface ModerationReportItem {
  id: string;
  share_page_id: string;
  reporter_email: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  action_taken?: string;
  created_at: string;
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ModerationReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/moderation')
      .then((res) => (res.ok ? res.json() : { reports: [] }))
      .then((data) => {
        setReports(data.reports || []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'resolved' | 'dismissed') => {
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: id, action: newStatus }),
      });
      if (res.ok) {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      // Ignore error
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Moderation Queue
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Review community reports, copyright disputes, and privacy violation tickets on public share pages.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-[var(--color-text-tertiary)]">
          Loading moderation tickets from database...
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mx-auto text-[var(--color-text-tertiary)]">
            <HugeIcon icon={InboxIcon} size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">All Clear: Moderation Queue is Empty</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            There are currently zero pending reports or copyright flags in the database.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {reports.map((rep) => {
            const isPending = rep.status === 'pending';
            return (
              <div
                key={rep.id}
                className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[var(--color-warning-subtle)] text-[var(--color-warning-default)] font-semibold">
                      {rep.reason.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1">
                      <HugeIcon icon={Time02Icon} size={12} />
                      {new Date(rep.created_at).toLocaleDateString()}
                    </span>
                    <StatusChip
                      status={rep.status === 'resolved' ? 'active' : rep.status === 'dismissed' ? 'private' : 'recording'}
                      label={rep.status.toUpperCase()}
                      size="sm"
                    />
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Share Page ID: <span className="font-mono text-sm">{rep.share_page_id}</span>
                  </h3>

                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    Reported by: <span className="font-mono">{rep.reporter_email}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">
                  <Link href={`/watch/${rep.share_page_id}`} target="_blank">
                    <Button variant="ghost" size="sm" leadingIcon={<HugeIcon icon={ArrowUpRight01Icon} size={14} />}>
                      Inspect
                    </Button>
                  </Link>

                  {isPending && (
                    <>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateStatus(rep.id, 'resolved')}
                        leadingIcon={<HugeIcon icon={Shield01Icon} size={14} />}
                      >
                        Take Down
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(rep.id, 'dismissed')}
                        leadingIcon={<HugeIcon icon={CheckmarkCircle01Icon} size={14} />}
                      >
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
