'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Trash2,
} from 'lucide-react';
import { Button, Modal, Input, Select, StatusChip, Avatar } from '@verse-studio/ui';
import { AdminRoleMember } from '@verse-studio/shared';
import { MOCK_ADMIN_ROLES } from '../../../data/mockAdminData';

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminRoleMember[]>(MOCK_ADMIN_ROLES);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'super_admin' | 'moderator' | 'support'>('moderator');

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    const newAdmin: AdminRoleMember = {
      id: `adm_${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      twoFactorEnabled: true,
      addedAt: new Date().toISOString(),
    };

    setAdmins([...admins, newAdmin]);
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
            Admin Settings & Roles (A14)
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Manage administrative personnel, assign role-based access permissions, and enforce hardware/TOTP 2FA.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setInviteModalOpen(true)}
          className="flex items-center gap-1.5 text-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Invite Admin (A15)</span>
        </Button>
      </div>

      {/* 2FA Enforcement Banner */}
      <div className="p-4 rounded-xl border border-[var(--color-brand-default)]/30 bg-[var(--color-brand-subtle)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--color-bg-surface)] text-[var(--color-brand-default)] border border-[var(--color-brand-default)]/30">
            <ShieldCheck className="w-5 h-5" />
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
            <div key={adm.id} className="py-3.5 flex items-center justify-between gap-4">
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

              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-brand-default)] font-semibold">
                  {adm.role.replace('_', ' ')}
                </span>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-success-default)]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">2FA Active</span>
                </div>

                {adm.role !== 'super_admin' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAdmin(adm.id)}
                    className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-error-default)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    title="Revoke Admin Access"
                  >
                    <Trash2 className="w-4 h-4" />
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
          title="Invite New Administrator (A15)"
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
                <Lock className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                <span>Security Onboarding Requirement</span>
              </div>
              <p>
                The invited administrator will receive an email verification link and must enroll a 2FA authenticator app before granting dashboard access.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" type="button" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Send Invitation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
