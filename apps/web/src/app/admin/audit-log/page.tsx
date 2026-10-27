'use client';

import React, { useState } from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '@verse-studio/ui';
import { AuditLogEntry } from '@verse-studio/shared';
import { MOCK_AUDIT_LOGS } from '../../../data/mockAdminData';

export default function AdminAuditLogPage() {
  const [logs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [search, setSearch] = useState('');

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorEmail.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Audit Log (A13)
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Immutable security ledger tracking administrative operations, moderation decisions, and user suspensions.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const csv = logs.map((l) => `${l.timestamp},${l.actorEmail},${l.action},${l.targetId},${l.ipAddress},"${l.details}"`).join('\n');
            const blob = new Blob([`timestamp,actor,action,target,ip,details\n${csv}`], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_log.csv';
            a.click();
          }}
          className="flex items-center gap-1.5 text-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit CSV</span>
        </Button>
      </div>

      <div className="p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, actor, or detail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] text-xs rounded-xl pl-9 pr-4 py-2 border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-canvas)] text-[var(--color-text-tertiary)] font-medium">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">IP Address</th>
                <th className="p-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-sans">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="p-3.5 font-mono text-[var(--color-text-tertiary)] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5 font-medium text-[var(--color-text-primary)]">
                    {log.actorEmail}
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono px-2 py-0.5 rounded bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-brand-default)] font-semibold text-[11px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[var(--color-text-primary)]">
                    {log.targetId}
                  </td>
                  <td className="p-3.5 font-mono text-[var(--color-text-tertiary)]">
                    {log.ipAddress}
                  </td>
                  <td className="p-3.5 text-[var(--color-text-primary)]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
