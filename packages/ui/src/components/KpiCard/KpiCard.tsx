import React from 'react';
import { cn } from '../../utils/cn';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  children?: React.ReactNode;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-left flex flex-col justify-between shadow-[var(--shadow-sm)]',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {title}
        </span>
        {icon ? (
          <div className="p-2 rounded-lg bg-[var(--color-bg-canvas)] text-[var(--color-brand-default)] border border-[var(--color-border-subtle)]">
            {icon}
          </div>
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}
          </span>
          {trend ? (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'bg-[var(--color-success-subtle)] text-[var(--color-success-default)]'
                  : 'bg-[var(--color-error-subtle)] text-[var(--color-error-default)]'
              )}
            >
              {trend.value}
            </span>
          ) : null}
        </div>

        {subtitle ? (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {subtitle}
          </p>
        ) : null}

        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </div>
  );
};
