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
    brand: 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]',
    warning: 'bg-[var(--color-warning-subtle)] text-[var(--color-warning-default)]',
    danger: 'bg-[var(--color-error-subtle)] text-[var(--color-error-default)]',
    default: 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]',
  };

  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors select-none text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
        active
          ? 'bg-[var(--color-brand-subtle)] text-[var(--color-text-primary)] font-semibold'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors',
            active ? 'text-[var(--color-brand-default)]' : 'text-[var(--color-text-tertiary)]'
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
            'text-[11px] font-semibold px-2 py-0.5 rounded-full',
            badgeClasses[badgeVariant]
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
};
