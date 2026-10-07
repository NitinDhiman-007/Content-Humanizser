'use client';

import { useMemo, useState } from 'react';
import {
  ShieldAlert,
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
      const start = Math.max(0, Math.min(passage.start_offset, humanizedText.length));
      const end = Math.max(start, Math.min(passage.end_offset, humanizedText.length));

      if (start > currentPos) {
        segments.push({
          text: humanizedText.slice(currentPos, start),
          passage: null,
        });
      }

      if (start >= currentPos) {
        segments.push({
          text: humanizedText.slice(start, end),
          passage,
        });
        currentPos = end;
      }
    }

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
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-card transition-all">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 px-6 sm:px-8 py-5 bg-brand-parchment/60">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ai-blue/10 text-ai-blue">
            <SearchCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ai-blue font-bold">
                04 — SIMILARITY AUDIT
              </span>
              <span className="rounded-full bg-white border border-black/5 px-2.5 py-0.5 text-[10px] font-mono font-bold text-brand-ink">
                {report.scope === 'internal_reference_collection' ? 'Corpus Benchmark' : report.scope}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-display text-brand-ink mt-0.5">
              {report.check_mode === 'local' ? 'Internal Similarity Analysis' : 'Licensed Plagiarism Analysis'}
            </h2>
            <p className="mt-0.5 text-xs text-brand-mist font-mono">
              {report.sources_checked ?? 0} reference document{(report.sources_checked ?? 0) === 1 ? '' : 's'} assessed
              {report.checked_at && ` · Completed ${new Date(report.checked_at).toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black font-display tracking-tight text-brand-ink">
              {report.similarity_percentage !== null ? `${report.similarity_percentage.toFixed(1)}%` : 'Not Checked'}
            </div>
            <div className="text-[11px] font-mono text-brand-mist uppercase">
              {report.similarity_percentage !== null ? 'Assessed Similarity' : 'No reference corpus'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-xl border border-black/10 p-2.5 text-brand-mist hover:bg-white hover:text-brand-ink transition-colors"
            title={expanded ? 'Collapse report' : 'Expand report'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {hasOutdatedWarning && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-900 font-sans">
          <AlertTriangle size={15} className="text-amber-600 shrink-0" />
          <span>The humanized content was edited after this check completed. Results may not reflect recent modifications.</span>
        </div>
      )}

      {report.error_message && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50/70 px-6 py-2.5 text-xs text-amber-800 font-sans">
          <Info size={15} className="shrink-0" />
          <span>{report.error_message}</span>
        </div>
      )}

      {expanded && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Scope and Disclaimer Notice */}
          <div className="rounded-2xl border border-ai-blue/20 bg-ai-blue/5 p-4 text-xs text-brand-ink leading-relaxed font-sans">
            <strong className="text-ai-blue font-mono font-bold uppercase tracking-wider block mb-0.5">
              About this measurement
            </strong>
            This score represents the proportion of text matching authorized reference documents in your local database. It isolates proprietary overlaps and verifies editorial originality.
          </div>

          {/* Interactive Highlighted Text & Inspector Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: Highlighted Text Viewer */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-brand-mist">
                  Interactive Text Preview (Select Highlights to Inspect)
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 text-rose-700">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Exact match
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-700">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Close similarity
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Quoted / Cited
                  </span>
                </div>
              </div>

              <div className="max-h-[480px] overflow-y-auto rounded-2xl border border-black/10 bg-[#FAFAFC] p-5 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {textSegments.map((seg, idx) => {
                  if (!seg.passage) {
                    return <span key={idx}>{seg.text}</span>;
                  }

                  const p = seg.passage;
                  const isSelected = selectedPassage?.passage_id === p.passage_id;

                  let highlightClass = 'bg-rose-100 text-rose-950 border-b-2 border-rose-500 hover:bg-rose-200';
                  if (p.is_quoted || p.is_cited) {
                    highlightClass = 'bg-emerald-100 text-emerald-950 border-b-2 border-emerald-500 hover:bg-emerald-200';
                  } else if (p.match_type === 'close_similarity') {
                    highlightClass = 'bg-amber-100 text-amber-950 border-b-2 border-amber-500 hover:bg-amber-200';
                  }

                  if (isSelected) {
                    highlightClass += ' ring-2 ring-ai-orange ring-offset-1';
                  }

                  return (
                    <mark
                      key={p.passage_id || idx}
                      onClick={() => setSelectedPassage(p)}
                      className={`cursor-pointer rounded px-1 transition-colors ${highlightClass}`}
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
              <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-brand-mist">
                Passage Inspector
              </h3>

              {selectedPassage ? (
                <div className="rounded-2xl border border-ai-blue/30 bg-ai-blue/5 p-5 shadow-xs text-xs space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                          selectedPassage.review_category === 'quoted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedPassage.review_category === 'cited'
                            ? 'bg-blue-100 text-ai-blue'
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
                      className="text-brand-mist hover:text-brand-ink"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-brand-mist">Matching Source</div>
                    <div className="font-bold font-display text-brand-ink mt-0.5 text-sm">{selectedPassage.source_title}</div>
                    {selectedPassage.source_url && (
                      <a
                        href={selectedPassage.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-ai-blue hover:underline font-mono"
                      >
                        <span>Verified reference URL</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-brand-mist">Matched Content</div>
                    <blockquote className="mt-1 rounded-xl border border-black/10 bg-white p-3 font-mono text-[11px] text-brand-ink">
                      &quot;{selectedPassage.text}&quot;
                    </blockquote>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/5 pt-2 text-[11px] font-mono">
                    <span className="text-brand-mist">Similarity Confidence</span>
                    <span className="font-bold text-brand-ink">
                      {(selectedPassage.similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="text-[11px] font-sans">
                    {selectedPassage.needs_review ? (
                      <span className="text-amber-800 font-semibold">⚠ Needs editorial review for attribution</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">✓ Properly attributed or formatted</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 p-6 text-center text-xs text-brand-mist bg-brand-parchment/30">
                  <FileText size={32} className="text-brand-mist/40 mb-2" />
                  <p className="font-bold font-display text-brand-ink">No passage selected</p>
                  <p className="mt-1 text-[11px] font-sans">
                    Click any highlighted passage on the left to inspect its matched source and confidence score.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Matched Sources Cards */}
          {report.matched_sources && report.matched_sources.length > 0 && (
            <div>
              <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-brand-mist">
                Matching Reference Sources ({report.matched_sources.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {report.matched_sources.map((src) => (
                  <div
                    key={src.source_id}
                    className="flex flex-col justify-between rounded-2xl border border-black/5 bg-brand-parchment/40 p-4 hover:border-ai-blue/30 transition-all shadow-2xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold font-display text-brand-ink line-clamp-1">{src.title}</h4>
                        <span className="rounded-full bg-ai-blue/10 px-2 py-0.5 text-[11px] font-mono font-bold text-ai-blue shrink-0">
                          {src.similarity_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-mono text-brand-mist">
                        {src.matches_count} matching passage{src.matches_count === 1 ? '' : 's'}
                      </p>
                    </div>

                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-ai-blue hover:underline font-mono"
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
              <h3 className="mb-3 text-xs font-mono font-bold uppercase tracking-wider text-brand-mist">
                Editorial Review Findings
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {report.review_flags.map((flag, idx) => (
                  <div
                    key={`${flag.code}:${idx}`}
                    className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-sans ${
                      flag.severity === 'critical'
                        ? 'border-rose-200 bg-rose-50/70 text-rose-900'
                        : flag.severity === 'warning'
                        ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                        : 'border-black/5 bg-brand-parchment/60 text-brand-mist'
                    }`}
                  >
                    {flag.severity === 'warning' ? (
                      <AlertTriangle size={15} className="mt-0.5 text-amber-600 shrink-0" />
                    ) : flag.severity === 'critical' ? (
                      <ShieldAlert size={15} className="mt-0.5 text-rose-600 shrink-0" />
                    ) : (
                      <Info size={15} className="mt-0.5 text-ai-blue shrink-0" />
                    )}
                    <div>
                      <span className="font-bold font-mono uppercase">{flag.code}: </span>
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
