'use client';
import { useMemo, useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SearchCheck,
  FileText,
  Quote,
  Bookmark,
  X,
} from 'lucide-react';
import type { PlagiarismReport, MatchedPassage } from '@/lib/api';

type Props = {
  report: PlagiarismReport;
  humanizedText: string;
};

export default function PlagiarismReportView({ report, humanizedText }: Props) {
  const [selectedPassage, setSelectedPassage] = useState<MatchedPassage | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Safely segment humanizedText into plain and highlighted chunks based on offsets
  const textSegments = useMemo(() => {
    if (!humanizedText || !report.matched_passages || report.matched_passages.length === 0) {
      return [{ text: humanizedText, passage: null }];
    }

    // Sort passages by start_offset
    const sorted = [...report.matched_passages].sort((a, b) => a.start_offset - b.start_offset);

    const segments: Array<{ text: string; passage: MatchedPassage | null }> = [];
    let currentPos = 0;

    for (const passage of sorted) {
      // Validate offsets
      const start = Math.max(0, Math.min(passage.start_offset, humanizedText.length));
      const end = Math.max(start, Math.min(passage.end_offset, humanizedText.length));

      // Unmatched text before this passage
      if (start > currentPos) {
        segments.push({
          text: humanizedText.slice(currentPos, start),
          passage: null,
        });
      }

      // Matched passage text (only if start >= currentPos to avoid duplicate overlaps)
      if (start >= currentPos) {
        segments.push({
          text: humanizedText.slice(start, end),
          passage,
        });
        currentPos = end;
      }
    }

    // Trailing unmatched text
    if (currentPos < humanizedText.length) {
      segments.push({
        text: humanizedText.slice(currentPos),
        passage: null,
      });
    }

    return segments;
  }, [humanizedText, report.matched_passages]);

  const hasOutdatedWarning = report.review_flags.some((f) => f.code === 'OUTDATED_REPORT');

  return (
    <section className="mt-6 overflow-hidden rounded-[18px] border border-outline bg-white shadow-soft transition-all">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline px-6 py-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <SearchCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-ink">
                {report.check_mode === 'local' ? 'Internal Similarity Analysis' : 'External Plagiarism Analysis'}
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                {report.scope === 'internal_reference_collection' ? 'Local Reference Collection' : report.scope}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {report.sources_checked ?? 0} reference document{(report.sources_checked ?? 0) === 1 ? '' : 's'} assessed
              {report.checked_at && ` · Completed ${new Date(report.checked_at).toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold tracking-tight text-ink">
              {report.similarity_percentage !== null ? `${report.similarity_percentage.toFixed(1)}%` : 'Not Checked'}
            </div>
            <div className="text-[11px] text-muted">
              {report.similarity_percentage !== null ? 'Assessed Similarity' : 'No reference documents'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg border border-outline p-2 text-muted hover:bg-white hover:text-ink"
            title={expanded ? 'Collapse report' : 'Expand report'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {hasOutdatedWarning && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-900">
          <AlertTriangle size={15} className="text-amber-600" />
          <span>The humanized content was edited after this check completed. Results may not reflect recent modifications.</span>
        </div>
      )}

      {report.error_message && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50/60 px-6 py-2.5 text-xs text-amber-800">
          <Info size={15} />
          <span>{report.error_message}</span>
        </div>
      )}

      {expanded && (
        <div className="p-6 space-y-6">
          {/* Scope and Disclaimer Notice */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-slate-700 leading-relaxed">
            <strong>About this measurement:</strong> This Internal Similarity score represents the proportion of your article matching uploaded reference documents in your local database. It is not an internet-wide search and does not prove intentional copying.
          </div>

          {/* Interactive Highlighted Text & Inspector Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Highlighted Text Viewer */}
            <div className="lg:col-span-2">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Interactive Text Preview (Click highlights to inspect)
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-400" /> Exact match
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-amber-400" /> Close similarity
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Quoted / Cited
                  </span>
                </div>
              </div>

              <div className="max-h-[460px] overflow-y-auto rounded-xl border border-outline bg-[#FBFCFE] p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {textSegments.map((seg, idx) => {
                  if (!seg.passage) {
                    return <span key={idx}>{seg.text}</span>;
                  }

                  const p = seg.passage;
                  const isSelected = selectedPassage?.passage_id === p.passage_id;

                  let highlightClass = 'bg-rose-100/90 text-rose-950 border-b-2 border-rose-400 hover:bg-rose-200';
                  if (p.is_quoted || p.is_cited) {
                    highlightClass = 'bg-emerald-100/90 text-emerald-950 border-b-2 border-emerald-400 hover:bg-emerald-200';
                  } else if (p.match_type === 'close_similarity') {
                    highlightClass = 'bg-amber-100/90 text-amber-950 border-b-2 border-amber-400 hover:bg-amber-200';
                  }

                  if (isSelected) {
                    highlightClass += ' ring-2 ring-brand ring-offset-1';
                  }

                  return (
                    <mark
                      key={p.passage_id || idx}
                      onClick={() => setSelectedPassage(p)}
                      className={`cursor-pointer rounded px-0.5 transition-colors ${highlightClass}`}
                      title={`Match: ${p.source_title} (${p.match_type})`}
                    >
                      {seg.text}
                    </mark>
                  );
                })}
              </div>
            </div>

            {/* Right 1 Col: Match Inspector Card */}
            <div className="lg:col-span-1">
              <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                Match Inspector
              </h3>

              {selectedPassage ? (
                <div className="rounded-xl border border-brand/30 bg-blue-50/30 p-4 shadow-sm text-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          selectedPassage.review_category === 'quoted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedPassage.review_category === 'cited'
                            ? 'bg-blue-100 text-brand'
                            : selectedPassage.match_type === 'exact_match'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {selectedPassage.review_category === 'quoted' && <Quote size={11} />}
                        {selectedPassage.review_category === 'cited' && <Bookmark size={11} />}
                        {selectedPassage.review_category === 'quoted'
                          ? 'Direct Quotation'
                          : selectedPassage.review_category === 'cited'
                          ? 'Cited Reference'
                          : selectedPassage.match_type === 'exact_match'
                          ? 'Exact Match'
                          : 'Close Similarity'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPassage(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-muted">Matching Source</div>
                    <div className="font-semibold text-ink mt-0.5">{selectedPassage.source_title}</div>
                    {selectedPassage.source_url && (
                      <a
                        href={selectedPassage.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
                      >
                        <span>Visit verified source</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-muted">Matched Passage</div>
                    <blockquote className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-800">
                      &quot;{selectedPassage.text}&quot;
                    </blockquote>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/80 pt-2 text-[11px] text-muted">
                    <span>Similarity confidence</span>
                    <span className="font-bold text-ink">
                      {(selectedPassage.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-[11px] text-muted">
                    {selectedPassage.needs_review ? (
                      <span className="text-amber-700 font-semibold">⚠ Needs editorial review for attribution</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">✓ Properly attributed or formatted</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-muted">
                  <FileText size={28} className="text-slate-300 mb-2" />
                  <p className="font-medium text-slate-700">No passage selected</p>
                  <p className="mt-1 text-[11px]">Click on any highlighted text segment to inspect its matched source and details.</p>
                </div>
              )}
            </div>
          </div>

          {/* Matched Sources Cards */}
          {report.matched_sources && report.matched_sources.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Matching Reference Sources ({report.matched_sources.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.matched_sources.map((src) => (
                  <div
                    key={src.source_id}
                    className="flex flex-col justify-between rounded-xl border border-outline bg-white p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-ink line-clamp-1">{src.title}</h4>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-brand shrink-0">
                          {src.similarity_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {src.matches_count} matching passage{src.matches_count === 1 ? '' : 's'}
                      </p>
                    </div>

                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
                      >
                        <span>Verified URL</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editorial Review Findings */}
          {report.review_flags && report.review_flags.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Editorial Review Findings
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {report.review_flags.map((flag, idx) => (
                  <div
                    key={`${flag.code}:${idx}`}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                      flag.severity === 'critical'
                        ? 'border-red-200 bg-red-50 text-red-900'
                        : flag.severity === 'warning'
                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    {flag.severity === 'warning' ? (
                      <AlertTriangle size={15} className="mt-0.5 text-amber-600 shrink-0" />
                    ) : flag.severity === 'critical' ? (
                      <ShieldAlert size={15} className="mt-0.5 text-red-600 shrink-0" />
                    ) : (
                      <Info size={15} className="mt-0.5 text-blue-500 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">{flag.code}: </span>
                      <span>{flag.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
