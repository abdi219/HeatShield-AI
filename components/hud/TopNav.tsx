"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { CITY_PRESETS, findMatchingPilotCity } from "@/lib/constants";
import { ChevronDown, Search, Loader2 } from "lucide-react";

interface WeatherData {
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windSpeedKmh: number;
  uvIndex: number;
  condition: string;
  heatAdvisory: string;
}

export const TopNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    temperatureUnit,
    toggleTemperatureUnit,
    viewport,
    setViewport,
    selectedCity,
    setSelectedCity,
    setToastAlert,
    mapStyle,
    isAIAssistantOpen,
    setIsAIAssistantOpen,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const isSatellite = mapStyle === "satellite";

  // Fetch Live Weather whenever viewport changes significantly
  useEffect(() => {
    let isCancelled = false;

    const fetchLiveWeather = async () => {
      try {
        const res = await fetch(`/api/weather?lat=${viewport.lat.toFixed(3)}&lng=${viewport.lng.toFixed(3)}`);
        if (res.ok) {
          const data: WeatherData = await res.json();
          if (!isCancelled) {
            setWeather(data);
          }
        }
      } catch (err) {
        console.warn("Error fetching live city weather:", err);
      }
    };

    fetchLiveWeather();

    return () => {
      isCancelled = true;
    };
  }, [viewport.lat, viewport.lng]);

  // Keep dropdown in sync if viewport moves into another pilot city
  useEffect(() => {
    const matched = findMatchingPilotCity(viewport.lat, viewport.lng);
    if (matched && matched.name !== selectedCity) {
      setSelectedCity(matched.name);
    }
  }, [viewport.lat, viewport.lng, selectedCity, setSelectedCity]);

  // City Dropdown Change Handler
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);
    setToastAlert(null);

    const selected = CITY_PRESETS.find((c) => c.name === cityName);
    if (selected) {
      setViewport({
        lat: selected.lat,
        lng: selected.lng,
        zoom: selected.zoom,
      });
    }
  };

  // Search Submit Handler with Pilot Zone Verification
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data && data.results && data.results.length > 0) {
        const first = data.results[0];
        const lat = first.lat;
        const lng = first.lng;
        const displayName = first.name || searchQuery;

        const matchedPilot = findMatchingPilotCity(lat, lng, displayName);

        if (matchedPilot) {
          setSelectedCity(matchedPilot.name);
          setToastAlert(null);
          setViewport({
            lat,
            lng,
            zoom: 15.5,
          });
        } else {
          setToastAlert({
            message: "FortyGuard live thermal data is currently active in pilot regions (Phoenix, Miami, Austin, Las Vegas). Please select a pilot city to explore!",
            type: "warning",
            searchedQuery: searchQuery,
          });
          setViewport({
            lat,
            lng,
            zoom: 14.5,
          });
        }

        setSearchQuery("");
      } else {
        setToastAlert({
          message: `Location "${searchQuery}" not found. Please try searching for a street, park, or pilot city.`,
          type: "info",
        });
      }
    } catch (err) {
      console.warn("Geocoding search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === "fahrenheit") {
      return `${(tempC * 1.8 + 32).toFixed(1)}°F`;
    }
    return `${tempC.toFixed(1)}°C`;
  };

  return (
    <header className={`h-14 px-4 sm:px-6 flex items-center justify-between z-30 transition-all duration-300 shrink-0 ${
      isSatellite 
        ? "sat-glass-nav" 
        : "bg-white border-b border-slate-200 text-slate-900 shadow-sm"
    }`}>
      {/* Brand & Search Bar */}
      <div className="flex items-center gap-4 lg:gap-5 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold shadow-sm ${
            isSatellite ? "bg-white text-slate-950 font-extrabold shadow-md" : "bg-slate-900 text-white"
          }`}>
            HS
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-bold text-sm tracking-tight ${isSatellite ? "text-white" : "text-slate-900"}`}>
              HeatShield
            </span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
              isSatellite 
                ? "bg-white/20 text-white border-white/40" 
                : "bg-slate-100 text-slate-800 border-slate-200"
            }`}>
              AI
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden xl:flex items-center">
          <div className={`flex items-center h-9 px-3.5 rounded-full w-68 2xl:w-76 transition-all duration-200 shadow-sm ${
            isSatellite
              ? "bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/40 text-white placeholder:text-white/80 focus-within:bg-white/30 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/30"
              : "bg-slate-100/90 hover:bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-within:bg-white focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-900/5"
          }`}>
            {isSearching ? (
              <Loader2 className={`w-3.5 h-3.5 animate-spin shrink-0 mr-2.5 ${isSatellite ? "text-white" : "text-slate-400"}`} />
            ) : (
              <Search className={`w-3.5 h-3.5 shrink-0 mr-2.5 ${isSatellite ? "text-white" : "text-slate-500"}`} />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, park, or city..."
              className={`w-full bg-transparent text-xs font-semibold focus:outline-none ${
                isSatellite ? "text-white placeholder:text-white/80" : "text-slate-900 placeholder:text-slate-400"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className={`text-[11px] font-bold ml-1 ${isSatellite ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-800"}`}
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Segmented Navigation Tabs */}
      <nav className={`hidden md:flex items-center p-1 rounded-xl shrink-0 transition-all ${
        isSatellite 
          ? "bg-white/15 backdrop-blur-xl border border-white/30 shadow-md" 
          : "bg-slate-100 border border-slate-200"
      }`}>
        <button
          onClick={() => setActiveTab("map")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "map"
              ? isSatellite
                ? "bg-white text-slate-950 shadow-md font-extrabold"
                : "bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold"
              : isSatellite
                ? "text-white hover:bg-white/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Heat Map
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "routes"
              ? isSatellite
                ? "bg-white text-slate-950 shadow-md font-extrabold"
                : "bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold"
              : isSatellite
                ? "text-white hover:bg-white/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Cool Route Finder
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "simulator"
              ? isSatellite
                ? "bg-white text-slate-950 shadow-md font-extrabold"
                : "bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold"
              : isSatellite
                ? "text-white hover:bg-white/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          What-If Simulator
        </button>

        <button
          onClick={() => setActiveTab("docs")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "docs"
              ? isSatellite
                ? "bg-white text-slate-950 shadow-md font-extrabold"
                : "bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold"
              : isSatellite
                ? "text-white hover:bg-white/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          Documentation
        </button>
      </nav>

      {/* Right Controls: Weather Badge, City Selector, Unit Toggle, AI Assistant */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live Weather Badge */}
        {weather && (
          <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold shadow-sm ${
            isSatellite 
              ? "bg-white/15 backdrop-blur-xl border border-white/30 text-white" 
              : "bg-slate-100 border border-slate-200 text-slate-900"
          }`}>
            <span>{formatTemp(weather.tempC)}</span>
            <span className={isSatellite ? "text-white/60" : "text-slate-300"}>|</span>
            <span className={`text-[11px] ${isSatellite ? "text-white font-semibold" : "text-slate-600"}`}>
              Feels {formatTemp(weather.feelsLikeC)}
            </span>
            <span className={`${isSatellite ? "text-white/60" : "text-slate-300"} hidden 2xl:inline`}>|</span>
            <span className={`text-[11px] ${isSatellite ? "text-white/90" : "text-slate-600"} hidden 2xl:inline`}>
              {weather.humidityPct}% Hum
            </span>
            <span className={`${isSatellite ? "text-white/60" : "text-slate-300"} hidden 2xl:inline`}>|</span>
            <span className={`text-[10px] font-bold ${isSatellite ? "text-white/90" : "text-slate-600"} hidden 2xl:inline`}>
              UV {weather.uvIndex}
            </span>
          </div>
        )}

        {/* City Selector */}
        <div className="relative">
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className={`appearance-none rounded-lg px-3 py-1.5 pr-7 text-xs font-bold focus:outline-none cursor-pointer shadow-sm transition-all ${
              isSatellite
                ? "bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 text-white focus:ring-2 focus:ring-white/40"
                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-slate-900/10"
            }`}
          >
            {CITY_PRESETS.map((city) => (
              <option key={city.name} value={city.name} className="bg-slate-900 text-white">
                {city.name}, {city.state}
              </option>
            ))}
          </select>
          <ChevronDown className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${isSatellite ? "text-white" : "text-slate-500"}`} />
        </div>

        {/* Temperature Unit Toggle */}
        <button
          onClick={toggleTemperatureUnit}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shadow-sm transition-all ${
            isSatellite
              ? "bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 text-white"
              : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-800"
          }`}
          title="Toggle Celsius / Fahrenheit"
        >
          {temperatureUnit === "celsius" ? "°C" : "°F"}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
            isAIAssistantOpen
              ? "bg-slate-900 text-white border border-slate-900"
              : isSatellite
                ? "bg-white text-slate-950 shadow-md hover:bg-slate-100 font-extrabold"
                : "bg-slate-900 hover:bg-slate-800 text-white border border-slate-900"
          }`}
        >
          AI Assistant
        </button>
      </div>
    </header>
  );
};
