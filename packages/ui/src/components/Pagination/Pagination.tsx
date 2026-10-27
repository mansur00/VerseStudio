'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showDetails?: boolean;
  totalItems?: number;
  pageSize?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showDetails = true,
  totalItems,
  pageSize = 10,
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  const getPages = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems ?? currentPage * pageSize);

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-3 select-none', className)}
    >
      {showDetails && totalItems !== undefined ? (
        <span className="text-xs text-[var(--color-text-tertiary)]">
          Showing <span className="text-[var(--color-text-primary)] font-medium">{startItem}</span> to{' '}
          <span className="text-[var(--color-text-primary)] font-medium">{endItem}</span> of{' '}
          <span className="text-[var(--color-text-primary)] font-medium">{totalItems}</span> results
        </span>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="p-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1">
          {getPages().map((page, idx) => {
            if (page === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-[var(--color-text-tertiary)]">
                  …
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]',
                  isCurrent
                    ? 'bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-bold shadow-sm'
                    : 'bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="p-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)]"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
