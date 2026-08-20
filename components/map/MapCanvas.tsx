"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { Plus, Minus } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon URL path 404s in Next.js bundlers
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

interface MapCanvasProps {
  onLocationSelect?: (lat: number, lng: number) => void;
}

const TILE_LAYERS = {
  streets: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

// Client-Side Spatial Cache for 0ms Instant Zoom Switching
const clientGridCache = new Map<string, GeoJSON.FeatureCollection>();

// 256-Step Opaque Color Palette Lookup Table (LUT)
function createGradientPalette(layerType: string): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const grad = ctx.createLinearGradient(0, 0, 0, 256);

  if (layerType === "heat_risk") {
    grad.addColorStop(0.0, "#2B82C9"); // Low Risk: Cool Blue (0-30)
    grad.addColorStop(0.35, "#2CA099"); // Moderate: Teal (30-50)
    grad.addColorStop(0.65, "#E87722"); // High: Orange (50-70)
    grad.addColorStop(0.85, "#D9381E"); // Very High: Red (70-85)
    grad.addColorStop(1.0, "#6B2D5C"); // Extreme: Dark Purple (85-100)
  } else if (layerType === "canopy_deficit") {
    grad.addColorStop(0.0, "#2CA099"); // Low Deficit (High Canopy): Teal
    grad.addColorStop(0.35, "#2B82C9"); // Moderate: Blue
    grad.addColorStop(0.70, "#E87722"); // High Deficit: Orange
    grad.addColorStop(1.0, "#D9381E"); // Severe Deficit: Red
  } else {
    // Surface Temperature (Official FortyGuard Scale)
    grad.addColorStop(0.0, "#2B82C9"); // 22°C - Cool Blue (#2B82C9)
    grad.addColorStop(0.30, "#2CA099"); // 28°C - Teal (#2CA099)
    grad.addColorStop(0.58, "#E87722"); // 33°C - Orange (#E87722)
    grad.addColorStop(0.80, "#D9381E"); // 38°C - Red (#D9381E)
    grad.addColorStop(1.0, "#6B2D5C"); // 43°C+ - Dark Purple (#6B2D5C)
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

// Offscreen Gaussian radial blur brush
function createRadialBrush(radius: number): HTMLCanvasElement {
  const size = radius * 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const center = radius;
  const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  grad.addColorStop(0.0, "rgba(0, 0, 0, 1.0)");
  grad.addColorStop(0.35, "rgba(0, 0, 0, 0.85)");
  grad.addColorStop(0.70, "rgba(0, 0, 0, 0.35)");
  grad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const clickPinRef = useRef<L.Marker | null>(null);
  const pointPickingModeRef = useRef<string | null>(null);
  const activeHeatLayerRef = useRef<string>("surface_temp");
  const isHeatmapVisibleRef = useRef<boolean>(true);
  const rawGridDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(14.5);
  const [hoverTelemetry, setHoverTelemetry] = useState<{
    x: number;
    y: number;
    temp: number;
    score: number;
    level: string;
  } | null>(null);

  const {
    activeTab,
    viewport,
    setViewport,
    selectedLocation,
    mapStyle,
    setMapStyle,
    isHeatmapVisible,
    toggleHeatmapVisibility,
    activeHeatLayer,
    fastestRoute,
    coolRoute,
    selectedRouteId,
    origin,
    destination,
    pointPickingMode,
    temperatureUnit,
    setOrigin,
    setDestination,
    setPointPickingMode,
  } = useAppStore();

  const isSatellite = mapStyle === "satellite";

  useEffect(() => {
    pointPickingModeRef.current = pointPickingMode;
  }, [pointPickingMode]);

  useEffect(() => {
    isHeatmapVisibleRef.current = isHeatmapVisible;
    if (canvasOverlayRef.current) {
      canvasOverlayRef.current.style.display = isHeatmapVisible ? "block" : "none";
    }
    requestHeatmapRedraw();
  }, [isHeatmapVisible]);

  /**
   * Hardware-Accelerated Canvas Heatmap Raster Engine
   */
  const drawHeatmap = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasOverlayRef.current;
    const geojson = rawGridDataRef.current;
    if (!map || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = map.getSize();
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x;
      canvas.height = size.y;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }

    ctx.clearRect(0, 0, size.x, size.y);

    if (!isHeatmapVisibleRef.current || !geojson || !geojson.features || geojson.features.length === 0) {
      return;
    }

    const zoom = map.getZoom();

    // Zoom-adaptive brush radius for seamless full-coverage blending without zebra stripes
    const baseRadius = zoom <= 11 ? 110 : zoom <= 13 ? 88 : zoom <= 15 ? 70 : 52;
    const brush = createRadialBrush(baseRadius);
    const brushHalf = baseRadius;

    const layerType = activeHeatLayerRef.current;

    // 1. Draw intensity accumulation buffer
    ctx.globalCompositeOperation = "source-over";

    geojson.features.forEach((feature) => {
      if (feature.geometry.type !== "Point") return;
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;

      const point = map.latLngToContainerPoint([lat, lng]);
      if (point.x < -brushHalf * 2 || point.x > size.x + brushHalf * 2 || point.y < -brushHalf * 2 || point.y > size.y + brushHalf * 2) {
        return;
      }

      let normalizedWeight = 0.55;
      if (layerType === "heat_risk") {
        const score = feature.properties?.hrsScore ?? 50;
        normalizedWeight = Math.max(0.15, Math.min(1.0, score / 100));
      } else if (layerType === "canopy_deficit") {
        const canopy = feature.properties?.canopyPct ?? 20;
        normalizedWeight = Math.max(0.15, Math.min(1.0, (100 - canopy) / 100));
      } else {
        const temp = feature.properties?.surfaceTemp ?? 34;
        normalizedWeight = Math.max(0.15, Math.min(1.0, (temp - 22) / 22));
      }

      ctx.globalAlpha = Math.min(1.0, normalizedWeight * 0.95);
      ctx.drawImage(brush, point.x - brushHalf, point.y - brushHalf);
    });

    // 2. Colorize alpha channel using 256-step Palette LUT
    const imgData = ctx.getImageData(0, 0, size.x, size.y);
    const pixels = imgData.data;
    const palette = createGradientPalette(layerType);

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha > 2) {
        const lutIndex = Math.min(255, Math.round(alpha)) * 4;
        pixels[i] = palette[lutIndex];         // R
        pixels[i + 1] = palette[lutIndex + 1]; // G
        pixels[i + 2] = palette[lutIndex + 2]; // B
        pixels[i + 3] = Math.round(Math.min(160, Math.max(70, alpha * 0.95))); // 0.60 Opacity
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, []);

  const requestHeatmapRedraw = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    animFrameIdRef.current = requestAnimationFrame(() => {
      drawHeatmap();
    });
  }, [drawHeatmap]);

  const resizeCanvas = useCallback(() => {
    const map = mapInstanceRef.current;
    const canvas = canvasOverlayRef.current;
    if (!map || !canvas) return;

    const size = map.getSize();
    if (canvas.width !== size.x || canvas.height !== size.y) {
      canvas.width = size.x;
      canvas.height = size.y;
      canvas.style.width = `${size.x}px`;
      canvas.style.height = `${size.y}px`;
    }
    requestHeatmapRedraw();
  }, [requestHeatmapRedraw]);

  // Load FortyGuard Microclimate Grid with Instant Client-Side Cache
  const loadHeatGrid = useCallback(async (map: L.Map) => {
    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const latBuffer = (ne.lat - sw.lat) * 0.35;
      const lngBuffer = (ne.lng - sw.lng) * 0.35;

      const swLat = Math.max(-85, sw.lat - latBuffer);
      const swLng = Math.max(-180, sw.lng - lngBuffer);
      const neLat = Math.min(85, ne.lat + latBuffer);
      const neLng = Math.min(180, ne.lng + lngBuffer);

      const cacheKey = `${swLat.toFixed(3)}_${swLng.toFixed(3)}_${neLat.toFixed(3)}_${neLng.toFixed(3)}`;

      // 0ms Instant Cache Hit
      if (clientGridCache.has(cacheKey)) {
        rawGridDataRef.current = clientGridCache.get(cacheKey)!;
        requestHeatmapRedraw();
        return;
      }

      setIsLoadingGrid(true);

      const res = await fetch(
        `/api/heat/grid?swLat=${swLat.toFixed(4)}&swLng=${swLng.toFixed(4)}&neLat=${neLat.toFixed(4)}&neLng=${neLng.toFixed(4)}`
      );

      if (!res.ok) return;
      const geojson: GeoJSON.FeatureCollection = await res.json();
      if (!geojson || !geojson.features || !geojson.features.length) return;

      clientGridCache.set(cacheKey, geojson);
      rawGridDataRef.current = geojson;
      requestHeatmapRedraw();
    } catch (err) {
      console.warn("Error rendering FortyGuard heat grid:", err);
    } finally {
      setIsLoadingGrid(false);
    }
  }, [requestHeatmapRedraw]);

  // Layer Switching Effect
  useEffect(() => {
    activeHeatLayerRef.current = activeHeatLayer;
    requestHeatmapRedraw();
  }, [activeHeatLayer, requestHeatmapRedraw]);

  /**
   * Unifies Map & Node Click Handling
   */
  const handleMapInteraction = useCallback((lat: number, lng: number) => {
    if (pointPickingModeRef.current === "origin") {
      setOrigin({
        name: `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
      });
      setPointPickingMode(null);
      return;
    }

    if (pointPickingModeRef.current === "destination") {
      setDestination({
        name: `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
      });
      setPointPickingMode(null);
      return;
    }

    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect, setOrigin, setDestination, setPointPickingMode]);

  // Smooth Zoom Controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Render Dual Route Lines
  const renderRoutes = useCallback((map: L.Map) => {
    if (!routeGroupRef.current) {
      routeGroupRef.current = L.layerGroup().addTo(map);
    }
    routeGroupRef.current.clearLayers();

    if (activeTab !== "routes" || (!fastestRoute && !coolRoute)) {
      return;
    }

    const isCoolSelected = selectedRouteId === "cool";

    if (fastestRoute && fastestRoute.geometry?.coordinates?.length) {
      const latlngs: L.LatLngTuple[] = fastestRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as L.LatLngTuple
      );

      L.polyline(latlngs, {
        color: "#FFFFFF",
        weight: !isCoolSelected ? 11 : 8,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      L.polyline(latlngs, {
        color: "#E87722",
        weight: !isCoolSelected ? 6 : 4,
        opacity: !isCoolSelected ? 1.0 : 0.75,
        dashArray: "6, 6",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);
    }

    if (coolRoute && coolRoute.geometry?.coordinates?.length) {
      const latlngs: L.LatLngTuple[] = coolRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as L.LatLngTuple
      );

      L.polyline(latlngs, {
        color: "#FFFFFF",
        weight: isCoolSelected ? 12 : 8.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      L.polyline(latlngs, {
        color: "#2B82C9",
        weight: isCoolSelected ? 7 : 4.5,
        opacity: isCoolSelected ? 1.0 : 0.75,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      const bounds = L.latLngBounds(latlngs);
      if (origin) bounds.extend([origin.lat, origin.lng]);
      if (destination) bounds.extend([destination.lat, destination.lng]);

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      map.fitBounds(bounds, {
        paddingTopLeft: isMobile ? [40, 40] : [420, 60],
        paddingBottomRight: isMobile ? [40, 40] : [60, 60],
        maxZoom: 16,
        animate: true,
      });
    }

    if (origin && typeof origin.lat === "number" && typeof origin.lng === "number") {
      const iconA = L.divIcon({
        className: "custom-marker-a",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#0F172A;color:#FFFFFF;font-weight:bold;font-size:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #FFFFFF;box-shadow:0 10px 15px -3px rgba(0,0,0,0.4);">A</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([origin.lat, origin.lng], { icon: iconA, interactive: false }).addTo(routeGroupRef.current);
    }

    if (destination && typeof destination.lat === "number" && typeof destination.lng === "number") {
      const iconB = L.divIcon({
        className: "custom-marker-b",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#D9381E;color:#FFFFFF;font-weight:bold;font-size:12px;display:flex;align-items:center;justify-content:center;border:2.5px solid #FFFFFF;box-shadow:0 10px 15px -3px rgba(0,0,0,0.4);">B</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([destination.lat, destination.lng], { icon: iconB, interactive: false }).addTo(routeGroupRef.current);
    }
  }, [activeTab, fastestRoute, coolRoute, selectedRouteId, origin, destination]);

  // Initialize Map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [viewport.lat, viewport.lng],
      zoom: viewport.zoom,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    const initialTileUrl = mapStyle === "satellite" ? TILE_LAYERS.satellite : TILE_LAYERS.streets;
    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const canvas = document.createElement("canvas");
    canvas.className = "leaflet-thermal-canvas";
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "400";
    mapContainerRef.current.appendChild(canvas);
    canvasOverlayRef.current = canvas;

    resizeCanvas();

    map.on("move", requestHeatmapRedraw);
    map.on("zoom", () => {
      setCurrentZoom(Number(map.getZoom().toFixed(1)));
      requestHeatmapRedraw();
    });
    map.on("resize", resizeCanvas);

    map.on("moveend", () => {
      const center = map.getCenter();
      setCurrentZoom(Number(map.getZoom().toFixed(1)));
      setViewport({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom(),
      });
      loadHeatGrid(map);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      handleMapInteraction(e.latlng.lat, e.latlng.lng);
    });

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      const geojson = rawGridDataRef.current;
      if (!geojson || !geojson.features || geojson.features.length === 0) {
        setHoverTelemetry(null);
        return;
      }

      const curLat = e.latlng.lat;
      const curLng = e.latlng.lng;

      let nearest: any = null;
      let minDist = Infinity;

      for (let i = 0; i < geojson.features.length; i++) {
        const f = geojson.features[i];
        if (f.geometry.type !== "Point") continue;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        const dist = Math.hypot(curLat - lat, curLng - lng);
        if (dist < minDist) {
          minDist = dist;
          nearest = f;
        }
      }

      if (nearest && minDist < 0.02) {
        setHoverTelemetry({
          x: e.containerPoint.x,
          y: e.containerPoint.y,
          temp: nearest.properties?.surfaceTemp ?? 34.5,
          score: nearest.properties?.hrsScore ?? 50,
          level: nearest.properties?.hrsLevel ?? "moderate",
        });
      } else {
        setHoverTelemetry(null);
      }
    });

    map.on("mouseout", () => {
      setHoverTelemetry(null);
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      resizeCanvas();
      loadHeatGrid(map);
    }, 100);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (canvasOverlayRef.current && canvasOverlayRef.current.parentNode) {
        canvasOverlayRef.current.parentNode.removeChild(canvasOverlayRef.current);
        canvasOverlayRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Style
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      const newUrl = mapStyle === "satellite" ? TILE_LAYERS.satellite : TILE_LAYERS.streets;
      tileLayerRef.current.setUrl(newUrl);
    }
  }, [mapStyle]);

  // Update Routes
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderRoutes(mapInstanceRef.current);
    }
  }, [renderRoutes]);

  // Handle City Switch FlyTo
  useEffect(() => {
    if (mapInstanceRef.current) {
      const curCenter = mapInstanceRef.current.getCenter();
      const dist = Math.hypot(curCenter.lat - viewport.lat, curCenter.lng - viewport.lng);
      if (dist > 0.005) {
        mapInstanceRef.current.flyTo([viewport.lat, viewport.lng], viewport.zoom, { duration: 1.2 });
        setTimeout(() => {
          if (mapInstanceRef.current) loadHeatGrid(mapInstanceRef.current);
        }, 1300);
      }
    }
  }, [viewport.lat, viewport.lng, viewport.zoom, loadHeatGrid]);

  // Selected Pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (clickPinRef.current) {
      clickPinRef.current.remove();
      clickPinRef.current = null;
    }

    if (activeTab === "map" && selectedLocation) {
      const pinIcon = L.divIcon({
        className: "custom-selected-pin",
        html: `<div style="width:32px;height:32px;border-radius:50%;background:#0F172A;color:#FFFFFF;display:flex;align-items:center;justify-content:center;border:2.5px solid #FFFFFF;box-shadow:0 10px 20px rgba(0,0,0,0.35);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      clickPinRef.current = L.marker([selectedLocation.lat, selectedLocation.lng], { icon: pinIcon }).addTo(
        mapInstanceRef.current
      );
    }
  }, [selectedLocation, activeTab]);

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === "fahrenheit") {
      return `${(tempC * 1.8 + 32).toFixed(1)}°F`;
    }
    return `${tempC.toFixed(1)}°C`;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-200 select-none">
      {/* Fullscreen Map Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Subtle Radar Sweep Scanner */}
      {isLoadingGrid && (
        <div className="radar-sweep-beam" />
      )}

      {/* Point Picking Mode Hint Banner */}
      {pointPickingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4.5 py-2 text-xs font-bold rounded-full shadow-2xl flex items-center gap-2 border bg-slate-900 text-white border-slate-700 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Click anywhere on the map to place {pointPickingMode === "origin" ? "Starting Point (A)" : "Destination (B)"}</span>
          <button
            onClick={() => setPointPickingMode(null)}
            className="ml-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] rounded text-slate-300 font-normal"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Hover HUD Tooltip */}
      {hoverTelemetry && !pointPickingMode && isHeatmapVisible && (
        <div
          className={`absolute z-[1000] pointer-events-none -translate-x-1/2 -translate-y-full flex items-center gap-2 font-mono text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xl ${
            isSatellite ? "sat-glass text-white" : "street-card text-slate-900"
          }`}
          style={{ left: `${hoverTelemetry.x}px`, top: `${hoverTelemetry.y}px` }}
        >
          <span>{formatTemp(hoverTelemetry.temp)}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span className="text-[11px] font-semibold">HRS {hoverTelemetry.score}</span>
          <span className={`text-[9px] font-bold uppercase px-1.5 rounded-full ${
            hoverTelemetry.score > 80 ? "bg-red-500 text-white" : hoverTelemetry.score > 50 ? "bg-amber-500 text-white" : "bg-sky-500 text-white"
          }`}>
            {hoverTelemetry.level}
          </span>
        </div>
      )}

      {/* Top-Right Controls: Heatmap Toggle & Map Switcher */}
      <div className="absolute top-4 right-5 z-[1000] flex items-center gap-2.5">
        {/* Heatmap Toggle */}
        <button
          onClick={toggleHeatmapVisibility}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-200 ${
            isHeatmapVisible
              ? isSatellite ? "bg-white text-slate-950 font-extrabold" : "bg-slate-900 text-white"
              : isSatellite ? "sat-glass text-white" : "street-card text-slate-800"
          }`}
          title="Toggle Thermal Heatmap Overlay"
        >
          {isHeatmapVisible ? "Heatmap: ON" : "Heatmap: OFF"}
        </button>

        {/* Street vs Satellite Switcher */}
        <div className={`flex items-center p-1 rounded-xl shadow-md ${
          isSatellite ? "sat-glass" : "street-card"
        }`}>
          <button
            onClick={() => setMapStyle("streets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mapStyle === "streets"
                ? "bg-slate-900 text-white"
                : isSatellite ? "text-white/85 hover:bg-white/20" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mapStyle === "satellite"
                ? "bg-white text-slate-950 font-extrabold"
                : isSatellite ? "text-white/85 hover:bg-white/20" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Zoom Controls (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-[1000] flex flex-col items-center gap-1.5">
        <div className={`flex flex-col overflow-hidden rounded-xl shadow-lg ${
          isSatellite ? "sat-glass" : "street-card"
        }`}>
          <button
            onClick={handleZoomIn}
            className={`w-9 h-9 flex items-center justify-center transition-colors border-b ${
              isSatellite ? "text-white hover:bg-white/20 border-white/20" : "text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`w-9 h-9 flex items-center justify-center transition-colors ${
              isSatellite ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-slate-100"
            }`}
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shadow-sm ${
          isSatellite ? "sat-glass text-white" : "street-card text-slate-800"
        }`}>
          {currentZoom.toFixed(1)}x
        </div>
      </div>

      {/* Status Bar (Bottom-Left) */}
      <div className={`absolute bottom-5 left-5 z-[1000] hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono shadow-sm ${
        isSatellite ? "sat-glass text-white" : "street-card text-slate-900"
      }`}>
        <span className="font-bold">
          {isHeatmapVisible ? "FortyGuard Thermal Engine" : "Base Map Mode"}
        </span>
        <span className={isSatellite ? "text-white/40" : "text-slate-300"}>|</span>
        <span className={isSatellite ? "text-white/85" : "text-slate-600"}>
          {viewport.lat.toFixed(4)}°N, {Math.abs(viewport.lng).toFixed(4)}°W
        </span>
        {isLoadingGrid && (
          <>
            <span className={isSatellite ? "text-white/40" : "text-slate-300"}>|</span>
            <span className="animate-pulse">Updating Grid...</span>
          </>
        )}
      </div>
    </div>
  );
};
