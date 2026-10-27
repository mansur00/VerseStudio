import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../utils/cn';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  showBadge = false,
  badgeContent,
  className,
}) => {
  // Generate 2 initials from name
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

  const sizeClasses = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg font-semibold',
  };

  return (
    <div className={cn('relative inline-flex shrink-0 select-none', className)}>
      <AvatarPrimitive.Root
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full',
          'bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-medium',
          sizeClasses[size]
        )}
      >
        {src ? (
          <AvatarPrimitive.Image
            src={src}
            alt={name}
            className="h-full w-full object-cover"
          />
        ) : null}
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center bg-[var(--color-bg-active)] text-[var(--color-brand-default)]"
          delayMs={100}
        >
          {initials}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>

      {showBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
          {badgeContent || (
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-default)] ring-2 ring-[var(--color-bg-canvas)]" />
          )}
        </span>
      )}
    </div>
  );
};
