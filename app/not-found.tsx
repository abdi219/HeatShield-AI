"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#070A10] text-white flex flex-col items-center justify-center p-6 text-center select-none">
      {/* ── Background Subtle Monochrome Grid ────────────────────────── */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-50" />

      {/* ── Open Minimalist Content ──────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-md mx-auto">
        {/* Animated Monochrome Radar Graphic */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
          <div className="absolute inset-2 rounded-full border border-white/15" />
          <div className="absolute inset-5 rounded-full border border-white/20" />
          <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10 -translate-y-1/2" />
          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/10 -translate-x-1/2" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-white/10 animate-spin [animation-duration:5s]" />
          <Radio className="w-5 h-5 text-white/80 relative z-10" />
        </div>

        {/* Clean, Simple Typography */}
        <div className="space-y-1.5">
          <p className="text-6xl sm:text-7xl font-black font-mono tracking-tighter text-white">
            404
          </p>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white/90">
            Page Not Found
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            The page or route you are looking for does not exist.
          </p>
        </div>

        {/* Clean Minimalist Text Navigation */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold text-white hover:text-slate-300 transition-all border-b border-white/40 hover:border-white pb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Heat Map</span>
          </Link>
        </div>

        {/* Subtle Pilot Metros Footer */}
        <div className="pt-8 text-[10px] font-mono text-slate-600">
          HeatShield AI • Miami • Austin • Phoenix • Las Vegas • Dubai
        </div>
      </div>
    </main>
  );
}
