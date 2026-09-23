'use client';

import React from 'react';
import { AIDetectionComparison as AIDetectionData } from '../lib/api';

interface Props {
  data: AIDetectionData;
  loading?: boolean;
}

export function AIDetectionComparison({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md animate-pulse mb-8">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-36 bg-slate-800/60 rounded-xl" />
          <div className="h-36 bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  const { original, humanized, ai_reduction_percentage } = data;

  const getScoreColor = (pct: number) => {
    if (pct < 15) return { text: 'text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' };
    if (pct < 50) return { text: 'text-amber-400', bar: 'bg-amber-500', badge: 'bg-amber-950/70 text-amber-300 border-amber-500/40' };
    return { text: 'text-rose-400', bar: 'bg-rose-500', badge: 'bg-rose-950/70 text-rose-300 border-rose-500/40' };
  };

  const origColor = getScoreColor(original.ai_percentage);
  const humanColor = getScoreColor(humanized.ai_percentage);

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md mb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/70">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
              AI Detection Benchmark Comparison
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Statistical perplexity and burstiness analysis calibrated against ZeroGPT &amp; GPTZero.
          </p>
        </div>

        {ai_reduction_percentage > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            <span><strong>{ai_reduction_percentage}%</strong> Reduction in AI Footprint</span>
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Original Draft Card */}
        <div className="bg-slate-950/60 border border-slate-800/70 rounded-xl p-5 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Original Draft AI Score
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${origColor.badge}`}>
              {original.verdict}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-4xl font-extrabold tracking-tight ${origColor.text}`}>
              {original.ai_percentage}%
            </span>
            <span className="text-xs text-slate-400 font-medium">AI Generated Probability</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden my-3">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${origColor.bar}`}
              style={{ width: `${Math.min(100, original.ai_percentage)}%` }}
            />
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-800/50 text-center">
            <div>
              <div className="text-[11px] text-slate-500">Sentence Burstiness</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{original.burstiness_score}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">AI Clichés Found</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{original.cliches_found.length}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Word Count</div>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{original.word_count}</div>
            </div>
          </div>
        </div>

        {/* Humanized Output Card */}
        <div className="bg-emerald-950/10 border border-emerald-800/40 rounded-xl p-5 hover:border-emerald-600/50 transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Humanized Output AI Score
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border ${humanColor.badge}`}>
              {humanized.verdict}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-4xl font-extrabold tracking-tight ${humanColor.text}`}>
              {humanized.ai_percentage}%
            </span>
            <span className="text-xs text-emerald-400/90 font-medium">ZeroGPT / AI Footprint</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden my-3">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${humanColor.bar}`}
              style={{ width: `${Math.max(3, humanized.ai_percentage)}%` }}
            />
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-800/50 text-center">
            <div>
              <div className="text-[11px] text-slate-400">Sentence Burstiness</div>
              <div className="text-xs font-semibold text-emerald-300 mt-0.5">{humanized.burstiness_score} (High)</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Contractions</div>
              <div className="text-xs font-semibold text-emerald-300 mt-0.5">{humanized.contraction_count}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Word Budget</div>
              <div className="text-xs font-semibold text-emerald-300 mt-0.5">{humanized.word_count} / 1500 max</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
