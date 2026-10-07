import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // TechMarketing.AI Brand Colors
        'ai-orange': {
          DEFAULT: '#F26522', // Signal Orange (Primary)
          warm: '#FF8A4C',    // Warm Accent
          light: '#FFF4EE',   // Subtle tint
        },
        'ai-blue': {
          DEFAULT: '#1E90D6', // Circuit Blue (Tech / Secondary)
          sky: '#4DAFEF',     // Sky Accent
          light: '#EEF8FD',   // Subtle tint
        },
        'brand-ink': {
          DEFAULT: '#0D0D0F', // Deep Ink (Dark surface)
          light: '#16161A',   // Elevated dark surface
          lighter: '#222228', // Dark border / surface
        },
        'brand-parchment': {
          DEFAULT: '#F7F6F3', // Parchment (Light background)
          warm: '#F2EFE9',    // Deeper parchment
        },
        'brand-mist': '#6B6B7A', // Neutral Mist (Supporting body / captions)
        // Compatibility tokens
        ink: '#0D0D0F',
        muted: '#6B6B7A',
        outline: '#E5E5EA',
        brand: '#F26522', // Default brand action maps to Signal Orange
        canvas: '#F7F6F3',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #F26522 0%, #1E90D6 100%)',
        'gradient-warm': 'linear-gradient(135deg, #F26522 0%, #FF8A4C 100%)',
        'gradient-circuit': 'linear-gradient(135deg, #1E90D6 0%, #4DAFEF 100%)',
        'gradient-hero': 'linear-gradient(145deg, #0D0D0F 0%, #171922 100%)',
        'gradient-ink-radial': 'radial-gradient(circle at top right, #1A1C24 0%, #0D0D0F 100%)',
      },
      boxShadow: {
        'ai': '0 10px 30px -10px rgba(242, 101, 34, 0.35)',
        'ai-lg': '0 20px 40px -12px rgba(242, 101, 34, 0.45)',
        'blue': '0 10px 30px -10px rgba(30, 144, 214, 0.35)',
        'soft': '0 12px 36px rgba(13, 13, 15, 0.045)',
        'card': '0 20px 50px -15px rgba(13, 13, 15, 0.07)',
        'elevated': '0 25px 60px -20px rgba(13, 13, 15, 0.12)',
        'glow-orange': '0 0 40px -10px rgba(242, 101, 34, 0.3)',
        'glow-blue': '0 0 40px -10px rgba(30, 144, 214, 0.3)',
      },
      animation: {
        'brand-pulse': 'brandPulse 2s ease-in-out infinite',
        'brand-breathe': 'brandBreathe 3s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 6s ease-in-out infinite',
        'pulse-slower': 'pulseSlower 8s ease-in-out infinite',
        'soft-spin': 'softSpin 35s linear infinite',
      },
      keyframes: {
        brandPulse: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        brandBreathe: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(242, 101, 34, 0.2)' },
          '50%': { transform: 'scale(1.02)', boxShadow: '0 0 35px rgba(30, 144, 214, 0.35)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.08)' },
        },
        pulseSlower: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.06)' },
        },
        softSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
