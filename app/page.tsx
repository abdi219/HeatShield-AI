"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/lib/store";
import { CITY_PRESETS } from "@/lib/constants";
import { TopNav } from "@/components/hud/TopNav";
import { RouteFinder } from "@/components/routes/RouteFinder";
import { WhatIfSimulator } from "@/components/simulator/WhatIfSimulator";
import { Layers, Flame, Trees, ChevronRight, Sparkles, MapPin } from "lucide-react";

const MapCanvas = dynamic(
  () => import("@/components/map/MapCanvas").then((mod) => mod.MapCanvas),
  { ssr: false }
);

const CITY_BENCHMARKS: Record<string, { hotspot: [number, number]; shaded: [number, number] }> = {
  miami:     { hotspot: [25.7663, -80.1915], shaded: [25.7753, -80.1873] },
  phoenix:   { hotspot: [33.4484, -112.0740], shaded: [33.4533, -112.0742] },
  austin:    { hotspot: [30.2672, -97.7431], shaded: [30.2625, -97.7430] },
  las_vegas: { hotspot: [36.1699, -115.1398], shaded: [36.1633, -115.1558] },
};

export default function HomePage() {
  const {
    activeTab,
    activeHeatLayer,
    setActiveHeatLayer,
    selectedLocation,
    setSelectedLocation,
    selectedCity,
    setSelectedCity,
    mapStyle,
    toastAlert,
    setToastAlert,
    setIsAIAssistantOpen,
    temperatureUnit,
    viewport,
    setViewport,
  } = useAppStore();

  const [isLoadingInspection, setIsLoadingInspection] = useState(false);
  const isSatellite = mapStyle === "satellite";
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      setIsLoadingInspection(true);
      const [heatRes, geoRes] = await Promise.all([
        fetch(`/api/heat/location?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`),
        fetch(`/api/geocode?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`),
      ]);
      if (!heatRes.ok) throw new Error("Failed to fetch location heat profile");
      const heatData = await heatRes.json();

      let streetName = `Sector (${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W)`;
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.address) streetName = geoData.address;
      }
      setSelectedLocation({ lat, lng, address: streetName, data: heatData.assessment });
    } catch (error) {
      console.error("Error inspecting location:", error);
    } finally {
      setIsLoadingInspection(false);
    }
  };

  // Auto-inspect hotspot on initial mount only once
  const hasAutoInspectedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoInspectedRef.current) {
      hasAutoInspectedRef.current = true;
      handleMapClick(viewport.lat, viewport.lng);
    }
  }, []);

  const handleBenchmarkClick = (type: "hotspot" | "shaded") => {
    let targetCoords: [number, number] | null = null;
    if (Math.abs(viewport.lat - 25.76) < 0.5) targetCoords = CITY_BENCHMARKS.miami[type];
    else if (Math.abs(viewport.lat - 33.44) < 0.5) targetCoords = CITY_BENCHMARKS.phoenix[type];
    else if (Math.abs(viewport.lat - 30.26) < 0.5) targetCoords = CITY_BENCHMARKS.austin[type];
    else if (Math.abs(viewport.lat - 36.16) < 0.5) targetCoords = CITY_BENCHMARKS.las_vegas[type];
    else targetCoords = type === "hotspot" ? [viewport.lat + 0.002, viewport.lng - 0.002] : [viewport.lat - 0.003, viewport.lng + 0.003];
    if (targetCoords) {
      setViewport({ lat: targetCoords[0], lng: targetCoords[1], zoom: 15.5 });
      handleMapClick(targetCoords[0], targetCoords[1]);
    }
  };

  const handlePilotCityJump = (cityName: string) => {
    setSelectedCity(cityName);
    setToastAlert(null);
    const target = CITY_PRESETS.find((c) => c.name === cityName);
    if (target) {
      setViewport({ lat: target.lat, lng: target.lng, zoom: target.zoom });
      handleMapClick(target.lat, target.lng);
    }
  };

  const formatTemp = (tempC: number) =>
    temperatureUnit === "fahrenheit" ? (tempC * 1.8 + 32).toFixed(1) : tempC.toFixed(1);
  const formatDelta = (deltaC: number) =>
    temperatureUnit === "fahrenheit" ? (deltaC * 1.8).toFixed(1) : deltaC.toFixed(1);

  // Shorthand class combos
  const glassCard    = isSatellite ? "sat-glass text-white"  : "street-card text-slate-900";
  const glassSubcard = isSatellite ? "sat-subglass"         : "street-subcard";

  const textPrimary   = isSatellite ? "text-white"    : "text-slate-900";
  const textSecondary = isSatellite ? "text-white/80" : "text-slate-500";
  const textMuted     = isSatellite ? "text-white/60" : "text-slate-400";
  const border        = isSatellite ? "border-white/25" : "border-slate-200";

  return (
    <main className={`relative w-screen h-screen overflow-hidden flex flex-col ${
      isSatellite ? "bg-[#3f413c]" : "bg-white"
    }`}>
      {/*
        ── Liquid Glass SVG Chromatic Aberration Dispersion Filter ──
      */}
      <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden="true">
        <defs>
          <filter id="glass-filter-_r_b_" colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
              href="data:image/png;base64,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"
            />
            <feDisplacementMap in="SourceGraphic" in2="map" id="redchannel" result="dispRed" scale="-20" xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
            <feDisplacementMap in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen" scale="-24" xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
            <feDisplacementMap in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" scale="-28" xChannelSelector="R" yChannelSelector="G" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur in="output" stdDeviation="3" />
          </filter>
        </defs>
      </svg>

      <TopNav />

      <div className="absolute inset-0 w-full h-full">
        <MapCanvas onLocationSelect={handleMapClick} />

        {/* ── Pilot Zone Toast Banner ──────────────────────────────────────── */}
        {toastAlert && (
          <div className={`absolute top-20 left-1/2 -translate-x-1/2 z-[1050] max-w-xl w-[92%] sm:w-auto
            px-5 py-3 rounded-2xl flex flex-col sm:flex-row items-center gap-3
            animate-in fade-in slide-in-from-top-3 duration-200 ${glassCard}`}
          >
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
              isSatellite ? "bg-white/20 text-white border-white/40" : "bg-slate-100 text-slate-700 border-slate-200"
            }`}>
              Pilot Zone Notice
            </span>
            <p className={`text-xs font-semibold ${textPrimary}`}>
              Live microclimate thermal data is active in 4 pilot cities:
            </p>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {CITY_PRESETS.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handlePilotCityJump(city.name)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    isSatellite
                      ? "bg-white/20 hover:bg-white hover:text-slate-950 text-white border-white/40"
                      : "bg-white hover:bg-slate-900 hover:text-white text-slate-800 border-slate-200"
                  }`}
                >
                  {city.name}
                </button>
              ))}
              <button
                onClick={() => setToastAlert(null)}
                className={`w-5 h-5 ml-1 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSatellite ? "text-white hover:bg-white/20" : "text-slate-400 hover:bg-slate-100"
                }`}
              >✕</button>
            </div>
          </div>
        )}

        {/* ── Left Dock: Thermal Layers / Route Finder / What-If Simulator ──── */}
        <div className="absolute top-20 left-5 z-[1000]">
          {activeTab === "routes" ? (
            <RouteFinder />
          ) : activeTab === "simulator" ? (
            <WhatIfSimulator />
          ) : (
            <div className={`w-64 p-4 rounded-2xl space-y-3 shadow-xl ${glassCard}`}>
              {/* Header */}
              <div className={`flex items-center justify-between pb-2 border-b ${border}`}>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${textPrimary}`}>
                  <Layers className="w-3.5 h-3.5" />
                  Thermal Layers
                </span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
                  isSatellite ? "bg-white/20 text-white border-white/40" : "bg-slate-100 text-slate-700 border-slate-200"
                }`}>
                  MICROCLIMATE AI
                </span>
              </div>

              {/* Layer Buttons */}
              <div className="space-y-1">
                {(["surface_temp", "heat_risk", "canopy_deficit"] as const).map((layer) => {
                  const labels: Record<string, [string, string]> = {
                    surface_temp:    ["Surface Temperature", unitSymbol],
                    heat_risk:       ["Heat Risk Score",     "0–100"],
                    canopy_deficit:  ["Tree Canopy Deficit", "%"],
                  };
                  const active = activeHeatLayer === layer;
                  return (
                    <button
                      key={layer}
                      onClick={() => setActiveHeatLayer(layer)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? isSatellite ? "bg-white text-slate-950 shadow-md font-extrabold" : "bg-slate-900 text-white shadow-sm"
                          : isSatellite ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{labels[layer][0]}</span>
                      <span className="font-mono text-[10px] opacity-80">{labels[layer][1]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Benchmarks */}
              <div className={`pt-2.5 border-t space-y-2 ${border}`}>
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textMuted}`}>
                  Quick Benchmarks
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleBenchmarkClick("hotspot")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      isSatellite
                        ? "bg-white/20 hover:bg-white hover:text-slate-950 text-white border-white/35"
                        : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    Hotspot
                  </button>
                  <button
                    onClick={() => handleBenchmarkClick("shaded")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      isSatellite
                        ? "bg-white/20 hover:bg-white hover:text-slate-950 text-white border-white/35"
                        : "bg-white hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <Trees className="w-3.5 h-3.5 text-emerald-500" />
                    Shaded
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Street-Level Telemetry Card ──────────────────────────────────────
            Positioned cleanly below top-right toggles with explicit top-[64px]
        ────────────────────────────────────────────────────────────────────── */}
        {selectedLocation && selectedLocation.data && (
          <div
            className={`absolute top-[132px] right-5 z-[1000] rounded-2xl overflow-hidden shadow-2xl ${glassCard}`}
            style={{ width: "330px", maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}
          >
            {/* Header */}
            <div className={`px-4 pt-3.5 pb-2.5 border-b ${border}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <MapPin className={`w-3 h-3 ${textSecondary}`} />
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${textSecondary}`}>
                      Street-Level Telemetry
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold leading-tight ${textPrimary}`}>
                    {selectedLocation.address}
                  </h4>
                  <span className={`text-[10px] font-mono mt-0.5 block ${textSecondary}`}>
                    {selectedLocation.lat.toFixed(4)}°N, {Math.abs(selectedLocation.lng).toFixed(4)}°W
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ml-2 flex-shrink-0 ${
                    isSatellite ? "text-white hover:bg-white/20" : "text-slate-400 hover:bg-slate-100"
                  }`}
                >✕</button>
              </div>
            </div>

            <div className="px-4 py-3 space-y-2.5">
              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Ground Temp */}
                <div className={`p-2.5 rounded-xl ${glassSubcard}`}>
                  <div className={`text-[10px] font-semibold mb-0.5 ${textSecondary}`}>Ground Temp</div>
                  <div className={`text-xl font-mono font-extrabold leading-none ${textPrimary}`}>
                    {formatTemp(selectedLocation.data.surfaceTemp)}{unitSymbol}
                  </div>
                  <div className={`text-[10px] font-mono mt-1 ${textSecondary}`}>
                    +{formatDelta(selectedLocation.data.deltaAnomaly)}{unitSymbol} vs ambient
                  </div>
                </div>

                {/* Heat Risk Score */}
                <div className={`p-2.5 rounded-xl ${glassSubcard}`}>
                  <div className={`text-[10px] font-semibold mb-0.5 ${textSecondary}`}>Heat Risk Score</div>
                  <div className={`text-xl font-mono font-extrabold leading-none ${textPrimary}`}>
                    {selectedLocation.data.score}
                    <span className={`text-xs font-normal ${textMuted}`}>/100</span>
                  </div>
                  <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    selectedLocation.data.score > 80 ? "bg-red-500 text-white"
                    : selectedLocation.data.score > 50 ? "bg-amber-500 text-white"
                    : "bg-sky-500 text-white"
                  }`}>
                    {selectedLocation.data.level}
                  </span>
                </div>
              </div>

              {/* Contributing Factors */}
              <div>
                <div className={`text-[10px] font-bold mb-1.5 ${textPrimary}`}>Contributing Urban Factors</div>
                <div className={`p-2.5 rounded-xl space-y-2 ${glassSubcard}`}>
                  {/* Albedo */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-medium ${textSecondary}`}>Asphalt Albedo Penalty</span>
                      <span className={`text-[10px] font-bold font-mono ${textPrimary}`}>
                        +{selectedLocation.data.contributingFactors.surfaceAlbedoPenalty}%
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isSatellite ? "bg-white/20" : "bg-slate-200"}`}>
                      <div
                        className={`h-full rounded-full ${isSatellite ? "bg-white" : "bg-slate-900"}`}
                        style={{ width: `${selectedLocation.data.contributingFactors.surfaceAlbedoPenalty}%`, transition: "width 0.5s" }}
                      />
                    </div>
                  </div>
                  {/* Canopy */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[10px] font-medium ${textSecondary}`}>Tree Canopy Deficit</span>
                      <span className={`text-[10px] font-bold font-mono ${textPrimary}`}>
                        +{selectedLocation.data.contributingFactors.vegetationDeficitPenalty}%
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isSatellite ? "bg-white/20" : "bg-slate-200"}`}>
                      <div
                        className={`h-full rounded-full ${isSatellite ? "bg-white" : "bg-slate-900"}`}
                        style={{ width: `${selectedLocation.data.contributingFactors.vegetationDeficitPenalty}%`, transition: "width 0.5s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className={`p-2.5 rounded-xl text-[10px] leading-relaxed ${
                isSatellite
                  ? "bg-white/15 border border-white/30 text-white"
                  : "bg-sky-50 border border-sky-200 text-sky-900"
              }`}>
                <span className="font-bold block mb-0.5">Actionable Insight</span>
                {selectedLocation.data.score > 70
                  ? "Extreme asphalt heat absorption. Prioritize high-albedo cool pavement coating and shade canopies."
                  : selectedLocation.data.score > 40
                  ? "Moderate thermal exposure. Urban tree canopy expansion recommended to reduce radiant heat."
                  : "Corridor benefits from microclimate cooling sanctuary and dense vegetation coverage."}
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                <button
                  onClick={() => setIsAIAssistantOpen(true)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    isSatellite
                      ? "bg-white text-slate-950 hover:bg-slate-100 font-extrabold"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Consult AI Heat Assistant
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Thermal Scale Legend (Bottom Center) ───────────────────────── */}
        <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] hidden md:flex
          items-center gap-4 px-5 py-2.5 rounded-full shadow-lg ${glassCard}`}
        >
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${textMuted}`}>
            {activeHeatLayer === "heat_risk"
              ? "Heat Risk Scale (HRS)"
              : activeHeatLayer === "canopy_deficit"
              ? "Canopy Deficit Scale"
              : "Thermal Heat Scale"}
          </span>
          <div className="flex items-center gap-3.5">
            {activeHeatLayer === "heat_risk" ? (
              [
                { color: "#2B82C9", label: "0–30 (Low)" },
                { color: "#2CA099", label: "30–50 (Mod)" },
                { color: "#E87722", label: "50–70 (High)" },
                { color: "#D9381E", label: "70–85 (V.High)" },
                { color: "#6B2D5C", label: "85–100 (Extreme)" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className={`text-[11px] font-mono font-bold ${textPrimary}`}>{label}</span>
                </div>
              ))
            ) : activeHeatLayer === "canopy_deficit" ? (
              [
                { color: "#2CA099", label: "0–20% (Dense)" },
                { color: "#2B82C9", label: "20–40% (Mod)" },
                { color: "#E87722", label: "40–70% (Deficit)" },
                { color: "#D9381E", label: "70–100% (Severe)" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className={`text-[11px] font-mono font-bold ${textPrimary}`}>{label}</span>
                </div>
              ))
            ) : (
              [
                { color: "#2B82C9", tempC: 22 },
                { color: "#2CA099", tempC: 28 },
                { color: "#E87722", tempC: 33 },
                { color: "#D9381E", tempC: 38 },
                { color: "#6B2D5C", tempC: 43, plus: true },
              ].map(({ color, tempC, plus }) => (
                <div key={tempC} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className={`text-[11px] font-mono font-bold ${textPrimary}`}>
                    {formatTemp(tempC)}{unitSymbol}{plus ? "+" : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
