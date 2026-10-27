import React, { useState } from 'react';
import { Copy, Download, Check, Printer, Sparkles, Clock, MousePointer } from 'lucide-react';
import { Modal, Button, Tabs } from '@verse-studio/ui';
import { useAIStore } from './aiStore';

export interface GuidePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GuidePreviewModal: React.FC<GuidePreviewModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { generatedGuide, exportGuideMarkdownDownload } = useAIStore();
  const [activeTab, setActiveTab] = useState('formatted');
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = async () => {
    if (!generatedGuide?.markdownContent) return;
    try {
      await navigator.clipboard.writeText(generatedGuide.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const steps = generatedGuide?.steps || [];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Step-by-Step Tutorial Guide"
      description={`Generated automatically from click interactions and translated speech cues.`}
      size="lg"
    >
      <div className="space-y-4 pt-1">
        {/* Header toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-primary)]">
              {steps.length} Steps Generated
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-default)] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Synthesized
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={copied ? <Check className="w-4 h-4 text-[var(--color-brand-default)]" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopyMarkdown}
            >
              {copied ? 'Copied!' : 'Copy Markdown'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leadingIcon={<Download className="w-4 h-4" />}
              onClick={() => exportGuideMarkdownDownload(`${generatedGuide?.title || 'Tutorial-Guide'}.md`)}
            >
              Download .md
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              PDF / Print
            </Button>
          </div>
        </div>

        {/* View mode tabs */}
        <Tabs
          items={[
            { id: 'formatted', label: 'Interactive Steps' },
            { id: 'markdown', label: 'Raw Markdown' },
          ]}
          value={activeTab}
          onValueChange={setActiveTab}
        />

        {/* Formatted Steps Viewer */}
        {activeTab === 'formatted' && (
          <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
            {steps.length === 0 ? (
              <div className="text-center py-12 text-[var(--color-text-secondary)] text-xs">
                No interactive steps detected. Click interactions and translated audio cues will appear here.
              </div>
            ) : (
              steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-strong)] transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-[var(--color-brand-default)] text-[var(--color-text-on-brand)] font-bold text-xs flex items-center justify-center shrink-0">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                        {step.title}
                      </h4>
                    </div>

                    <span className="font-mono text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-hover)] px-2 py-0.5 rounded border border-[var(--color-border-subtle)] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {step.timeFormatted}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex items-start gap-2">
                    <MousePointer className="w-3.5 h-3.5 text-[var(--color-accent-laser)] shrink-0 mt-0.5" />
                    <span>{step.description}</span>
                  </p>

                  {step.englishTranscript && (
                    <div className="p-2.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] font-medium">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-brand-default)] block mb-0.5">
                        Spoken Narration (English):
                      </span>
                      &ldquo;{step.englishTranscript}&rdquo;
                    </div>
                  )}

                  {step.banglaTranscript && (
                    <div className="px-2.5 py-1 text-xs text-[var(--color-text-tertiary)] font-bangla">
                      মূল বাংলা: &ldquo;{step.banglaTranscript}&rdquo;
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Raw Markdown Viewer */}
        {activeTab === 'markdown' && (
          <div className="relative">
            <pre className="max-h-[460px] overflow-auto p-4 rounded-xl bg-[var(--color-bg-canvas)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap select-text">
              {generatedGuide?.markdownContent || '# No guide content'}
            </pre>
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          <Button variant="primary" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
