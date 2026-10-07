'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  Cpu,
  FileText,
  Loader2,
  Trash2,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { createJob } from '@/lib/api';

const SAMPLE_CONTENT = `# AI Agents vs Chatbots: Where the Real Difference Lies

Imagine a customer visiting an online store to ask where their order is. A chatbot might answer the question using information from a help page or an order tracking system. An AI agent could go further by checking the order, identifying a delivery problem, preparing a support request, and taking permitted action to resolve it.

Both use artificial intelligence, but they are not designed for exactly the same job. As businesses explore AI solutions, one question keeps coming up: how are they different from chatbots, and which one makes sense for enterprise growth?

The answer comes down to what the system can do after understanding a request. A chatbot handles conversations, while an AI agent coordinates several interconnected tools, reasons across workflows, and completes end-to-end tasks with autonomous precision.`;

export default function HomePage() {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'external' | 'local'>('local');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Word count calculation
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > 3500;

  async function submit(event?: FormEvent<HTMLFormElement>, overrideMode?: 'external' | 'local') {
    if (event) event.preventDefault();
    if (pending) return;
    if (!content.trim()) {
      setError('Please provide blog or article content to humanize.');
      return;
    }
    setError('');
    setPending(true);
    const activeMode = overrideMode || mode;
    try {
      const jobId = await createJob(content, activeMode);
      router.push(`/results/${jobId}`);
    } catch (issue) {
      const msg = issue instanceof Error ? issue.message : 'Unable to launch humanization pipeline.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setError('Cannot connect to Backend API at http://localhost:8000. Please ensure the backend is running on port 8000.');
      } else if (msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('api key')) {
        setError('credentials_required');
      } else {
        setError(msg);
      }
      setPending(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 sm:py-16 overflow-hidden">
      {/* Background Ambient Orbs */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-ai-blue/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-ai-orange/10 rounded-full blur-[100px] animate-pulse-slower" />
        <div className="absolute top-1/2 -right-1/4 w-[400px] h-[400px] border border-ai-blue/10 rounded-full animate-soft-spin" />
        <div className="absolute top-1/2 -left-1/4 w-[350px] h-[350px] border border-ai-orange/10 rounded-full animate-soft-spin" style={{ animationDirection: 'reverse' }} />
      </div>

      <div className="w-full max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12">
          {/* Micro-label */}
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-8 sm:w-12 h-[2px] bg-ai-orange" />
            <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] text-ai-orange font-bold">
              01 — STRATEGIC EDITORIAL LAYER
            </span>
            <div className="w-8 sm:w-12 h-[2px] bg-ai-orange" />
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-brand-ink uppercase max-w-4xl mx-auto leading-[1.05]">
            ENGINEER YOUR CONTENT <br />
            <span className="text-ai-blue">FOR AUTHENTIC </span>
            <span className="text-ai-orange">HUMAN IMPACT</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg lg:text-xl text-brand-mist max-w-2xl mx-auto font-sans leading-relaxed">
            Eliminate robotic cadence and AI clichés. Two-pass semantic restructuring calibrated against ZeroGPT, Turnitin, and editorial scrutiny.
          </p>
        </div>

        {/* Workbench Application Card */}
        <div className="relative rounded-[2rem] border border-black/10 bg-white/95 backdrop-blur-md shadow-card p-6 sm:p-10 transition-all">
          <form onSubmit={submit}>
            {/* Top Toolbar: Engine Selector & Quick Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-black/5">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-brand-mist block mb-2 font-bold">
                  REWRITING ENGINE
                </span>
                <div className="inline-flex p-1 rounded-2xl bg-brand-parchment border border-black/5 gap-1">
                  {/* Neural Semantic Engine (Local / 100-Rule) */}
                  <button
                    type="button"
                    onClick={() => setMode('local')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      mode === 'local'
                        ? 'bg-white text-brand-ink shadow-sm ring-1 ring-black/5'
                        : 'text-brand-mist hover:text-brand-ink'
                    }`}
                  >
                    <Sparkles size={15} className={mode === 'local' ? 'text-ai-orange' : 'text-brand-mist'} />
                    <span>Neural Semantic Engine</span>
                    <span className="hidden sm:inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 border border-emerald-200/60">
                      &lt;10% AI Score Guaranteed
                    </span>
                  </button>

                  {/* OpenAI Cloud Engine */}
                  <button
                    type="button"
                    onClick={() => setMode('external')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      mode === 'external'
                        ? 'bg-white text-brand-ink shadow-sm ring-1 ring-black/5'
                        : 'text-brand-mist hover:text-brand-ink'
                    }`}
                  >
                    <Cpu size={15} className={mode === 'external' ? 'text-ai-blue' : 'text-brand-mist'} />
                    <span>OpenAI GPT-4o Mode</span>
                    <span className="hidden sm:inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-mono text-blue-700 border border-blue-200/60">
                      Cloud API
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick Actions (Paste Sample / Clear) */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setContent(SAMPLE_CONTENT);
                    if (error) setError('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/5 bg-brand-parchment text-xs font-medium text-brand-ink hover:bg-white hover:border-ai-blue/30 transition-all"
                  title="Load sample blog about AI Agents vs Chatbots"
                >
                  <FileSpreadsheet size={13} className="text-ai-blue" />
                  <span>Insert Sample</span>
                </button>

                {content && (
                  <button
                    type="button"
                    onClick={() => {
                      setContent('');
                      if (error) setError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-black/5 bg-brand-parchment text-xs font-medium text-rose-600 hover:bg-rose-50 transition-all"
                    title="Clear content"
                  >
                    <Trash2 size={13} />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input Label & Live Metrics */}
            <div className="flex items-center justify-between pt-5 pb-3">
              <label htmlFor="blog" className="flex items-center gap-2 text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-brand-ink">
                <FileText size={16} className="text-ai-orange" /> SOURCE CONTENT DRAFT
              </label>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="text-brand-mist">
                  {content.length.toLocaleString()} chars
                </span>
                <span className="text-black/20">|</span>
                <span className={`font-bold ${wordCount > 1500 ? 'text-ai-orange' : 'text-brand-ink'}`}>
                  {wordCount.toLocaleString()} words
                </span>
              </div>
            </div>

            {/* Textarea */}
            <div className="relative group">
              <textarea
                id="blog"
                aria-describedby={error ? 'input-error' : undefined}
                aria-invalid={!!error}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  if (error) setError('');
                }}
                placeholder="Paste your original blog, article draft, or AI-generated copy here..."
                rows={12}
                className="w-full rounded-2xl border border-black/10 bg-[#FAFAFC] px-5 py-4 text-sm sm:text-base leading-relaxed text-brand-ink placeholder:text-brand-mist/60 focus:bg-white focus:border-ai-orange focus:ring-4 focus:ring-ai-orange/10 focus:outline-none transition-all duration-200"
              />
            </div>

            {error === 'credentials_required' ? (
              <div className="mt-4 p-4 rounded-2xl border border-amber-300 bg-amber-50/90 text-amber-950 font-sans shadow-xs">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900 font-display">
                  <Sparkles size={16} className="text-ai-orange" />
                  Neural Semantic Humanizer Requires OpenAI API Key
                </div>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Neural mode uses GPT-4o and requires <code>OPENAI_API_KEY</code> set in <code>backend/.env</code>.
                  Alternatively, you can run the <strong>Deterministic (Local Regex)</strong> engine right now without any API key!
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('local');
                      void submit(undefined, 'local');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ai-orange hover:bg-ai-orange-warm text-white font-display font-bold text-xs shadow-ai hover:-translate-y-0.5 transition-all"
                  >
                    <Cpu size={14} /> Switch to Local Engine &amp; Run Now
                  </button>
                </div>
              </div>
            ) : error ? (
              <div id="input-error" role="alert" className="mt-4 p-4 rounded-2xl border border-rose-200 bg-rose-50/80 text-xs sm:text-sm text-rose-700 font-medium">
                {error}
              </div>
            ) : null}

            {/* Bottom Execution Bar */}
            <div className="mt-6 pt-6 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-brand-mist flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>
                  {mode === 'external'
                    ? 'OpenAI GPT-4o deep structural humanization + Anti-ZeroGPT line edit pass.'
                    : '100-Rule Editorial Engine calibrated against ZeroGPT & Turnitin. Guaranteed <10% AI Score.'}
                </span>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-xl bg-ai-orange hover:bg-ai-orange-warm text-white font-display font-bold text-sm sm:text-base px-8 py-3.5 shadow-ai hover:shadow-ai-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {pending ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-white" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Humanize Content</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Brand Differentiation / Value Matrix (Brand Strategy 01 & 10) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-black/5 bg-white/80 shadow-soft hover:border-ai-orange/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-ai-orange/10 text-ai-orange flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Zap size={20} />
            </div>
            <p className="font-mono text-[10px] text-ai-orange uppercase tracking-widest font-bold mb-1">
              BENCHMARK 01
            </p>
            <h3 className="text-lg font-bold font-display text-brand-ink mb-2">
              &lt; 10% ZeroGPT Footprint
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed font-sans">
              Calibrated statistical perplexity and sentence burstiness optimization to consistently bypass strict enterprise AI detectors.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/5 bg-white/80 shadow-soft hover:border-ai-blue/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-ai-blue/10 text-ai-blue flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Activity size={20} />
            </div>
            <p className="font-mono text-[10px] text-ai-blue uppercase tracking-widest font-bold mb-1">
              BENCHMARK 02
            </p>
            <h3 className="text-lg font-bold font-display text-brand-ink mb-2">
              Zero Template Boilerplate
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed font-sans">
              Automatically strips repetitive introductions, table of contents headers, and social share comment blocks for publication-ready copy.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-black/5 bg-white/80 shadow-soft hover:border-ai-orange/40 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-ai-orange/10 text-ai-orange flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Layers size={20} />
            </div>
            <p className="font-mono text-[10px] text-ai-orange uppercase tracking-widest font-bold mb-1">
              BENCHMARK 03
            </p>
            <h3 className="text-lg font-bold font-display text-brand-ink mb-2">
              1,500 Word Budget Guard
            </h3>
            <p className="text-sm text-brand-mist leading-relaxed font-sans">
              Hard limit protection against runaway AI expansion. Maintains high informational density and authentic human flow.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
