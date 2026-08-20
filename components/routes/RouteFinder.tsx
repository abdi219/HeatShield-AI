"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { CITY_PRESETS, CITY_COMMUTE_CORRIDORS } from "@/lib/constants";
import { 
  Navigation, 
  Clock, 
  Footprints, 
  Bike, 
  Car, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  Trees, 
  LocateFixed,
  Search,
  MapPin,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Sun
} from "lucide-react";

/**
 * Smart duration formatter (converts to minutes, hours, or days)
 */
function formatSmartDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 1) return "< 1 min";
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  if (hours < 24) {
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function RouteFinder() {
  const {
    viewport,
    setViewport,
    origin,
    destination,
    setOrigin,
    setDestination,
    travelMode,
    setTravelMode,
    fastestRoute,
    coolRoute,
    selectedRouteId,
    setSelectedRouteId,
    setRoutes,
    isCalculatingRoutes,
    setIsCalculatingRoutes,
    temperatureUnit,
    pointPickingMode,
    setPointPickingMode,
  } = useAppStore();

  // Find active preset city based on viewport
  const activeCity = (CITY_PRESETS && CITY_PRESETS.length > 0)
    ? CITY_PRESETS.reduce((prev, curr) => {
        const prevDist = Math.hypot(prev.lat - viewport.lat, prev.lng - viewport.lng);
        const currDist = Math.hypot(curr.lat - viewport.lat, curr.lng - viewport.lng);
        return currDist < prevDist ? curr : prev;
      }, CITY_PRESETS[0])
    : { name: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.0740, zoom: 14.5, description: "" };

  const activeCityName = activeCity.name;
  const activeCorridors = (CITY_COMMUTE_CORRIDORS && CITY_COMMUTE_CORRIDORS[activeCityName]) || CITY_COMMUTE_CORRIDORS["Phoenix"] || [];

  const [originText, setOriginText] = useState(origin?.name || "");
  const [destText, setDestText] = useState(destination?.name || "");
  const [isDirectionsExpanded, setIsDirectionsExpanded] = useState(true);

  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === "fahrenheit") {
      return (tempC * 1.8 + 32).toFixed(1);
    }
    return tempC.toFixed(1);
  };

  const formatDeltaTemp = (deltaC: number) => {
    if (temperatureUnit === "fahrenheit") {
      return (deltaC * 1.8).toFixed(1);
    }
    return deltaC.toFixed(1);
  };

  // Safe server-side geocoding proxy
  const geocodeAddress = async (query: string, fallbackLat: number, fallbackLng: number) => {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      
      if (data && data.results && data.results.length > 0) {
        return {
          name: query,
          lat: data.results[0].lat,
          lng: data.results[0].lng,
        };
      }
    } catch (e) {
      console.warn("Geocoding query fallback:", e);
    }
    return { name: query, lat: fallbackLat, lng: fallbackLng };
  };

  const handleCalculateRoutes = async (
    mode = travelMode,
    explicitOrigin?: { name: string; lat: number; lng: number },
    explicitDest?: { name: string; lat: number; lng: number }
  ) => {
    const origQuery = explicitOrigin?.name || originText.trim();
    const destQuery = explicitDest?.name || destText.trim();

    if (!origQuery || !destQuery) return;

    try {
      setIsCalculatingRoutes(true);

      let startCoord = explicitOrigin || origin;
      if (!startCoord || startCoord.name !== origQuery) {
        startCoord = await geocodeAddress(origQuery, viewport.lat + 0.005, viewport.lng - 0.005);
      }
      setOrigin(startCoord);
      setOriginText(startCoord.name);

      let endCoord = explicitDest || destination;
      if (!endCoord || endCoord.name !== destQuery) {
        endCoord = await geocodeAddress(destQuery, viewport.lat - 0.005, viewport.lng + 0.005);
      }
      setDestination(endCoord);
      setDestText(endCoord.name);

      // Camera auto-framing
      const midLat = (startCoord.lat + endCoord.lat) / 2;
      const midLng = (startCoord.lng + endCoord.lng) / 2;
      if (Math.hypot(midLat - viewport.lat, midLng - viewport.lng) > 0.05) {
        setViewport({ lat: midLat, lng: midLng, zoom: 14.5 });
      }

      const res = await fetch("/api/routes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: startCoord,
          destination: endCoord,
          mode,
        }),
      });

      if (!res.ok) throw new Error(`Route analysis failed: ${res.status}`);
      const data = await res.json();
      setRoutes(data.fastestRoute, data.coolRecommendedRoute);
    } catch (err) {
      console.error("Route calculation error:", err);
    } finally {
      setIsCalculatingRoutes(false);
    }
  };

  // Instant Travel Mode Switch (Walk / Cycle / Drive)
  const handleModeChange = (mode: "walking" | "cycling" | "driving") => {
    setTravelMode(mode);
    if (origin && destination) {
      handleCalculateRoutes(mode, origin, destination);
    }
  };

  // Apply City Corridor Preset
  const handleApplyCorridor = (corridor: (typeof activeCorridors)[0]) => {
    setOriginText(corridor.origin.name);
    setDestText(corridor.destination.name);
    handleCalculateRoutes(travelMode, corridor.origin, corridor.destination);
  };

  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLoc = {
            name: "Current GPS Location",
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setOrigin(userLoc);
          setOriginText("Current GPS Location");
        },
        () => {
          const fallback = { name: `${activeCity.name} Center`, lat: viewport.lat, lng: viewport.lng };
          setOrigin(fallback);
          setOriginText(`${activeCity.name} Center`);
        }
      );
    }
  };

  const activeRoute = selectedRouteId === "cool" ? coolRoute : fastestRoute;

  // Build SVG Points for the Thermal Elevation Area Chart
  const buildSvgPath = (profile: { surfaceTempCelsius: number }[] = [], isFill = false) => {
    if (!profile || profile.length === 0) return "";
    const w = 400;
    const h = 56;
    const minT = 26;
    const maxT = 46;

    const points = profile.map((p, i) => {
      const x = (i / (profile.length - 1)) * w;
      const normalizedY = Math.max(0, Math.min(1, (p.surfaceTempCelsius - minT) / (maxT - minT)));
      const y = h - (normalizedY * (h - 10)) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    if (isFill) {
      return `M 0,${h} L ${points.join(" L ")} L ${w},${h} Z`;
    }
    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="w-full max-w-md max-h-[calc(100vh-5.5rem)] overflow-y-auto p-4 rounded-lg panel-white-elevated space-y-3.5 shadow-panel select-none scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-slate-900" />
          <h3 className="text-xs font-semibold text-ink-primary">
            Cool Route Finder ({activeCity.name})
          </h3>
        </div>
        <span className="text-[10px] font-mono text-ink-tertiary">FORTYGUARD TELEMETRY</span>
      </div>

      {/* Origin & Destination Inputs with Interactive Map Pinning */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleCalculateRoutes();
        }}
        className="space-y-2"
      >
        {/* Origin */}
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-ink-tertiary">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
          </div>
          <input
            type="text"
            value={originText}
            onChange={(e) => setOriginText(e.target.value)}
            placeholder="Enter starting point (or click pin to set on map)..."
            className="w-full h-8 pl-8 pr-16 bg-canvas-subtle border border-border-subtle hover:border-border-active rounded text-xs text-ink-primary placeholder:text-ink-faded focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPointPickingMode(pointPickingMode === "origin" ? null : "origin")}
              className={`p-1 rounded text-xs transition-colors ${
                pointPickingMode === "origin" ? "bg-slate-900 text-amber-400" : "text-ink-tertiary hover:text-ink-primary"
              }`}
              title="Click on map to set Origin (A)"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="p-1 text-ink-tertiary hover:text-ink-primary text-xs"
              title="Use Current GPS Location"
            >
              <LocateFixed className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Destination */}
        <div className="relative">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-ink-tertiary">
            <span className="w-2 h-2 rounded-full bg-red-600" />
          </div>
          <input
            type="text"
            value={destText}
            onChange={(e) => setDestText(e.target.value)}
            placeholder="Enter destination (or click pin to set on map)..."
            className="w-full h-8 pl-8 pr-16 bg-canvas-subtle border border-border-subtle hover:border-border-active rounded text-xs text-ink-primary placeholder:text-ink-faded focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPointPickingMode(pointPickingMode === "destination" ? null : "destination")}
              className={`p-1 rounded text-xs transition-colors ${
                pointPickingMode === "destination" ? "bg-red-600 text-white" : "text-ink-tertiary hover:text-ink-primary"
              }`}
              title="Click on map to set Destination (B)"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              className="p-1 text-ink-tertiary hover:text-ink-primary text-xs"
              title="Search Destination"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Travel Mode Selector (Live Switching) */}
      <div className="flex items-center justify-between p-1 rounded bg-canvas-subtle border border-border-subtle text-xs">
        <button
          type="button"
          onClick={() => handleModeChange("walking")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors ${
            travelMode === "walking" ? "bg-white text-ink-primary shadow-sm" : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Walk</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("cycling")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors ${
            travelMode === "cycling" ? "bg-white text-ink-primary shadow-sm" : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Cycle</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("driving")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-xs font-medium transition-colors ${
            travelMode === "driving" ? "bg-white text-ink-primary shadow-sm" : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Drive</span>
        </button>
      </div>

      {/* Calculate Route Action Button */}
      <button
        type="button"
        onClick={() => handleCalculateRoutes()}
        disabled={isCalculatingRoutes || (!originText.trim() && !origin) || (!destText.trim() && !destination)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition-colors disabled:opacity-40 shadow-sm"
      >
        {isCalculatingRoutes ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Analyzing Microclimate Corridors...</span>
          </>
        ) : (
          <>
            <span>Compare Heat Exposure</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {/* Quick Verified City Corridors */}
      <div className="space-y-1.5 pt-0.5">
        <span className="text-[10px] font-mono text-ink-tertiary uppercase tracking-wider block">
          Frequent {activeCity.name} Corridors
        </span>
        <div className="space-y-1">
          {activeCorridors.map((corridor, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyCorridor(corridor)}
              className="w-full text-left px-2.5 py-1.5 rounded bg-canvas-subtle hover:bg-slate-100 border border-border-subtle text-[11px] text-ink-secondary hover:text-ink-primary transition-colors flex items-center justify-between"
            >
              <span className="truncate">{corridor.name}</span>
              <span className="text-[10px] text-ink-tertiary font-mono">Run →</span>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Route Comparison Results */}
      {coolRoute && fastestRoute && (
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          {/* Instructions to toggle active route */}
          <div className="text-[10px] text-ink-tertiary font-mono flex items-center justify-between">
            <span>SELECT ROUTE TO HIGHLIGHT ON MAP:</span>
            <span className="text-slate-900 font-semibold">{selectedRouteId === "cool" ? "Cool Corridor" : "Direct GPS"}</span>
          </div>

          {/* Dual Route Comparison Cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* Direct Fastest Route Card */}
            <div
              onClick={() => setSelectedRouteId("fastest")}
              className={`p-2.5 rounded border cursor-pointer transition-all ${
                selectedRouteId === "fastest"
                  ? "bg-amber-50/70 border-amber-400 ring-2 ring-amber-400 shadow-sm"
                  : "bg-canvas-subtle border-border-subtle hover:border-slate-300 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-ink-tertiary">
                <span>DIRECT (GPS)</span>
                <Clock className="w-3 h-3 text-slate-500" />
              </div>

              <div className="mt-1">
                <div className="text-base font-mono font-bold text-ink-primary">
                  {formatSmartDuration(fastestRoute.durationSeconds)}
                </div>
                <span className="text-[10px] text-ink-secondary">
                  {(fastestRoute.distanceMeters / 1000).toFixed(1)} km
                </span>
              </div>

              <div className="mt-2 pt-1.5 border-t border-border-subtle text-[10px] space-y-0.5 font-mono">
                <div className="flex justify-between text-ink-secondary">
                  <span>Avg Temp:</span>
                  <span className="text-orange-600 font-bold">{formatTemp(fastestRoute.averageTempCelsius)}{unitSymbol}</span>
                </div>
                <div className="flex justify-between text-ink-secondary">
                  <span>Peak Heat:</span>
                  <span className="text-red-600 font-bold">{formatTemp(fastestRoute.peakTempCelsius)}{unitSymbol}</span>
                </div>
                <div className="flex justify-between text-ink-secondary pt-0.5 font-sans">
                  <span>Exposure:</span>
                  <span className="text-amber-700 font-semibold">High Heat</span>
                </div>
              </div>
            </div>

            {/* Cool Recommended Route Card */}
            <div
              onClick={() => setSelectedRouteId("cool")}
              className={`p-2.5 rounded border cursor-pointer transition-all ${
                selectedRouteId === "cool"
                  ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500 shadow-sm"
                  : "bg-canvas-subtle border-border-subtle hover:border-slate-300 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-emerald-700 font-semibold">
                <span>RECOMMENDED</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>

              <div className="mt-1">
                <div className="text-base font-mono font-bold text-ink-primary flex items-baseline gap-1">
                  <span>{formatSmartDuration(coolRoute.durationSeconds)}</span>
                  <span className="text-[10px] text-ink-tertiary font-normal">
                    (+{formatSmartDuration(coolRoute.durationSeconds - fastestRoute.durationSeconds)})
                  </span>
                </div>
                <span className="text-[10px] text-ink-secondary">
                  {(coolRoute.distanceMeters / 1000).toFixed(1)} km
                </span>
              </div>

              <div className="mt-2 pt-1.5 border-t border-border-subtle text-[10px] space-y-0.5 font-mono">
                <div className="flex justify-between text-ink-secondary">
                  <span>Avg Temp:</span>
                  <span className="text-emerald-700 font-bold">{formatTemp(coolRoute.averageTempCelsius)}{unitSymbol}</span>
                </div>
                <div className="flex justify-between text-ink-secondary">
                  <span>Peak Heat:</span>
                  <span className="text-emerald-700 font-bold">{formatTemp(coolRoute.peakTempCelsius)}{unitSymbol}</span>
                </div>
                <div className="flex justify-between text-emerald-800 pt-0.5 font-sans font-semibold">
                  <span>Score:</span>
                  <span>{coolRoute.heatShieldScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Differential Exposure Summary Banner */}
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trees className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-emerald-900 text-[11px]">
                {coolRoute.exposureReductionPct}% Less Heat Exposure
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-800">
              -{formatDeltaTemp(fastestRoute.averageTempCelsius - coolRoute.averageTempCelsius)}{unitSymbol} Cooler
            </span>
          </div>

          {/* Turn-by-Turn Thermal Directions */}
          {activeRoute && activeRoute.steps && activeRoute.steps.length > 0 && (
            <div className="space-y-1.5 border border-border-subtle rounded-md bg-canvas-subtle p-2.5">
              <button
                type="button"
                onClick={() => setIsDirectionsExpanded(!isDirectionsExpanded)}
                className="w-full flex items-center justify-between text-xs font-semibold text-ink-primary"
              >
                <div className="flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
                  <span>Turn-by-Turn Thermal Directions ({activeRoute.type === "cool_recommended" ? "Cool Corridor" : "Direct GPS"})</span>
                </div>
                {isDirectionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isDirectionsExpanded && (
                <div className="space-y-2 pt-2 border-t border-border-subtle max-h-48 overflow-y-auto scrollbar-thin">
                  {activeRoute.steps.map((step, idx) => (
                    <div key={idx} className="text-[11px] p-2 rounded bg-white border border-border-subtle space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-ink-primary leading-tight">
                          {idx + 1}. {step.instruction}
                        </span>
                        <span className="text-[10px] font-mono text-ink-tertiary whitespace-nowrap">
                          {step.distanceMeters}m ({formatSmartDuration(step.durationSeconds)})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                        <div className="flex items-center gap-1">
                          {step.isShaded ? (
                            <Trees className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Sun className="w-3 h-3 text-amber-500" />
                          )}
                          <span className={step.isShaded ? "text-emerald-700 font-medium" : "text-amber-700"}>
                            {step.heatAdvisory}
                          </span>
                        </div>
                        <span className={`font-bold ${step.isShaded ? "text-emerald-700" : "text-orange-600"}`}>
                          {formatTemp(step.avgTempCelsius)}{unitSymbol}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Responsive SVG Thermal Profile Chart */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-ink-tertiary">
              <span>THERMAL ELEVATION PROFILE</span>
              <span>DISTANCE (KM)</span>
            </div>

            <div className="relative w-full h-16 bg-slate-50 border border-border-subtle rounded-md overflow-hidden p-1">
              <svg 
                viewBox="0 0 400 56" 
                preserveAspectRatio="none" 
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Direct Fastest Route Area & Line */}
                <path d={buildSvgPath(fastestRoute.thermalProfile, true)} fill="url(#amberGrad)" />
                <path 
                  d={buildSvgPath(fastestRoute.thermalProfile, false)} 
                  fill="none" 
                  stroke="#E87722" 
                  strokeWidth="2" 
                  strokeDasharray="4 3" 
                />

                {/* Cool Recommended Route Area & Line */}
                <path d={buildSvgPath(coolRoute.thermalProfile, true)} fill="url(#emeraldGrad)" />
                <path 
                  d={buildSvgPath(coolRoute.thermalProfile, false)} 
                  fill="none" 
                  stroke="#2CA099" 
                  strokeWidth="2.5" 
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[10px] text-ink-tertiary font-mono pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed border-amber-600" /> Direct Sun Path ({formatTemp(fastestRoute.peakTempCelsius)}{unitSymbol})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-600 rounded-xs" /> Shaded Canopy ({formatTemp(coolRoute.peakTempCelsius)}{unitSymbol})
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
