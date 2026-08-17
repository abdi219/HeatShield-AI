"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TopNav } from "@/components/hud/TopNav";
import { useAppStore } from "@/lib/store";
import { THERMAL_COLOR_RAMP, getHeatRiskBadge } from "@/lib/constants";
import { 
  Layers, 
  ArrowRight,
  Info,
  X
} from "lucide-react";

// Dynamic import for Mapbox GL JS canvas (disables SSR for WebGL safety)
const MapCanvas = dynamic(
  () => import("@/components/map/MapCanvas").then((mod) => mod.MapCanvas),
  { ssr: false }
);

export default function HomePage() {
  const {
    activeHeatLayer,
    setActiveHeatLayer,
    selectedLocation,
    setSelectedLocation,
    setIsAIAssistantOpen,
    temperatureUnit,
  } = useAppStore();

  const handleMapClick = (lat: number, lng: number) => {
    // Generate deterministic microclimate calculation based on exact geographic coordinates
    const baseTemp = 36.8 + (Math.sin(lat * 100) * 4.2);
    const ambientTemp = 33.0;
    const hrs = Math.min(95, Math.max(20, Math.round((baseTemp - 20) * 3.5)));
    const badge = getHeatRiskBadge(hrs);

    setSelectedLocation({
      lat,
      lng,
      address: `Coordinate (${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W)`,
      data: {
        score: hrs,
        level: hrs > 80 ? 'extreme' : hrs > 60 ? 'high' : hrs > 30 ? 'moderate' : 'low',
        surfaceTemp: Number(baseTemp.toFixed(1)),
        ambientTemp: ambientTemp,
        deltaAnomaly: Number((baseTemp - ambientTemp).toFixed(1)),
        contributingFactors: {
          surfaceAlbedoPenalty: 38,
          vegetationDeficitPenalty: 44,
          solarExposurePenalty: 28,
          shadeCredit: 10,
        },
        recommendations: [
          "Impervious pavement heat accumulation observed.",
          "Estimated 3.2°C cooling potential with canopy planting.",
          "Shaded route alternative available via secondary corridor.",
        ]
      }
    });
  };

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === 'fahrenheit') {
      return (tempC * 1.8 + 32).toFixed(1);
    }
    return tempC.toFixed(1);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-canvas-base flex flex-col">
      {/* Top Architectural Navigation Bar */}
      <TopNav />

      {/* Main Map Viewport */}
      <div className="relative flex-1 w-full h-full">
        <MapCanvas onLocationSelect={handleMapClick} />

        {/* Layer Selector Dock (Top Left) */}
        <div className="absolute top-4 left-5 z-20 w-60 p-3 rounded-lg panel-white space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle text-xs font-semibold text-ink-primary">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-700" />
              Thermal Layers
            </span>
            <span className="text-[10px] font-mono text-ink-tertiary">25M GRID</span>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveHeatLayer("surface_temp")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                activeHeatLayer === "surface_temp"
                  ? "bg-slate-900 text-white"
                  : "text-ink-secondary hover:bg-slate-50 hover:text-ink-primary"
              }`}
            >
              <span>Surface Temperature</span>
              <span className="font-mono text-[10px] opacity-80">°{temperatureUnit === 'celsius' ? 'C' : 'F'}</span>
            </button>

            <button
              onClick={() => setActiveHeatLayer("heat_risk")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                activeHeatLayer === "heat_risk"
                  ? "bg-slate-900 text-white"
                  : "text-ink-secondary hover:bg-slate-50 hover:text-ink-primary"
              }`}
            >
              <span>Heat Risk Score</span>
              <span className="font-mono text-[10px] opacity-80">0–100</span>
            </button>

            <button
              onClick={() => setActiveHeatLayer("canopy_deficit")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                activeHeatLayer === "canopy_deficit"
                  ? "bg-slate-900 text-white"
                  : "text-ink-secondary hover:bg-slate-50 hover:text-ink-primary"
              }`}
            >
              <span>Tree Canopy Deficit</span>
              <span className="font-mono text-[10px] opacity-80">%</span>
            </button>
          </div>
        </div>

        {/* Location Telemetry Inspector Card (Top Right) */}
        {selectedLocation && selectedLocation.data && (
          <div className="absolute top-4 right-5 z-20 w-80 p-4 rounded-lg panel-white-elevated space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <div>
                <span className="text-[10px] font-mono font-medium text-ink-tertiary uppercase tracking-wider">
                  Location Telemetry
                </span>
                <h4 className="text-xs font-semibold text-ink-primary truncate mt-0.5">
                  {selectedLocation.address}
                </h4>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="w-6 h-6 rounded hover:bg-slate-100 text-ink-tertiary hover:text-ink-primary flex items-center justify-center text-xs transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Temperature */}
              <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                <span className="text-[11px] text-ink-secondary block">Surface Temp</span>
                <div className="text-xl font-mono font-bold text-ink-primary mt-0.5">
                  {formatTemp(selectedLocation.data.surfaceTemp)}°{temperatureUnit === 'celsius' ? 'C' : 'F'}
                </div>
                <span className="text-[10px] text-ink-tertiary font-mono">
                  +{selectedLocation.data.deltaAnomaly}°C vs ambient
                </span>
              </div>

              {/* Heat Risk Score */}
              <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                <span className="text-[11px] text-ink-secondary block">Heat Risk Score</span>
                <div className="text-xl font-mono font-bold text-ink-primary mt-0.5">
                  {selectedLocation.data.score}<span className="text-xs font-normal text-ink-faded">/100</span>
                </div>
                <span className={`text-[10px] font-medium uppercase font-mono ${
                  selectedLocation.data.score > 80 ? 'text-red-600' : selectedLocation.data.score > 50 ? 'text-amber-600' : 'text-sky-600'
                }`}>
                  {selectedLocation.data.level}
                </span>
              </div>
            </div>

            {/* Contributing Urban Factors Breakdown */}
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-medium text-ink-secondary block">Contributing Drivers:</span>
              
              <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle space-y-2 text-[11px]">
                <div>
                  <div className="flex justify-between text-ink-secondary mb-1">
                    <span>Impervious Surface Retention</span>
                    <span className="font-mono text-ink-primary font-medium">+{selectedLocation.data.contributingFactors.surfaceAlbedoPenalty}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-700 rounded-full" 
                      style={{ width: `${selectedLocation.data.contributingFactors.surfaceAlbedoPenalty}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-ink-secondary mb-1">
                    <span>Tree Canopy Deficit</span>
                    <span className="font-mono text-ink-primary font-medium">+{selectedLocation.data.contributingFactors.vegetationDeficitPenalty}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-700 rounded-full" 
                      style={{ width: `${selectedLocation.data.contributingFactors.vegetationDeficitPenalty}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant Action Trigger */}
            <button
              onClick={() => setIsAIAssistantOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-white transition-colors"
            >
              <span>Analyze with AI Assistant</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Clean Scientific Thermal Scale Legend (Bottom Center) */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 hidden sm:flex items-center gap-4 px-4 py-2 rounded-md panel-white text-xs">
          <span className="text-[11px] font-mono text-ink-tertiary">THERMAL SCALE</span>
          <div className="flex items-center gap-2">
            {THERMAL_COLOR_RAMP.map((step) => (
              <div key={step.tempC} className="flex items-center gap-1">
                <span
                  className="w-3.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: step.color }}
                  title={step.label}
                />
                <span className="text-[10px] font-mono text-ink-secondary">{step.tempC}°C</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
