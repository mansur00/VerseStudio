'use client';

import React, { useState, useEffect } from 'react';
import { HardDriveIcon, Shield01Icon, AlertCircleIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { KpiCard, HugeIcon } from '@verse-studio/ui';

interface DriveTelemetry {
  totalStorageFormatted: string;
  serverHostingCost: string;
  tokenHealth: string;
  quotaOverages: number;
  totalConnectedUsers: number;
  totalPagesHosted: number;
}

export default function AdminDriveLimitsPage() {
  const [telemetry, setTelemetry] = useState<DriveTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/drive-limits')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setTelemetry(data?.telemetry || null);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const data = telemetry || {
    totalStorageFormatted: '0.00 TB',
    serverHostingCost: '$0.00',
    tokenHealth: '100.0%',
    quotaOverages: 0,
    totalConnectedUsers: 0,
    totalPagesHosted: 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Google Drive Storage & Quota Limits (A12)
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Telemetry on user-owned Google Drive storage, BYOS (Bring Your Own Storage) economics, and OAuth token health.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Video Storage"
          value={isLoading ? '...' : data.totalStorageFormatted}
          subtitle={`Across ${data.totalConnectedUsers} connected user Drives`}
          icon={<HugeIcon icon={HardDriveIcon} size={16} className="text-blue-400" />}
        />

        <KpiCard
          title="Server Video Hosting Cost"
          value={isLoading ? '...' : data.serverHostingCost}
          subtitle="Zero video egress or storage cost (BYOS)"
          icon={<HugeIcon icon={Shield01Icon} size={16} className="text-[var(--color-brand-default)]" />}
        />

        <KpiCard
          title="OAuth Token Health"
          value={isLoading ? '...' : data.tokenHealth}
          subtitle="Active drive.file grants"
          icon={<HugeIcon icon={CheckmarkCircle01Icon} size={16} className="text-emerald-400" />}
        />

        <KpiCard
          title="Quota Overages"
          value={isLoading ? '...' : data.quotaOverages.toString()}
          subtitle="Users with full Google Drive"
          icon={<HugeIcon icon={AlertCircleIcon} size={16} className="text-amber-400" />}
        />
      </div>

      <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
        <h2 className="text-sm font-bold tracking-tight">BYOS Architectural Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[var(--color-text-secondary)]">
          <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)]">Minimal OAuth Scope</h3>
            <p className="leading-relaxed">
              VerseStudio requests strictly <code>https://www.googleapis.com/auth/drive.file</code>. The app can only see and access files created by VerseStudio itself, ensuring complete user privacy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)]">Infinite Local Retention</h3>
            <p className="leading-relaxed">
              Free and Pro tiers both enjoy unlimited storage because data is stored on the creator&apos;s own Google Drive quota.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] space-y-2">
            <h3 className="font-bold text-[var(--color-text-primary)]">Zero Vendor Lock-in</h3>
            <p className="leading-relaxed">
              If a user uninstalls the extension or deletes their VerseStudio account, all their MP4/WebM recordings remain untouched inside their Google Drive.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
