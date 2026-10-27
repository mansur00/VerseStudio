'use client';

import React from 'react';
import Link from 'next/link';
import {
  Video,
  Users,
  Cpu,
  HardDrive,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';
import { KpiCard, ChartLine, ChartBars, Button, StatusChip } from '@verse-studio/ui';
import { MOCK_ADMIN_RECORDINGS, MOCK_MODERATION_REPORTS } from '../../data/mockAdminData';

export default function AdminOverviewPage() {
  const recordingTrendData = [
    { label: 'Oct 01', value: 320 },
    { label: 'Oct 05', value: 410 },
    { label: 'Oct 10', value: 390 },
    { label: 'Oct 15', value: 540 },
    { label: 'Oct 20', value: 680 },
    { label: 'Oct 25', value: 890 },
    { label: 'Oct 27', value: 1040 },
  ];

  const aiUsageBreakdownData = [
    { label: 'BN->EN Subtitles', value: 24500 },
    { label: 'Neural Dubbing', value: 16800 },
    { label: 'Mixed Audio Ducking', value: 4200 },
    { label: 'Tutorial Guides', value: 2750 },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Admin Overview (A01)
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Real-time platform telemetry, user adoption, bilingual AI pipelines, and cloud storage health.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/moderation">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-warning-default)]" />
              <span>Moderation Queue ({MOCK_MODERATION_REPORTS.filter((r) => r.status === 'pending').length})</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Recordings"
          value="14,892"
          subtitle="+18.4% vs last month"
          icon={<Video className="w-4 h-4 text-[var(--color-brand-default)]" />}
          trend={{ value: '+18.4%', isPositive: true }}
        />

        <KpiCard
          title="Active Creators"
          value="2,410"
          subtitle="+12.2% growth rate"
          icon={<Users className="w-4 h-4 text-sky-400" />}
          trend={{ value: '+12.2%', isPositive: true }}
        />

        <KpiCard
          title="AI Minutes Consumed"
          value="48,250"
          subtitle="STT & Neural Dubbing"
          icon={<Cpu className="w-4 h-4 text-[var(--color-accent-laser)]" />}
          trend={{ value: '+24.0%', isPositive: true }}
        />

        <KpiCard
          title="Drive Storage Managed"
          value="18.4 TB"
          subtitle="Zero server video cost • User Drive"
          icon={<HardDrive className="w-4 h-4 text-emerald-400" />}
          trend={{ value: '100% BYOS', isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Recordings Chart */}
        <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                Daily 4K Recordings Growth
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Completed 4K 60FPS recordings over the last 30 days
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--color-brand-default)] bg-[var(--color-brand-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-brand-default)]/30 font-semibold">
              Peak: 1,040 / day
            </span>
          </div>

          <ChartLine
            data={recordingTrendData}
            height={160}
            strokeColor="var(--color-brand-default)"
            fillColor="var(--color-brand-default)"
            unit=" recs"
          />
        </div>

        {/* AI Consumption Breakdown */}
        <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
                Bilingual AI Usage by Pipeline
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Minutes processed for Bangla speech & dubbing
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
              Total: 48.2k mins
            </span>
          </div>

          <ChartBars
            data={aiUsageBreakdownData}
            height={160}
            barColor="var(--color-accent-laser)"
            unit="m"
          />
        </div>
      </div>

      {/* Recent Recordings & Flagged Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Recordings Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-4">
            <h2 className="text-sm font-bold tracking-tight">Recent Cloud Uploads</h2>
            <Link
              href="/admin/recordings"
              className="text-xs text-[var(--color-brand-default)] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {MOCK_ADMIN_RECORDINGS.slice(0, 3).map((rec) => (
              <div key={rec.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate text-[var(--color-text-primary)]">
                    {rec.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    <span>by {rec.userName}</span>
                    <span>•</span>
                    <span className="font-mono">{rec.resolution.toUpperCase()} {rec.fps}FPS</span>
                    <span>•</span>
                    <span>{rec.viewsCount} views</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusChip
                    status={rec.status === 'active' ? 'shared' : 'failed'}
                    label={rec.status === 'active' ? 'Active' : 'Blocked'}
                    size="sm"
                  />
                  <Link href={`/watch/${rec.id === 'rec_001' ? 'demo-recording' : rec.id}`} target="_blank">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                      title="Open watch page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Moderation Alerts */}
        <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)] mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[var(--color-warning-default)]" />
                <h2 className="text-sm font-bold tracking-tight">Active Moderation</h2>
              </div>
              <span className="text-xs font-mono text-[var(--color-warning-default)] bg-[var(--color-warning-subtle)] px-2 py-0.5 rounded-full font-semibold">
                1 Pending
              </span>
            </div>

            <div className="space-y-3">
              {MOCK_MODERATION_REPORTS.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--color-warning-subtle)] text-[var(--color-warning-default)] font-semibold">
                      {rep.reason.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                    {rep.recordingTitle}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] line-clamp-2">
                    {rep.details}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--color-border-subtle)]">
            <Link href="/admin/moderation">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                Review Moderation Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
