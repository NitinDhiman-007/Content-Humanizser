'use client';

import { useState } from 'react';
import { SearchCheck, ShieldAlert, FolderOpen, X, Loader2 } from 'lucide-react';
import type { PlagiarismCheckMode } from '@/lib/api';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onStartCheck: (mode: PlagiarismCheckMode, consent: boolean, includeRevision: boolean) => Promise<void>;
  referenceCount: number;
  onOpenLibrary: () => void;
  loading: boolean;
};

export default function PlagiarismCheckModal({
  isOpen,
  onClose,
  onStartCheck,
  referenceCount,
  onOpenLibrary,
  loading,
}: Props) {
  const [mode, setMode] = useState<PlagiarismCheckMode>('local');
  const [consent, setConsent] = useState(false);
  const [includeRevision, setIncludeRevision] = useState(false);
  const [localError, setLocalError] = useState('');

  if (!isOpen) return null;

  async function handleConfirm() {
    setLocalError('');
    if (mode === 'external' && !consent) {
      setLocalError('You must explicitly provide consent before sending content to an external service.');
      return;
    }
    try {
      await onStartCheck(mode, consent, includeRevision);
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to launch similarity check.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-elevated animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ai-blue/10 text-ai-blue">
              <SearchCheck size={20} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ai-blue font-bold block">
                04 — SIMILARITY ENGINE
              </span>
              <h2 className="text-lg font-bold font-display text-brand-ink">
                Run Similarity &amp; Plagiarism Analysis
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-brand-mist hover:bg-brand-parchment hover:text-brand-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {localError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
            {localError}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <label
            onClick={() => setMode('local')}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
              mode === 'local'
                ? 'border-ai-orange bg-ai-orange/5 ring-1 ring-ai-orange shadow-xs'
                : 'border-black/5 bg-brand-parchment/50 hover:bg-white'
            }`}
          >
            <input
              type="radio"
              name="checkMode"
              checked={mode === 'local'}
              onChange={() => setMode('local')}
              className="mt-1 text-ai-orange focus:ring-ai-orange"
            />
            <div className="flex-1 text-xs">
              <div className="font-bold text-brand-ink text-sm font-display">
                Internal Similarity (Local Reference Collection)
              </div>
              <p className="mt-1 text-brand-mist leading-relaxed font-sans">
                Deterministic passage comparison against your authorized reference library. Completely private, no data leaves your machine.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white border border-black/5 px-3 py-2 text-[11px] font-mono text-brand-ink">
                <span>{referenceCount} reference document{referenceCount === 1 ? '' : 's'} available</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLibrary();
                  }}
                  className="inline-flex items-center gap-1 font-bold text-ai-blue hover:underline"
                >
                  <FolderOpen size={13} /> Manage Library
                </button>
              </div>
            </div>
          </label>

          <label
            onClick={() => setMode('external')}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
              mode === 'external'
                ? 'border-ai-orange bg-ai-orange/5 ring-1 ring-ai-orange shadow-xs'
                : 'border-black/5 bg-brand-parchment/50 hover:bg-white'
            }`}
          >
            <input
              type="radio"
              name="checkMode"
              checked={mode === 'external'}
              onChange={() => setMode('external')}
              className="mt-1 text-ai-orange focus:ring-ai-orange"
            />
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-brand-ink text-sm font-display">
                Licensed External Plagiarism Service
                <span className="rounded-full bg-ai-blue/10 px-2 py-0.5 text-[10px] font-mono font-bold text-ai-blue">
                  API
                </span>
              </div>
              <p className="mt-1 text-brand-mist leading-relaxed font-sans">
                Dispatches text to a configured third-party licensed plagiarism provider contract.
              </p>
            </div>
          </label>
        </div>

        {mode === 'local' && (
          <div className="mt-4 rounded-xl border border-black/5 bg-brand-parchment/60 p-3.5">
            <label className="flex items-start gap-2.5 text-xs text-brand-ink cursor-pointer font-sans">
              <input
                type="checkbox"
                checked={includeRevision}
                onChange={(e) => setIncludeRevision(e.target.checked)}
                className="mt-0.5 rounded text-ai-orange focus:ring-ai-orange"
              />
              <span>
                <strong>Include revision comparison:</strong> Compare against original draft to measure revision divergence.
              </span>
            </label>
          </div>
        )}

        {mode === 'external' && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 font-sans">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldAlert size={14} className="text-amber-600" />
              External Transmission Authorization
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
              Your humanized text will leave this machine and be submitted to the licensed external provider.
            </p>
            <label className="mt-2.5 flex items-start gap-2 cursor-pointer font-medium text-amber-950">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded text-ai-orange focus:ring-ai-orange"
              />
              <span>I authorize transmitting this text to the external provider.</span>
            </label>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/5 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-xs font-semibold text-brand-ink hover:bg-brand-parchment transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (mode === 'external' && !consent)}
            className="inline-flex items-center gap-2 rounded-xl bg-ai-orange hover:bg-ai-orange-warm px-5 py-2.5 text-xs font-display font-bold text-white shadow-ai hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <SearchCheck size={14} /> Run Similarity Check
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
