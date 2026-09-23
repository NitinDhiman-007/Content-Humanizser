'use client';
import { useState } from 'react';
import { SearchCheck, ShieldAlert, FolderOpen, ExternalLink, X, Loader2 } from 'lucide-react';
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
      setLocalError(err instanceof Error ? err.message : 'Failed to launch plagiarism check.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-outline bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-brand">
              <SearchCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Check Plagiarism & Similarity</h2>
              <p className="text-xs text-muted">Select checking scope and comparison parameters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-slate-100 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {localError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {localError}
          </div>
        )}

        <div className="mt-5 space-y-3">
          <label
            onClick={() => setMode('local')}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
              mode === 'local'
                ? 'border-brand bg-blue-50/50 ring-1 ring-brand'
                : 'border-outline bg-white hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="checkMode"
              checked={mode === 'local'}
              onChange={() => setMode('local')}
              className="mt-1 text-brand"
            />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-ink">Internal Similarity (Local Reference Collection)</div>
              <p className="mt-1 text-muted leading-relaxed">
                Deterministic passage comparison against your authorized reference documents. Completely private, no data leaves your machine.
              </p>
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-100/80 px-2.5 py-1.5 text-[11px] text-slate-700">
                <span>{referenceCount} reference document{referenceCount === 1 ? '' : 's'} available</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenLibrary();
                  }}
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  <FolderOpen size={13} /> Manage library
                </button>
              </div>
            </div>
          </label>

          <label
            onClick={() => setMode('external')}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all ${
              mode === 'external'
                ? 'border-brand bg-blue-50/50 ring-1 ring-brand'
                : 'border-outline bg-white hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="checkMode"
              checked={mode === 'external'}
              onChange={() => setMode('external')}
              className="mt-1 text-brand"
            />
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-ink">
                External Plagiarism Service
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-normal text-slate-700">API</span>
              </div>
              <p className="mt-1 text-muted leading-relaxed">
                Dispatches text to a configured third-party licensed plagiarism provider. Requires valid API credentials.
              </p>
            </div>
          </label>
        </div>

        {mode === 'local' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <label className="flex items-start gap-2 text-xs text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={includeRevision}
                onChange={(e) => setIncludeRevision(e.target.checked)}
                className="mt-0.5 rounded text-brand"
              />
              <span>
                <strong>Include revision comparison:</strong> Compare against the original submitted draft to analyze revision overlap.
              </span>
            </label>
          </div>
        )}

        {mode === 'external' && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-900">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldAlert size={14} className="text-amber-600" />
              External Transmission Authorization
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
              Your humanized blog text will leave this application and be submitted to the licensed provider.
            </p>
            <label className="mt-2.5 flex items-start gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 rounded text-amber-600"
              />
              <span>I authorize transmitting this text to the external plagiarism service.</span>
            </label>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-outline pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-outline px-4 py-2 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (mode === 'external' && !consent)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Starting check...
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
