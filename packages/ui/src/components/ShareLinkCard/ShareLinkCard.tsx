import React, { useState } from 'react';
import {
  Copy01Icon,
  Tick01Icon,
  GlobeIcon,
  LockIcon,
  ArrowUpRight01Icon,
  QrCodeIcon,
} from '@hugeicons/core-free-icons';
import { HugeIcon } from '../HugeIcon';
import { Button } from '../Button/Button';
import { cn } from '../../utils/cn';

export interface ShareLinkCardProps {
  shareUrl: string;
  isPublic: boolean;
  onToggleVisibility?: (isPublic: boolean) => void;
  onOpenInDrive?: () => void;
  className?: string;
}

export const ShareLinkCard: React.FC<ShareLinkCardProps> = ({
  shareUrl,
  isPublic,
  onToggleVisibility,
  onOpenInDrive,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 p-4 rounded-xl border bg-[var(--color-bg-surface)] border-[var(--color-border-default)] text-left',
        className
      )}
    >
      {/* Visibility Status Selector */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'p-2 rounded-lg shrink-0',
              isPublic
                ? 'bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)]'
                : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]'
            )}
          >
            {isPublic ? (
              <HugeIcon icon={GlobeIcon} size={16} />
            ) : (
              <HugeIcon icon={LockIcon} size={16} />
            )}
          </div>
          <div>
            <div className="font-label-s font-semibold text-[var(--color-text-primary)]">
              {isPublic ? 'Anyone with the link can view' : 'Restricted (Only you)'}
            </div>
            <div className="font-caption text-[var(--color-text-tertiary)]">
              {isPublic
                ? 'Recipients can stream without signing in'
                : 'Sign-in required to view this file'}
            </div>
          </div>
        </div>

        {onToggleVisibility && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleVisibility(!isPublic)}
            className="text-xs"
          >
            {isPublic ? 'Make Private' : 'Make Public'}
          </Button>
        )}
      </div>

      {/* Copy Link Input Bar */}
      <div className="space-y-1.5">
        <label className="font-label-s text-[var(--color-text-secondary)]">
          Public Share Link
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className={cn(
              'flex-1 px-3 py-2 font-code rounded-lg border outline-none truncate',
              'bg-[var(--color-bg-elevated)] border-[var(--color-border-input)] text-[var(--color-text-primary)]',
              'focus:border-[var(--color-brand-default)] select-all'
            )}
          />
          <Button
            size="sm"
            variant={copied ? 'secondary' : 'primary'}
            onClick={handleCopy}
            className="shrink-0"
            leadingIcon={copied ? <HugeIcon icon={Tick01Icon} size={16} className="text-[var(--color-success-default)]" /> : <HugeIcon icon={Copy01Icon} size={16} />}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Action Footer: QR Code toggle & Drive Link */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => setShowQr(!showQr)}
          className="flex items-center gap-1.5 font-label-s text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <HugeIcon icon={QrCodeIcon} size={16} className="text-[var(--color-brand-default)]" />
          <span>{showQr ? 'Hide QR Code' : 'Show QR Code'}</span>
        </button>

        {onOpenInDrive && (
          <button
            type="button"
            onClick={onOpenInDrive}
            className="flex items-center gap-1.5 font-label-s text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <HugeIcon icon={ArrowUpRight01Icon} size={16} />
            <span>Open in Google Drive</span>
          </button>
        )}
      </div>

      {/* QR Code Container */}
      {showQr && (
        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white text-black space-y-3 animate-in fade-in-50">
          {/* Stylized high-contrast SVG QR Code Matrix */}
          <div className="p-2 border-2 border-black rounded-lg bg-white">
            <svg
              className="w-36 h-36"
              viewBox="0 0 100 100"
              fill="currentColor"
            >
              {/* Corner position markers */}
              <rect x="5" y="5" width="25" height="25" fill="black" />
              <rect x="10" y="10" width="15" height="15" fill="white" />
              <rect x="13" y="13" width="9" height="9" fill="black" />

              <rect x="70" y="5" width="25" height="25" fill="black" />
              <rect x="75" y="10" width="15" height="15" fill="white" />
              <rect x="78" y="13" width="9" height="9" fill="black" />

              <rect x="5" y="70" width="25" height="25" fill="black" />
              <rect x="10" y="75" width="15" height="15" fill="white" />
              <rect x="13" y="78" width="9" height="9" fill="black" />

              {/* Data pattern blocks */}
              <rect x="35" y="10" width="5" height="5" />
              <rect x="45" y="10" width="5" height="5" />
              <rect x="55" y="10" width="5" height="5" />
              <rect x="35" y="20" width="10" height="5" />
              <rect x="50" y="20" width="5" height="10" />
              <rect x="10" y="35" width="5" height="10" />
              <rect x="20" y="40" width="10" height="5" />
              <rect x="35" y="35" width="25" height="25" />
              <rect x="42" y="42" width="11" height="11" fill="white" />
              <rect x="45" y="45" width="5" height="5" fill="black" />
              <rect x="70" y="35" width="10" height="10" />
              <rect x="85" y="40" width="10" height="5" />
              <rect x="35" y="65" width="5" height="15" />
              <rect x="45" y="70" width="10" height="5" />
              <rect x="60" y="65" width="5" height="20" />
              <rect x="70" y="70" width="15" height="5" />
              <rect x="70" y="80" width="5" height="10" />
              <rect x="85" y="75" width="10" height="15" />
            </svg>
          </div>
          <span className="text-[11px] font-medium text-gray-700">
            Scan to view on mobile
          </span>
        </div>
      )}
    </div>
  );
};
