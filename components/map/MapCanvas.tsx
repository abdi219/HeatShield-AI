"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useAppStore } from "@/lib/store";
import { Crosshair, MapPin, Globe, Map as MapIcon } from "lucide-react";

interface MapCanvasProps {
  onLocationSelect?: (lat: number, lng: number) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  const {
    viewport,
    setViewport,
    selectedLocation,
    mapStyle,
    setMapStyle,
  } = useAppStore();

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || token.includes("your_mapbox") || token.length < 15) {
      setTokenMissing(true);
      return;
    }

    try {
      mapboxgl.accessToken = token;
      if (!mapContainerRef.current) return;

      const styleUrl = mapStyle === 'satellite' 
        ? "mapbox://styles/mapbox/satellite-streets-v12"
        : "mapbox://styles/mapbox/light-v11";

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: [viewport.lng, viewport.lat],
        zoom: viewport.zoom,
        pitch: viewport.pitch,
        bearing: viewport.bearing,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");

      map.on("moveend", () => {
        const center = map.getCenter();
        setViewport({
          lat: center.lat,
          lng: center.lng,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        });
      });

      map.on("click", (e) => {
        if (onLocationSelect) {
          onLocationSelect(e.lngLat.lat, e.lngLat.lng);
        }
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.warn("Mapbox initialization:", err);
      setTokenMissing(true);
    }
  }, []);

  // Handle dynamic map style switching (Standard Light Vector vs Satellite Aerial)
  useEffect(() => {
    if (mapRef.current) {
      const styleUrl = mapStyle === 'satellite'
        ? "mapbox://styles/mapbox/satellite-streets-v12"
        : "mapbox://styles/mapbox/light-v11";
      mapRef.current.setStyle(styleUrl);
    }
  }, [mapStyle]);

  // Handle external viewport updates (e.g. city selector)
  useEffect(() => {
    if (mapRef.current) {
      const currentCenter = mapRef.current.getCenter();
      const dist = Math.abs(currentCenter.lat - viewport.lat) + Math.abs(currentCenter.lng - viewport.lng);
      if (dist > 0.005) {
        mapRef.current.flyTo({
          center: [viewport.lng, viewport.lat],
          zoom: viewport.zoom,
          duration: 1200,
          essential: true,
        });
      }
    }
  }, [viewport.lat, viewport.lng, viewport.zoom]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const yRatio = (e.clientY - rect.top) / rect.height;

    const lat = viewport.lat + (0.5 - yRatio) * 0.03;
    const lng = viewport.lng + (xRatio - 0.5) * 0.03;

    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-canvas-base select-none">
      {/* Live Mapbox Vector / Satellite Container */}
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* Map Style Switcher (Top-Center Right) */}
      <div className="absolute top-4 right-5 z-20 hidden sm:flex items-center p-1 rounded-lg panel-white space-x-1 shadow-sm">
        <button
          onClick={() => setMapStyle('streets')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mapStyle === 'streets'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-50'
          }`}
          title="Switch to Clean Street Map"
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Street Map</span>
        </button>

        <button
          onClick={() => setMapStyle('satellite')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            mapStyle === 'satellite'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-ink-secondary hover:text-ink-primary hover:bg-slate-50'
          }`}
          title="Switch to High-Resolution Satellite Aerial View"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite Aerial</span>
        </button>
      </div>

      {/* Clean Cartesian Cartography Fallback when Mapbox Token is pending */}
      {tokenMissing && (
        <div 
          onClick={handleCanvasClick}
          className="absolute inset-0 z-10 w-full h-full bg-carto-grid cursor-crosshair flex flex-col items-center justify-center p-6"
        >
          <div className="text-center max-w-md p-6 rounded-lg panel-white space-y-3 pointer-events-auto">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-border-subtle flex items-center justify-center mx-auto text-slate-700">
              <Crosshair className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-ink-primary">Cartographic Canvas Ready</h3>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                Click anywhere on the coordinate grid to inspect microclimate thermal exposure, or enter your Mapbox token in <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded border border-border-subtle text-[11px]">.env.local</code> to render live vector and satellite aerial tiles.
              </p>
            </div>

            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-ink-tertiary">
              <span>Center: {viewport.lat.toFixed(4)}°N, {Math.abs(viewport.lng).toFixed(4)}°W</span>
              <span className="text-slate-900 font-medium">Click to Inspect</span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Location Pin Indicator on Canvas */}
      {selectedLocation && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center"
        >
          <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div className="w-2 h-2 rounded-full bg-slate-900/30 mt-1" />
        </div>
      )}

      {/* Coordinate & Grid Status Tag (Bottom Left) */}
      <div className="absolute bottom-5 left-5 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-md panel-white text-xs text-ink-secondary font-mono">
        <span>GRID: 25M RESOLUTION</span>
        <span className="text-border-active">|</span>
        <span className="text-ink-primary font-medium">{viewport.lat.toFixed(4)}°N, {Math.abs(viewport.lng).toFixed(4)}°W</span>
      </div>
    </div>
  );
};
