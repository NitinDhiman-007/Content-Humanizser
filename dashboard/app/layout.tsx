import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Syne, DM_Sans, Space_Mono } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Content Humanizer Studio | TechMarketing.AI',
  description:
    'Engineering brand identities for growth in the AI era. Strategic logic meets creative precision — transforming AI drafts into high-converting, human editorial prose.',
  keywords: [
    'TechMarketing.AI',
    'Content Humanizer',
    'AI Detector Bypass',
    'ZeroGPT Humanizer',
    'Editorial Automation',
    'Brand Strategy',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${spaceMono.variable}`}
    >
      <body className="min-h-screen bg-brand-parchment text-brand-ink flex flex-col font-sans antialiased circuit-grid">
        <Navbar />
        <div className="flex-1 w-full">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
