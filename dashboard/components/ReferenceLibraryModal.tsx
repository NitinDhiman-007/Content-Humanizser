'use client';
import { useEffect, useState } from 'react';
import { FolderOpen, Upload, Plus, Trash2, FileText, X, AlertCircle, Loader2, Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-outline bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-outline px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-brand">
              <FolderOpen size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">Authorized Reference Library</h2>
              <p className="text-xs text-muted">Manage documents used for internal similarity checks</p>
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

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex border-b border-outline px-6 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`border-b-2 pb-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'list'
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Document Collection ({docs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`ml-6 border-b-2 pb-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Upload File (TXT, MD, PDF)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`ml-6 border-b-2 pb-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'paste'
                ? 'border-brand text-brand'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            Paste Text
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' && (
            <div>
              {loading ? (
                <div className="flex h-40 items-center justify-center text-xs text-muted">
                  <Loader2 size={16} className="mr-2 animate-spin text-brand" /> Loading reference documents...
                </div>
              ) : docs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-12 text-center">
                  <FileText size={32} className="text-slate-400" />
                  <h3 className="mt-2 text-sm font-semibold text-ink">No reference documents yet</h3>
                  <p className="mt-1 max-w-sm text-xs text-muted">
                    Upload TXT, Markdown, or PDF articles you have permission to compare against.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                    >
                      <Upload size={13} /> Upload document
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('paste')}
                      className="inline-flex items-center gap-1 rounded-lg border border-outline px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-50"
                    >
                      <Plus size={13} /> Paste text
                    </button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 rounded-xl border border-outline">
                  {docs.map((doc) => (
                    <div
                      key={doc.doc_id}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-semibold text-ink">{doc.title}</h4>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
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
                                className="truncate text-brand hover:underline max-w-[200px]"
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
                        className="ml-3 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete reference document"
                      >
                        <Trash2 size={15} />
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
                <label className="block text-xs font-semibold text-ink">Select Document File</label>
                <input
                  type="file"
                  accept=".txt,.md,.markdown,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-lg border border-outline p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand hover:file:bg-blue-100"
                />
                <p className="mt-1 text-[11px] text-muted">Supported: Plain text (.txt), Markdown (.md), PDF (.pdf). Maximum 10MB.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Title (Optional)</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Industry Whitepaper 2026"
                  className="mt-1 block w-full rounded-lg border border-outline px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Source URL (Optional)</label>
                <input
                  type="url"
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  placeholder="https://example.com/reference"
                  className="mt-1 block w-full rounded-lg border border-outline px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !uploadFile}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                Add to Reference Library
              </button>
            </form>
          )}

          {activeTab === 'paste' && (
            <form onSubmit={handlePasteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink">Document Title</label>
                <input
                  type="text"
                  required
                  value={pasteTitle}
                  onChange={(e) => setPasteTitle(e.target.value)}
                  placeholder="e.g. Chatbot Architecture Guidelines"
                  className="mt-1 block w-full rounded-lg border border-outline px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Source URL (Optional)</label>
                <input
                  type="url"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  placeholder="https://example.com/guidelines"
                  className="mt-1 block w-full rounded-lg border border-outline px-3 py-2 text-xs focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Document Content</label>
                <textarea
                  required
                  rows={6}
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder="Paste reference text or markdown here..."
                  className="mt-1 block w-full rounded-lg border border-outline p-3 text-xs focus:border-brand focus:outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !pasteTitle || !pasteContent}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                Save Reference Document
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-outline px-6 py-3 bg-slate-50/50 text-[11px] text-muted rounded-b-2xl">
          <span>Upload only authorized reference documents that you have permission to analyze.</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline px-3 py-1.5 text-xs font-semibold text-ink hover:bg-slate-100"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
