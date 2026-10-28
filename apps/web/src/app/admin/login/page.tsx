'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield01Icon, Alert01Icon } from '@hugeicons/core-free-icons';
import { Button, Input, HugeIcon } from '@verse-studio/ui';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        setIsLoading(false);
        return;
      }

      if (data.requires2FA) {
        router.push(`/admin/verify-2fa?next=${encodeURIComponent(next)}`);
      } else {
        router.push(next);
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8 bg-[var(--color-bg-surface)] p-8 rounded-2xl border border-[var(--color-border-subtle)] shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-default)] flex items-center justify-center font-black text-black text-xl shadow-[var(--glow-brand)] mx-auto mb-4">
            V
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Authentication</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Role-gated operational dashboard for VerseStudio 4K Pro
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)]/30 text-[var(--color-error-default)] flex items-center gap-2.5 text-xs">
            <HugeIcon icon={Alert01Icon} size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              Admin Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@versestudio.app"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying Credentials...' : 'Continue to 2FA Challenge'}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <HugeIcon icon={Shield01Icon} size={14} className="text-[var(--color-brand-default)]" />
            <span>2FA & AAL2 Required</span>
          </div>
          <Link href="/" className="hover:text-[var(--color-text-primary)]">
            Exit to App
          </Link>
        </div>
      </div>
    </div>
  );
}
