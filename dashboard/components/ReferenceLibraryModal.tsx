'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, Upload, Plus, Trash2, FileText, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  fetchReferences,
  createReference,
  uploadReference,
  deleteReference,
  type ReferenceDoc,
} from '@/lib/api';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onReferencesChanged: (count: number) => void;
};

export default function ReferenceLibraryModal({ isOpen, onClose, onReferencesChanged }: Props) {
  const [docs, setDocs] = useState<ReferenceDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'upload' | 'paste'>('list');

  // Paste form state
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      void loadDocs();
    }
  }, [isOpen]);

  async function loadDocs() {
    setLoading(true);
    setError('');
    try {
      const list = await fetchReferences();
      setDocs(list);
      onReferencesChanged(list.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not fetch reference documents.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Remove this reference document from the collection?')) return;
    try {
      await deleteReference(docId);
      const updated = docs.filter((d) => d.doc_id !== docId);
      setDocs(updated);
      onReferencesChanged(updated.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reference document.');
    }
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteTitle.trim() || !pasteContent.trim()) {
      setError('Title and content are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await createReference(pasteTitle, pasteContent, pasteUrl);
      const updated = [created, ...docs];
      setDocs(updated);
      onReferencesChanged(updated.length);
      setPasteTitle('');
      setPasteContent('');
      setPasteUrl('');
      setActiveTab('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reference document.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) {
      setError('Select a TXT, Markdown, or PDF file to upload.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await uploadReference(uploadFile, uploadTitle || uploadFile.name, uploadUrl);
      const updated = [created, ...docs];
      setDocs(updated);
      onReferencesChanged(updated.length);
      setUploadFile(null);
      setUploadTitle('');
      setUploadUrl('');
      setActiveTab('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-3xl border border-black/10 bg-white shadow-elevated">
        <div className="flex items-center justify-between border-b border-black/5 px-6 sm:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ai-blue/10 text-ai-blue">
              <FolderOpen size={20} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ai-blue font-bold block">
                CORPUS REPOSITORY
              </span>
              <h2 className="text-lg font-bold font-display text-brand-ink">
                Authorized Reference Library
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

        {error && (
          <div className="mx-6 sm:mx-8 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex border-b border-black/5 px-6 sm:px-8 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`border-b-2 pb-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'list'
                ? 'border-ai-orange text-ai-orange'
                : 'border-transparent text-brand-mist hover:text-brand-ink'
            }`}
          >
            Document Collection ({docs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`ml-6 border-b-2 pb-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'border-ai-orange text-ai-orange'
                : 'border-transparent text-brand-mist hover:text-brand-ink'
            }`}
          >
            Upload File (.txt, .md, .pdf)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`ml-6 border-b-2 pb-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'paste'
                ? 'border-ai-orange text-ai-orange'
                : 'border-transparent text-brand-mist hover:text-brand-ink'
            }`}
          >
            Paste Text
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {activeTab === 'list' && (
            <div>
              {loading ? (
                <div className="flex h-44 items-center justify-center text-xs font-mono text-brand-mist">
                  <Loader2 size={16} className="mr-2 animate-spin text-ai-orange" /> Querying corpus library...
                </div>
              ) : docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 py-12 text-center bg-brand-parchment/30">
                  <FileText size={36} className="text-brand-mist/50" />
                  <h3 className="mt-3 text-sm font-bold font-display text-brand-ink">No reference documents yet</h3>
                  <p className="mt-1 max-w-sm text-xs text-brand-mist font-sans">
                    Upload TXT, Markdown, or PDF articles to build an authorized similarity benchmark.
                  </p>
                  <div className="mt-5 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ai-blue hover:bg-ai-blue-sky px-4 py-2 text-xs font-semibold text-white shadow-blue transition-all"
                    >
                      <Upload size={13} /> Upload Document
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('paste')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-brand-ink hover:bg-brand-parchment transition-all"
                    >
                      <Plus size={13} /> Paste Text
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-black/5 rounded-2xl border border-black/5 overflow-hidden">
                  {docs.map((doc) => (
                    <div
                      key={doc.doc_id}
                      className="flex items-center justify-between p-4 hover:bg-brand-parchment/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs sm:text-sm font-bold text-brand-ink">{doc.title}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-brand-mist">
                          <span>{doc.word_count.toLocaleString()} words</span>
                          <span>·</span>
                          <span>Added {new Date(doc.created_at).toLocaleDateString()}</span>
                          {doc.source_url && (
                            <>
                              <span>·</span>
                              <a
                                href={doc.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-ai-blue hover:underline max-w-[200px]"
                              >
                                {doc.source_url}
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.doc_id)}
                        className="ml-3 rounded-xl p-2 text-brand-mist hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete reference document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-brand-ink mb-1">
                  Select Document File
                </label>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-xl border border-black/10 bg-brand-parchment/40 p-2.5 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-ai-blue/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ai-blue hover:file:bg-ai-blue/20"
                />
                <p className="mt-1.5 text-[11px] font-mono text-brand-mist">
                  Supported: Plain text (.txt), Markdown (.md), PDF (.pdf). Maximum 10MB.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-brand-ink mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Enterprise AI Strategy Whitepaper"
                  className="mt-1 block w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-xs text-brand-ink focus:border-ai-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-brand-ink mb-1">
                  Source URL (Optional)
                </label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/reference"
                  className="mt-1 block w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-xs text-brand-ink focus:border-ai-orange focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !uploadFile}
                className="inline-flex items-center gap-2 rounded-xl bg-ai-orange hover:bg-ai-orange-warm px-5 py-2.5 text-xs font-display font-bold text-white shadow-ai hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Add to Reference Library
              </button>
            </form>
          )}

          {activeTab === 'paste' && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-brand-ink mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. Chatbot Architecture Guidelines"
                  className="mt-1 block w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-xs text-brand-ink focus:border-ai-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-brand-ink mb-1">
                  Source URL (Optional)
                </label>
                <input
                  type="url"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  placeholder="https://example.com/guidelines"
                  className="mt-1 block w-full rounded-xl border border-black/10 px-3.5 py-2.5 text-xs text-brand-ink focus:border-ai-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold font-mono uppercase text-brand-ink mb-1">
                  Document Content
                </label>
                <textarea
                  required
                  rows={6}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste reference text or markdown here..."
                  className="mt-1 block w-full rounded-xl border border-black/10 p-3.5 text-xs font-mono text-brand-ink focus:border-ai-orange focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !pasteTitle || !pasteContent}
                className="inline-flex items-center gap-2 rounded-xl bg-ai-orange hover:bg-ai-orange-warm px-5 py-2.5 text-xs font-display font-bold text-white shadow-ai hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Save Reference Document
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-black/5 px-6 sm:px-8 py-3.5 bg-brand-parchment/60 text-[11px] font-mono text-brand-mist rounded-b-3xl">
          <span>Corpus restricted strictly to authorized internal documents.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white px-4 py-1.5 text-xs font-semibold text-brand-ink hover:bg-brand-parchment transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
