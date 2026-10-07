'use client';

import { X, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { Infographic } from '@/lib/api';

export default function InfographicModal({
  items,
  close,
}: {
  items: Infographic[];
  close: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Infographic previews"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[88vh] w-full max-w-[820px] overflow-y-auto rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-elevated"
      >
        <div className="mb-6 flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ai-orange/10 text-ai-orange">
              <ImageIcon size={20} />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ai-orange font-bold block">
                VISUAL ASSET ENGINE
              </span>
              <h2 className="text-xl font-bold font-display text-brand-ink">
                Generated Infographics ({items.length})
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close previews"
            className="rounded-xl p-2 text-brand-mist hover:bg-brand-parchment hover:text-brand-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6">
          {items.map((item, index) => (
            <section
              key={index}
              className="rounded-2xl border border-black/10 bg-brand-parchment/40 p-5 shadow-xs"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold font-display text-brand-ink">
                  {item.title}
                </h3>
                <span className="rounded-full bg-ai-blue/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-ai-blue uppercase">
                  {item.type}
                </span>
              </div>
              {item.svg_preview && (
                <div className="overflow-hidden rounded-xl border border-black/5 bg-white p-2">
                  <img
                    alt={`${item.title} infographic`}
                    className="w-full h-auto"
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svg_preview)}`}
                  />
                </div>
              )}
              <p className="mt-3 text-xs font-mono text-brand-mist">
                Vector infographic automatically derived from article structure. Ready for export.
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
