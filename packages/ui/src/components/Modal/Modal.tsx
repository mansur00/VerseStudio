import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn';
import { Button } from '../Button/Button';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'confirm' | 'danger' | 'info';
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText,
  cancelText,
  onConfirm,
  variant = 'confirm',
  isLoading = false,
}) => {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Dialog Content */}
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]',
            'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-6 shadow-xl',
            'duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-lg font-semibold text-[var(--color-text-primary)]">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-[var(--color-text-secondary)]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 rounded-md transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogPrimitive.Close>
          </div>

          {children ? <div className="mt-4">{children}</div> : null}

          {(confirmText || cancelText) && (
            <div className="mt-6 flex justify-end gap-3">
              {cancelText && (
                <Button
                  variant="secondary"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
              )}
              {confirmText && (
                <Button
                  variant={variant === 'danger' ? 'danger' : 'primary'}
                  onClick={onConfirm}
                  isLoading={isLoading}
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
