'use client';

import React from 'react';
import { Sparkles, TrendingDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AIDetectionComparison as AIDetectionData } from '../lib/api';

interface Props {
  data: AIDetectionData;
  loading?: boolean;
}

export function AIDetectionComparison({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-brand-ink/95 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-md animate-pulse mb-8 shadow-card">
        <div className="h-6 w-56 bg-white/10 rounded-lg mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-white/5 rounded-2xl" />
          <div className="h-44 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { original, humanized, ai_reduction_percentage } = data;

  const getScoreBadge = (pct: number) => {
    if (pct < 15) {
      return {
        text: 'text-emerald-400',
        bar: 'bg-emerald-500',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      };
    }
    if (pct < 50) {
      return {
        text: 'text-ai-orange-warm',
        bar: 'bg-ai-orange',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
      };
    }
    return {
      text: 'text-rose-400',
      bar: 'bg-rose-500',
      badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
    };
  };

  const origColor = getScoreBadge(original.ai_percentage);
  const humanColor = getScoreBadge(humanized.ai_percentage);

  return (
    <div className="relative bg-gradient-to-b from-brand-ink via-[#121318] to-brand-ink border border-white/10 rounded-3xl p-6 sm:p-8 shadow-card backdrop-blur-md mb-8 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-ai-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-ai-orange/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ai-blue font-bold">
              02 — STATISTICAL BENCHMARK
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight mt-1">
            AI Detection Benchmark Comparison
          </h2>
          <p className="text-xs sm:text-sm text-white/50 mt-1 font-sans">
            Perplexity, burstiness, and syntactic variety calibrated against ZeroGPT &amp; Turnitin models.
          </p>
        </div>

        {ai_reduction_percentage > 0 && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold shadow-glow-blue">
            <TrendingDown size={15} className="text-emerald-400" />
            <span>
              <strong className="text-sm">{ai_reduction_percentage}%</strong> Reduction in AI Footprint
            </span>
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Original Draft Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-6 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-white/60">
              Original Draft
            </span>
            <span className={`text-[11px] font-mono px-3 py-1 rounded-full border ${origColor.badge}`}>
              {original.verdict}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-4xl sm:text-5xl font-black font-display tracking-tight ${origColor.text}`}>
              {original.ai_percentage}%
            </span>
            <span className="text-xs font-mono text-white/40">AI Footprint Probability</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden my-4">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${origColor.bar}`}
              style={{ width: `${Math.min(100, original.ai_percentage)}%` }}
            />
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-white/10 text-center font-mono">
            <div>
              <div className="text-[10px] text-white/40 uppercase">Burstiness</div>
              <div className="text-xs sm:text-sm font-bold text-white/90 mt-0.5">{original.burstiness_score}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">AI Clichés</div>
              <div className="text-xs sm:text-sm font-bold text-rose-400 mt-0.5">{original.cliches_found.length} detected</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">Word Count</div>
              <div className="text-xs sm:text-sm font-bold text-white/90 mt-0.5">{original.word_count}</div>
            </div>
          </div>
        </div>

        {/* Humanized Output Card */}
        <div className="bg-white/5 border border-ai-blue/40 rounded-2xl p-5 sm:p-6 hover:border-ai-blue/60 transition-all relative overflow-hidden shadow-glow-blue">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-ai-blue flex items-center gap-1.5">
              <Sparkles size={13} className="text-ai-orange" />
              Humanized Output
            </span>
            <span className={`text-[11px] font-mono px-3 py-1 rounded-full border ${humanColor.badge}`}>
              {humanized.verdict}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-4xl sm:text-5xl font-black font-display tracking-tight ${humanColor.text}`}>
              {humanized.ai_percentage}%
            </span>
            {humanized.ai_percentage < 10 ? (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={13} /> Passed Anti-ZeroGPT Standard (&lt;10% Target)
              </span>
            ) : (
              <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle size={13} /> Moderate AI Footprint (Target &lt;10%)
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden my-4">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${humanColor.bar}`}
              style={{ width: `${Math.max(4, humanized.ai_percentage)}%` }}
            />
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-white/10 text-center font-mono">
            <div>
              <div className="text-[10px] text-white/40 uppercase">Burstiness</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-300 mt-0.5">{humanized.burstiness_score} (Optimal)</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">Contractions</div>
              <div className="text-xs sm:text-sm font-bold text-emerald-300 mt-0.5">{humanized.contraction_count}</div>
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase">Word Budget</div>
              <div className="text-xs sm:text-sm font-bold text-ai-orange mt-0.5">{humanized.word_count} / 1500 max</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
