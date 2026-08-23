"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error("HeatShield AI Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl space-y-6 text-center backdrop-blur-xl">
        {/* Error Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Thermal Engine Interrupted</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            HeatShield AI encountered an unexpected state while processing spatial microclimate data.
          </p>
        </div>

        {/* Error details (sanitized) */}
        {error.message && (
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-[11px] text-slate-300 text-left overflow-x-auto">
            <code>{error.message}</code>
          </div>
        )}

        {/* Recovery Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restart Engine</span>
          </button>
          <a
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Reload Map</span>
          </a>
        </div>
      </div>
    </div>
  );
}
