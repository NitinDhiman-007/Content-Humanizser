'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Loader2, Sparkles, Cpu } from 'lucide-react';
import { createJob } from '@/lib/api';

export default function HomePage() {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<'external' | 'local'>('external');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!content.trim()) {
      setError('Please enter or paste your blog content.');
      return;
    }
    setError('');
    setPending(true);
    try {
      const jobId = await createJob(content, mode);
      router.push(`/results/${jobId}`);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Unable to create this job.');
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-74px)] max-w-[1120px] items-center justify-center px-5 py-14 sm:px-8">
      <div className="w-full">
        <div className="mb-9 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Content processing
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-[46px]">
            Humanize your content.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-muted">
            Transform drafts into natural, human prose with deep rephrasing, target &lt;10% AI detection, and low plagiarism.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[22px] border border-outline bg-white p-4 shadow-soft sm:p-6">
          {/* Mode Selector */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">Rewriting Engine:</label>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode('external')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    mode === 'external'
                      ? 'bg-white text-brand shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  <Sparkles size={13} className={mode === 'external' ? 'text-brand' : 'text-slate-400'} />
                  AI Semantic Humanizer
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    &lt;10% AI & Plagiarism
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('local')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    mode === 'local'
                      ? 'bg-white text-ink shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-ink'
                  }`}
                >
                  <Cpu size={13} className={mode === 'local' ? 'text-ink' : 'text-slate-400'} />
                  Standard Rule-Based (Local)
                </button>
              </div>
            </div>
            <span className="text-xs text-muted">{content.length.toLocaleString()} characters</span>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="blog" className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileText size={17} className="text-brand" /> Your original blog
            </label>
          </div>

          <textarea
            id="blog"
            aria-describedby={error ? 'input-error' : undefined}
            aria-invalid={!!error}
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              if (error) setError('');
            }}
            placeholder="Paste your original blog content here..."
            className="min-h-[340px] w-full rounded-xl border border-outline bg-[#FCFDFE] px-5 py-4 text-[14px] leading-7 text-ink placeholder:text-slate-400 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 sm:min-h-[420px]"
          />
          {error && (
            <p id="input-error" role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-5">
            <span className="text-xs text-muted hidden sm:inline">
              {mode === 'external'
                ? 'Deep semantic rewrite guided by 100 Functional Humanizer rules via OpenAI.'
                : 'Conservative deterministic replacements only.'}
            </span>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-brand px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Rewriting Content...
                </>
              ) : (
                <>
                  Humanize Content <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs leading-5 text-muted">
          Original content stays completely preserved. Results are rendered side-by-side in dual Monaco editors.
        </p>
      </div>
    </main>
  );
}
