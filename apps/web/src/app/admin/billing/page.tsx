'use client';

import React from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Sparkles,
  Check,
} from 'lucide-react';
import { KpiCard, StatusChip } from '@verse-studio/ui';

export default function AdminBillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Plans & Billing (A10)
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          Revenue performance, subscription distribution, and plan pricing tier controls.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monthly Recurring Revenue"
          value="$28,920"
          subtitle="+14.2% MRR growth"
          icon={<DollarSign className="w-4 h-4 text-[var(--color-brand-default)]" />}
          trend={{ value: '+14.2%', isPositive: true }}
        />

        <KpiCard
          title="Pro Subscribers"
          value="1,522"
          subtitle="63.1% conversion rate"
          icon={<Sparkles className="w-4 h-4 text-amber-400" />}
          trend={{ value: '+8.4%', isPositive: true }}
        />

        <KpiCard
          title="Average Revenue / User"
          value="$19.00"
          subtitle="Standard Pro tier pricing"
          icon={<CreditCard className="w-4 h-4 text-sky-400" />}
        />

        <KpiCard
          title="Churn Rate"
          value="1.2%"
          subtitle="Low churn due to Google Drive BYOS"
          icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          trend={{ value: '-0.3%', isPositive: true }}
        />
      </div>

      {/* Subscription Tiers Table */}
      <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
        <h2 className="text-sm font-bold tracking-tight">Active Plan Tiers</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="p-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Free Starter</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">888 Active Creators</p>
              </div>
              <span className="text-xl font-bold font-mono">$0</span>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>Up to 4K 60FPS Studio Recording</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>30 AI Dubbing / Subtitle Minutes per month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>Direct Save to Google Drive (Zero storage quota limits)</span>
              </li>
              <li className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                <span>Standard VerseStudio watermark on tutorial guide export</span>
              </li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="p-5 rounded-xl border border-[var(--color-brand-default)]/40 bg-[var(--color-bg-elevated)] space-y-4 relative">
            <div className="absolute top-3 right-3">
              <StatusChip status="pro" label="MOST POPULAR" size="sm" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Pro Studio</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">1,522 Active Subscribers</p>
              </div>
              <span className="text-xl font-bold font-mono text-[var(--color-brand-default)]">$19/mo</span>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>Everything in Starter + 300 AI Minutes per month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>Custom Branding & Unbranded Tutorial Markdown Guides</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>Priority Whisper STT & ElevenLabs Dubbing Queues</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>2FA Security & Multi-device Sync</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
