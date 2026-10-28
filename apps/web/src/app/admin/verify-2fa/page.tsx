'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield01Icon, Alert01Icon, LockIcon } from '@hugeicons/core-free-icons';
import { Button, Input, HugeIcon } from '@verse-studio/ui';

function AdminVerify2FaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [totpCode, setTotpCode] = useState('');
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
        body: JSON.stringify({ action: 'verify-2fa', totpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '2FA Verification failed');
        setIsLoading(false);
        return;
      }

      router.push(next);
    } catch {
      setError('Unable to complete 2FA challenge. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-8 bg-[var(--color-bg-surface)] p-8 rounded-2xl border border-[var(--color-border-subtle)] shadow-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-subtle)] border border-[var(--color-brand-default)]/30 text-[var(--color-brand-default)] flex items-center justify-center mx-auto mb-4">
            <HugeIcon icon={LockIcon} size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Enter the 6-digit TOTP verification code from your authenticator application.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)]/30 text-[var(--color-error-default)] flex items-center gap-2.5 text-xs">
            <HugeIcon icon={Alert01Icon} size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Authentication Code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="123456"
            className="text-center tracking-widest font-mono text-xl"
            autoFocus
            required
          />

          <div className="space-y-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center"
              disabled={isLoading || totpCode.length < 6}
            >
              {isLoading ? 'Verifying Code...' : 'Complete Authentication'}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-1.5">
            <HugeIcon icon={Shield01Icon} size={14} className="text-[var(--color-brand-default)]" />
            <span>Assurance Level AAL2</span>
          </div>
          <Link href="/admin/login" className="hover:text-[var(--color-text-primary)]">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminVerify2FaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-canvas)]" />}>
      <AdminVerify2FaForm />
    </Suspense>
  );
}
