'use client';
import { X, Image as ImageIcon } from 'lucide-react';
import type { Infographic } from '@/lib/api';
export default function InfographicModal({items, close}: {items: Infographic[]; close: () => void}) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={close}>
    <div role="dialog" aria-modal="true" aria-label="Infographic previews" onMouseDown={event=>event.stopPropagation()} className="max-h-[88vh] w-full max-w-[760px] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold"><ImageIcon size={20} className="text-brand"/> Infographic previews</h2><button type="button" onClick={close} aria-label="Close previews" className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div>
      {items.map((item,index) => <section key={index} className="mb-6 rounded-xl border border-outline p-3"><h3 className="mb-3 text-sm font-semibold">{item.title}</h3>{item.svg_preview && <img alt={`${item.title} infographic`} className="w-full" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.svg_preview)}`}/>}<p className="mt-2 text-xs text-muted">Generated from existing article content. Please review before publication.</p></section>)}
    </div>
  </div>;
}
