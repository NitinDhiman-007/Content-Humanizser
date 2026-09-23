'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  SearchCheck,
  FolderOpen,
  Download,
  FileText,
} from 'lucide-react';
import JsonEditorPanel from '@/components/JsonEditorPanel';
import InfographicModal from '@/components/InfographicModal';
import PlagiarismCheckModal from '@/components/PlagiarismCheckModal';
import ReferenceLibraryModal from '@/components/ReferenceLibraryModal';
import PlagiarismReportView from '@/components/PlagiarismReportView';
import { AIDetectionComparison } from '@/components/AIDetectionComparison';
import {
  fetchJob,
  fetchPlagiarismStatus,
  startPlagiarismCheck,
  fetchReferences,
  getAiDetection,
  getDocxExportUrl,
  getMarkdownExportUrl,
  type Job,
  type PlagiarismReport,
  type PlagiarismCheckMode,
  type AIDetectionComparison as AIDetectionData,
} from '@/lib/api';

export default function ResultsPage() {
  const params = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [showInfographics, setShowInfographics] = useState(false);

  // Plagiarism state
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [plagiarismReport, setPlagiarismReport] = useState<PlagiarismReport | null>(null);
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [plagiarismPolling, setPlagiarismPolling] = useState(false);
  const [plagiarismError, setPlagiarismError] = useState('');
  const [referenceCount, setReferenceCount] = useState(0);

  // AI Detection state
  const [aiDetection, setAiDetection] = useState<AIDetectionData | null>(null);
  const [aiDetectionLoading, setAiDetectionLoading] = useState(false);

  // Load reference count
  useEffect(() => {
    async function getRefCount() {
      try {
        const refs = await fetchReferences();
        setReferenceCount(refs.length);
      } catch {
        /* Backend may be booting */
      }
    }
    void getRefCount();
  }, []);

  // Poll plagiarism status
  const pollPlagiarism = useCallback(async (jobId: string) => {
    try {
      const statusRes = await fetchPlagiarismStatus(jobId);
      if (statusRes.status === 'completed' && statusRes.report) {
        setPlagiarismReport(statusRes.report);
        setPlagiarismPolling(false);
      } else if (statusRes.status === 'failed') {
        setPlagiarismError(statusRes.error_message || 'Plagiarism check failed.');
        setPlagiarismPolling(false);
      } else {
        // Still queued or processing
        setPlagiarismPolling(true);
        setTimeout(() => void pollPlagiarism(jobId), 1500);
      }
    } catch {
      setPlagiarismPolling(false);
    }
  }, []);

  // Load Job
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function refresh() {
      try {
        const data = await fetchJob(params.jobId);
        if (!active) return;
        setJob(data);
        setError('');
        if (data.status === 'queued' || data.status === 'processing') {
          timer = setTimeout(refresh, 1300);
        } else if (data.status === 'completed') {
          // Check if there is an existing plagiarism report
          void pollPlagiarism(params.jobId);
          // Fetch AI detection metrics
          setAiDetectionLoading(true);
          void getAiDetection(params.jobId)
            .then((det) => {
              if (active) setAiDetection(det);
            })
            .catch(() => {})
            .finally(() => {
              if (active) setAiDetectionLoading(false);
            });
        }
      } catch (issue) {
        if (active) setError(issue instanceof Error ? issue.message : 'Cannot load this job.');
      }
    }
    void refresh();
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [params.jobId, pollPlagiarism]);

  async function handleStartPlagiarismCheck(
    mode: PlagiarismCheckMode,
    consent: boolean,
    includeRevision: boolean
  ) {
    setPlagiarismLoading(true);
    setPlagiarismError('');
    try {
      await startPlagiarismCheck(params.jobId, mode, consent, includeRevision);
      setPlagiarismPolling(true);
      void pollPlagiarism(params.jobId);
    } catch (err) {
      setPlagiarismError(err instanceof Error ? err.message : 'Could not launch plagiarism check.');
      throw err;
    } finally {
      setPlagiarismLoading(false);
    }
  }

  const result = job?.result;
  const state = job?.status ?? 'queued';
  const humanizedText = result?.humanized_text || '';

  return (
    <main className="mx-auto max-w-[1480px] px-5 pb-16 pt-8 sm:px-8">
      {/* Top Breadcrumb & Status */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-brand"
          >
            <ArrowLeft size={14} /> Back to input
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">Content Validator</h1>
          <p className="mt-1.5 text-sm text-muted">Your source and processed result, side by side.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Word Count Indicator (Max 1500) */}
          {result && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="font-bold text-emerald-600">{result.audit.final_word_count}</span>
              <span className="text-slate-400">/ 1,500 words max</span>
            </span>
          )}

          {/* Download Word Document (.docx) */}
          {state === 'completed' && (
            <a
              href={getDocxExportUrl(params.jobId)}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-brand shadow-sm hover:bg-blue-100 transition-colors"
              title="Download formatted Word Document (.docx)"
            >
              <FileText size={14} /> Download Word (.docx)
            </a>
          )}

          {/* Export Markdown */}
          {state === 'completed' && (
            <a
              href={getMarkdownExportUrl(params.jobId)}
              download
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Download size={14} /> Export Markdown
            </a>
          )}

          {/* Quick Action: Reference Library */}
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-outline bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-slate-50 shadow-sm"
          >
            <FolderOpen size={14} className="text-muted" />
            Reference Library ({referenceCount})
          </button>

          {/* Primary Action: Check Plagiarism */}
          <button
            type="button"
            disabled={state !== 'completed' || plagiarismPolling}
            onClick={() => setShowPlagiarismModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {plagiarismPolling ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Checking Similarity...
              </>
            ) : (
              <>
                <SearchCheck size={14} /> Check Plagiarism
              </>
            )}
          </button>

          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
              state === 'completed'
                ? 'border-green-200 bg-green-50 text-green-700'
                : state === 'failed'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-blue-100 bg-blue-50 text-brand'
            }`}
          >
            {state === 'completed' ? (
              <CheckCircle2 size={15} />
            ) : state === 'failed' ? (
              <AlertCircle size={15} />
            ) : (
              <Loader2 size={15} className="animate-spin" />
            )}
            {state === 'completed'
              ? 'Processing complete'
              : state === 'failed'
              ? 'Processing failed'
              : 'Processing'}
          </span>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {job?.error_message && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {job.error_message}
        </div>
      )}
      {plagiarismError && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Plagiarism Checker:</strong> {plagiarismError}
        </div>
      )}

      {/* AI Detection Comparison Widget */}
      {aiDetection && (
        <AIDetectionComparison data={aiDetection} loading={aiDetectionLoading} />
      )}

      {/* Dual Monaco JSON Editors */}
      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <JsonEditorPanel
          title="Original Content"
          subtitle="Your text, preserved exactly"
          payload={job?.original_content || null}
          wordCount={result?.audit.original_word_count ?? null}
          status={job ? 'completed' : 'waiting'}
        />
        <JsonEditorPanel
          title="Humanized Content"
          subtitle="Processed article, infographic specs and audit"
          payload={result || null}
          wordCount={result?.audit.final_word_count ?? null}
          status={state === 'queued' ? 'waiting' : state}
          plainText={result?.humanized_text}
        />
      </div>

      {/* Editorial Audit Panel */}
      {result && (
        <div className="mt-5 rounded-[18px] border border-outline bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Editorial audit</h2>
              <p className="mt-1 text-xs text-muted">
                {result.audit.final_word_count.toLocaleString()} words · {result.audit.word_count_ratio}% of original ·{' '}
                {result.audit.applied_rules.length} rule types applied
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  result.audit.validation_status === 'passed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {result.audit.validation_status === 'passed' ? 'Automated checks passed' : 'Review required'}
              </span>
              {result.infographics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowInfographics(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-outline px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                >
                  <ImageIcon size={14} /> Infographics ({result.infographics.length})
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {result.audit.review_flags.map((flag, index) => (
              <div
                key={`${flag.code}:${index}`}
                className={`rounded-lg border px-3 py-2 text-xs leading-5 ${
                  flag.severity === 'critical'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : flag.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-outline bg-slate-50 text-slate-600'
                }`}
              >
                <span className="font-semibold">{flag.code}: </span>
                {flag.message}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            Plagiarism check: {result.audit.originality_check}. AI detection: {result.audit.ai_detection_check}. The local engine does not implement every editorial rule.
          </p>
        </div>
      )}

      {/* Plagiarism Report View */}
      {plagiarismReport && (
        <PlagiarismReportView report={plagiarismReport} humanizedText={humanizedText} />
      )}

      {/* Modals */}
      {showInfographics && result && (
        <InfographicModal items={result.infographics} close={() => setShowInfographics(false)} />
      )}

      <PlagiarismCheckModal
        isOpen={showPlagiarismModal}
        onClose={() => setShowPlagiarismModal(false)}
        onStartCheck={handleStartPlagiarismCheck}
        referenceCount={referenceCount}
        onOpenLibrary={() => {
          setShowPlagiarismModal(false);
          setShowLibraryModal(true);
        }}
        loading={plagiarismLoading}
      />

      <ReferenceLibraryModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onReferencesChanged={(cnt) => setReferenceCount(cnt)}
      />
    </main>
  );
}
