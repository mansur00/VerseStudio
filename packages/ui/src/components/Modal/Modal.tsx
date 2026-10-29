import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn';
import { Button } from '../Button/Button';
import { HugeIcon } from '../HugeIcon';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'confirm' | 'danger' | 'info';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  hideHeader?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl w-[calc(100vw-2rem)]',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title = '',
  description,
  children,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'confirm',
  isLoading = false,
  size = 'md',
  className,
  hideHeader = false,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Dialog Content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] translate-x-[-50%] translate-y-[-50%] flex flex-col overflow-hidden',
            sizeClasses[size],
            'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl p-4 sm:p-6 shadow-xl',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            className
          )}
        >
          {hideHeader ? (
            <>
              {/* Visually hidden accessibility title */}
              <DialogPrimitive.Title className="sr-only">
                {title || 'Modal dialog'}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="sr-only">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="absolute top-4 right-4 z-20 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-canvas)]"
                  aria-label="Close dialog"
                >
                  <HugeIcon icon={Cancel01Icon} size={20} />
                </button>
              </DialogPrimitive.Close>
            </>
          ) : (
            <div className="flex items-start justify-between shrink-0">
              <div className="space-y-1">
                <DialogPrimitive.Title className="font-h4 font-semibold text-[var(--color-text-primary)]">
                  {title}
                </DialogPrimitive.Title>
                {description ? (
                  <DialogPrimitive.Description className="font-body-s text-[var(--color-text-secondary)]">
                    {description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-canvas)]"
                  aria-label="Close dialog"
                >
                  <HugeIcon icon={Cancel01Icon} size={20} />
                </button>
              </DialogPrimitive.Close>
            </div>
          )}

          {children ? (
            <div className={cn('flex-1 min-h-0 overflow-y-auto pr-1', !hideHeader && 'mt-4')}>
              {children}
            </div>
          ) : null}

          {(confirmText || cancelText) && (
            <div className="mt-6 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3">
              {cancelText && (
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {cancelText}
                </Button>
              )}
              {confirmText && (
                <Button
                  variant={variant === 'danger' ? 'danger' : 'primary'}
                  onClick={onConfirm}
                  isLoading={isLoading}
                  className="w-full sm:w-auto"
                >
                  {confirmText}
                </Button>
              )}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
