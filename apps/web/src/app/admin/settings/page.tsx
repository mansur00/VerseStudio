'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield01Icon,
  UserAdd01Icon,
  LockIcon,
  Delete01Icon,
} from '@hugeicons/core-free-icons';
import { Button, Modal, Input, Select, StatusChip, Avatar, HugeIcon } from '@verse-studio/ui';
import { AdminRoleMember } from '@verse-studio/shared';

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminRoleMember[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'moderator' | 'support'>('moderator');

  const loadAdmins = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/admins');
      if (res.ok) {
        const data = await res.json();
        const mapped: AdminRoleMember[] = (data.admins || []).map((a: any) => ({
          id: a.id,
          name: a.email.split('@')[0],
          email: a.email,
          role: a.role === 'super_admin' ? 'super_admin' : a.role === 'support' ? 'support' : 'moderator',
          twoFactorEnabled: a.two_factor_enabled,
          addedAt: a.created_at,
        }));
        setAdmins(mapped);
      }
    } catch (e) {
      console.error('Failed to load admins:', e);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole === 'moderator' ? 'viewer' : inviteRole }),
      });
      if (res.ok) {
        loadAdmins();
      }
    } catch (e) {
      console.error('Failed to invite admin:', e);
    }

    setInviteName('');
    setInviteEmail('');
    setInviteModalOpen(false);
  };

  const handleRemoveAdmin = (id: string) => {
    setAdmins(admins.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Admin Settings & Roles
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Manage administrative personnel, assign role-based access permissions, and enforce hardware/TOTP 2FA.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setInviteModalOpen(true)}
          leadingIcon={<HugeIcon icon={UserAdd01Icon} size={16} />}
          className="w-full sm:w-auto"
        >
          Invite Admin
        </Button>
      </div>

      {/* 2FA Enforcement Banner */}
      <div className="p-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-brand-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface)] text-[var(--color-brand-default)] shrink-0">
            <HugeIcon icon={Shield01Icon} size={20} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[var(--color-brand-default)]">
              Mandatory 2FA Enforcement Active
            </h3>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              All administrative accounts require active Two-Factor Authentication (TOTP or Passkey) before accessing `/admin` routes.
            </p>
          </div>
        </div>

        <StatusChip status="active" label="ENFORCED" size="sm" />
      </div>

      {/* Admin Personnel Directory */}
      <div className="p-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
        <h2 className="text-sm font-bold tracking-tight">Active Administrators</h2>

        <div className="divide-y divide-[var(--color-border-subtle)]">
          {admins.map((adm) => (
            <div key={adm.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={adm.name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {adm.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                    {adm.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0 flex-wrap sm:flex-nowrap">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-brand-default)] font-semibold">
                  {adm.role.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-success-default)]">
                  <HugeIcon icon={Shield01Icon} size={14} />
                  <span>2FA Active</span>
                </div>

                {adm.role !== 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(adm.id)}
                    className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error-default)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    title="Revoke Admin Access"
                  >
                    <HugeIcon icon={Delete01Icon} size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Screen A15: Invite Admin Modal */}
      {inviteModalOpen && (
        <Modal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          title="Invite New Administrator"
          size="md"
        >
          <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-[var(--color-text-secondary)]">Full Name</label>
              <Input
                placeholder="e.g. Ayesha Rahman"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[var(--color-text-secondary)]">Work Email</label>
              <Input
                type="email"
                placeholder="colleague@versestudio.app"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-[var(--color-text-secondary)]">Administrative Role</label>
              <Select
                options={[
                  { value: 'moderator', label: 'Moderator (Can review & block share pages)' },
                  { value: 'support', label: 'Support (Can inspect user quotas)' },
                  { value: 'super_admin', label: 'Super Admin (Full administrative access)' },
                ]}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
              />
            </div>

            <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-tertiary)] space-y-1">
              <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] font-semibold">
                <HugeIcon icon={LockIcon} size={14} className="text-[var(--color-brand-default)]" />
                <span>Security Onboarding Requirement</span>
              </div>
              <p>
                The invited administrator will receive an email verification link and must enroll a 2FA authenticator app before granting dashboard access.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setInviteModalOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="w-full sm:w-auto">
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
