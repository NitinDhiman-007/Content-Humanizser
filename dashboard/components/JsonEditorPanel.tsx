'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Check, Clipboard, FileJson, Loader2, AlertCircle, FileText, Code2 } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs font-mono text-brand-mist">
      <Loader2 size={16} className="mr-2 animate-spin text-ai-orange" /> Initializing Monaco Editor...
    </div>
  ),
});

type Props = {
  title: string;
  subtitle: string;
  payload: unknown;
  wordCount: number | null;
  status?: 'waiting' | 'processing' | 'completed' | 'failed';
  plainText?: string;
};

export default function JsonEditorPanel({
  title,
  subtitle,
  payload,
  wordCount,
  status = 'completed',
  plainText,
}: Props) {
  const [copied, setCopied] = useState('');
  
  // Extract prose text if not explicitly provided
  const proseText = useMemo(() => {
    if (plainText) return plainText;
    if (payload && typeof payload === 'object') {
      const p = payload as Record<string, unknown>;
      if (typeof p.humanized_text === 'string') return p.humanized_text;
      if (typeof p.original_text === 'string') return p.original_text;
    }
    return '';
  }, [plainText, payload]);

  // Default to prose view if proseText is present, else json
  const [viewMode, setViewMode] = useState<'prose' | 'json'>(proseText ? 'prose' : 'json');

  const json = useMemo(() => (payload ? JSON.stringify(payload, null, 2) : ''), [payload]);
  const valid = useMemo(() => {
    try {
      if (!json) return false;
      JSON.parse(json);
      return true;
    } catch {
      return false;
    }
  }, [json]);

  const activeContent = viewMode === 'prose' ? (proseText || json) : json;
  const activeLanguage = viewMode === 'prose' && proseText ? 'markdown' : 'json';

  async function copy(text: string, type: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2500);
    } catch {
      setCopied('failed');
      setTimeout(() => setCopied(''), 2500);
    }
  }

  return (
    <section className="flex min-h-[600px] min-w-0 flex-col overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-card transition-all">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-6 py-4 bg-brand-parchment/60">
        <div>
          <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold font-display text-brand-ink">
            {viewMode === 'prose' ? (
              <FileText size={18} className="text-ai-orange" />
            ) : (
              <FileJson size={18} className="text-ai-blue" />
            )}
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-brand-mist font-sans">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle Switch */}
          {proseText && (
            <div className="inline-flex rounded-xl bg-black/5 p-1 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('prose')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'prose'
                    ? 'bg-white text-brand-ink shadow-xs'
                    : 'text-brand-mist hover:text-brand-ink'
                }`}
              >
                <FileText size={12} className={viewMode === 'prose' ? 'text-ai-orange' : ''} />
                <span>Article Prose</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'json'
                    ? 'bg-white text-brand-ink shadow-xs'
                    : 'text-brand-mist hover:text-brand-ink'
                }`}
              >
                <Code2 size={12} className={viewMode === 'json' ? 'text-ai-blue' : ''} />
                <span>JSON Payload</span>
              </button>
            </div>
          )}

          {wordCount !== null && (
            <span className="rounded-full bg-white border border-black/5 px-3 py-1 text-xs font-mono font-bold text-brand-ink shadow-xs">
              {wordCount.toLocaleString()} words
            </span>
          )}
          {viewMode === 'json' && valid && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 text-xs font-mono font-bold text-emerald-700">
              <Check size={13} /> Valid JSON
            </span>
          )}
        </div>
      </div>

      {/* Monaco Container */}
      <div className="monaco-container relative min-h-[460px] flex-1 bg-[#FAFAFC] p-2">
        {activeContent ? (
          <Editor
            height="100%"
            language={activeLanguage}
            value={activeContent}
            theme="vs-light"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 24,
              automaticLayout: true,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              renderLineHighlight: 'none',
              padding: { top: 14, bottom: 14 },
              folding: true,
              tabSize: 2,
              fontFamily: 'var(--font-space-mono), Consolas, monospace',
            }}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-brand-mist font-sans">
            {status === 'failed' ? (
              <>
                <AlertCircle size={28} className="text-rose-500" />
                <p className="font-semibold text-rose-700">Processing failed. Your original source is still preserved.</p>
              </>
            ) : (
              <>
                <Loader2 className="animate-spin text-ai-orange" size={28} />
                <p className="font-semibold text-brand-ink">Executing humanization pipeline...</p>
                <p className="text-xs text-brand-mist font-mono">Structured output and infographics will render automatically.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-t border-black/5 px-6 py-3.5 bg-brand-parchment/40">
        <span aria-live="polite" className="text-xs font-mono text-brand-mist">
          {copied === 'failed'
            ? 'Clipboard access denied.'
            : copied === 'text'
            ? '✓ Article prose copied to clipboard'
            : copied === 'json'
            ? '✓ JSON payload copied to clipboard'
            : viewMode === 'prose'
            ? 'Formatted Publication Prose (Markdown)'
            : 'TechMarketing.AI Structured JSON'}
        </span>

        <div className="flex items-center gap-2">
          {proseText && (
            <button
              type="button"
              onClick={() => copy(proseText, 'text')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-ink hover:border-ai-orange hover:text-ai-orange hover:bg-ai-orange/5 transition-all shadow-xs"
            >
              <FileText size={13} className="text-ai-orange" /> Copy Article Text
            </button>
          )}

          <button
            type="button"
            disabled={!valid}
            onClick={() => copy(json, 'json')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-ink hover:border-ai-blue hover:text-ai-blue hover:bg-ai-blue/5 transition-all disabled:opacity-40 shadow-xs"
          >
            <Clipboard size={13} className="text-ai-blue" /> Copy JSON
          </button>
        </div>
      </div>
    </section>
  );
}
