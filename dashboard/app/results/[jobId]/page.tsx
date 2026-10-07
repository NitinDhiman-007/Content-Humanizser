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
  Sparkles,
  Layers,
  ShieldCheck,
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
          void pollPlagiarism(params.jobId);
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
    <main className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8 pb-20 pt-6">
      {/* Top Breadcrumb & Status Navigation */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-black/5">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-brand-mist hover:text-ai-orange transition-colors"
          >
            <ArrowLeft size={14} /> Back to Studio Workbench
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-display tracking-tight text-brand-ink uppercase">
              Content Validation Studio
            </h1>
            <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-md bg-white border border-black/5 text-brand-mist shadow-2xs">
              ID: {params.jobId.slice(0, 8)}...
            </span>
          </div>
          <p className="mt-1.5 text-sm text-brand-mist font-sans">
            Side-by-side original source and neural humanized copy with statistical validation.
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Word Count Indicator */}
          {result && (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-4 py-2 text-xs font-mono shadow-xs">
              <span className="font-bold text-emerald-600">{result.audit.final_word_count}</span>
              <span className="text-brand-mist">/ 1,500 words target</span>
            </div>
          )}

          {/* Download Word Document (.docx) */}
          {state === 'completed' && (
            <a
              href={getDocxExportUrl(params.jobId)}
              download
              className="inline-flex items-center gap-2 rounded-xl bg-ai-blue hover:bg-ai-blue-sky text-white px-4 py-2 text-xs font-semibold shadow-blue hover:-translate-y-0.5 transition-all duration-200"
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
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white hover:bg-brand-parchment text-brand-ink px-4 py-2 text-xs font-semibold shadow-xs hover:-translate-y-0.5 transition-all duration-200"
            >
              <Download size={14} /> Markdown (.md)
            </a>
          )}

          {/* Quick Action: Reference Library */}
          <button
            type="button"
            onClick={() => setShowLibraryModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white hover:bg-brand-parchment text-brand-ink px-4 py-2 text-xs font-semibold shadow-xs hover:-translate-y-0.5 transition-all duration-200"
          >
            <FolderOpen size={14} className="text-ai-blue" />
            <span>Library ({referenceCount})</span>
          </button>

          {/* Primary Action: Check Plagiarism */}
          <button
            type="button"
            disabled={state !== 'completed' || plagiarismPolling}
            onClick={() => setShowPlagiarismModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-ai-orange hover:bg-ai-orange-warm text-white px-5 py-2 text-xs font-display font-bold shadow-ai hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {plagiarismPolling ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Verifying Similarity...
              </>
            ) : (
              <>
                <SearchCheck size={14} /> Check Similarity
              </>
            )}
          </button>

          {/* State Badge */}
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-mono font-bold ${
              state === 'completed'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : state === 'failed'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-ai-blue/30 bg-ai-blue/10 text-ai-blue'
            }`}
          >
            {state === 'completed' ? (
              <CheckCircle2 size={14} />
            ) : state === 'failed' ? (
              <AlertCircle size={14} />
            ) : (
              <Loader2 size={14} className="animate-spin text-ai-blue" />
            )}
            {state === 'completed'
              ? 'PIPELINE COMPLETE'
              : state === 'failed'
              ? 'FAILED'
              : 'PROCESSING REWRITE'}
          </span>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
          {error}
        </div>
      )}
      {job?.error_message && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
          {job.error_message}
        </div>
      )}
      {plagiarismError && (
        <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 font-medium">
          <strong>Similarity Engine Alert:</strong> {plagiarismError}
        </div>
      )}

      {/* AI Detection Benchmark Comparison Widget */}
      {aiDetection && (
        <AIDetectionComparison data={aiDetection} loading={aiDetectionLoading} />
      )}

      {/* Dual Monaco JSON / Text Editors */}
      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2 mb-8">
        <JsonEditorPanel
          title="Source Article Draft"
          subtitle="Original content submitted for humanization"
          payload={job?.original_content || null}
          wordCount={result?.audit.original_word_count ?? null}
          status={job ? 'completed' : 'waiting'}
          plainText={job?.original_content?.original_text}
        />
        <JsonEditorPanel
          title="Humanized Publication Prose"
          subtitle="Two-pass semantic rewrite, infographic specs & audit metadata"
          payload={result || null}
          wordCount={result?.audit.final_word_count ?? null}
          status={state === 'queued' ? 'waiting' : state}
          plainText={result?.humanized_text}
        />
      </div>

      {/* Editorial Audit Panel */}
      {result && (
        <div className="rounded-[2rem] border border-black/10 bg-white p-6 sm:p-8 shadow-card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-black/5">
            <div>
              <div className="inline-flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-ai-blue" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-ai-blue font-bold">
                  03 — EDITORIAL COMPLIANCE
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-brand-ink">
                Editorial Compliance &amp; Rulebook Audit
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-brand-mist font-sans">
                {result.audit.final_word_count.toLocaleString()} words · {result.audit.word_count_ratio}% of source ·{' '}
                {result.audit.applied_rules.length} rule categories verified
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3.5 py-1.5 text-xs font-mono font-bold border ${
                  result.audit.validation_status === 'passed'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {result.audit.validation_status === 'passed' ? '✓ AUTOMATED RULES PASSED' : 'EDITORIAL REVIEW REQUIRED'}
              </span>

              {result.infographics.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowInfographics(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-brand-parchment hover:bg-white px-3.5 py-2 text-xs font-semibold text-brand-ink transition-all shadow-2xs"
                >
                  <ImageIcon size={15} className="text-ai-orange" />
                  <span>Infographics ({result.infographics.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Review Flags Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.audit.review_flags.map((flag, index) => (
              <div
                key={`${flag.code}:${index}`}
                className={`rounded-xl border p-4 text-xs leading-relaxed font-sans transition-all ${
                  flag.severity === 'critical'
                    ? 'border-rose-200 bg-rose-50/60 text-rose-900'
                    : flag.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                    : 'border-black/5 bg-brand-parchment/60 text-brand-mist'
                }`}
              >
                <div className="font-mono font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      flag.severity === 'critical'
                        ? 'bg-rose-500'
                        : flag.severity === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-ai-blue'
                    }`}
                  />
                  {flag.code}
                </div>
                <div>{flag.message}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-black/5 flex flex-wrap items-center justify-between text-xs font-mono text-brand-mist">
            <div>Plagiarism Check: {result.audit.originality_check}</div>
            <div>AI Detection Status: {result.audit.ai_detection_check}</div>
            <div className="text-ai-orange font-bold">TECHMARKETING.AI AUDIT LAYER</div>
          </div>
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
