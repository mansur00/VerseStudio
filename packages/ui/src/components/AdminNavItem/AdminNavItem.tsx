'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface AdminNavItemProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: string | number;
  badgeVariant?: 'brand' | 'warning' | 'danger' | 'default';
  onClick?: () => void;
  className?: string;
  id?: string;
}

export const AdminNavItem: React.FC<AdminNavItemProps> = ({
  label,
  icon,
  active = false,
  badge,
  badgeVariant = 'default',
  onClick,
  className,
  id,
}) => {
  const badgeClasses = {
    brand: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] border-[var(--color-brand-default)]/30',
    warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-default)] border-[var(--color-warning-default)]/30',
    danger: 'bg-[var(--color-error-subtle)] text-[var(--color-error-default)] border-[var(--color-error-default)]/30',
    default: 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border-subtle)]',
  };

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group select-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
        active
          ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-semibold border border-[var(--color-brand-default)]/20 shadow-sm'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] border border-transparent',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors',
            active ? 'text-[var(--color-brand-default)]' : 'text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]'
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>

      {badge !== undefined && (
        <span
          className={cn(
            'text-[11px] font-semibold px-2 py-0.5 rounded-full border',
            badgeClasses[badgeVariant]
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
