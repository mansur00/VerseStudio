'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield01Icon, Alert01Icon } from '@hugeicons/core-free-icons';
import { Button, Input, HugeIcon } from '@verse-studio/ui';

function AdminLoginForm() {
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
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-brand-subtle)] flex items-center justify-center mb-2">
            <HugeIcon icon={Shield01Icon} size={20} className="text-[var(--color-brand-default)]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">VerseStudio Admin Portal</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Sign in with authorized staff credentials. Multi-factor authentication is strictly enforced.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-[var(--color-danger-subtle)] text-xs text-[var(--color-danger-default)] flex items-center gap-2">
            <HugeIcon icon={Alert01Icon} size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@versestudio.app"
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
          />

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

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-canvas)]" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
