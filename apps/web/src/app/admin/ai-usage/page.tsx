'use client';

import React from 'react';
import { CpuIcon, DollarSignIcon, Activity01Icon, ServerIcon } from '@hugeicons/core-free-icons';
import { KpiCard, ChartLine, HugeIcon } from '@verse-studio/ui';

export default function AdminAiUsagePage() {
  const weeklyUsageData = [
    { label: 'Mon', value: 6200 },
    { label: 'Tue', value: 7100 },
    { label: 'Wed', value: 6800 },
    { label: 'Thu', value: 8400 },
    { label: 'Fri', value: 9200 },
    { label: 'Sat', value: 5100 },
    { label: 'Sun', value: 5450 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          AI Usage & Server Costs (A11)
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Monitor serverless speech-to-text, neural English dubbing, and AI tutorial compilation costs.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total AI Minutes (MTD)"
          value="48,250m"
          subtitle="Whisper + Neural Voice"
          icon={<HugeIcon icon={CpuIcon} size={16} className="text-[var(--color-brand-default)]" />}
        />

        <KpiCard
          title="Gross AI Compute Cost"
          value="$742.60"
          subtitle="Avg $0.015 / minute"
          icon={<HugeIcon icon={DollarSignIcon} size={16} className="text-emerald-400" />}
        />

        <KpiCard
          title="Gross Margin on AI"
          value="97.4%"
          subtitle="High margin SaaS economics"
          icon={<HugeIcon icon={Activity01Icon} size={16} className="text-sky-400" />}
          trend={{ value: '+2.1%', isPositive: true }}
        />

        <KpiCard
          title="Serverless Success Rate"
          value="99.94%"
          subtitle="Zero failed mux jobs"
          icon={<HugeIcon icon={ServerIcon} size={16} className="text-purple-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          <h2 className="text-sm font-bold tracking-tight mb-4">Daily AI Minutes Processed</h2>
          <ChartLine
            data={weeklyUsageData}
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
                <p className="font-semibold text-[var(--color-text-primary)]">Whisper STT (Bangla to English)</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">Real-time & post-recording transcript</p>
              </div>
              <span className="font-mono font-bold">$0.006 / min</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex justify-between items-center">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">ElevenLabs Neural Voice Dubbing</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">Natural English audio generation</p>
              </div>
              <span className="font-mono font-bold">$0.024 / min</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex justify-between items-center">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">Gemini Flash Step-by-Step Guide</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">Markdown tutorial generation</p>
              </div>
              <span className="font-mono font-bold">$0.001 / guide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
