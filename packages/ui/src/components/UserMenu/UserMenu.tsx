import React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { User, Shield, CreditCard, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { Avatar } from '../Avatar/Avatar';
import { StatusChip } from '../StatusChip/StatusChip';
import { cn } from '../../utils/cn';

export interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
    plan: 'free' | 'pro';
  };
  onOpenProfile: () => void;
  onOpenSecurity: () => void;
  onOpenPlan: () => void;
  onOpenHelp: () => void;
  onSignOut: () => void;
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onOpenProfile,
  onOpenSecurity,
  onOpenPlan,
  onOpenHelp,
  onSignOut,
  className,
}) => {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 p-1.5 rounded-lg border border-transparent transition-colors outline-none',
            'hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
            className
          )}
          aria-label="User account menu"
        >
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-medium text-[var(--color-text-primary)] leading-tight max-w-[120px] truncate">
              {user.name}
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
              {user.plan}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" />
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-50 w-64 rounded-xl p-1.5 shadow-xl border border-[var(--color-border-default)]',
            'bg-[var(--color-bg-surface)] backdrop-blur-md text-[var(--color-text-primary)]',
            'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2'
          )}
        >
          {/* Header info */}
          <div className="p-2.5 pb-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="flex flex-col overflow-hidden mr-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {user.name}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)] truncate">
                {user.email}
              </span>
            </div>
            <StatusChip
              status={user.plan === 'pro' ? 'pro' : 'default'}
              label={user.plan.toUpperCase()}
              size="sm"
            />
          </div>

          {/* Navigation Items */}
          <div className="py-1">
            <DropdownMenuPrimitive.Item
              onSelect={onOpenProfile}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer outline-none transition-colors',
                'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus:bg-[var(--color-bg-hover)]'
              )}
            >
              <User className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span>Profile & Account</span>
            </DropdownMenuPrimitive.Item>

            <DropdownMenuPrimitive.Item
              onSelect={onOpenSecurity}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer outline-none transition-colors',
                'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus:bg-[var(--color-bg-hover)]'
              )}
            >
              <Shield className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span>Security & 2FA</span>
            </DropdownMenuPrimitive.Item>

            <DropdownMenuPrimitive.Item
              onSelect={onOpenPlan}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer outline-none transition-colors',
                'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus:bg-[var(--color-bg-hover)]'
              )}
            >
              <CreditCard className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span>Plan & Billing</span>
            </DropdownMenuPrimitive.Item>

            <DropdownMenuPrimitive.Item
              onSelect={onOpenHelp}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer outline-none transition-colors',
                'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] focus:bg-[var(--color-bg-hover)]'
              )}
            >
              <HelpCircle className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <span>Help & Support</span>
            </DropdownMenuPrimitive.Item>
          </div>

          <DropdownMenuPrimitive.Separator className="h-px bg-[var(--color-border-subtle)] my-1" />

          {/* Sign out */}
          <DropdownMenuPrimitive.Item
            onSelect={onSignOut}
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer outline-none transition-colors',
              'text-[var(--color-danger-default)] hover:bg-[var(--color-danger-subtle)] focus:bg-[var(--color-danger-subtle)]'
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};
