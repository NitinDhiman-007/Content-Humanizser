import React from 'react';
import BrandLogo from './BrandLogo';
import { ArrowUpRight, ShieldCheck, Cpu, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-brand-ink text-white pt-16 pb-12 mt-24 overflow-hidden border-t border-white/10">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute -top-[20%] left-[-10%] w-[45%] h-[45%] bg-ai-blue/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-ai-orange/15 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-[90rem] mx-auto px-5 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-white/10">
          {/* Brand Col */}
          <div className="lg:col-span-5 space-y-6">
            <BrandLogo variant="dark" size="lg" />
            <p className="text-white/60 text-sm leading-relaxed max-w-md font-light">
              Engineering <span className="text-white font-medium">measurable growth</span> with AI-driven systems.
              Our Content Humanizer Studio transforms drafts into authentic, publication-grade human prose calibrated against ZeroGPT and academic benchmarks.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-ai-orange tracking-widest uppercase">
                <Cpu size={12} /> 100+ LINGUISTIC RULES
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-ai-blue tracking-widest uppercase">
                <ShieldCheck size={12} /> HARD &lt;1,500 WORDS
              </span>
            </div>
          </div>

          {/* Core Links */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-[0.25em] text-ai-orange uppercase">
              Brand Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://techmarketing.ai/brand-strategy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Brand Strategy &amp; AI Identity <ArrowUpRight size={13} className="opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://techmarketing.ai/services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Autonomous AI Agents <ArrowUpRight size={13} className="opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://techmarketing.ai/services"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                >
                  AI-Enhanced SEO Dominance <ArrowUpRight size={13} className="opacity-50" />
                </a>
              </li>
            </ul>
          </div>

          {/* Value Proposition */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-mono font-bold tracking-[0.25em] text-ai-blue uppercase">
              The Architecture
            </h4>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">ZeroGPT Bypass Target:</span>
                <span className="font-bold text-emerald-400">&lt; 10% AI Score</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">Word Count Budget:</span>
                <span className="font-bold text-ai-orange">&le; 1,500 Words</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/50">Pipeline:</span>
                <span className="font-bold text-ai-blue">2-Pass Neural Reasoning</span>
              </div>
            </div>
            <p className="text-[11px] font-mono text-white/40">
              TechMarketing.AI &copy; {new Date().getFullYear()} · All rights reserved. Built for enterprise scale.
            </p>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-mono">
          <div>TECHMARKETING.AI // CONTENT HUMANIZER STUDIO</div>
          <div className="flex items-center gap-6">
            <span className="text-ai-orange font-bold">BUILD.</span>
            <span className="text-white font-bold">SCALE.</span>
            <span className="text-ai-blue font-bold">AUTOMATE.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
