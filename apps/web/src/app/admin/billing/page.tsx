'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  DollarSignIcon,
  TrendingUpIcon,
  SparklesIcon,
  Tick01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { KpiCard, StatusChip, HugeIcon } from '@verse-studio/ui';

interface BillingData {
  summary: {
    mrr: string;
    mrrGrowth: string;
    proSubscribers: number;
    freeSubscribers: number;
    totalUsers: number;
    conversionRate: string;
    arpu: string;
    churnRate: string;
  };
  provider: {
    name: string;
    configured: boolean;
    notice?: string;
  };
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/billing')
      .then((res) => (res.ok ? res.json() : null))
      .then((resData) => {
        setData(resData);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const summary = data?.summary || {
    mrr: '$0.00',
    mrrGrowth: '0.0%',
    proSubscribers: 0,
    freeSubscribers: 0,
    totalUsers: 0,
    conversionRate: '0.0%',
    arpu: '$0.00',
    churnRate: '0.0%',
  };

  const provider = data?.provider || {
    name: 'Unconfigured',
    configured: false,
    notice: 'Payment provider not configured in environment.',
  };

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

      {/* Provider Status Alert */}
      {!provider.configured && (
        <div className="p-4 rounded-xl border border-[var(--color-warning-default)]/30 bg-[var(--color-warning-subtle)]/30 flex items-start gap-3">
          <div className="text-[var(--color-warning-default)] mt-0.5">
            <HugeIcon icon={AlertCircleIcon} size={18} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-[var(--color-text-primary)]">
              Payment Provider Status: Not Configured
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Automatic payment checkout and webhooks are inactive. Plan upgrades are currently managed directly via administrator entitlement in accordance with Pass D security guidelines. Set <code>STRIPE_SECRET_KEY</code> to enable live payment processing.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Monthly Recurring Revenue"
          value={isLoading ? '...' : summary.mrr}
          subtitle={`${summary.proSubscribers} Pro @ $19/mo`}
          icon={<HugeIcon icon={DollarSignIcon} size={16} className="text-[var(--color-brand-default)]" />}
        />

        <KpiCard
          title="Pro Subscribers"
          value={isLoading ? '...' : summary.proSubscribers.toString()}
          subtitle={`${summary.conversionRate} conversion rate`}
          icon={<HugeIcon icon={SparklesIcon} size={16} className="text-amber-400" />}
        />

        <KpiCard
          title="Average Revenue / User"
          value={isLoading ? '...' : summary.arpu}
          subtitle="Across total user base"
          icon={<HugeIcon icon={CreditCardIcon} size={16} className="text-sky-400" />}
        />

        <KpiCard
          title="Total Registered Creators"
          value={isLoading ? '...' : summary.totalUsers.toString()}
          subtitle={`${summary.freeSubscribers} Free Starter tiers`}
          icon={<HugeIcon icon={TrendingUpIcon} size={16} className="text-emerald-400" />}
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
                <p className="text-xs text-[var(--color-text-tertiary)]">{summary.freeSubscribers} Active Creators</p>
              </div>
              <span className="text-xl font-bold font-mono">$0</span>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
                <span>Up to 4K 60FPS Studio Recording</span>
              </li>
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
                <span>30 AI Dubbing / Subtitle Minutes per month</span>
              </li>
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
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
              <StatusChip status="pro" label="PRO TIER" size="sm" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">Pro Studio</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">{summary.proSubscribers} Active Subscribers</p>
              </div>
              <span className="text-xl font-bold font-mono">$19/mo</span>
            </div>

            <ul className="space-y-2 text-xs text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
                <span>Up to 4K 60FPS Studio Recording with Custom Wallpaper Frames</span>
              </li>
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
                <span>300 AI Minutes / month (Gemini STT + ElevenLabs Neural Voice)</span>
              </li>
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
                <span>Whitelabel guide exports without watermark</span>
              </li>
              <li className="flex items-center gap-2">
                <HugeIcon icon={Tick01Icon} size={14} className="text-[var(--color-brand-default)]" />
                <span>High-priority rendering & WebCodecs acceleration</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
