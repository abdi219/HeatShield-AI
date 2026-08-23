"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Shield,
  X,
  Search,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

export function DocsShowcase() {
  const { activeTab, setActiveTab, mapStyle } = useAppStore();
  const [activeTabName, setActiveTabName] = useState<"mission" | "impact" | "methodology" | "faq">("mission");
  const [sliderPos, setSliderPos] = useState(50);

  // ── Use Cases Interactive Stage State ──────────────────────────
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState(0);

  // ── Interactive Formula Lab State ──────────────────────────────
  const [anomalyDelta, setAnomalyDelta] = useState(6.0); // °C
  const [albedoPenalty, setAlbedoPenalty] = useState(55); // %
  const [canopyDeficit, setCanopyDeficit] = useState(45); // %
  const [shadeCredit, setShadeCredit] = useState(20); // %

  // Calculate dynamic HRS score in real-time
  const calculatedHRS = Math.min(
    100,
    Math.max(
      1,
      Math.round(
        15 +
          anomalyDelta * 3.2 +
          albedoPenalty * 0.28 +
          canopyDeficit * 0.22 -
          shadeCredit * 0.35
      )
    )
  );

  const getHRSTier = (score: number) => {
    if (score <= 30) return { label: "LOW RISK", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/30" };
    if (score <= 60) return { label: "MODERATE RISK", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/30" };
    if (score <= 80) return { label: "HIGH RISK", color: "text-orange-400", bg: "bg-orange-500/20 border-orange-500/30" };
    return { label: "EXTREME HAZARD", color: "text-red-400", bg: "bg-red-500/20 border-red-500/30" };
  };

  const currentTier = getHRSTier(calculatedHRS);

  // ── Use Cases Data (Clean Typography, Zero SVGs) ───────────────
  const PERSONA_JOURNEYS = [
    {
      id: "pedestrians",
      label: "Everyday Walkers",
      badge: "Pedestrian Comfort",
      title: "Walk in cooling shade, not on boiling asphalt.",
      challenge: "Direct walking routes force people onto sun-baked asphalt that radiates 48°C heat, causing rapid dehydration and heat exhaustion.",
      solution: "HeatShield maps real tree canopies and building shadows along your path, cutting radiant heat exposure by up to 35% with almost zero detour.",
      highlights: [
        "Finds the lowest-heat walking & biking corridors",
        "Turn-by-turn shade alerts & safe walking windows",
        "Protects seniors, children, and daily commuters",
      ],
      stat: "-35% Heat Load",
      actionText: "Plan a Cool Route",
      actionTab: "routes" as const,
    },
    {
      id: "planners",
      label: "City Planners",
      badge: "Urban Resilience",
      title: "Test cooling solutions before spending city funds.",
      challenge: "Cities spend millions planting trees or repaving streets without knowing where heat will drop the most.",
      solution: "Our digital-twin simulator models tree canopy additions, cool reflective pavements, and solar pergolas with real physics before construction.",
      highlights: [
        "Simulates cooling radius & temperature drops (ΔT)",
        "Pinpoints neighborhoods with severe tree canopy deficits",
        "Generates data-backed ROI reports for municipal grants",
      ],
      stat: "-4.2°C Cooling Impact",
      actionText: "Open What-If Simulator",
      actionTab: "simulator" as const,
    },
    {
      id: "logistics",
      label: "Workforce & Logistics",
      badge: "Worker Safety",
      title: "Protect outdoor crews and temperature-sensitive goods.",
      challenge: "Field workers and delivery drivers face dangerous heat spikes that traditional airport forecasts fail to predict.",
      solution: "Monitor real-time street temperatures to enforce safe rest breaks and route perishable deliveries through cooler city sectors.",
      highlights: [
        "Street-level heat safety monitoring for outdoor crews",
        "Cool transit corridor routing for delivery cargo",
        "Instant AI advice on hydration and travel timing",
      ],
      stat: "Real-Time Safety Alerts",
      actionText: "Inspect Heat Telemetry",
      actionTab: "map" as const,
    },
  ];

  // ── Searchable FAQ State ───────────────────────────────────────
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<"all" | "data" | "routing" | "physics" | "privacy">("all");
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(0);

  const FAQ_ITEMS = [
    {
      id: 0,
      category: "data",
      question: "How does street-level heat differ from normal weather apps?",
      answer:
        "Normal weather apps pull numbers from airport stations miles away, giving one generic number for the entire city. HeatShield AI maps actual street temperatures at 30-meter precision—showing how dark roads bake in the sun while parks stay cool.",
    },
    {
      id: 1,
      category: "data",
      question: "Why is dark asphalt so much hotter than the air?",
      answer:
        "Dark pavement absorbs over 90% of direct sunlight and traps the heat. This makes the ground up to 15°C hotter than the air, turning sidewalks into radiant heat ovens.",
    },
    {
      id: 2,
      category: "routing",
      question: "How does the Cool Route Finder save 35% heat exposure?",
      answer:
        "Instead of just finding the shortest distance, our router calculates heat at every 25 meters. It steers you through tree-lined streets, park paths, and building shadows so you stay significantly cooler without adding much walking time.",
    },
    {
      id: 3,
      category: "physics",
      question: "How does the What-If Simulator estimate cooling?",
      answer:
        "It uses real urban microclimate formulas: (1) Tree leaves release moisture that cools surrounding air by up to 4.2°C; (2) Reflective pavements bounce sunlight back into space; (3) Shade pergolas block direct sun rays completely.",
    },
    {
      id: 4,
      category: "privacy",
      question: "How does the AI Assistant stay accurate without guessing?",
      answer:
        "The AI Assistant reads live measured temperatures and route stats directly from your active screen. It is strictly locked to live data and never makes up numbers.",
    },
    {
      id: 5,
      category: "privacy",
      question: "Is my personal location or chat history saved on remote servers?",
      answer:
        "Never. HeatShield AI is completely private. Your chat history, routes, and simulations are saved only in your own browser storage. Nothing is stored on remote database servers.",
    },
  ];

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCat = faqCategory === "all" || item.category === faqCategory;
    const matchesQuery =
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const isSatellite = mapStyle === "satellite";

  if (activeTab !== "docs") return null;

  const currentPersona = PERSONA_JOURNEYS[selectedPersonaIdx];

  return (
    <div className="fixed inset-0 z-[1150] overflow-hidden bg-black/80 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-all my-auto ${
          isSatellite
            ? "bg-[#0A0E17]/98 border-white/10 text-white"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        {/* ── 1. Clean Minimalist Header ─────────────────────────────── */}
        <div
          className={`px-5 py-3 border-b flex items-center justify-between gap-4 shrink-0 ${
            isSatellite ? "border-white/10 bg-white/5" : "border-slate-100 bg-slate-50/60"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm ${
                isSatellite ? "bg-white text-slate-950 font-black" : "bg-slate-900 text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight">HeatShield AI</h2>
              <p className={`text-[9px] font-mono ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                Street-Level Heat Resilience
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Navigation Tabs */}
            <div
              className={`p-1 rounded-xl flex items-center border text-[11px] sm:text-xs font-semibold overflow-x-auto ${
                isSatellite ? "bg-white/10 border-white/15" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTabName("mission")}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all shrink-0 ${
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
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all shrink-0 ${
                  activeTabName === "impact"
                    ? isSatellite
                      ? "bg-white text-slate-950 font-bold"
                      : "bg-white text-slate-900 shadow-sm font-bold"
                    : isSatellite
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Solutions
              </button>
              <button
                type="button"
                onClick={() => setActiveTabName("methodology")}
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all shrink-0 ${
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
                className={`px-2 sm:px-3 py-1 rounded-lg transition-all shrink-0 ${
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
              className={`p-1.5 rounded-lg border transition-all ${
                isSatellite
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/15"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Modal Body (Compact Viewport Scaling) ────────────────── */}
        <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[82vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW (Fits 100% On Screen)                    */}
          {/* ======================================================== */}
          {activeTabName === "mission" && (
            <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5 max-w-2xl">
                <h1 className="text-base sm:text-xl font-black tracking-tight leading-snug">
                  Standard weather tells you city averages. <br />
                  <span className={isSatellite ? "text-slate-200" : "text-slate-900"}>
                    HeatShield AI reveals street reality.
                  </span>
                </h1>
                <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  When airport weather says <strong>30°C</strong>, sun-baked asphalt bakes at <strong>48°C</strong> while shaded streets 50 meters away stay at <strong>27°C</strong>. HeatShield maps cooling corridors, tests green urban projects, and keeps you safe from extreme heat.
                </p>
              </div>

              {/* Interactive City Average vs Street Reality Split Card */}
              <div
                className={`p-3.5 sm:p-4 rounded-2xl border space-y-3 ${
                  isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-bold uppercase text-[10px] tracking-wider ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                    Interactive Street Heat Comparison
                  </span>
                  <span className={`font-mono text-[10px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                    Drag slider to compare
                  </span>
                </div>

                <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden border border-white/15 flex items-center">
                  {/* Left: Traditional Weather */}
                  <div
                    className="absolute inset-y-0 left-0 bg-slate-900 text-white p-3 flex flex-col justify-between overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-wider bg-white/15 px-1.5 py-0.5 rounded text-slate-200">
                        Airport Weather App
                      </span>
                      <p className="text-[11px] font-semibold mt-0.5">Single City Average</p>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono">29.0°C</span>
                      <span className="text-[10px] text-emerald-400 font-medium">"Safe & Mild"</span>
                    </div>
                  </div>

                  {/* Right: Street Reality */}
                  <div
                    className="absolute inset-y-0 right-0 bg-slate-950 text-white p-3 flex flex-col justify-between overflow-hidden text-right"
                    style={{ width: `${100 - sliderPos}%` }}
                  >
                    <div>
                      <span className="text-[8px] font-mono uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-white font-bold">
                        HeatShield Reality
                      </span>
                      <p className="text-[11px] font-semibold mt-0.5">30m Street Microclimate</p>
                    </div>

                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-[10px] text-slate-300">Asphalt Hotspot:</span>
                      <span className="text-2xl font-black font-mono text-white">46.5°C</span>
                    </div>
                  </div>

                  {/* Interactive Drag Handle */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-white text-slate-950 shadow-xl flex items-center justify-center text-[9px] font-black">
                      ↔
                    </div>
                  </div>
                </div>

                <input
                  type="range"
                  min="10"
                  max="90"
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-ew-resize accent-white"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>◀ General Weather Forecast</span>
                  <span>Real Ground-Level Heat ▶</span>
                </div>
              </div>

              {/* 3 Quick Launchers (Clean, Compact) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("map")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSatellite
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Heat Map Explorer</p>
                    <p className={`text-[10px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      View street thermal hotspots
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("routes")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSatellite
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Cool Route Finder</p>
                    <p className={`text-[10px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      -35% heat exposure paths
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("simulator")}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSatellite
                      ? "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-xs"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">What-If Simulator</p>
                    <p className={`text-[10px] ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      Test tree & pavement cooling
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: SOLUTIONS (NO SVGs, CLEAN TEXT TOGGLE)            */}
          {/* ======================================================== */}
          {activeTabName === "impact" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight">Tailored Solutions for Real Needs</h3>
                  <p className={`text-[11px] mt-0.5 ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    Select a profile to explore how HeatShield protects people, projects, and workforces.
                  </p>
                </div>

                {/* Clean Typography Segmented Toggle (Zero SVGs) */}
                <div className={`p-1 rounded-xl border flex items-center self-start sm:self-auto ${
                  isSatellite ? "bg-white/10 border-white/15" : "bg-slate-100 border-slate-200"
                }`}>
                  {PERSONA_JOURNEYS.map((p, idx) => {
                    const isSelected = selectedPersonaIdx === idx;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPersonaIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? isSatellite
                              ? "bg-white text-slate-950 font-bold shadow-xs"
                              : "bg-white text-slate-900 font-bold shadow-xs border border-slate-200"
                            : isSatellite
                            ? "text-slate-300 hover:text-white"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Interactive Stage for Active Profile */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 transition-all ${
                isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                {/* Headline & Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      isSatellite ? "bg-white/10 text-white border-white/20" : "bg-white text-slate-800 border-slate-300"
                    }`}>
                      {currentPersona.badge}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold tracking-tight pt-0.5">
                      {currentPersona.title}
                    </h4>
                  </div>

                  <div className="px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
                    {currentPersona.stat}
                  </div>
                </div>

                {/* Problem vs HeatShield Solution Flow (Zero SVG Icons) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* The Problem */}
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    isSatellite ? "bg-black/40 border-white/10" : "bg-white border-slate-200"
                  }`}>
                    <span className="text-[10px] font-mono uppercase font-bold text-red-400 block">
                      THE EVERYDAY PROBLEM
                    </span>
                    <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                      {currentPersona.challenge}
                    </p>
                  </div>

                  {/* The HeatShield Fix */}
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    isSatellite ? "bg-black/40 border-white/10" : "bg-white border-slate-200"
                  }`}>
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">
                      THE HEATSHIELD SOLUTION
                    </span>
                    <p className={`text-xs leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                      {currentPersona.solution}
                    </p>
                  </div>
                </div>

                {/* Key Benefits List (Minimalist Typography Bullets) & Action Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 border-t border-white/10">
                  <ul className="space-y-1 text-xs">
                    {currentPersona.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span className={isSatellite ? "text-slate-200" : "text-slate-700"}>{h}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setActiveTab(currentPersona.actionTab)}
                    className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 shadow-md transition-all ${
                      isSatellite
                        ? "bg-white text-slate-950 hover:bg-slate-100 font-extrabold"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    <span>{currentPersona.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: METHODOLOGY (INTERACTIVE FORMULA LAB)             */}
          {/* ======================================================== */}
          {activeTabName === "methodology" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight">How Heat Risk Is Calculated</h3>
                <p className={`text-[11px] mt-0.5 ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                  Move the sliders to see how pavement heat, dark roads, and tree shade determine your Heat Risk Score.
                </p>
              </div>

              {/* ── Interactive Formula Laboratory ──────────────────────── */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isSatellite ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${isSatellite ? "text-slate-400" : "text-slate-500"}`}>
                      Live Formula Playground
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold">Heat Risk Score (HRS) Live Calculator</h4>
                  </div>

                  {/* Calculated Output Badge */}
                  <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${currentTier.bg}`}>
                    <span className="text-xs font-mono font-black text-white">HRS: {calculatedHRS}/100</span>
                    <span className={`text-[9px] font-mono font-extrabold ${currentTier.color}`}>
                      [{currentTier.label}]
                    </span>
                  </div>
                </div>

                {/* Simple Intuitive Formula Explanation */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 font-mono text-[10px] text-white">
                  HRS = Base Temp + Pavement Heat Surge + Dark Road Penalty + Missing Trees - Shade Shield
                </div>

                {/* Live Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  {/* Slider 1: Surface Anomaly */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={isSatellite ? "text-slate-300" : "text-slate-700"}>Pavement Heat Surge (ΔT)</span>
                      <span className="font-mono font-bold">+{anomalyDelta.toFixed(1)}°C</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={anomalyDelta}
                      onChange={(e) => setAnomalyDelta(Number(e.target.value))}
                      className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Slider 2: Asphalt Albedo Penalty */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={isSatellite ? "text-slate-300" : "text-slate-700"}>Dark Road Absorption</span>
                      <span className="font-mono font-bold">+{albedoPenalty}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={albedoPenalty}
                      onChange={(e) => setAlbedoPenalty(Number(e.target.value))}
                      className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Slider 3: Tree Canopy Deficit */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={isSatellite ? "text-slate-300" : "text-slate-700"}>Missing Tree Cover</span>
                      <span className="font-mono font-bold">+{canopyDeficit}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={canopyDeficit}
                      onChange={(e) => setCanopyDeficit(Number(e.target.value))}
                      className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  {/* Slider 4: Shade Credit */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className={isSatellite ? "text-slate-300" : "text-slate-700"}>Shade Shield Bonus</span>
                      <span className="font-mono font-bold">-{shadeCredit}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={shadeCredit}
                      onChange={(e) => setShadeCredit(Number(e.target.value))}
                      className="w-full h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              </div>

              {/* Natural Cooling Physics Explanations (Zero SVG Icons) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className={`p-3 rounded-xl border space-y-1 ${isSatellite ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                  <h5 className="text-xs font-bold">Tree Canopy Evaporation</h5>
                  <p className={`text-[11px] leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    Trees naturally release moisture into the air while blocking sun rays, cooling surrounding streets by up to -4.2°C.
                  </p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${isSatellite ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}>
                  <h5 className="text-xs font-bold">Reflective Cool Pavements</h5>
                  <p className={`text-[11px] leading-relaxed ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    Light-colored pavement coatings bounce solar rays back into the atmosphere instead of trapping heat inside the asphalt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: FREQUENTLY ASKED QUESTIONS                       */}
          {/* ======================================================== */}
          {activeTabName === "faq" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm sm:text-base font-bold tracking-tight">Frequently Asked Questions</h3>
                  <p className={`text-[11px] mt-0.5 ${isSatellite ? "text-slate-300" : "text-slate-600"}`}>
                    Common questions about our routing, cooling models, and privacy.
                  </p>
                </div>

                {/* Search Bar Input */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    placeholder="Search questions (e.g. routing)..."
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1 text-xs rounded-xl border focus:outline-none transition-all ${
                      isSatellite
                        ? "bg-white/10 border-white/15 text-white placeholder-white/40 focus:border-white/30"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400"
                    }`}
                  />
                  {faqSearch && (
                    <button
                      type="button"
                      onClick={() => setFaqSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                {[
                  { id: "all", label: "All Questions" },
                  { id: "data", label: "Street Heat Data" },
                  { id: "routing", label: "Cool Routes" },
                  { id: "physics", label: "Cooling Physics" },
                  { id: "privacy", label: "AI & Privacy" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFaqCategory(cat.id as any)}
                    className={`px-2.5 py-0.5 rounded-lg transition-all text-[11px] ${
                      faqCategory === cat.id
                        ? isSatellite
                          ? "bg-white text-slate-950 font-bold shadow-xs"
                          : "bg-slate-900 text-white font-bold"
                        : isSatellite
                        ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Accordion FAQ List */}
              <div className="space-y-2">
                {filteredFaqs.length === 0 ? (
                  <div className="p-6 text-center text-xs opacity-60">
                    No matching questions found for "{faqSearch}".
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isSatellite
                            ? isExpanded
                              ? "bg-white/10 border-white/20"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                            : isExpanded
                            ? "bg-slate-50 border-slate-300"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                          className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs font-bold"
                        >
                          <span>{faq.question}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className={`px-3.5 pb-3.5 text-xs leading-relaxed border-t pt-2.5 ${
                            isSatellite ? "text-slate-300 border-white/10" : "text-slate-600 border-slate-200"
                          }`}>
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
