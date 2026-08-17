"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store";
import { CITY_PRESETS } from "@/lib/constants";
import { 
  Map as MapIcon, 
  Navigation, 
  Sparkles, 
  BookOpen, 
  Bot, 
  ChevronDown,
  Search,
  Loader2
} from "lucide-react";

export const TopNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    temperatureUnit,
    toggleTemperatureUnit,
    setViewport,
    isAIAssistantOpen,
    setIsAIAssistantOpen,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = CITY_PRESETS.find((c) => c.name === e.target.value);
    if (selected) {
      setViewport({
        lat: selected.lat,
        lng: selected.lng,
        zoom: selected.zoom,
      });
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        setViewport({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          zoom: 15,
        });
        setSearchQuery("");
      }
    } catch (err) {
      console.warn("Geocoding search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="h-14 px-5 bg-white border-b border-border-subtle flex items-center justify-between z-30 shadow-card">
      {/* Brand & Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white font-mono text-xs font-bold">
            HS
          </div>
          <span className="font-semibold text-sm tracking-tight text-ink-primary">
            HeatShield
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            AI
          </span>
        </div>

        {/* Global Geographic Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden xl:flex items-center relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address, neighborhood, or city..."
            className="w-72 h-8 pl-8 pr-3 bg-canvas-subtle border border-border-subtle hover:border-border-active rounded-md text-xs text-ink-primary placeholder:text-ink-faded focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
          />
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
          )}
        </form>
      </div>

      {/* Structured Segmented Navigation */}
      <nav className="hidden md:flex items-center p-1 rounded-lg bg-canvas-subtle border border-border-subtle">
        <button
          onClick={() => setActiveTab("map")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "map"
              ? "bg-white text-ink-primary shadow-sm border border-border-subtle"
              : "text-ink-secondary hover:text-ink-primary hover:bg-white/50"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5 text-slate-600" />
          <span>Heat Map</span>
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "routes"
              ? "bg-white text-ink-primary shadow-sm border border-border-subtle"
              : "text-ink-secondary hover:text-ink-primary hover:bg-white/50"
          }`}
        >
          <Navigation className="w-3.5 h-3.5 text-slate-600" />
          <span>Cool Route Finder</span>
        </button>

        <button
          onClick={() => setActiveTab("simulator")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "simulator"
              ? "bg-white text-ink-primary shadow-sm border border-border-subtle"
              : "text-ink-secondary hover:text-ink-primary hover:bg-white/50"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-600" />
          <span>What-If Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === "docs"
              ? "bg-white text-ink-primary shadow-sm border border-border-subtle"
              : "text-ink-secondary hover:text-ink-primary hover:bg-white/50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
          <span>Documentation</span>
        </button>
      </nav>

      {/* Actions: City Select, Unit Toggle, AI Trigger */}
      <div className="flex items-center gap-2.5">
        {/* City Selector */}
        <div className="relative">
          <select
            onChange={handleCityChange}
            className="appearance-none bg-white border border-border-subtle hover:border-border-active rounded-md px-3 py-1.5 pr-7 text-xs font-medium text-ink-primary focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer shadow-sm"
          >
            {CITY_PRESETS.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}, {city.state}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Temperature Unit Toggle */}
        <button
          onClick={toggleTemperatureUnit}
          className="px-2.5 py-1.5 rounded-md bg-white border border-border-subtle hover:bg-slate-50 text-xs font-mono font-medium text-ink-secondary hover:text-ink-primary shadow-sm transition-colors"
          title="Toggle Celsius / Fahrenheit"
        >
          {temperatureUnit === "celsius" ? "°C" : "°F"}
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border shadow-sm transition-colors ${
            isAIAssistantOpen
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-ink-primary border-border-subtle hover:bg-slate-50"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    </header>
  );
};
