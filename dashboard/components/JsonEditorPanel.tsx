'use client';
import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Check, Clipboard, FileJson, Loader2, AlertCircle } from 'lucide-react';
const Editor = dynamic(() => import('@monaco-editor/react'), {ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted"><Loader2 size={16} className="mr-2 animate-spin"/> Loading JSON editor...</div>});

type Props = {
  title: string; subtitle: string; payload: unknown; wordCount: number | null;
  status?: 'waiting' | 'processing' | 'completed' | 'failed';
  plainText?: string;
};
export default function JsonEditorPanel({title, subtitle, payload, wordCount, status='completed', plainText}: Props) {
  const [copied, setCopied] = useState('');
  const json = useMemo(() => payload ? JSON.stringify(payload, null, 2) : '', [payload]);
  const valid = useMemo(() => {try {if (!json) return false; JSON.parse(json); return true;} catch {return false;}}, [json]);
  async function copy(text: string, type: string) {
    try { await navigator.clipboard.writeText(text); setCopied(type); }
    catch { setCopied('failed'); }
  }
  return <section className="flex min-h-[580px] min-w-0 flex-col overflow-hidden rounded-[18px] border border-outline bg-white shadow-soft">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline px-5 py-4">
      <div><h2 className="flex items-center gap-2 text-sm font-semibold text-ink"><FileJson size={18} className="text-brand"/>{title}</h2><p className="mt-1 text-xs text-muted">{subtitle}</p></div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {wordCount !== null && <span className="rounded-md bg-slate-100 px-2.5 py-1.5 font-medium text-slate-600">{wordCount.toLocaleString()} words</span>}
        {valid && <span className="flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 font-semibold text-green-700"><Check size={13}/> Valid JSON</span>}
      </div>
    </div>
    <div className="monaco-container relative min-h-[430px] flex-1 bg-[#FBFCFE] p-2">
      {json ? <Editor height="100%" language="json" value={json} theme="vs-light" options={{readOnly: true, minimap: {enabled: false}, fontSize: 12, lineHeight: 22, automaticLayout: true, wordWrap: 'on', scrollBeyondLastLine: false, renderLineHighlight: 'none', padding: {top: 14, bottom: 14}, folding: true, tabSize: 2}}/> :
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-muted">
          {status === 'failed' ? <><AlertCircle size={24} className="text-red-500"/><p>Processing failed. Your original content is still available.</p></> : <><Loader2 className="animate-spin text-brand" size={24}/><p>Processing your content...</p><p className="text-xs">Results will appear here when ready.</p></>}
        </div>}
    </div>
    <div className="flex min-h-[65px] flex-wrap items-center justify-between gap-2 border-t border-outline px-4 py-3 sm:px-5">
      <span aria-live="polite" className="text-xs text-muted">{copied === 'failed' ? 'Copy failed. Check clipboard permissions.' : copied ? 'Copied to clipboard' : 'Structured JSON'}</span>
      <div className="flex items-center gap-2">
        {plainText !== undefined && <button type="button" disabled={!json} onClick={() => copy(plainText, 'text')} className="rounded-lg border border-outline px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40">Copy blog only</button>}
        <button type="button" disabled={!valid} onClick={() => copy(json, 'json')} className="inline-flex items-center gap-1.5 rounded-lg border border-outline px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 disabled:opacity-40"><Clipboard size={13}/> Copy JSON</button>
      </div>
    </div>
  </section>;
}
