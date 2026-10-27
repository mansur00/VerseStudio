import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: TabItem[];
  variant?: 'pill' | 'underline';
  className?: string;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  items,
  variant = 'pill',
  className,
  children,
}) => {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full flex flex-col', className)}
    >
      <TabsPrimitive.List
        className={cn(
          'flex items-center gap-1.5',
          variant === 'pill' &&
            'p-1 bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] rounded-lg',
          variant === 'underline' &&
            'border-b border-[var(--color-border-default)] pb-px'
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.id}
            value={item.id}
            disabled={item.disabled}
            className={cn(
              'flex items-center justify-center gap-2 px-3.5 py-1.5 text-sm font-medium transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              variant === 'pill' && [
                'rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]',
                'data-[state=active]:bg-[var(--color-bg-elevated)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm',
              ],
              variant === 'underline' && [
                'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] relative border-b-2 border-transparent -mb-px',
                'data-[state=active]:border-[var(--color-brand-default)] data-[state=active]:text-[var(--color-text-primary)]',
              ]
            )}
          >
            {item.icon ? <span className="w-4 h-4 shrink-0">{item.icon}</span> : null}
            <span>{item.label}</span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
};

export const TabContent = TabsPrimitive.Content;
