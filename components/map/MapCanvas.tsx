"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { MapPin, Globe, Map as MapIcon, RefreshCw } from "lucide-react";

interface MapCanvasProps {
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Crisp, Uniform 2x High-DPI Map Styles with Smooth Fade Transitions
const MAP_STYLES: Record<string, any> = {
  streets: {
    version: 8,
    sources: {
      "carto-positron": {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
          "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors, © CARTO",
      },
    },
    layers: [
      {
        id: "carto-positron-layer",
        type: "raster",
        source: "carto-positron",
        minzoom: 0,
        maxzoom: 22,
        paint: {
          "raster-fade-duration": 300,
        },
      },
    ],
  },
  satellite: {
    version: 8,
    sources: {
      "esri-satellite": {
        type: "raster",
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        maxzoom: 18,
        attribution: "© Esri, Maxar, Earthstar Geographics, USDA, USGS",
      },
    },
    layers: [
      {
        id: "esri-satellite-layer",
        type: "raster",
        source: "esri-satellite",
        minzoom: 0,
        maxzoom: 22,
        paint: {
          "raster-fade-duration": 300,
        },
      },
    ],
  },
};

export const MapCanvas: React.FC<MapCanvasProps> = ({ onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);

  const {
    viewport,
    setViewport,
    selectedLocation,
    mapStyle,
    setMapStyle,
  } = useAppStore();

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      try {
        const module = await import("maplibre-gl");
        const maplibregl = module.default || module;
        maplibreRef.current = maplibregl;

        if (!isMounted || !mapContainerRef.current) return;

        const targetStyle = mapStyle === "satellite" ? MAP_STYLES.satellite : MAP_STYLES.streets;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: targetStyle,
          center: [viewport.lng, viewport.lat],
          zoom: viewport.zoom,
          minZoom: 3,
          maxZoom: 19,
          fadeDuration: 300,
          pitch: 0,
          bearing: 0,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

        map.on("load", () => {
          map.resize();
          loadHeatGridLayer(map);
        });

        setTimeout(() => {
          if (map) map.resize();
        }, 150);

        map.on("moveend", () => {
          const center = map.getCenter();
          setViewport({
            lat: center.lat,
            lng: center.lng,
            zoom: map.getZoom(),
          });
          loadHeatGridLayer(map);
        });

        map.on("click", (e: any) => {
          if (onLocationSelect) {
            onLocationSelect(e.lngLat.lat, e.lngLat.lng);
          }
        });

        mapRef.current = map;
      } catch (err) {
        console.error("Map initialization error:", err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fetch FortyGuard Thermal Grid and Overlay on Canvas
  const loadHeatGridLayer = async (mapInstance: any) => {
    if (!mapInstance) return;

    const bounds = mapInstance.getBounds();
    if (!bounds) return;

    const swLat = bounds.getSouth();
    const swLng = bounds.getWest();
    const neLat = bounds.getNorth();
    const neLng = bounds.getEast();

    try {
      setIsLoadingGrid(true);
      const res = await fetch(
        `/api/heat/grid?swLat=${swLat.toFixed(4)}&swLng=${swLng.toFixed(4)}&neLat=${neLat.toFixed(4)}&neLng=${neLng.toFixed(4)}`
      );

      if (!res.ok) throw new Error("Failed to fetch heat grid");
      const geojson = await res.json();

      const sourceId = "fortyguard-heat-source";
      const layerId = "fortyguard-heat-layer";

      if (mapInstance.getSource(sourceId)) {
        mapInstance.getSource(sourceId).setData(geojson);
      } else {
        mapInstance.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        mapInstance.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              12, 10,
              15, 24,
              18, 48
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "surfaceTemp"],
              24, "#0284C7",
              30, "#0D9488",
              34, "#D97706",
              38, "#EA580C",
              42, "#DC2626",
              46, "#991B1B"
            ],
            "circle-opacity": 0.45,
            "circle-blur": 0.6,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": [
              "interpolate",
              ["linear"],
              ["get", "surfaceTemp"],
              24, "#0284C7",
              30, "#0D9488",
              34, "#D97706",
              38, "#EA580C",
              42, "#DC2626"
            ],
            "circle-stroke-opacity": 0.65,
          },
        });
      }
    } catch (error) {
      console.warn("Could not refresh heat grid overlay:", error);
    } finally {
      setIsLoadingGrid(false);
    }
  };

  // Handle Dynamic Map Style Switching (Street vs Satellite)
  useEffect(() => {
    if (mapRef.current) {
      const targetStyle = mapStyle === "satellite" ? MAP_STYLES.satellite : MAP_STYLES.streets;
      mapRef.current.setStyle(targetStyle);
      mapRef.current.once("style.load", () => {
        if (mapRef.current) {
          mapRef.current.resize();
          loadHeatGridLayer(mapRef.current);
        }
      });
    }
  }, [mapStyle]);

  // Handle Viewport FlyTo upon City Selection
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

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 select-none">
      {/* Fullscreen Map Canvas */}
      <div 
        ref={mapContainerRef} 
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Map Style Switcher (Top-Right) */}
      <div className="absolute top-4 right-5 z-20 flex items-center p-1 rounded-lg panel-white space-x-1 shadow-md">
        <button
          onClick={() => setMapStyle("streets")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mapStyle === "streets"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-ink-secondary hover:text-ink-primary hover:bg-slate-50"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Street Map</span>
        </button>

        <button
          onClick={() => setMapStyle("satellite")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            mapStyle === "satellite"
              ? "bg-slate-900 text-white shadow-sm"
              : "text-ink-secondary hover:text-ink-primary hover:bg-slate-50"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Satellite Aerial</span>
        </button>
      </div>

      {/* Selected Location Pin Indicator on Map */}
      {selectedLocation && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900/40 -mt-1" />
        </div>
      )}

      {/* Live Data Resolution Indicator (Bottom-Left) */}
      <div className="absolute bottom-5 left-5 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-md panel-white text-xs text-ink-secondary font-mono shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>FortyGuard Grid 25m</span>
        </div>
        <span className="text-border-active">|</span>
        <span className="text-ink-primary font-medium">{viewport.lat.toFixed(4)}°N, {Math.abs(viewport.lng).toFixed(4)}°W</span>
        {isLoadingGrid && (
          <>
            <span className="text-border-active">|</span>
            <span className="flex items-center gap-1 text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Updating...</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
