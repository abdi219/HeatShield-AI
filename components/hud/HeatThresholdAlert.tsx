"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { AlertTriangle, Flame, ShieldCheck, ArrowRight, X, Droplets, Sun } from "lucide-react";

interface HeatThresholdAlertProps {
  onSelectShaded?: () => void;
}

export const HeatThresholdAlert: React.FC<HeatThresholdAlertProps> = ({ onSelectShaded }) => {
  const {
    activeTab,
    setActiveTab,
    selectedLocation,
    fastestRoute,
    temperatureUnit,
    mapStyle,
  } = useAppStore();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isSatellite = mapStyle === "satellite";
  const isFahrenheit = temperatureUnit === "fahrenheit";
  const unitSymbol = isFahrenheit ? "°F" : "°C";

  const formatTemp = (c: number) => {
    if (isFahrenheit) return (c * 1.8 + 32).toFixed(1);
    return c.toFixed(1);
  };

  // Determine active temperature to evaluate
  const currentTempC = selectedLocation?.data
    ? selectedLocation.data.surfaceTemp
    : fastestRoute
      ? fastestRoute.peakTempCelsius
      : 0;

  const currentHrs = selectedLocation?.data
    ? selectedLocation.data.score
    : fastestRoute
      ? Math.round(Math.min(100, Math.max(0, (fastestRoute.peakTempCelsius - 20) * 3.8)))
      : 0;

  // Threshold: Surface Temp >= 37.5°C (99.5°F) or HRS >= 72
  const isHighHeat = currentTempC >= 37.5 || currentHrs >= 72;
  const isExtremeHeat = currentTempC >= 41.0 || currentHrs >= 85;

  // Reset dismissal if location changes
  useEffect(() => {
    if (selectedLocation) {
      setIsDismissed(false);
    }
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  if (!isHighHeat || isDismissed) return null;

  return (
    <aside
      role="alert"
      aria-live="assertive"
      aria-label="High Heat Microclimate Advisory Banner"
      className={`fixed top-14 sm:top-16 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[1050] max-w-lg w-full transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${isMinimized ? "p-2" : "p-3 sm:p-3.5"
        } rounded-2xl shadow-2xl border ${isExtremeHeat
          ? "bg-slate-900/95 border-rose-500/60 text-white backdrop-blur-xl shadow-rose-950/40"
          : "bg-slate-900/95 border-sky-500/40 text-white backdrop-blur-xl shadow-slate-950/60"
        }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl ${isExtremeHeat ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse" : "bg-sky-500/20 text-sky-400 border border-sky-500/40"}`}>
            {isExtremeHeat ? <Flame className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-100">
                {isExtremeHeat ? "Extreme Heat Danger" : "Microclimate Heat Advisory"}
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isExtremeHeat ? "bg-rose-500/30 text-rose-200 border border-rose-400/40" : "bg-sky-500/30 text-sky-200 border border-sky-400/40"
                }`}>
                {formatTemp(currentTempC)}{unitSymbol} Peak
              </span>
            </div>
            {!isMinimized && (
              <p className="text-[11px] text-slate-300 font-normal leading-tight mt-0.5">
                {isExtremeHeat
                  ? "Continuous exposure limit: <10 mins. Seek active shaded transit corridors."
                  : "Elevated urban thermal stress detected. Hydrate and follow shaded cool paths."}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isMinimized && (
            <button
              type="button"
              onClick={() => {
                if (activeTab !== "routes") {
                  setActiveTab("routes");
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-950 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Cool Path</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-mono transition-all"
            title={isMinimized ? "Expand Advisory" : "Minimize Advisory"}
          >
            {isMinimized ? "▲" : "▼"}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Dismiss Advisory"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
