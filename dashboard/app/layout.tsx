import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Layers3 } from 'lucide-react';
import './globals.css';
export const metadata: Metadata = { title: 'Content Humanizer', description: 'Local editorial workspace and structured review dashboard' };
export default function RootLayout({ children }: Readonly<{children: ReactNode}>) {
  return <html lang="en"><body className="min-h-screen">
    <header className="border-b border-outline bg-white/95">
      <div className="mx-auto flex h-[74px] max-w-[1480px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Content Humanizer home" className="flex items-center gap-3 font-semibold tracking-tight text-ink">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white"><Layers3 size={21}/></span>
          <span className="text-[17px]">Content Humanizer<span className="ml-2 rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted">Studio</span></span>
        </Link>
        <span className="hidden text-xs font-medium tracking-wide text-muted sm:block">EDITORIAL WORKSPACE</span>
      </div>
    </header>
    {children}
  </body></html>;
}
