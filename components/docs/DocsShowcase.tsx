"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Shield,
  X,
  Compass,
  Navigation,
  Sliders,
  User,
  Building,
  Activity,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function DocsShowcase() {
  const { activeTab, setActiveTab, mapStyle } = useAppStore();
  const [activeTabName, setActiveTabName] = useState<"mission" | "impact" | "methodology" | "faq">("mission");
  const [sliderPos, setSliderPos] = useState(50);

  const isSatellite = mapStyle === "satellite";

  if (activeTab !== "docs") return null;

  return (
    <div className="fixed inset-0 z-[1150] overflow-hidden bg-black/80 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-all my-auto ${
          isSatellite
            ? "bg-[#0A0E17]/98 border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* ── 1. Clean Minimalist Header ─────────────────────────────── */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isSatellite ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/60"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm ${
                isSatellite ? "bg-white text-slate-950 font-black" : "bg-slate-900 text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">HeatShield AI</h2>
              <p className={`text-[10px] font-mono ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                Microclimate Spatial Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Elegant Segmented Tabs */}
            <div
              className={`p-1 rounded-xl flex items-center border text-xs font-semibold ${
                isSatellite ? "bg-white/10 border-white/15" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTabName("mission")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTabName === "mission"
                    ? isSatellite
                      ? "bg-white text-slate-950 font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : isSatellite
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTabName("impact")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTabName === "impact"
                    ? isSatellite
                      ? "bg-white text-slate-950 font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : isSatellite
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Use Cases
              </button>
              <button
                type="button"
                onClick={() => setActiveTabName("methodology")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTabName === "methodology"
                    ? isSatellite
                      ? "bg-white text-slate-950 font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : isSatellite
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Methodology
              </button>
              <button
                type="button"
                onClick={() => setActiveTabName("faq")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTabName === "faq"
                    ? isSatellite
                      ? "bg-white text-slate-950 font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : isSatellite
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                FAQ
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveTab("map")}
              title="Return to Map"
              className={`p-2 rounded-xl border transition-all ${
                isSatellite
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/15"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Modal Body (Spacious & Clean) ───────────────────────── */}
        <div className="p-6 sm:p-8 md:p-10 space-y-8 overflow-y-auto max-h-[85vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW & INTERACTIVE SPLIT SLIDER               */}
          {/* ======================================================== */}
          {activeTabName === "mission" && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header Headline */}
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight">
                  Standard weather tells you city averages. <br />
                  <span className={isSatellite ? "text-slate-200" : "text-slate-900"}>
                    HeatShield AI reveals street reality.
                  </span>
                </h1>
                <p className={`text-xs sm:text-sm leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  A single regional forecast of <strong>32°C</strong> obscures the fact that dark asphalt absorbs solar radiation up to <strong>48°C</strong>, while a shaded corridor 50 meters away stays at <strong>27°C</strong>.
                </p>
              </div>

              {/* Interactive City Average vs Street Reality Split Card */}
              <div
                className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
                  isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-bold uppercase tracking-wider ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                    Interactive Microclimate Comparison
                  </span>
                  <span className={`font-mono text-[11px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                    Drag slider to compare
                  </span>
                </div>

                {/* The Split Screen Container */}
                <div className="relative w-full h-32 sm:h-36 rounded-xl overflow-hidden border border-white/15 flex items-center">
                  {/* Left Side: Standard Regional Forecast */}
                  <div
                    className="absolute inset-y-0 left-0 bg-slate-900 text-white p-4 flex flex-col justify-between overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded text-slate-200">
                        Regional Weather App
                      </span>
                      <p className="text-xs font-semibold mt-1">Airport Weather Station</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black font-mono">29.0°C</span>
                      <span className="text-[11px] text-emerald-400 font-medium">"Safe & Mild"</span>
                    </div>
                  </div>

                  {/* Right Side: Hyper-Local Street Reality */}
                  <div
                    className="absolute inset-y-0 right-0 bg-slate-950 text-white p-4 flex flex-col justify-between overflow-hidden text-right"
                    style={{ width: `${100 - sliderPos}%` }}
                  >
                    <div>
                      <span className="text-[9px] font-mono uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white font-bold">
                        HeatShield AI
                      </span>
                      <p className="text-xs font-semibold mt-1">30m Street Microclimate</p>
                    </div>

                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-[11px] text-slate-300">Asphalt Hotspot:</span>
                      <span className="text-3xl font-black font-mono text-white">46.5°C</span>
                    </div>
                  </div>

                  {/* Interactive Drag Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-white text-slate-950 shadow-xl flex items-center justify-center text-[10px] font-black">
                      ↔
                    </div>
                  </div>
                </div>

                {/* Range Slider Control */}
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-ew-resize accent-white"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>◀ Regional Weather Illusion</span>
                  <span>Hyper-Local Street Reality ▶</span>
                </div>
              </div>

              {/* 3 Action Launchers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("map")}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSatellite
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Heat Map Explorer</p>
                    <p className={`text-[11px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      Inspect 30m thermal telemetry
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("routes")}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSatellite
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold">Cool Route Finder</p>
                    <p className={`text-[11px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      -35% heat exposure navigation
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("simulator")}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSatellite
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold">What-If Simulator</p>
                    <p className={`text-[11px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      Digital-twin mitigation testing
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-70" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: USE CASES / VALUE PROPOSITIONS                    */}
          {/* ======================================================== */}
          {activeTabName === "impact" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Built for Pedestrians, Planners & Logistics</h3>
                <p className={`text-xs mt-1 ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  How different stakeholders leverage street-level microclimate data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pedestrians */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isSatellite ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSatellite ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold">Pedestrians & Commuters</h4>
                    <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                      Navigate shaded corridors, avoid radiant heat spikes, and stay protected during peak sun hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("routes")}
                    className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSatellite
                        ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200"
                    }`}
                  >
                    Plan Cool Route
                  </button>
                </div>

                {/* Urban Planners */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isSatellite ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSatellite ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"}`}>
                      <Building className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold">Urban Planners & Cities</h4>
                    <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                      Simulate tree canopy additions and reflective pavements to quantify temperature drops before construction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("simulator")}
                    className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSatellite
                        ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200"
                    }`}
                  >
                    Open Simulator
                  </button>
                </div>

                {/* Logistics */}
                <div
                  className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                    isSatellite ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSatellite ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900"}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold">Workforce & Logistics</h4>
                    <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                      Monitor outdoor worker thermal exposure thresholds and route heat-sensitive cargo through cooler corridors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("map")}
                    className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSatellite
                        ? "bg-white/10 hover:bg-white/20 text-white border-white/20"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-900 border-slate-200"
                    }`}
                  >
                    Inspect Telemetry
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SCIENTIFIC METHODOLOGY                            */}
          {/* ======================================================== */}
          {activeTabName === "methodology" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Scientific Formulation & Physics Models</h3>
                <p className={`text-xs mt-1 ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  How HeatShield AI calculates Heat Risk Scores and simulated cooling deltas.
                </p>
              </div>

              {/* Formula 1: HRS */}
              <div className={`p-5 rounded-2xl border space-y-2.5 ${isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <h4 className="text-sm font-bold">1. Heat Risk Score (HRS) Formulation</h4>
                <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  The Heat Risk Score (1–100) combines surface thermal anomaly, asphalt albedo penalty, canopy deficit, and shade credits:
                </p>
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white">
                  HRS = BaseRisk(T_amb) + 0.45·ΔT + 0.25·AlbedoPenalty + 0.20·CanopyDeficit - 0.35·ShadeCredit
                </div>
              </div>

              {/* Formula 2: Physics */}
              <div className={`p-5 rounded-2xl border space-y-2.5 ${isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <h4 className="text-sm font-bold">2. Digital-Twin Cooling Physics</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Tree Canopy Evapotranspiration:</strong> ΔT_canopy = -0.065 × CanopyAdded% (up to -4.2°C cooling).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Cool Pavement Albedo:</strong> ΔT_albedo = -0.085 × ΔAlbedo% via shortwave solar reflection.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">•</span>
                    <span><strong>Solar Shading Pergolas:</strong> ΔT_shade = -0.040 × ShadeAdded% blocking direct insolation.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: FREQUENTLY ASKED QUESTIONS                       */}
          {/* ======================================================== */}
          {activeTabName === "faq" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Frequently Asked Questions</h3>
                <p className={`text-xs mt-1 ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  Answers to common questions about data resolution and routing models.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className={`p-4 rounded-xl border ${isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h4 className="text-xs font-bold">How does street-level telemetry differ from standard weather?</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    Standard weather apps provide a generalized airport forecast. HeatShield AI delivers 30-meter resolution street-level thermal measurements that capture radiant asphalt heat and canopy shade variations.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h4 className="text-xs font-bold">How does the Cool Route Finder calculate heat savings?</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    Our routing engine samples thermal exposure along waypoints at 25-meter intervals, calculating cumulative solar load and optimizing a path with up to 40% less thermal stress for pedestrians.
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                  <h4 className="text-xs font-bold">Which pilot cities are actively supported?</h4>
                  <p className={`text-xs mt-1 leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    HeatShield AI actively supports 5 metropolitan benchmark zones: Miami (FL), Austin (TX), Phoenix (AZ), Las Vegas (NV), and Dubai (UAE).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
