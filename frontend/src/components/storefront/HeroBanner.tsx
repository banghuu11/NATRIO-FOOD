'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, MousePointerClick } from 'lucide-react';

// Dynamic import Nut3DCanvas with SSR disabled
const Nut3DCanvas = dynamic(() => import('./Nut3DCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] sm:h-[600px] lg:h-[680px] flex items-center justify-center bg-slate-950">
      <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
    </div>
  ),
});

export default function HeroBanner() {
  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-b from-slate-950 via-[#061e16] to-slate-950 border-b border-emerald-900/40">
      
      {/* Background Ambient Lighting & Stars Grid */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b20_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Pure Full-Width 3D Canvas Scene */}
      <div className="w-full relative z-10 pt-28 sm:pt-32 lg:pt-34">
        <Nut3DCanvas />
      </div>

      {/* Subtle Floating Interactive Badge at Bottom-Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Trải nghiệm 3D tương tác xoay 360° theo chuột</span>
        </div>
      </div>

    </section>
  );
}
