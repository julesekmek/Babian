import React from 'react';
import { Inter } from 'next/font/google';
import '../../app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.className} min-h-screen bg-neutral-950 text-neutral-100 selection:bg-rose-500/30`}>
      <header className="border-b border-neutral-800 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black bg-linear-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              BABIAN
            </span>
            <span className="text-xs font-bold px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full">
              MARKET
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
