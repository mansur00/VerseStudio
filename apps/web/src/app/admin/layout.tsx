'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Video,
  ShieldAlert,
  CreditCard,
  Cpu,
  HardDrive,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Search,
  Menu,
  X,
  LogOut,
  Bell,
  Sparkles,
} from 'lucide-react';
import { AdminNavItem, Avatar } from '@verse-studio/ui';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [is2FaVerified, setIs2FaVerified] = useState(true);

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: <LayoutDashboard className="w-4 h-4" />,
      active: pathname === '/admin',
    },
    {
      label: 'Users',
      href: '/admin/users',
      icon: <Users className="w-4 h-4" />,
      active: pathname.startsWith('/admin/users'),
    },
    {
      label: 'Recordings',
      href: '/admin/recordings',
      icon: <Video className="w-4 h-4" />,
      active: pathname.startsWith('/admin/recordings'),
    },
    {
      label: 'Moderation',
      href: '/admin/moderation',
      icon: <ShieldAlert className="w-4 h-4" />,
      active: pathname.startsWith('/admin/moderation'),
      badge: 1,
      badgeVariant: 'warning' as const,
    },
    {
      label: 'Plans & Billing',
      href: '/admin/billing',
      icon: <CreditCard className="w-4 h-4" />,
      active: pathname.startsWith('/admin/billing'),
    },
    {
      label: 'AI Usage & Costs',
      href: '/admin/ai-usage',
      icon: <Cpu className="w-4 h-4" />,
      active: pathname.startsWith('/admin/ai-usage'),
    },
    {
      label: 'Drive & Limits',
      href: '/admin/drive-limits',
      icon: <HardDrive className="w-4 h-4" />,
      active: pathname.startsWith('/admin/drive-limits'),
    },
    {
      label: 'Audit Log',
      href: '/admin/audit-log',
      icon: <FileSpreadsheet className="w-4 h-4" />,
      active: pathname.startsWith('/admin/audit-log'),
    },
    {
      label: 'Admin Settings',
      href: '/admin/settings',
      icon: <Settings className="w-4 h-4" />,
      active: pathname.startsWith('/admin/settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)] flex">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col justify-between border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4 sticky top-0 h-screen select-none">
        <div className="space-y-6">
          {/* Logo & Admin Badge */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-brand-default)] flex items-center justify-center font-black text-black text-sm shadow-[var(--glow-brand)]">
                V
              </div>
              <span className="font-bold text-sm tracking-tight">
                VerseStudio <span className="text-[var(--color-brand-default)] text-[10px] font-mono">ADMIN</span>
              </span>
            </Link>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]">
              v1.0
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <AdminNavItem
                  label={item.label}
                  icon={item.icon}
                  active={item.active}
                  badge={item.badge}
                  badgeVariant={item.badgeVariant}
                />
              </Link>
            ))}
          </nav>
        </div>

        {/* Admin User Footer Card */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-brand-default)]" />
              <span className="text-xs font-semibold text-[var(--color-brand-default)]">2FA Protected</span>
            </div>
            <button
              type="button"
              onClick={() => setIs2FaVerified(!is2FaVerified)}
              className="text-[10px] font-mono text-[var(--color-text-tertiary)] hover:underline"
              title="Toggle simulated 2FA status"
            >
              {is2FaVerified ? 'Verified' : 'Challenge'}
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar name="Mansur Admin" size="sm" />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">Mansur Admin</p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] truncate">Super Admin</p>
              </div>
            </div>

            <Link href="/" title="Exit Admin to App">
              <button
                type="button"
                className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                aria-label="Exit admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
              aria-label="Open navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="w-4 h-4 text-[var(--color-text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users, recordings, logs..."
                className="w-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] text-xs rounded-xl pl-9 pr-4 py-2 border border-[var(--color-border-subtle)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] border border-[var(--color-brand-default)]/30 text-xs font-mono font-medium">
              <Sparkles className="w-3 h-3" />
              Cluster: us-east (Healthy)
            </span>

            <button
              type="button"
              className="p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-warning-default)]" />
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex">
            <div className="w-64 bg-[var(--color-bg-surface)] h-full p-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                  <span className="font-bold text-sm">VerseStudio Admin</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1 text-[var(--color-text-secondary)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <AdminNavItem
                        label={item.label}
                        icon={item.icon}
                        active={item.active}
                        badge={item.badge}
                        badgeVariant={item.badgeVariant}
                      />
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-[var(--color-border-subtle)]">
                <Link href="/" onClick={() => setMobileOpen(false)}>
                  <button className="w-full py-2 px-3 rounded-xl border border-[var(--color-border-subtle)] text-xs text-center text-[var(--color-text-secondary)]">
                    Exit Admin to App
                  </button>
                </Link>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
