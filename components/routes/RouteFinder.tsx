"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CITY_PRESETS, CITY_COMMUTE_CORRIDORS } from "@/lib/constants";
import { HeatShieldEmblem } from "@/components/common/HeatShieldEmblem";
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
  Sun,
  Flame,
  RotateCcw,
  X
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

/**
 * Duration difference formatter
 */
function formatDurationDiff(coolSec: number, fastSec: number): string {
  const diffSec = coolSec - fastSec;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin > 0) return `(+${diffMin} min)`;
  if (diffMin === 0) return `(Equal time)`;
  return `(${Math.abs(diffMin)} min faster)`;
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
    clearRoutes,
    isCalculatingRoutes,
    setIsCalculatingRoutes,
    temperatureUnit,
    pointPickingMode,
    setPointPickingMode,
    mapStyle,
  } = useAppStore();

  const isSatellite = mapStyle === "satellite";
  const glassCard = isSatellite ? "sat-glass" : "street-card";
  const subGlass = isSatellite ? "sat-subglass" : "street-subcard";
  const textPrimary = isSatellite ? "text-white" : "text-slate-900";
  const textSecondary = isSatellite ? "text-white/85" : "text-slate-600";
  const textMuted = isSatellite ? "text-white/60" : "text-slate-400";
  const border = isSatellite ? "border-white/30" : "border-slate-200";

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
  const [isMobileMinimized, setIsMobileMinimized] = useState(true);

  // Synchronize local input state whenever store coordinates are placed/updated/cleared
  useEffect(() => {
    if (origin?.name) {
      setOriginText(origin.name);
    } else if (!origin) {
      setOriginText("");
    }
  }, [origin]);

  useEffect(() => {
    if (destination?.name) {
      setDestText(destination.name);
    } else if (!destination) {
      setDestText("");
    }
  }, [destination]);

  const handleClearRoute = () => {
    clearRoutes();
    setOriginText("");
    setDestText("");
  };

  const hasActiveRoute = Boolean(fastestRoute || coolRoute || origin || destination);

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
    const origQuery = (explicitOrigin?.name || originText || origin?.name || "").trim();
    const destQuery = (explicitDest?.name || destText || destination?.name || "").trim();

    if (!origQuery || !destQuery) return;

    try {
      setIsCalculatingRoutes(true);

      // Determine Origin Coordinates: Use explicit/pinned origin or geocode new query
      let startCoord = explicitOrigin;
      if (!startCoord) {
        if (origin && (origin.name === origQuery || origQuery.startsWith("Pin (") || origin.name.startsWith("Pin ("))) {
          startCoord = origin;
        } else {
          startCoord = await geocodeAddress(origQuery, viewport.lat + 0.005, viewport.lng - 0.005);
        }
      }
      setOrigin(startCoord);
      setOriginText(startCoord.name);

      // Determine Destination Coordinates: Use explicit/pinned destination or geocode new query
      let endCoord = explicitDest;
      if (!endCoord) {
        if (destination && (destination.name === destQuery || destQuery.startsWith("Pin (") || destination.name.startsWith("Pin ("))) {
          endCoord = destination;
        } else {
          endCoord = await geocodeAddress(destQuery, viewport.lat - 0.005, viewport.lng + 0.005);
        }
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
    setOrigin(corridor.origin);
    setDestination(corridor.destination);
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
    const minT = 20;
    const maxT = 46;

    const denom = Math.max(1, profile.length - 1);
    const points = profile.map((p, i) => {
      const x = profile.length === 1 ? w / 2 : (i / denom) * w;
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
    <div 
      className={`w-[calc(100vw-1.5rem)] max-w-sm sm:w-[410px] max-h-[calc(100vh-9.5rem)] md:max-h-[calc(100vh-6rem)] overflow-y-auto p-4 rounded-2xl space-y-3.5 shadow-2xl select-none scrollbar-thin transition-all duration-300 ${glassCard}`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2.5 border-b ${border}`}>
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
            isSatellite ? "bg-white/15 backdrop-blur-md border-white/35 text-white shadow-sm" : "bg-slate-100 border-slate-200 text-slate-900 shadow-sm"
          }`}>
            <HeatShieldEmblem size={16} isSatellite={isSatellite} className={isSatellite ? "text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" : "text-slate-900"} />
          </div>
          <h3 className={`text-xs font-bold ${textPrimary}`}>
            Cool Route Finder ({activeCity.name})
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsMobileMinimized(!isMobileMinimized)}
            className={`flex md:hidden px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all ${
              isSatellite ? "border-white/20 text-white/80 hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title={isMobileMinimized ? "Expand Route Panel" : "Minimize Route Panel"}
          >
            {isMobileMinimized ? "▲" : "▼"}
          </button>
          {hasActiveRoute && (
            <button
              type="button"
              onClick={handleClearRoute}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition-all ${
                isSatellite 
                  ? "bg-white/20 hover:bg-white/30 text-white border-white/40" 
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Clear active route & reset map"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
            isSatellite ? "bg-white/20 text-white border-white/40" : "bg-slate-100 text-slate-700 border-slate-200"
          }`}>
            MICROCLIMATE
          </span>
        </div>
      </div>

      {/* Minimized Mobile View (Rich Glanceable Summary) */}
      {isMobileMinimized && (
        <div className="flex md:hidden flex-col gap-2 pt-0.5">
          {coolRoute && fastestRoute ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-400 truncate">
                  Cool: -{formatDeltaTemp(fastestRoute.averageTempCelsius - coolRoute.averageTempCelsius)}{unitSymbol} Cooler ({coolRoute.exposureReductionPct}% Less Heat)
                </span>
                <span className={`text-[10px] font-mono shrink-0 ${textSecondary}`}>
                  {formatSmartDuration(coolRoute.durationSeconds)} • {(coolRoute.distanceMeters / 1000).toFixed(1)}km
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10">
                <span className={textSecondary}>
                  Peak: <b className="text-emerald-400">{formatTemp(coolRoute.peakTempCelsius)}{unitSymbol}</b> vs Direct <b className="text-red-400">{formatTemp(fastestRoute.peakTempCelsius)}{unitSymbol}</b>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleClearRoute}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                      isSatellite ? "bg-white/10 text-white border-white/20" : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileMinimized(false)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                      isSatellite ? "bg-white text-slate-950 font-black shadow-sm" : "bg-slate-900 text-white font-bold shadow-sm"
                    }`}
                  >
                    Details ▲
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-medium truncate ${textSecondary}`}>
                A: {originText || "Start"} → B: {destText || "Destination"}
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMinimized(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                  isSatellite ? "bg-white text-slate-950 font-black shadow-sm" : "bg-slate-900 text-white font-bold shadow-sm"
                }`}
              >
                Set Route ▲
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Form & Details (Collapsible on mobile) */}
      <div className={`${isMobileMinimized ? "hidden md:block" : "block"} space-y-3.5`}>
        {/* Origin & Destination Inputs with Interactive Map Pinning */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleCalculateRoutes();
          }}
          className="space-y-2"
        >
        {/* Origin (A) */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
          </div>
          <input
            type="text"
            value={originText}
            onChange={(e) => setOriginText(e.target.value)}
            placeholder="Enter starting point (or click pin)..."
            className={`w-full h-9 pl-8 pr-16 rounded-xl text-xs font-semibold focus:outline-none transition-all ${
              isSatellite
                ? "bg-white/15 border border-white/35 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/60"
                : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
            }`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPointPickingMode(pointPickingMode === "origin" ? null : "origin")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                pointPickingMode === "origin" 
                  ? "bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300" 
                  : isSatellite ? "text-white/80 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-slate-800 hover:bg-slate-200"
              }`}
              title="Click on map to set Origin (A)"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className={`p-1.5 rounded-lg text-xs transition-all ${
                isSatellite ? "text-white/80 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-slate-800 hover:bg-slate-200"
              }`}
              title="Use Current GPS Location"
            >
              <LocateFixed className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Destination (B) */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white shadow-sm" />
          </div>
          <input
            type="text"
            value={destText}
            onChange={(e) => setDestText(e.target.value)}
            placeholder="Enter destination (or click pin)..."
            className={`w-full h-9 pl-8 pr-16 rounded-xl text-xs font-semibold focus:outline-none transition-all ${
              isSatellite
                ? "bg-white/15 border border-white/35 text-white placeholder:text-white/70 focus:bg-white/25 focus:border-white/60"
                : "bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
            }`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPointPickingMode(pointPickingMode === "destination" ? null : "destination")}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                pointPickingMode === "destination" 
                  ? "bg-red-500 text-white shadow-md ring-2 ring-red-300" 
                  : isSatellite ? "text-white/80 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-slate-800 hover:bg-slate-200"
              }`}
              title="Click on map to set Destination (B)"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
            <button
              type="submit"
              className={`p-1.5 rounded-lg text-xs transition-all ${
                isSatellite ? "text-white/80 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-slate-800 hover:bg-slate-200"
              }`}
              title="Search Destination"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Travel Mode Selector */}
      <div className={`flex items-center justify-between p-1 rounded-xl text-xs ${subGlass}`}>
        {(["walking", "cycling", "driving"] as const).map((mode) => {
          const active = travelMode === mode;
          const labels = {
            walking: { icon: Footprints, label: "Walk" },
            cycling: { icon: Bike, label: "Cycle" },
            driving: { icon: Car, label: "Drive" },
          };
          const Icon = labels[mode].icon;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                active
                  ? isSatellite ? "bg-white text-slate-950 shadow-md font-extrabold" : "bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold"
                  : isSatellite ? "text-white hover:bg-white/20" : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{labels[mode].label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons: Compare Heat Exposure & Reset */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleCalculateRoutes()}
          disabled={isCalculatingRoutes || (!originText.trim() && !origin) || (!destText.trim() && !destination)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
            isSatellite
              ? "bg-white hover:bg-white/90 text-slate-950 font-extrabold shadow-lg"
              : "bg-slate-900 hover:bg-slate-800 text-white"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isCalculatingRoutes ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Corridors...</span>
            </>
          ) : (
            <>
              <span>Compare Heat Exposure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {hasActiveRoute && (
          <button
            type="button"
            onClick={handleClearRoute}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 shrink-0 ${
              isSatellite
                ? "bg-white/15 hover:bg-white/25 text-white border-white/35"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            }`}
            title="Clear active route & reset map"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Quick Verified City Corridors */}
      <div className="space-y-1.5 pt-1">
        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${textMuted}`}>
          Frequent {activeCity.name} Corridors
        </span>
        <div className="space-y-1">
          {activeCorridors.map((corridor, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyCorridor(corridor)}
              className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-semibold transition-all flex items-center justify-between border ${
                isSatellite
                  ? "bg-white/10 hover:bg-white/20 text-white border-white/25"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
              }`}
            >
              <span className="truncate">{corridor.name}</span>
              <span className={`text-[10px] font-mono font-bold ${isSatellite ? "text-amber-300" : "text-slate-500"}`}>
                Run →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Route Comparison Results */}
      {coolRoute && fastestRoute && (
        <div className={`space-y-3 pt-2.5 border-t ${border}`}>
          {/* Active Highlight Selector Indicator */}
          <div className={`text-[10px] font-mono font-bold flex items-center justify-between ${textMuted}`}>
            <span>MAP HIGHLIGHT:</span>
            <span className={`font-bold ${selectedRouteId === "cool" ? "text-emerald-400" : "text-amber-400"}`}>
              {selectedRouteId === "cool" ? "Solid Sapphire Blue (Cool)" : "Dashed Coral (Direct)"}
            </span>
          </div>

          {/* Dual Route Comparison Cards */}
          <div className="grid grid-cols-2 gap-2">
            {/* Direct Fastest Route Card */}
            <div
              onClick={() => setSelectedRouteId("fastest")}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                selectedRouteId === "fastest"
                  ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 shadow-md"
                  : isSatellite ? "bg-white/10 border-white/20 hover:bg-white/15 opacity-80" : "bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                <span className={isSatellite ? "text-amber-300" : "text-amber-700"}>DIRECT (GPS)</span>
                <Clock className="w-3 h-3 text-amber-400" />
              </div>

              <div className="mt-1.5">
                <div className={`text-base font-mono font-bold ${textPrimary}`}>
                  {formatSmartDuration(fastestRoute.durationSeconds)}
                </div>
                <span className={`text-[10px] font-mono ${textSecondary}`}>
                  {(fastestRoute.distanceMeters / 1000).toFixed(1)} km
                </span>
              </div>

              <div className={`mt-2 pt-2 border-t ${border} text-[10px] space-y-1 font-mono`}>
                <div className={`flex justify-between ${textSecondary}`}>
                  <span>Avg Temp:</span>
                  <span className="text-orange-500 font-bold">{formatTemp(fastestRoute.averageTempCelsius)}{unitSymbol}</span>
                </div>
                <div className={`flex justify-between ${textSecondary}`}>
                  <span>Peak Heat:</span>
                  <span className="text-red-500 font-bold">{formatTemp(fastestRoute.peakTempCelsius)}{unitSymbol}</span>
                </div>
                <div className="flex justify-between pt-0.5 font-bold">
                  <span className={textSecondary}>Exposure:</span>
                  <span className={
                    fastestRoute.averageTempCelsius < 27 
                      ? "text-emerald-400" 
                      : fastestRoute.averageTempCelsius < 33 
                      ? "text-teal-400" 
                      : fastestRoute.averageTempCelsius < 38 
                      ? "text-amber-400" 
                      : "text-red-400"
                  }>
                    {fastestRoute.averageTempCelsius < 27 
                      ? "Low Heat" 
                      : fastestRoute.averageTempCelsius < 33 
                      ? "Moderate" 
                      : fastestRoute.averageTempCelsius < 38 
                      ? "Elevated" 
                      : "High Heat"}
                  </span>
                </div>
              </div>
            </div>

            {/* Cool Recommended Route Card */}
            <div
              onClick={() => setSelectedRouteId("cool")}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                selectedRouteId === "cool"
                  ? "bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400 shadow-md"
                  : isSatellite ? "bg-white/10 border-white/20 hover:bg-white/15 opacity-80" : "bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-emerald-400">
                <span>{(fastestRoute.averageTempCelsius - coolRoute.averageTempCelsius) >= 0.5 ? "RECOMMENDED" : "ALTERNATE"}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>

              <div className="mt-1.5">
                <div className={`text-base font-mono font-bold ${textPrimary} flex items-baseline gap-1`}>
                  <span>{formatSmartDuration(coolRoute.durationSeconds)}</span>
                  <span className={`text-[10px] font-normal ${textMuted}`}>
                    {formatDurationDiff(coolRoute.durationSeconds, fastestRoute.durationSeconds)}
                  </span>
                </div>
                <span className={`text-[10px] font-mono ${textSecondary}`}>
                  {(coolRoute.distanceMeters / 1000).toFixed(1)} km
                </span>
              </div>

              <div className={`mt-2 pt-2 border-t ${border} text-[10px] space-y-1 font-mono`}>
                <div className={`flex justify-between ${textSecondary}`}>
                  <span>Avg Temp:</span>
                  <span className="text-emerald-400 font-bold">{formatTemp(coolRoute.averageTempCelsius)}{unitSymbol}</span>
                </div>
                <div className={`flex justify-between ${textSecondary}`}>
                  <span>Peak Heat:</span>
                  <span className="text-emerald-400 font-bold">{formatTemp(coolRoute.peakTempCelsius)}{unitSymbol}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-0.5 font-bold">
                  <span>Score:</span>
                  <span>{coolRoute.heatShieldScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Differential Exposure Summary Banner */}
          {coolRoute.exposureReductionPct > 0 && (fastestRoute.averageTempCelsius - coolRoute.averageTempCelsius) >= 0.5 ? (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isSatellite ? "bg-emerald-500/25 border-emerald-400/50 text-white" : "bg-emerald-50 border-emerald-200 text-emerald-950"
            }`}>
              <div className="flex items-center gap-2">
                <Trees className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-[11px]">
                  {coolRoute.exposureReductionPct}% Less Heat Exposure
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-300">
                -{formatDeltaTemp(fastestRoute.averageTempCelsius - coolRoute.averageTempCelsius)}{unitSymbol} Cooler
              </span>
            </div>
          ) : (
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isSatellite ? "bg-white/10 border-white/20 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-bold text-[11px]">
                  Balanced Thermal Corridor
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${isSatellite ? "text-white/70" : "text-slate-500"}`}>
                Both Paths Optimal
              </span>
            </div>
          )}

          {/* Turn-by-Turn Thermal Directions */}
          {activeRoute && activeRoute.steps && activeRoute.steps.length > 0 && (
            <div className={`space-y-2 border rounded-xl p-3 ${subGlass}`}>
              <button
                type="button"
                onClick={() => setIsDirectionsExpanded(!isDirectionsExpanded)}
                className={`w-full flex items-center justify-between text-xs font-bold ${textPrimary}`}
              >
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Turn-by-Turn Directions ({activeRoute.type === "cool_recommended" ? "Cool Corridor" : "Direct GPS"})</span>
                </div>
                {isDirectionsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isDirectionsExpanded && (
                <div className={`space-y-1.5 pt-2 border-t ${border} max-h-48 overflow-y-auto scrollbar-thin`}>
                  {activeRoute.steps.map((step, idx) => (
                    <div 
                      key={idx} 
                      className={`text-[11px] p-2 rounded-lg border space-y-1 ${
                        isSatellite ? "bg-white/10 border-white/20" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold leading-tight ${textPrimary}`}>
                          {idx + 1}. {step.instruction}
                        </span>
                        <span className={`text-[10px] font-mono shrink-0 ${textMuted}`}>
                          {step.distanceMeters}m ({formatSmartDuration(step.durationSeconds)})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                        <div className="flex items-center gap-1">
                          {step.isShaded ? (
                            <Trees className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Sun className="w-3 h-3 text-amber-400" />
                          )}
                          <span className={step.isShaded ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                            {step.heatAdvisory}
                          </span>
                        </div>
                        <span className={`font-bold ${step.isShaded ? "text-emerald-400" : "text-orange-400"}`}>
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
            <div className={`flex items-center justify-between text-[10px] font-mono font-bold ${textMuted}`}>
              <span>THERMAL ELEVATION PROFILE</span>
              <span>DISTANCE (KM)</span>
            </div>

            <div className={`relative w-full h-16 border rounded-xl overflow-hidden p-1 ${subGlass}`}>
              <svg 
                viewBox="0 0 400 56" 
                preserveAspectRatio="none" 
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="amberGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EA580C" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#EA580C" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* Direct Fastest Route Area & Line */}
                <path d={buildSvgPath(fastestRoute.thermalProfile, true)} fill="url(#amberGrad)" />
                <path 
                  d={buildSvgPath(fastestRoute.thermalProfile, false)} 
                  fill="none" 
                  stroke="#E87722" 
                  strokeWidth="2.5" 
                  strokeDasharray="5 3" 
                />

                {/* Cool Recommended Route Area & Line */}
                <path d={buildSvgPath(coolRoute.thermalProfile, true)} fill="url(#emeraldGrad)" />
                <path 
                  d={buildSvgPath(coolRoute.thermalProfile, false)} 
                  fill="none" 
                  stroke="#2CA099" 
                  strokeWidth="3" 
                />
              </svg>
            </div>

            <div className={`flex items-center justify-between text-[10px] font-mono font-bold pt-0.5 ${textSecondary}`}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed border-amber-400" /> Direct ({formatTemp(fastestRoute.peakTempCelsius)}{unitSymbol})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-emerald-400 rounded-xs" /> Cool ({formatTemp(coolRoute.peakTempCelsius)}{unitSymbol})
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
