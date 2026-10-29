'use client';

import React, { useState, useEffect } from 'react';
import { CpuIcon, DollarSignIcon, Activity01Icon, ServerIcon, InboxIcon } from '@hugeicons/core-free-icons';
import { KpiCard, ChartLine, HugeIcon } from '@verse-studio/ui';

interface AiUsageStats {
  totalAiMinutes: string;
  totalComputeCost: string;
  grossMargin: string;
  successRate: string;
  dailyUsage: Array<{ label: string; value: number }>;
}

export default function AdminAiUsagePage() {
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/ai-usage')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setStats(data?.stats || null);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const data = stats || {
    totalAiMinutes: '0m',
    totalComputeCost: '$0.00',
    grossMargin: '100%',
    successRate: '100%',
    dailyUsage: [
      { label: 'Mon', value: 0 },
      { label: 'Tue', value: 0 },
      { label: 'Wed', value: 0 },
      { label: 'Thu', value: 0 },
      { label: 'Fri', value: 0 },
      { label: 'Sat', value: 0 },
      { label: 'Sun', value: 0 },
    ],
  };

  const hasUsage = parseInt(data.totalAiMinutes.replace(/\D/g, ''), 10) > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          AI Usage & Costs
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Monitor serverless speech-to-text, neural English dubbing, and AI tutorial compilation costs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total AI Minutes (MTD)"
          value={isLoading ? '...' : data.totalAiMinutes}
          subtitle="Gemini STT + Neural Voice"
          icon={<HugeIcon icon={CpuIcon} size={16} className="text-[var(--color-brand-default)]" />}
        />

        <KpiCard
          title="Gross AI Compute Cost"
          value={isLoading ? '...' : data.totalComputeCost}
          subtitle="Avg $0.015 / minute"
          icon={<HugeIcon icon={DollarSignIcon} size={16} className="text-emerald-400" />}
        />

        <KpiCard
          title="Gross Margin on AI"
          value={isLoading ? '...' : data.grossMargin}
          subtitle="High margin SaaS economics"
          icon={<HugeIcon icon={Activity01Icon} size={16} className="text-sky-400" />}
        />

        <KpiCard
          title="Serverless Success Rate"
          value={isLoading ? '...' : data.successRate}
          subtitle="Gemini & ElevenLabs pipeline"
          icon={<HugeIcon icon={ServerIcon} size={16} className="text-purple-400" />}
        />
      </div>

      {!hasUsage && !isLoading ? (
        <div className="p-8 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mx-auto text-[var(--color-text-tertiary)]">
            <HugeIcon icon={InboxIcon} size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Zero AI Minutes Consumed</h3>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            No recording sessions have consumed AI dubbing or subtitle minutes yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
            <h2 className="text-sm font-bold tracking-tight mb-4">Daily AI Minutes Processed</h2>
            <ChartLine
              data={data.dailyUsage}
              height={160}
              strokeColor="var(--color-accent-laser)"
              unit="m"
            />
          </div>

          <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
            <h2 className="text-sm font-bold tracking-tight">AI Service Unit Economics</h2>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Gemini 1.5 Flash STT (Bangla to English)</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">Speech recognition & translation</p>
                </div>
                <span className="font-mono font-bold">$0.005 / min</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">ElevenLabs Neural English Dubbing</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">Natural English audio generation</p>
                </div>
                <span className="font-mono font-bold">$0.024 / min</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">Automated Tutorial Guide Compiler</p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">Markdown tutorial generation</p>
                </div>
                <span className="font-mono font-bold">$0.001 / guide</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
