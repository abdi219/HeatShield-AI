"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { getMockHeatGrid } from "@/lib/fortyguard";
import { Plus, Minus, X } from "lucide-react";
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

const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY || "cb1_2h12_1_538b4d3c848f9eef7624a175";

const TILE_LAYERS = {
  streets: `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

// Client-Side Spatial Cache for 0ms Instant Zoom Switching
const clientGridCache = new Map<string, GeoJSON.FeatureCollection>();

/**
 * Spatial feature accumulator: merges new spatial features with existing loaded points
 * to guarantee continuous coverage without blank holes or border dropoffs.
 */
function mergeSpatialFeatures(
  current: GeoJSON.Feature[],
  incoming: GeoJSON.Feature[],
  maxFeatures = 4000
): GeoJSON.Feature[] {
  const map = new Map<string, GeoJSON.Feature>();

  for (let i = 0; i < current.length; i++) {
    const f = current[i];
    if (f.geometry.type === "Point") {
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
      map.set(`${lat.toFixed(4)}_${lng.toFixed(4)}`, f);
    }
  }

  for (let i = 0; i < incoming.length; i++) {
    const f = incoming[i];
    if (f.geometry.type === "Point") {
      const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
      map.set(`${lat.toFixed(4)}_${lng.toFixed(4)}`, f);
    }
  }

  const result = Array.from(map.values());
  if (result.length > maxFeatures) {
    return result.slice(result.length - maxFeatures);
  }
  return result;
}

// 256-Step Opaque Color Palette Lookup Table (LUT)
function createGradientPalette(layerType: string): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(256 * 4);

  const grad = ctx.createLinearGradient(0, 0, 0, 256);

  if (layerType === "heat_risk") {
    grad.addColorStop(0.0, "#2B82C9"); // 0–30: Low Risk Cool Blue
    grad.addColorStop(0.35, "#2CA099"); // 30–50: Moderate Teal
    grad.addColorStop(0.65, "#E87722"); // 50–70: High Orange
    grad.addColorStop(0.85, "#D9381E"); // 70–85: Severe Red
    grad.addColorStop(1.0, "#6B2D5C"); // 85–100: Extreme Dark Purple
  } else if (layerType === "canopy_deficit") {
    grad.addColorStop(0.0, "#2CA099"); // Dense Canopy (Low Deficit): Teal
    grad.addColorStop(0.35, "#2B82C9"); // Moderate: Blue
    grad.addColorStop(0.70, "#E87722"); // High Deficit: Orange
    grad.addColorStop(1.0, "#D9381E"); // Severe Deficit: Red
  } else {
    // Surface Temperature (Official FortyGuard Scale)
    grad.addColorStop(0.0, "#2B82C9"); // 20–24°C: Cool Baseline Blue
    grad.addColorStop(0.28, "#2CA099"); // 27°C: Temperate Teal
    grad.addColorStop(0.54, "#E87722"); // 33°C: Moderate Orange
    grad.addColorStop(0.75, "#D9381E"); // 38°C: High Heat Red
    grad.addColorStop(1.0, "#6B2D5C"); // 43°C+: Extreme Deep Purple
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 256);
  return ctx.getImageData(0, 0, 1, 256).data;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const simulationGroupRef = useRef<L.LayerGroup | null>(null);
  const clickPinRef = useRef<L.Marker | null>(null);
  const pointPickingModeRef = useRef<string | null>(null);
  const activeHeatLayerRef = useRef<string>("surface_temp");
  const isHeatmapVisibleRef = useRef<boolean>(true);
  const rawGridDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastFittedRouteKeyRef = useRef<string>("");

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
    simulationResult,
    simulationVisualizationMode,
    setOrigin,
    setDestination,
    setPointPickingMode,
    clearRoutes,
    clearCalculatedRoutes,
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
   * Mathematically-Grounded Weighted Spatial Field Heatmap Engine
   * Eliminates alpha-stacking distortion: preserves true physical temperatures across dense point clusters.
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

    // Adaptive performance downscaling: Capped at ~220px offscreen resolution on 4K/1080p desktop monitors
    const maxDimension = Math.max(size.x, size.y);
    const targetOffDim = Math.min(220, Math.max(80, Math.round(maxDimension * 0.18)));
    const scale = targetOffDim / maxDimension;
    const offWidth = Math.max(64, Math.round(size.x * scale));
    const offHeight = Math.max(64, Math.round(size.y * scale));
    const totalCells = offWidth * offHeight;

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement("canvas");
    }
    const offCanvas = offscreenCanvasRef.current;
    if (offCanvas.width !== offWidth || offCanvas.height !== offHeight) {
      offCanvas.width = offWidth;
      offCanvas.height = offHeight;
    }
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    const valSum = new Float32Array(totalCells);
    const weightSum = new Float32Array(totalCells);

    // Continuous liquid field radius calculation:
    const nodeDistOff = (offWidth * 3.0) / 42;
    const radiusOff = Math.max(14, Math.round(nodeDistOff * 1.85));
    const radiusOff2 = radiusOff * radiusOff;
    const sigma2 = 2 * (radiusOff * 0.60) * (radiusOff * 0.60);

    // Precomputed Gaussian LUT (Lookup Table): eliminates expensive Math.exp calls in inner hot loop
    const gaussianLUT = new Float32Array(radiusOff2 + 1);
    for (let r2 = 0; r2 <= radiusOff2; r2++) {
      gaussianLUT[r2] = Math.exp(-r2 / sigma2);
    }

    const layerType = activeHeatLayerRef.current;

    // 1. Accumulate Weighted Field (Value * Weight and Weight)
    geojson.features.forEach((feature) => {
      if (feature.geometry.type !== "Point") return;
      const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;

      const pt = map.latLngToContainerPoint([lat, lng]);
      const cx = Math.round(pt.x * scale);
      const cy = Math.round(pt.y * scale);

      if (cx < -radiusOff || cx >= offWidth + radiusOff || cy < -radiusOff || cy >= offHeight + radiusOff) {
        return;
      }

      let normVal = 0.5;
      const isSimActive = activeTab === "simulator" && simulationResult && simulationVisualizationMode !== "baseline";
      let coolingDecay = 0;

      if (isSimActive && simulationResult) {
        const simCenterLat = selectedLocation ? selectedLocation.lat : viewport.lat;
        const simCenterLng = selectedLocation ? selectedLocation.lng : viewport.lng;
        const simRadius = simulationResult.estimatedCoolingRadiusMeters || 350;
        const dLat = (lat - simCenterLat) * 111320;
        const dLng = (lng - simCenterLng) * (111320 * Math.cos((simCenterLat * Math.PI) / 180));
        const distFromCenter = Math.hypot(dLat, dLng);
        if (distFromCenter <= simRadius) {
          coolingDecay = Math.cos((distFromCenter / simRadius) * (Math.PI / 2));
        }
      }

      if (layerType === "heat_risk") {
        let score = feature.properties?.hrsScore ?? 50;
        if (isSimActive && coolingDecay > 0 && simulationResult) {
          score = Math.max(10, score - simulationResult.heatRiskScoreReductionDelta * coolingDecay);
        }
        normVal = Math.max(0, Math.min(1.0, score / 100));
      } else if (layerType === "canopy_deficit") {
        let canopy = feature.properties?.canopyPct ?? 20;
        if (isSimActive && coolingDecay > 0 && simulationResult) {
          canopy = Math.min(95, canopy + simulationResult.interventions.treeCanopyCoveragePct * 0.7 * coolingDecay);
        }
        normVal = Math.max(0, Math.min(1.0, (100 - canopy) / 100));
      } else {
        let temp = feature.properties?.surfaceTemp ?? 32;
        if (isSimActive && coolingDecay > 0 && simulationResult) {
          if (simulationVisualizationMode === "delta") {
            const coolingDrop = simulationResult.temperatureReductionDelta * coolingDecay;
            temp = Math.max(20, 36 - coolingDrop * 2.8); // Highlight active cooling zone in delta view
          } else {
            temp = Math.max(20, temp - simulationResult.temperatureReductionDelta * coolingDecay);
          }
        }
        normVal = Math.max(0, Math.min(1.0, (temp - 20) / 24)); // 20°C (0.0) -> 44°C (1.0)
      }

      const minX = Math.max(0, cx - radiusOff);
      const maxX = Math.min(offWidth - 1, cx + radiusOff);
      const minY = Math.max(0, cy - radiusOff);
      const maxY = Math.min(offHeight - 1, cy + radiusOff);

      for (let y = minY; y <= maxY; y++) {
        const dy = y - cy;
        const dy2 = dy * dy;
        const rowOffset = y * offWidth;
        for (let x = minX; x <= maxX; x++) {
          const dx = x - cx;
          const dist2 = dx * dx + dy2;
          if (dist2 <= radiusOff2) {
            const w = gaussianLUT[dist2];
            const idx = rowOffset + x;
            valSum[idx] += normVal * w;
            weightSum[idx] += w;
          }
        }
      }
    });

    // 2. Colorize using True Normalized Value (valSum / weightSum)
    const imgData = offCtx.createImageData(offWidth, offHeight);
    const pixels = imgData.data;
    const palette = createGradientPalette(layerType);

    for (let i = 0; i < totalCells; i++) {
      const w = weightSum[i];
      if (w > 0.008) {
        const normalizedVal = valSum[i] / w;
        const lutIndex = Math.min(255, Math.max(0, Math.round(normalizedVal * 255))) * 4;
        const pIdx = i * 4;
        pixels[pIdx] = palette[lutIndex];
        pixels[pIdx + 1] = palette[lutIndex + 1];
        pixels[pIdx + 2] = palette[lutIndex + 2];
        pixels[pIdx + 3] = Math.round(Math.min(160, Math.max(65, Math.min(1.0, w * 1.3) * 155))); // 0.60 Opacity with smooth edges
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    // 3. Bilinear Upscaling to Full Map Canvas
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(offCanvas, 0, 0, size.x, size.y);
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

  // Load Microclimate Grid Dynamically for Current Viewport + 2.0x Buffer (Task 2.1)
  const loadHeatGrid = useCallback((map: L.Map) => {
    try {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const latSpan = Math.max(0.003, ne.lat - sw.lat);
      const lngSpan = Math.max(0.003, ne.lng - sw.lng);

      // Generous 2.0x buffer (100% extra padding in all 4 directions around screen)
      const swLat = Math.max(-85, sw.lat - latSpan);
      const swLng = Math.max(-180, sw.lng - lngSpan);
      const neLat = Math.min(85, ne.lat + latSpan);
      const neLng = Math.min(180, ne.lng + lngSpan);

      // Generate synchronous grid for the active viewport + buffer
      const geojson = getMockHeatGrid(swLat, swLng, neLat, neLng);
      rawGridDataRef.current = geojson;
      requestHeatmapRedraw();
    } catch (err) {
      console.warn("Error rendering heat grid:", err);
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
    const currentMode = useAppStore.getState().pointPickingMode;
    if (currentMode === "origin") {
      const tempName = `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      clearCalculatedRoutes();
      setOrigin({
        name: tempName,
        lat,
        lng,
      });
      setPointPickingMode(null);

      // Asynchronously resolve human-readable street name
      fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.address) {
            setOrigin({ name: data.address, lat, lng });
          }
        })
        .catch(() => { });
      return;
    }

    if (currentMode === "destination") {
      const tempName = `Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      clearCalculatedRoutes();
      setDestination({
        name: tempName,
        lat,
        lng,
      });
      setPointPickingMode(null);

      // Asynchronously resolve human-readable street name
      fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.address) {
            setDestination({ name: data.address, lat, lng });
          }
        })
        .catch(() => { });
      return;
    }

    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect, setOrigin, setDestination, setPointPickingMode, clearCalculatedRoutes]);

  const handleMapInteractionRef = useRef(handleMapInteraction);
  useEffect(() => {
    handleMapInteractionRef.current = handleMapInteraction;
  });

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

  // Render Dual Route Lines and Point (A)/(B) Markers
  const renderRoutes = useCallback((map: L.Map) => {
    if (!map) return;

    if (!routeGroupRef.current || !map.hasLayer(routeGroupRef.current)) {
      if (routeGroupRef.current) {
        routeGroupRef.current.clearLayers();
        try { map.removeLayer(routeGroupRef.current); } catch { }
      }
      routeGroupRef.current = L.layerGroup().addTo(map);
    } else {
      routeGroupRef.current.clearLayers();
    }

    // 1. Always Render Origin Pin (A) if available
    if (origin && typeof origin.lat === "number" && typeof origin.lng === "number") {
      const iconA = L.divIcon({
        className: "custom-marker-a",
        html: `<div style="position:relative;width:32px;height:32px;border-radius:50%;background:#0F172A;color:#FFFFFF;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;border:3px solid #FFFFFF;box-shadow:0 8px 24px rgba(0,0,0,0.6);"><span style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #38BDF8;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.6;"></span>A</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([origin.lat, origin.lng], { icon: iconA, interactive: false, zIndexOffset: 1000 }).addTo(routeGroupRef.current);
    }

    // 2. Always Render Destination Pin (B) if available
    if (destination && typeof destination.lat === "number" && typeof destination.lng === "number") {
      const iconB = L.divIcon({
        className: "custom-marker-b",
        html: `<div style="position:relative;width:32px;height:32px;border-radius:50%;background:#D9381E;color:#FFFFFF;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;border:3px solid #FFFFFF;box-shadow:0 8px 24px rgba(217,56,30,0.7);"><span style="position:absolute;inset:-4px;border-radius:50%;border:2px solid #F87171;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;opacity:0.6;"></span>B</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([destination.lat, destination.lng], { icon: iconB, interactive: false, zIndexOffset: 1000 }).addTo(routeGroupRef.current);
    }

    // If pointPickingMode is active (user is currently selecting/changing a pin),
    // or if either origin/destination is missing, or if no calculated routes exist,
    // do NOT draw old disconnected route polylines!
    if (pointPickingMode || !origin || !destination || (!fastestRoute && !coolRoute)) {
      if (origin && destination && !pointPickingMode) {
        const bounds = L.latLngBounds([[origin.lat, origin.lng], [destination.lat, destination.lng]]);
        map.fitBounds(bounds, { paddingTopLeft: [420, 60], paddingBottomRight: [60, 60], maxZoom: 15, animate: true });
      }
      return;
    }

    const isCoolSelected = selectedRouteId === "cool";
    let allRouteCoords: L.LatLngTuple[] = [];

    // 3. Render Direct (Fastest GPS) Route Polylines
    if (fastestRoute && fastestRoute.geometry?.coordinates?.length) {
      const latlngs: L.LatLngTuple[] = fastestRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as L.LatLngTuple
      );
      allRouteCoords = allRouteCoords.concat(latlngs);

      // Outer White Casing
      L.polyline(latlngs, {
        color: "#FFFFFF",
        weight: !isCoolSelected ? 8.5 : 6,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      // Inner Dashed Hot Coral Polyline
      const fastestLine = L.polyline(latlngs, {
        color: "#E87722",
        weight: !isCoolSelected ? 5.5 : 3.5,
        opacity: !isCoolSelected ? 1.0 : 0.7,
        dashArray: "6, 6",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      fastestLine.on("click", () => {
        useAppStore.getState().setSelectedRouteId("fastest");
      });
    }

    // 4. Render Cool Recommended Route Polylines
    if (coolRoute && coolRoute.geometry?.coordinates?.length) {
      const latlngs: L.LatLngTuple[] = coolRoute.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as L.LatLngTuple
      );
      allRouteCoords = allRouteCoords.concat(latlngs);

      // Outer White Casing
      L.polyline(latlngs, {
        color: "#FFFFFF",
        weight: isCoolSelected ? 9 : 6.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      // Inner Solid Sapphire Blue Polyline
      const coolLine = L.polyline(latlngs, {
        color: "#2B82C9",
        weight: isCoolSelected ? 6 : 4,
        opacity: isCoolSelected ? 1.0 : 0.7,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(routeGroupRef.current);

      coolLine.on("click", () => {
        useAppStore.getState().setSelectedRouteId("cool");
      });
    }

    // 5. Auto-Fit Camera only once per newly calculated route in routes tab
    if (allRouteCoords.length > 0) {
      const currentRouteKey = `${origin?.lat}_${origin?.lng}_${destination?.lat}_${destination?.lng}_${fastestRoute?.durationSeconds}_${coolRoute?.durationSeconds}`;
      if (activeTab === "routes" && currentRouteKey !== lastFittedRouteKeyRef.current) {
        lastFittedRouteKeyRef.current = currentRouteKey;
        const bounds = L.latLngBounds(allRouteCoords);
        if (origin) bounds.extend([origin.lat, origin.lng]);
        if (destination) bounds.extend([destination.lat, destination.lng]);

        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
        map.fitBounds(bounds, {
          paddingTopLeft: isMobile ? [40, 40] : [430, 80],
          paddingBottomRight: isMobile ? [40, 40] : [60, 80],
          maxZoom: 16,
          animate: true,
        });
      }
    }
  }, [activeTab, fastestRoute, coolRoute, selectedRouteId, origin, destination, pointPickingMode]);

  // Render Simulation Sector Boundary & Floating Zone Badge
  useEffect(() => {
    if (!simulationGroupRef.current || !mapInstanceRef.current) return;
    simulationGroupRef.current.clearLayers();

    if (activeTab !== "simulator" || !simulationResult) {
      requestHeatmapRedraw();
      return;
    }

    const centerLat = selectedLocation ? selectedLocation.lat : viewport.lat;
    const centerLng = selectedLocation ? selectedLocation.lng : viewport.lng;
    const radius = simulationResult.estimatedCoolingRadiusMeters || 350;

    const isDelta = simulationVisualizationMode === "delta";
    const isMitigated = simulationVisualizationMode === "mitigated";

    // 1. Intervention Boundary Circle & Concentric Diffusion Contours
    if (isDelta) {
      // Outer Contour
      L.circle([centerLat, centerLng], {
        radius: radius,
        color: "#10B981",
        weight: 2,
        dashArray: "6, 6",
        fillColor: "#10B981",
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(simulationGroupRef.current);

      // Mid-Zone Thermal Contour
      L.circle([centerLat, centerLng], {
        radius: radius * 0.65,
        color: "#34D399",
        weight: 1.5,
        dashArray: "4, 4",
        fillColor: "#34D399",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(simulationGroupRef.current);

      // Core Thermal Reduction Core
      L.circle([centerLat, centerLng], {
        radius: radius * 0.35,
        color: "#6EE7B7",
        weight: 1.5,
        dashArray: "3, 3",
        fillColor: "#6EE7B7",
        fillOpacity: 0.18,
        interactive: false,
      }).addTo(simulationGroupRef.current);
    } else {
      L.circle([centerLat, centerLng], {
        radius: radius,
        color: isMitigated ? "#2B82C9" : "#E87722",
        weight: 2.5,
        dashArray: "6, 6",
        fillColor: isMitigated ? "#2B82C9" : "#E87722",
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(simulationGroupRef.current);
    }

    // 2. Central Floating Zone Badge (High-Contrast Solid Pill)
    const badgeHtml = `
      <div style="
        background: #0F172A !important;
        color: #FFFFFF !important;
        padding: 6px 14px;
        border-radius: 9999px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        border: 2px solid ${isDelta ? "#10B981" : "#38BDF8"};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transform: translate(-50%, -50%);
        pointer-events: none;
      ">
        <span style="font-size: 13px; line-height: 1;">🌿</span>
        <span style="color: #FFFFFF;">-${simulationResult.temperatureReductionDelta}°C Cooling Zone <span style="color: rgba(255,255,255,0.7); font-weight: normal;">(~${radius}m)</span></span>
      </div>
    `;
    const icon = L.divIcon({
      html: badgeHtml,
      className: "",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    L.marker([centerLat, centerLng], { icon, interactive: false }).addTo(simulationGroupRef.current);

    requestHeatmapRedraw();
  }, [activeTab, selectedLocation, viewport, simulationResult, simulationVisualizationMode]);

  // Initialize Map on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [viewport.lat, viewport.lng],
      zoom: viewport.zoom,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: false,
    });

    // Custom Layer Panes (Ensuring points/pins/routes are strictly above heatmap canvas)
    map.createPane("thermalPane");
    map.getPane("thermalPane")!.style.zIndex = "450";
    map.getPane("thermalPane")!.style.pointerEvents = "none";

    map.createPane("simulationPane");
    map.getPane("simulationPane")!.style.zIndex = "550";

    map.createPane("routePane");
    map.getPane("routePane")!.style.zIndex = "650";

    map.createPane("pinPane");
    map.getPane("pinPane")!.style.zIndex = "750";

    simulationGroupRef.current = L.layerGroup([], { pane: "simulationPane" } as any).addTo(map);

    const initialTileUrl = mapStyle === "satellite" ? TILE_LAYERS.satellite : TILE_LAYERS.streets;
    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
      maxNativeZoom: 19,
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
    canvas.style.zIndex = "450";
    map.getContainer().appendChild(canvas);
    canvasOverlayRef.current = canvas;

    resizeCanvas();

    map.on("move", requestHeatmapRedraw);
    map.on("zoom", () => {
      setCurrentZoom(Number(map.getZoom().toFixed(1)));
      loadHeatGrid(map);
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
      handleMapInteractionRef.current(e.latlng.lat, e.latlng.lng);
    });

    let mouseMoveThrottleId: number | null = null;
    let lastMouseMoveTime = 0;

    map.on("mousemove", (e: L.LeafletMouseEvent) => {
      // Disable hover tooltips on touch devices (phones, tablets, iPads)
      if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) {
        return;
      }

      const now = performance.now();
      if (now - lastMouseMoveTime < 40) return; // Cap mouse hover checks at 25fps for silky performance
      lastMouseMoveTime = now;

      if (mouseMoveThrottleId) return;
      mouseMoveThrottleId = window.requestAnimationFrame(() => {
        mouseMoveThrottleId = null;
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
    });

    map.on("mouseout", () => {
      if (mouseMoveThrottleId) {
        cancelAnimationFrame(mouseMoveThrottleId);
        mouseMoveThrottleId = null;
      }
      setHoverTelemetry(null);
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
      resizeCanvas();
      loadHeatGrid(map);
      renderRoutes(map);
    }, 100);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (canvasOverlayRef.current && canvasOverlayRef.current.parentNode) {
        canvasOverlayRef.current.parentNode.removeChild(canvasOverlayRef.current);
        canvasOverlayRef.current = null;
      }
      if (routeGroupRef.current) {
        routeGroupRef.current.clearLayers();
        try { routeGroupRef.current.remove(); } catch { }
        routeGroupRef.current = null;
      }
      if (clickPinRef.current) {
        clickPinRef.current.remove();
        clickPinRef.current = null;
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
        if (dist > 0.8) {
          rawGridDataRef.current = null;
          requestHeatmapRedraw();
        }
        mapInstanceRef.current.flyTo([viewport.lat, viewport.lng], viewport.zoom, { duration: 1.2 });
        setTimeout(() => {
          if (mapInstanceRef.current) loadHeatGrid(mapInstanceRef.current);
        }, 1300);
      }
    }
  }, [viewport.lat, viewport.lng, viewport.zoom, loadHeatGrid, requestHeatmapRedraw]);

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
        <div className={`fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-[1100] w-[calc(100vw-2rem)] sm:w-auto max-w-sm sm:max-w-md px-4 py-2 rounded-2xl sm:rounded-full shadow-2xl flex items-center justify-between sm:justify-center gap-3 border backdrop-blur-xl animate-in fade-in slide-in-from-top-2 ${
          isSatellite
            ? "sat-glass text-white border-white/35 shadow-black/40"
            : "street-card text-slate-900 border-slate-200/90 shadow-xl"
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 animate-ping ${pointPickingMode === "origin" ? "bg-emerald-400" : "bg-rose-500"}`} />
            <span className={`text-xs font-semibold truncate ${isSatellite ? "text-white" : "text-slate-900"}`}>
              <span className="hidden sm:inline">Click map to set </span>
              <span className="inline sm:hidden">Tap map for </span>
              <strong className={
                pointPickingMode === "origin"
                  ? isSatellite ? "text-emerald-300 font-extrabold" : "text-emerald-600 font-extrabold"
                  : isSatellite ? "text-rose-300 font-extrabold" : "text-rose-600 font-extrabold"
              }>
                {pointPickingMode === "origin" ? "Point (A)" : "Point (B)"}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPointPickingMode(null)}
            className={`px-3 py-1 text-[11px] font-mono font-bold rounded-xl sm:rounded-full border shrink-0 transition-all ml-1.5 flex items-center gap-1.5 ${
              isSatellite
                ? "bg-white/15 hover:bg-white/30 text-white border-white/30 shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm"
            }`}
          >
            <span>Cancel</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Hover HUD Tooltip (Desktop Mouse Only) */}
      {hoverTelemetry && !pointPickingMode && isHeatmapVisible && (
        <div
          className={`absolute z-[1000] pointer-events-none -translate-x-1/2 -translate-y-full hidden lg:flex items-center gap-2 font-mono text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xl ${isSatellite ? "sat-glass text-white" : "street-card text-slate-900"
            }`}
          style={{ left: `${hoverTelemetry.x}px`, top: `${hoverTelemetry.y}px` }}
        >
          <span>{formatTemp(hoverTelemetry.temp)}</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span className="text-[11px] font-semibold">HRS {hoverTelemetry.score}</span>
          <span className={`text-[9px] font-bold uppercase px-1.5 rounded-full ${hoverTelemetry.score > 80 ? "bg-red-500 text-white" : hoverTelemetry.score > 50 ? "bg-amber-500 text-white" : "bg-sky-500 text-white"
            }`}>
            {hoverTelemetry.level}
          </span>
        </div>
      )}

      {/* Top-Right Controls: Heatmap Toggle & Map Switcher (Desktop Only) */}
      <div className="absolute top-20 right-5 z-[1000] hidden lg:flex items-center gap-2.5">
        {/* Heatmap Toggle */}
        <button
          onClick={toggleHeatmapVisibility}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all duration-200 ${isHeatmapVisible
            ? isSatellite ? "bg-white text-slate-950 font-extrabold" : "bg-slate-900 text-white"
            : isSatellite ? "sat-glass text-white" : "street-card text-slate-800"
            }`}
          title="Toggle Thermal Heatmap Overlay"
        >
          {isHeatmapVisible ? "Heatmap: ON" : "Heatmap: OFF"}
        </button>

        {/* Street vs Satellite Switcher */}
        <div className={`flex items-center p-1 rounded-xl shadow-md ${isSatellite ? "sat-glass" : "street-card"
          }`}>
          <button
            onClick={() => setMapStyle("streets")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mapStyle === "streets"
              ? "bg-slate-900 text-white"
              : isSatellite ? "text-white/85 hover:bg-white/20" : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            Street
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mapStyle === "satellite"
              ? "bg-white text-slate-950 font-extrabold"
              : isSatellite ? "text-white/85 hover:bg-white/20" : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Zoom Controls (Bottom-Right: Buttons on desktop, Zoom badge everywhere) */}
      <div className="absolute bottom-20 right-3.5 md:bottom-5 md:right-5 z-[1000] flex flex-col items-center gap-1.5">
        <div className={`hidden md:flex flex-col overflow-hidden rounded-xl shadow-lg ${isSatellite ? "sat-glass" : "street-card"
          }`}>
          <button
            onClick={handleZoomIn}
            className={`w-9 h-9 flex items-center justify-center transition-colors border-b ${isSatellite ? "text-white hover:bg-white/20 border-white/20" : "text-slate-700 hover:bg-slate-100 border-slate-200"
              }`}
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`w-9 h-9 flex items-center justify-center transition-colors ${isSatellite ? "text-white hover:bg-white/20" : "text-slate-700 hover:bg-slate-100"
              }`}
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
        <div className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold shadow-sm ${isSatellite ? "sat-glass text-white" : "street-card text-slate-800"
          }`}>
          {currentZoom.toFixed(1)}x
        </div>
      </div>

      {/* Status Bar (Bottom-Left) */}
      <div className={`absolute bottom-5 left-5 z-[1000] hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono shadow-sm ${isSatellite ? "sat-glass text-white" : "street-card text-slate-900"
        }`}>
        <span className="font-bold">
          {isHeatmapVisible ? "Microclimate Thermal Engine" : "Base Map Mode"}
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
