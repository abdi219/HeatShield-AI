"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { calculateMitigationImpact } from "@/lib/fortyguard";
import { HeatReportModal } from "@/components/reports/HeatReportModal";
import {
  Sliders,
  RotateCcw,
  Info,
  TrendingDown,
  Shield,
  Bookmark,
  BookmarkCheck,
  FileText,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";

export function WhatIfSimulator() {
  const {
    mapStyle,
    temperatureUnit,
    selectedLocation,
    selectedCity,
    simulationInterventions,
    setSimulationInterventions,
    simulationResult,
    setSimulationResult,
    simulationVisualizationMode,
    setSimulationVisualizationMode,
    savedScenarios,
    saveCurrentScenario,
    loadScenario,
    deleteScenario,
    setToastAlert,
  } = useAppStore();

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [scenarioNameInput, setScenarioNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [isMobileMinimized, setIsMobileMinimized] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const isSatellite = mapStyle === "satellite";
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";

  const formatTemp = (tempC: number) =>
    temperatureUnit === "fahrenheit" ? (tempC * 1.8 + 32).toFixed(1) : tempC.toFixed(1);
  const formatDelta = (deltaC: number) =>
    temperatureUnit === "fahrenheit" ? (deltaC * 1.8).toFixed(1) : deltaC.toFixed(1);

  // Baseline surface and ambient temperature derived from selected location or active city default
  const baselineData = useMemo(() => {
    if (selectedLocation?.data) {
      return {
        surfaceTemp: selectedLocation.data.surfaceTemp,
        ambientTemp: selectedLocation.data.ambientTemp,
        locationName: selectedLocation.address || `${selectedCity} Sector`,
      };
    }
    const cityBaselines: Record<string, { surface: number; ambient: number }> = {
      Phoenix: { surface: 41.5, ambient: 37.0 },
      Miami: { surface: 36.2, ambient: 31.5 },
      Austin: { surface: 38.0, ambient: 33.5 },
      "Las Vegas": { surface: 42.0, ambient: 38.0 },
    };
    const def = cityBaselines[selectedCity] || { surface: 37.5, ambient: 32.0 };
    return {
      surfaceTemp: def.surface,
      ambientTemp: def.ambient,
      locationName: `${selectedCity} Central Sector`,
    };
  }, [selectedLocation, selectedCity]);

  // Live real-time simulation calculation whenever interventions or baseline changes
  useEffect(() => {
    const result = calculateMitigationImpact(
      baselineData.surfaceTemp,
      baselineData.ambientTemp,
      simulationInterventions,
      baselineData.locationName
    );
    setSimulationResult(result);
  }, [baselineData, simulationInterventions, setSimulationResult]);

  // 1-Click Preset Handlers
  const handleApplyPreset = (preset: {
    treeCanopyCoveragePct: number;
    coolPavementAlbedo: number;
    solarCanopyCoveragePct: number;
    shadeStructureDensityPct: number;
  }) => {
    setSimulationInterventions(preset);
  };

  const handleResetBaseline = () => {
    setSimulationInterventions({
      treeCanopyCoveragePct: 0,
      coolPavementAlbedo: 0.10,
      solarCanopyCoveragePct: 0,
      shadeStructureDensityPct: 0,
    });
  };

  const handleSaveScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulationResult) return;
    
    // Edge case: unmitigated baseline
    const hasInterventions = 
      simulationInterventions.treeCanopyCoveragePct > 0 ||
      simulationInterventions.coolPavementAlbedo > 0.10 ||
      simulationInterventions.solarCanopyCoveragePct > 0 ||
      simulationInterventions.shadeStructureDensityPct > 0;

    if (!hasInterventions) {
      setToastAlert({
        type: "warning",
        message: "Notice: No interventions configured (0% cooling). Please adjust sliders or choose a preset before saving.",
      });
      return;
    }

    const name = scenarioNameInput.trim() || `Plan (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    saveCurrentScenario(name);
    setScenarioNameInput("");
    setIsSaving(false);
    setIsSavedDrawerOpen(true);
  };

  // Executive Urban Resilience Summary Report Generator (Task 9.1)
  const handleExportReport = () => {
    setIsReportModalOpen(true);
  };

  // Visual classes
  const glassCard = isSatellite ? "sat-glass text-white" : "street-card text-slate-900";
  const glassSubcard = isSatellite ? "sat-subglass" : "street-subcard";
  const textPrimary = isSatellite ? "text-white" : "text-slate-900";
  const textSecondary = isSatellite ? "text-white/80" : "text-slate-500";
  const textMuted = isSatellite ? "text-white/60" : "text-slate-400";
  const border = isSatellite ? "border-white/25" : "border-slate-200";

  return (
    <div
      className={`w-[calc(100vw-1.5rem)] max-w-sm md:w-[350px] p-4 rounded-2xl space-y-3.5 shadow-2xl overflow-y-auto max-h-[calc(100vh-9.5rem)] md:max-h-[calc(100vh-100px)] scrollbar-thin ${glassCard}`}
    >
      {/* ── 1. Header ── */}
      <div className={`flex items-center justify-between pb-2.5 border-b ${border}`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isSatellite ? "bg-emerald-400/20 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-extrabold tracking-tight ${textPrimary}`}>
              What-If Mitigation Simulator
            </h3>
            <span className={`text-[10px] font-mono block ${textMuted}`}>
              Parametric Physics Sandbox
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMobileMinimized(!isMobileMinimized)}
            className={`flex md:hidden px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
              isSatellite ? "border-white/20 text-white/80 hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title={isMobileMinimized ? "Expand Simulator" : "Minimize Simulator"}
          >
            {isMobileMinimized ? "▲" : "▼"}
          </button>
          <button
            type="button"
            onClick={handleResetBaseline}
            title="Reset to asphalt baseline"
            className={`px-2 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
              isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="text-[10px]">Reset</span>
          </button>
        </div>
      </div>

      {/* Minimized Mobile Summary (Rich Glanceable Snapshot) */}
      {isMobileMinimized && (
        <div className="flex md:hidden flex-col gap-1.5 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-400 truncate">
              Cooling: -{formatDelta(simulationResult?.temperatureReductionDelta || 0)}{unitSymbol} (HRS -{simulationResult?.heatRiskScoreReductionDelta || 0})
            </span>
            <span className={`text-[10px] font-mono shrink-0 ${textSecondary}`}>
              {baselineData.locationName.split(",")[0]}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10">
            <span className={textSecondary}>
              Canopy: {simulationInterventions.treeCanopyCoveragePct}% • Albedo: {simulationInterventions.coolPavementAlbedo.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetBaseline}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                  isSatellite ? "bg-white/10 text-white border-white/20" : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMinimized(false)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                  isSatellite ? "bg-white text-slate-950 font-black shadow-sm" : "bg-slate-900 text-white font-bold shadow-sm"
                }`}
              >
                Controls ▲
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Simulator Controls (Collapsible on mobile) */}
      <div className={`${isMobileMinimized ? "hidden md:block" : "block"} space-y-3.5`}>
        {/* ── 2. Active Sector Indicator ── */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between ${glassSubcard}`}>
        <div className="space-y-0.5 min-w-0 pr-2">
          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${textSecondary}`}>
            Target Sector
          </span>
          <p className={`text-xs font-bold truncate ${textPrimary}`}>
            {baselineData.locationName}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-[9px] font-mono block ${textMuted}`}>Baseline Temp</span>
          <span className="text-xs font-mono font-bold text-red-500">
            {formatTemp(baselineData.surfaceTemp)}{unitSymbol}
          </span>
        </div>
      </div>

      {/* ── 3. Quick 1-Click Mitigation Presets ── */}
      <div className="space-y-1.5">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${textMuted}`}>
          1-Click Presets
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                treeCanopyCoveragePct: 85,
                coolPavementAlbedo: 0.25,
                solarCanopyCoveragePct: 10,
                shadeStructureDensityPct: 20,
              })
            }
            className={`px-2.5 py-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
              isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-400">Urban Forest</span>
            <span className={`text-[9px] font-mono ${textMuted}`}>85% Canopy Cover</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                treeCanopyCoveragePct: 40,
                coolPavementAlbedo: 0.65,
                solarCanopyCoveragePct: 20,
                shadeStructureDensityPct: 30,
              })
            }
            className={`px-2.5 py-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
              isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            <span className="text-[11px] font-bold text-sky-400">Cool District</span>
            <span className={`text-[9px] font-mono ${textMuted}`}>0.65 Reflective Seal</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                treeCanopyCoveragePct: 25,
                coolPavementAlbedo: 0.30,
                solarCanopyCoveragePct: 75,
                shadeStructureDensityPct: 50,
              })
            }
            className={`px-2.5 py-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
              isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
            }`}
          >
            <span className="text-[11px] font-bold text-amber-400">Solar Canopies</span>
            <span className={`text-[9px] font-mono ${textMuted}`}>75% Solar Array</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                treeCanopyCoveragePct: 90,
                coolPavementAlbedo: 0.70,
                solarCanopyCoveragePct: 80,
                shadeStructureDensityPct: 85,
              })
            }
            className={`px-2.5 py-2 rounded-xl text-left border transition-all flex flex-col gap-0.5 ${
              isSatellite
                ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-white border-emerald-400/50"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-200"
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-400">Max Resilience</span>
            <span className={`text-[9px] font-mono ${textMuted}`}>Multi-Tier Solution</span>
          </button>
        </div>
      </div>

      {/* ── 4. Interactive Parametric Sliders ── */}
      <div className={`p-3 rounded-xl border space-y-3 ${glassSubcard}`}>
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${textSecondary}`}>
          Intervention Parameters
        </span>

        {/* 4.1 Tree Canopy Coverage Slider */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold ${textPrimary}`}>Urban Tree Canopy</span>
            <span className="font-mono font-extrabold text-emerald-400">
              {simulationInterventions.treeCanopyCoveragePct}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={simulationInterventions.treeCanopyCoveragePct}
            onChange={(e) =>
              setSimulationInterventions({ treeCanopyCoveragePct: Number(e.target.value) })
            }
            className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-lg bg-slate-700"
          />
          <div className="flex justify-between text-[9px] font-mono opacity-60">
            <span>0%</span>
            <span>-4.2°C Max Potential</span>
            <span>100%</span>
          </div>
        </div>

        {/* 4.2 Cool Pavement Albedo Slider */}
        <div className="space-y-1 pt-1 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold ${textPrimary}`}>Cool Pavement Albedo</span>
            <span className="font-mono font-extrabold text-sky-400">
              {simulationInterventions.coolPavementAlbedo.toFixed(2)} α
            </span>
          </div>
          <input
            type="range"
            min={0.10}
            max={0.70}
            step={0.05}
            value={simulationInterventions.coolPavementAlbedo}
            onChange={(e) =>
              setSimulationInterventions({ coolPavementAlbedo: Number(e.target.value) })
            }
            className="w-full accent-sky-500 cursor-pointer h-1.5 rounded-lg bg-slate-700"
          />
          <div className="flex justify-between text-[9px] font-mono opacity-60">
            <span>0.10 (Asphalt)</span>
            <span>-5.8°C Max Potential</span>
            <span>0.70 (Reflective)</span>
          </div>
        </div>

        {/* 4.3 Solar Canopy Coverage Slider */}
        <div className="space-y-1 pt-1 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold ${textPrimary}`}>Solar Photovoltaic Canopy</span>
            <span className="font-mono font-extrabold text-amber-400">
              {simulationInterventions.solarCanopyCoveragePct}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={simulationInterventions.solarCanopyCoveragePct}
            onChange={(e) =>
              setSimulationInterventions({ solarCanopyCoveragePct: Number(e.target.value) })
            }
            className="w-full accent-amber-500 cursor-pointer h-1.5 rounded-lg bg-slate-700"
          />
          <div className="flex justify-between text-[9px] font-mono opacity-60">
            <span>0%</span>
            <span>-3.5°C Shading</span>
            <span>100%</span>
          </div>
        </div>

        {/* 4.4 Tensile Shade Sails Slider */}
        <div className="space-y-1 pt-1 border-t border-white/10">
          <div className="flex justify-between items-center text-xs">
            <span className={`font-bold ${textPrimary}`}>Tensile Shade Sails</span>
            <span className="font-mono font-extrabold text-teal-400">
              {simulationInterventions.shadeStructureDensityPct}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={simulationInterventions.shadeStructureDensityPct}
            onChange={(e) =>
              setSimulationInterventions({ shadeStructureDensityPct: Number(e.target.value) })
            }
            className="w-full accent-teal-500 cursor-pointer h-1.5 rounded-lg bg-slate-700"
          />
          <div className="flex justify-between text-[9px] font-mono opacity-60">
            <span>0%</span>
            <span>-3.0°C Shading</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* ── 5. Real-Time Telemetry & Side-by-Side Impact (Task 5.3) ── */}
      {simulationResult && (
        <div className="space-y-2">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${textMuted}`}>
            Before vs After Comparison
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Temperature Delta Card */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isSatellite ? "bg-emerald-500/20 border-emerald-400/40" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-400">TEMP DROP</span>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="my-1">
                <div className="text-xl font-mono font-extrabold text-emerald-400">
                  -{formatDelta(simulationResult.temperatureReductionDelta)}{unitSymbol}
                </div>
                <span className={`text-[9px] font-mono block ${textSecondary}`}>
                  {formatTemp(simulationResult.simulatedSurfaceTemp)}{unitSymbol} simulated
                </span>
              </div>
            </div>

            {/* Heat Risk Score Delta Card */}
            <div className={`p-3 rounded-xl border flex flex-col justify-between ${
              isSatellite ? "bg-sky-500/20 border-sky-400/40" : "bg-sky-50 border-sky-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-sky-400">HEAT RISK</span>
                <Shield className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="my-1">
                <div className="text-xl font-mono font-extrabold text-sky-400">
                  {simulationResult.simulatedHeatRiskScore}
                  <span className="text-xs font-normal opacity-70">/100</span>
                </div>
                <span className={`text-[9px] font-mono block text-emerald-400 font-bold`}>
                  -{simulationResult.heatRiskScoreReductionDelta} pts drop
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Visual Bars */}
          <div className={`p-2.5 rounded-xl border space-y-2 ${glassSubcard}`}>
            <div>
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className={textSecondary}>Surface Temperature</span>
                <span>
                  <strong className="text-red-400">{formatTemp(simulationResult.baselineSurfaceTemp)}{unitSymbol}</strong>
                  {" -> "}
                  <strong className="text-emerald-400">{formatTemp(simulationResult.simulatedSurfaceTemp)}{unitSymbol}</strong>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(10, Math.min(100, (simulationResult.simulatedSurfaceTemp / simulationResult.baselineSurfaceTemp) * 100))}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span className={textSecondary}>Heat Risk Score</span>
                <span>
                  <strong className="text-orange-400">{simulationResult.baselineHeatRiskScore}</strong>
                  {" -> "}
                  <strong className="text-sky-400">{simulationResult.simulatedHeatRiskScore}/100</strong>
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden flex">
                <div
                  className="bg-sky-400 h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(10, Math.min(100, simulationResult.simulatedHeatRiskScore))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Cooling Radius & Zone Coverage */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${glassSubcard}`}>
            <span className={`text-[10px] font-mono font-semibold ${textPrimary}`}>
              Cooling Radius
            </span>
            <span className="text-xs font-mono font-bold text-teal-400">
              ~{simulationResult.estimatedCoolingRadiusMeters} meters
            </span>
          </div>
        </div>
      )}

      {/* ── 6. Visual Comparison Switcher ── */}
      <div className="space-y-1.5 pt-1 border-t border-white/10">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${textMuted}`}>
          Map Mode
        </span>
        <div className="grid grid-cols-3 gap-1">
          {(["mitigated", "baseline", "delta"] as const).map((mode) => {
            const active = simulationVisualizationMode === mode;
            const labels = {
              mitigated: "Mitigated",
              baseline: "Baseline",
              delta: "Delta (ΔT)",
            };
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setSimulationVisualizationMode(mode)}
                className={`py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all text-center ${
                  active
                    ? isSatellite
                      ? "bg-white text-slate-950 border-white shadow-md font-extrabold"
                      : "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : isSatellite
                    ? "bg-white/10 hover:bg-white/20 text-white/80 border-white/20"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 7. Scenario Persistence & Report Export (Task 5.4) ── */}
      <div className="space-y-2 pt-1 border-t border-white/10">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setIsSaving(!isSaving)}
            className={`flex-1 py-1.5 px-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSaving
                ? "bg-sky-500 text-white border-sky-400 shadow-md"
                : isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Plan</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className={`flex-1 py-1.5 px-2.5 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
              copiedReport
                ? "bg-emerald-500 text-white border-emerald-400"
                : isSatellite
                ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
            }`}
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Export Report</span>
              </>
            )}
          </button>
        </div>

        {/* Save Scenario Inline Form */}
        {isSaving && (
          <form onSubmit={handleSaveScenario} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              placeholder="e.g. Downtown Shade Plan..."
              value={scenarioNameInput}
              onChange={(e) => setScenarioNameInput(e.target.value)}
              className={`flex-1 px-2.5 py-1.5 text-xs rounded-xl border focus:outline-none transition-all ${
                isSatellite
                  ? "sat-subglass text-white border-white/30 placeholder-white/50 focus:border-sky-400"
                  : "bg-slate-50 text-slate-900 border-slate-300 placeholder-slate-400 focus:border-sky-500"
              }`}
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md transition-all shrink-0"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSaving(false);
                setScenarioNameInput("");
              }}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all ${
                isSatellite
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
              }`}
              title="Cancel"
            >
              ✕
            </button>
          </form>
        )}

        {/* Saved Plans Dropdown Drawer */}
        {savedScenarios.length > 0 && (
          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(!isSavedDrawerOpen)}
              className={`w-full py-1 px-2 rounded-lg text-[10px] font-mono font-bold flex items-center justify-between border ${
                isSatellite ? "bg-white/5 border-white/15 text-white/80" : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span className="flex items-center gap-1">
                <BookmarkCheck className="w-3 h-3 text-sky-400" />
                Saved Plans ({savedScenarios.length})
              </span>
              {isSavedDrawerOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isSavedDrawerOpen && (
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                {savedScenarios.map((scen) => (
                  <div
                    key={scen.id}
                    className={`p-1.5 rounded-lg border flex items-center justify-between text-xs ${
                      isSatellite ? "bg-white/10 border-white/20 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        loadScenario(scen);
                        setToastAlert({
                          type: "info",
                          message: `Loaded plan "${scen.name}".`,
                        });
                      }}
                      className="text-left flex-1 truncate pr-1"
                    >
                      <span className="font-bold block truncate">{scen.name}</span>
                      <span className={`text-[9px] font-mono block ${textMuted}`}>
                        -{formatDelta(scen.result.temperatureReductionDelta)}{unitSymbol} | {scen.cityName}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteScenario(scen.id)}
                      className="p-1 hover:text-red-400 text-slate-400"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

        {/* ── 8. Academic Disclaimer Badge ── */}
        <div className={`p-2 rounded-xl text-[9px] leading-tight flex items-start gap-1.5 opacity-75 ${
          isSatellite ? "bg-white/5 border border-white/15 text-white/70" : "bg-slate-50 border border-slate-200 text-slate-500"
        }`}>
          <Info className="w-3 h-3 shrink-0 mt-0.5 text-amber-400" />
          <span>
            Physics-based empirical microclimate projections. Outcomes vary by local humidity and winds.
          </span>
        </div>
      </div>

      {/* Heat Mitigation Report Modal (Task 9.1) */}
      {simulationResult && (
        <HeatReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportType="simulation"
          cityName={selectedCity || "Urban Core"}
          temperatureUnit={temperatureUnit}
          simulationData={{
            lat: selectedLocation?.lat || 33.4484,
            lng: selectedLocation?.lng || -112.074,
            result: simulationResult,
          }}
        />
      )}
    </div>
  );
}
