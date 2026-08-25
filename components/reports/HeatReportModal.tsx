import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HeatShieldEmblem } from "@/components/common/HeatShieldEmblem";
import { 
  Printer, 
  Copy, 
  Check, 
  X, 
  Trees, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Layers, 
  FileText 
} from "lucide-react";
import { AnalyzedRoute, SimulationResult } from "@/types";

interface HeatReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "route" | "simulation";
  cityName: string;
  temperatureUnit: "celsius" | "fahrenheit";
  routeData?: {
    originText: string;
    destText: string;
    travelMode: string;
    fastestRoute: AnalyzedRoute;
    coolRoute: AnalyzedRoute;
  };
  simulationData?: {
    lat: number;
    lng: number;
    result: SimulationResult;
  };
}

export const HeatReportModal: React.FC<HeatReportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  cityName,
  temperatureUnit,
  routeData,
  simulationData,
}) => {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const isFahrenheit = temperatureUnit === "fahrenheit";
  const unitSymbol = isFahrenheit ? "°F" : "°C";

  const formatTemp = (c: number) => {
    if (isFahrenheit) return (c * 1.8 + 32).toFixed(1);
    return c.toFixed(1);
  };

  const formatSmartDuration = (sec: number) => {
    const min = Math.round(sec / 60);
    if (min < 60) return `${min} min`;
    const hrs = Math.floor(min / 60);
    const rem = min % 60;
    return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let text = `HEATSHIELD AI — URBAN MICROCLIMATE REPORT\n`;
    text += `Generated: ${dateStr} | City: ${cityName}\n`;
    text += `Powered by FortyGuard Street-Level Spatial Data\n\n`;

    if (reportType === "route" && routeData) {
      const { originText, destText, fastestRoute, coolRoute, travelMode } = routeData;
      text += `--- ROUTE THERMAL EXPOSURE ANALYSIS ---\n`;
      text += `Origin: ${originText}\n`;
      text += `Destination: ${destText}\n`;
      text += `Mode: ${travelMode.toUpperCase()}\n\n`;
      text += `DIRECT (GPS) ROUTE:\n`;
      text += `  • Distance: ${(fastestRoute.distanceMeters / 1000).toFixed(1)} km\n`;
      text += `  • Time: ${formatSmartDuration(fastestRoute.durationSeconds)}\n`;
      text += `  • Avg Temp: ${formatTemp(fastestRoute.averageTempCelsius)}${unitSymbol}\n`;
      text += `  • Peak Temp: ${formatTemp(fastestRoute.peakTempCelsius)}${unitSymbol}\n\n`;
      text += `COOL RECOMMENDED CORRIDOR:\n`;
      text += `  • Distance: ${(coolRoute.distanceMeters / 1000).toFixed(1)} km\n`;
      text += `  • Time: ${formatSmartDuration(coolRoute.durationSeconds)}\n`;
      text += `  • Avg Temp: ${formatTemp(coolRoute.averageTempCelsius)}${unitSymbol}\n`;
      text += `  • Peak Temp: ${formatTemp(coolRoute.peakTempCelsius)}${unitSymbol}\n`;
      text += `  • Heat Exposure Reduction: -${coolRoute.exposureReductionPct}%\n`;
      text += `  • HeatShield Safety Score: ${coolRoute.heatShieldScore}/100\n`;
    } else if (reportType === "simulation" && simulationData) {
      const { lat, lng, result } = simulationData;
      text += `--- URBAN HEAT MITIGATION SIMULATION ---\n`;
      text += `Target Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}\n\n`;
      text += `INTERVENTION PARAMETERS:\n`;
      text += `  • Tree Canopy Coverage: +${result.interventions.treeCanopyCoveragePct}%\n`;
      text += `  • Cool Pavement / Roof Albedo: ${result.interventions.coolPavementAlbedo.toFixed(2)} α\n`;
      text += `  • Solar Photovoltaic Canopies: +${result.interventions.solarCanopyCoveragePct}%\n`;
      text += `  • Tensile Shade Sails: +${result.interventions.shadeStructureDensityPct}%\n\n`;
      text += `PREDICTED COOLING IMPACT:\n`;
      text += `  • Surface Temperature Drop: -${formatTemp(result.temperatureReductionDelta)}${unitSymbol}\n`;
      text += `  • Heat Risk Score Drop: -${result.heatRiskScoreReductionDelta.toFixed(1)} pts\n`;
      text += `  • Estimated Cooling Radius: ${result.estimatedCoolingRadiusMeters} meters\n`;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-full my-auto">
        {/* Top Action Toolbar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
              Executive Heat Resilience Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all"
              title="Close Report"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-8 space-y-6 print:p-6" id="printable-heat-report">
          {/* Header Banner */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <HeatShieldEmblem size={22} isSatellite={false} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-950">HeatShield AI</h1>
                <p className="text-[11px] font-mono text-slate-600">
                  Street-Level Microclimate Resilience Intelligence
                </p>
              </div>
            </div>
            <div className="text-right font-mono text-[11px] space-y-0.5">
              <div className="font-bold text-slate-900">{cityName} Pilot Region</div>
              <div className="text-slate-500">{currentDate}</div>
              <div className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold inline-block mt-1">
                FortyGuard Certified Data
              </div>
            </div>
          </div>

          {/* Route Report Content */}
          {reportType === "route" && routeData && (
            <div className="space-y-6">
              {/* Corridor Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Commute Corridor Specification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 text-[10px] block font-mono">ORIGIN (A)</span>
                      <span className="font-bold text-slate-900">{routeData.originText}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 text-[10px] block font-mono">DESTINATION (B)</span>
                      <span className="font-bold text-slate-900">{routeData.destText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Path Comparison Cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Direct GPS Path */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-slate-700">
                    <span>DIRECT GPS PATH</span>
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-extrabold text-slate-950">
                      {formatSmartDuration(routeData.fastestRoute.durationSeconds)}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {(routeData.fastestRoute.distanceMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Avg Temperature:</span>
                      <span className="font-bold text-orange-600">
                        {formatTemp(routeData.fastestRoute.averageTempCelsius)}{unitSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Peak Thermal Spike:</span>
                      <span className="font-bold text-red-600">
                        {formatTemp(routeData.fastestRoute.peakTempCelsius)}{unitSymbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cool Recommended Path */}
                <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs font-bold text-emerald-800">
                    <span>COOL RECOMMENDED</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-mono font-extrabold text-slate-950">
                      {formatSmartDuration(routeData.coolRoute.durationSeconds)}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {(routeData.coolRoute.distanceMeters / 1000).toFixed(1)} km
                    </span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Avg Temperature:</span>
                      <span className="font-bold text-emerald-700">
                        {formatTemp(routeData.coolRoute.averageTempCelsius)}{unitSymbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Peak Thermal Spike:</span>
                      <span className="font-bold text-emerald-700">
                        {formatTemp(routeData.coolRoute.peakTempCelsius)}{unitSymbol}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exposure Reduction Highlight Banner */}
              <div className="p-4 rounded-2xl bg-emerald-600 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/20">
                    <Trees className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">
                      {routeData.coolRoute.exposureReductionPct}% Heat Exposure Reduction
                    </div>
                    <div className="text-xs font-mono text-emerald-100">
                      Optimized for tree canopy cover, cool pavements & urban shade corridors
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-emerald-200 block">Safety Score</span>
                  <span className="text-xl font-extrabold">{routeData.coolRoute.heatShieldScore}/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Report Content */}
          {reportType === "simulation" && simulationData && (
            <div className="space-y-6">
              {/* Target Location */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Intervention Zone Location
                  </span>
                  <span className="text-sm font-bold text-slate-900">{cityName} Urban Core</span>
                </div>
                <div className="font-mono text-xs text-slate-600">
                  {simulationData.lat.toFixed(4)}° N, {simulationData.lng.toFixed(4)}° W
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Applied Mitigation Interventions
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-lg font-mono font-extrabold text-slate-900">
                      +{simulationData.result.interventions.treeCanopyCoveragePct}%
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Tree Canopy</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-lg font-mono font-extrabold text-slate-900">
                      {simulationData.result.interventions.coolPavementAlbedo.toFixed(2)}α
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Cool Pavement</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-lg font-mono font-extrabold text-slate-900">
                      +{simulationData.result.interventions.solarCanopyCoveragePct}%
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Solar Canopy</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-lg font-mono font-extrabold text-slate-900">
                      +{simulationData.result.interventions.shadeStructureDensityPct}%
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Shade Sails</span>
                  </div>
                </div>
              </div>

              {/* Cooling Impact Results */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                  <Layers className="w-4 h-4" />
                  <span>PREDICTED MICROCLIMATE COOLING RESULTS</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-400">
                      -{formatTemp(simulationData.result.temperatureReductionDelta)}{unitSymbol}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Surface Temp Drop</span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-mono font-extrabold text-teal-400">
                      -{simulationData.result.heatRiskScoreReductionDelta.toFixed(1)}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Heat Risk Index Drop</span>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-mono font-extrabold text-sky-400">
                      {simulationData.result.estimatedCoolingRadiusMeters}m
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Cooling Radius</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Methodology & Certification */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>Deterministic Spatial Modeling — FortyGuard Microclimate Engine</span>
            <span>HeatShield AI — FortyGuard Hackathon Track 1</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
