'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { API_BASE_URL } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    async function checkHealth() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
        if (active) {
          setIsBackendOnline(res.ok);
        }
      } catch {
        if (active) {
          setIsBackendOnline(false);
        }
      }
    }

    void checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 mb-6">
      <nav className="mx-auto max-w-[90rem] bg-white/85 backdrop-blur-xl border border-black/5 shadow-soft rounded-full px-5 py-2.5 sm:py-3 transition-all duration-300">
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <BrandLogo size="md" />

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-full text-xs lg:text-[13px] font-medium transition-all duration-200 ${
                pathname === '/'
                  ? 'bg-ai-orange/10 text-ai-orange border border-ai-orange/25 font-semibold'
                  : 'text-brand-ink/80 hover:text-ai-orange hover:bg-ai-orange/5'
              }`}
            >
              Humanizer Studio
            </Link>

            <a
              href="https://techmarketing.ai/brand-strategy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs lg:text-[13px] font-medium text-brand-mist hover:text-ai-blue hover:bg-ai-blue/5 transition-all duration-200"
            >
              Brand Strategy
              <ArrowUpRight size={13} className="opacity-70" />
            </a>

            <a
              href="https://techmarketing.ai/services"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs lg:text-[13px] font-medium text-brand-mist hover:text-ai-blue hover:bg-ai-blue/5 transition-all duration-200"
            >
              AI Solutions
              <ArrowUpRight size={13} className="opacity-70" />
            </a>
          </div>

          {/* Right Status & Action */}
          <div className="flex items-center gap-3">
            {/* Live Engine Telemetry Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-brand-parchment border border-black/5 text-[11px] font-mono text-brand-mist">
              {isBackendOnline === true ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold tracking-wider text-brand-ink/90">BACKEND ONLINE</span>
                </>
              ) : isBackendOnline === false ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span className="font-bold tracking-wider text-rose-600">BACKEND OFFLINE (PORT 8000)</span>
                </>
              ) : (
                <span className="text-brand-mist font-medium">CONNECTING...</span>
              )}
            </div>

            {/* Quick Action */}
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full text-xs sm:text-sm font-semibold font-sans bg-ai-orange text-white shadow-ai hover:bg-ai-orange-warm hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 px-4 sm:px-5 py-2 sm:py-2.5"
            >
              <Sparkles size={14} />
              <span>New Job</span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
