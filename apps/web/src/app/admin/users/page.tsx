'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  AlertTriangle,
  HardDrive,
  Cpu,
  Video,
} from 'lucide-react';
import {
  Button,
  StatusChip,
  Checkbox,
  Pagination,
  Modal,
  Avatar,
  Select,
} from '@verse-studio/ui';
import { AdminUser } from '@verse-studio/shared';
import { MOCK_ADMIN_USERS } from '../../../data/mockAdminData';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(MOCK_ADMIN_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Modals state
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [suspendUserTarget, setSuspendUserTarget] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState('Terms of service violation');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'all' || u.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, searchQuery, planFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk selection handling (Screen A03)
  const isAllSelected = paginatedUsers.length > 0 && paginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  // Suspend action (Screen A06)
  const handleConfirmSuspend = () => {
    if (!suspendUserTarget) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === suspendUserTarget.id
          ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' }
          : u
      )
    );
    setSuspendUserTarget(null);
  };

  const handleBulkSuspend = () => {
    setUsers((prev) =>
      prev.map((u) => (selectedUserIds.includes(u.id) ? { ...u, status: 'suspended' } : u))
    );
    setSelectedUserIds([]);
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Users Management (A02–A06)
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Directory of all registered creators, subscription tiers, Drive storage, and active accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const csv = users.map((u) => `${u.id},${u.name},${u.email},${u.plan},${u.status}`).join('\n');
              const blob = new Blob([`id,name,email,plan,status\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'versestudio_users.csv';
              a.click();
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] text-xs rounded-xl pl-9 pr-4 py-2 border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-36">
            <Select
              options={[
                { value: 'all', label: 'All Plans' },
                { value: 'free', label: 'Free Tier' },
                { value: 'pro', label: 'Pro Studio' },
              ]}
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-1.5 text-xs"
            />
          </div>

          <div className="w-36">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'suspended', label: 'Suspended' },
              ]}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="py-1.5 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Screen A03: Bulk Actions Floating Bar */}
      {selectedUserIds.length > 0 && (
        <div className="p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-brand-default)]/40 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-default)]">
            <span className="w-5 h-5 rounded-full bg-[var(--color-brand-default)] text-black flex items-center justify-center font-bold text-[10px]">
              {selectedUserIds.length}
            </span>
            <span>users selected for bulk actions</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleBulkSuspend}
              className="text-xs"
            >
              Suspend Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds([])}
              className="text-xs"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Screen A04: No Results State */}
      {filteredUsers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            No users match your criteria
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto">
            No creators found matching &quot;{searchQuery}&quot;. Try adjusting your search query or reset the filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setPlanFilter('all');
              setStatusFilter('all');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Screen A02: Users Directory Table */
        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] text-[var(--color-text-tertiary)] font-medium">
                  <th className="p-3.5 w-10 text-center">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all users on page"
                    />
                  </th>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Plan</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Recordings</th>
                  <th className="p-3.5">Drive Storage</th>
                  <th className="p-3.5">AI Minutes</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
                {paginatedUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[var(--color-bg-hover)] transition-colors ${
                        isSelected ? 'bg-[var(--color-brand-subtle)]/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectUser(user.id)}
                          aria-label={`Select ${user.name}`}
                        />
                      </td>

                      <td className="p-3.5">
                        <div
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => setDetailUser(user)}
                        >
                          <Avatar name={user.name} size="sm" />
                          <div>
                            <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-default)] transition-colors">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-tertiary)]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <StatusChip
                          status={user.plan === 'pro' ? 'pro' : 'default'}
                          label={user.plan.toUpperCase()}
                          size="sm"
                        />
                      </td>

                      <td className="p-3.5">
                        <StatusChip
                          status={user.status === 'active' ? 'active' : 'failed'}
                          label={user.status === 'active' ? 'Active' : 'Suspended'}
                          size="sm"
                        />
                      </td>

                      <td className="p-3.5 font-mono text-[var(--color-text-primary)]">
                        {user.recordingsCount}
                      </td>

                      <td className="p-3.5 font-mono text-[var(--color-text-primary)]">
                        {formatBytes(user.driveStorageBytes)}
                      </td>

                      <td className="p-3.5 font-mono text-[var(--color-text-primary)]">
                        {user.aiMinutesUsed}m
                      </td>

                      <td className="p-3.5 text-[var(--color-text-tertiary)]">
                        {user.lastActive}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDetailUser(user)}
                            className="text-xs px-2 py-1"
                          >
                            Details
                          </Button>

                          <Button
                            variant={user.status === 'active' ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => setSuspendUserTarget(user)}
                            className="text-xs px-2 py-1"
                          >
                            {user.status === 'active' ? 'Suspend' : 'Reinstate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Screen A05: User Detail Modal */}
      {detailUser && (
        <Modal
          open={!!detailUser}
          onOpenChange={(open) => !open && setDetailUser(null)}
          title={`User Detail: ${detailUser.name}`}
          size="lg"
        >
          <div className="space-y-6 text-xs text-[var(--color-text-secondary)]">
            {/* Header summary */}
            <div className="p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={detailUser.name} size="md" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {detailUser.name}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">{detailUser.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={detailUser.plan === 'pro' ? 'pro' : 'default'} label={detailUser.plan.toUpperCase()} />
                <StatusChip status={detailUser.status === 'active' ? 'active' : 'failed'} label={detailUser.status} />
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] mb-1">
                  <Video className="w-3.5 h-3.5 text-[var(--color-brand-default)]" />
                  <span>Recordings</span>
                </div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{detailUser.recordingsCount}</p>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Drive Managed</span>
                </div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{formatBytes(detailUser.driveStorageBytes)}</p>
              </div>

              <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                <div className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] mb-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Minutes</span>
                </div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">{detailUser.aiMinutesUsed} / 300m</p>
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-2 p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-tertiary)]">Account ID</span>
                <span className="font-mono text-[var(--color-text-primary)]">{detailUser.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-tertiary)]">Joined Date</span>
                <span>{new Date(detailUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[var(--color-border-subtle)]">
                <span className="text-[var(--color-text-tertiary)]">Cloud Storage Architecture</span>
                <span className="text-[var(--color-brand-default)] font-semibold">User-Owned Google Drive (BYOS)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[var(--color-text-tertiary)]">2FA Authentication</span>
                <span className="text-[var(--color-success-default)] font-semibold">Enabled</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDetailUser(null)}>
                Close
              </Button>
              <Button
                variant={detailUser.status === 'active' ? 'danger' : 'primary'}
                onClick={() => {
                  setSuspendUserTarget(detailUser);
                  setDetailUser(null);
                }}
              >
                {detailUser.status === 'active' ? 'Suspend Account' : 'Reinstate Account'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Screen A06: Suspend Confirm Modal */}
      {suspendUserTarget && (
        <Modal
          open={!!suspendUserTarget}
          onOpenChange={(open) => !open && setSuspendUserTarget(null)}
          title={
            suspendUserTarget.status === 'active'
              ? `Suspend Account: ${suspendUserTarget.name}`
              : `Reinstate Account: ${suspendUserTarget.name}`
          }
          size="md"
        >
          <div className="space-y-4 text-xs text-[var(--color-text-secondary)]">
            <div className="p-3 rounded-xl bg-[var(--color-error-subtle)] border border-[var(--color-error-default)]/30 text-[var(--color-error-default)] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {suspendUserTarget.status === 'active'
                    ? 'Account suspension restricts access to VerseStudio Studio'
                    : 'Reinstate creator account to restore active studio permissions'}
                </p>
                <p className="text-[11px] mt-1 text-[var(--color-text-secondary)]">
                  Note: VerseStudio cannot delete or modify files in the creator&apos;s personal Google Drive folder.
                </p>
              </div>
            </div>

            {suspendUserTarget.status === 'active' && (
              <div className="space-y-2">
                <label className="font-medium text-[var(--color-text-primary)]">Suspension Reason</label>
                <input
                  type="text"
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] px-3 py-2 rounded-xl border border-[var(--color-border-input)] focus:outline-none focus:ring-2 focus:ring-[var(--color-border-focus)] text-xs"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setSuspendUserTarget(null)}>
                Cancel
              </Button>
              <Button
                variant={suspendUserTarget.status === 'active' ? 'danger' : 'primary'}
                onClick={handleConfirmSuspend}
              >
                {suspendUserTarget.status === 'active' ? 'Confirm Suspension' : 'Confirm Reinstatement'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
