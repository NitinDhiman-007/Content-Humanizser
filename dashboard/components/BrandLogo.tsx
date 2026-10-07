import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BrandLogoIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 transition-transform duration-300 group-hover:scale-105`}
    >
      {/* Outer ambient glow ring */}
      <circle cx="24" cy="24" r="21" stroke="url(#logo-grad-circuit)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      
      {/* Central neural stem (Nature/Tree trunk) */}
      <path
        d="M24 40V24M24 24L16 16M24 24L32 16M24 20L19 12M24 20L29 12"
        stroke="#0D0D0F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-white transition-colors"
      />
      
      {/* Circuit Nodes (AI & Brain synapses) */}
      <circle cx="16" cy="16" r="3.5" fill="#1E90D6" />
      <circle cx="32" cy="16" r="3.5" fill="#F26522" />
      <circle cx="19" cy="12" r="2.5" fill="#4DAFEF" />
      <circle cx="29" cy="12" r="2.5" fill="#FF8A4C" />
      <circle cx="24" cy="8" r="3" fill="url(#logo-grad-primary)" />
      
      {/* Neural bridge arcs */}
      <path
        d="M16 16C16 10 32 10 32 16"
        stroke="url(#logo-grad-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />

      <defs>
        <linearGradient id="logo-grad-primary" x1="16" y1="8" x2="32" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F26522" />
          <stop offset="1" stopColor="#1E90D6" />
        </linearGradient>
        <linearGradient id="logo-grad-circuit" x1="3" y1="3" x2="45" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E90D6" />
          <stop offset="1" stopColor="#F26522" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function BrandLogo({
  variant = 'light',
  size = 'md',
  showTagline = true,
}: BrandLogoProps) {
  const isDark = variant === 'dark';
  
  const textSizes = {
    sm: 'text-[12px] sm:text-[14px]',
    md: 'text-[14px] sm:text-[16px] lg:text-[17px]',
    lg: 'text-[18px] sm:text-[22px]',
  };

  return (
    <Link href="/" className="inline-flex items-center gap-2.5 group select-none">
      <div className="relative flex items-center justify-center p-1 rounded-xl bg-gradient-to-br from-brand-parchment to-white border border-black/5 shadow-xs group-hover:border-ai-blue/30 transition-all duration-300">
        <BrandLogoIcon className={size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6'} />
      </div>

      <div className="flex flex-col items-start leading-none">
        <div className={`font-display font-black tracking-tight ${textSizes[size]}`}>
          <span className={isDark ? 'text-white' : 'text-brand-ink'}>TECH</span>
          <span className="text-ai-blue">MARKETING</span>
          <span className="text-ai-orange">.AI</span>
        </div>
        {showTagline && (
          <span
            className={`font-mono text-[8px] font-bold uppercase tracking-[0.24em] mt-1 ${
              isDark ? 'text-white/40' : 'text-brand-mist'
            }`}
          >
            BUILD. SCALE. AUTOMATE
          </span>
        )}
      </div>
    </Link>
  );
}
