"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught component error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[220px] p-6 rounded-2xl bg-slate-900/90 border border-white/10 text-white flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-xs font-bold">
              {this.props.fallbackTitle || "Component Temporarily Unavailable"}
            </h4>
            <p className="text-[11px] text-slate-400">
              {this.props.fallbackMessage || "An error occurred while rendering this module."}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 text-xs font-bold hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
