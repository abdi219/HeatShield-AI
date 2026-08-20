import { MicroclimatePoint, HeatRiskAssessment } from "@/types";
import { calculateHeatRiskScore } from "./heatRisk";

const FORTYGUARD_API_BASE_URL = process.env.FORTYGUARD_API_BASE_URL || "https://api.fortyguard.com/v1";
const FORTYGUARD_API_KEY = process.env.FORTYGUARD_API_KEY || "";

// In-Memory Server LRU Cache
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Verified Urban Cool Landmarks & Water/Canopy Corridors for Major Presets
const COOL_CORRIDOR_LANDMARKS = [
  // Phoenix: Civic Space Park, Margaret T. Hance Deck Park, Encanto Park
  { lat: 33.4533, lng: -112.0742, radiusKm: 0.45, coolingDeltaC: 5.5, canopyBonus: 45 },
  { lat: 33.4623, lng: -112.0740, radiusKm: 0.65, coolingDeltaC: 6.2, canopyBonus: 50 },
  { lat: 33.4750, lng: -112.0850, radiusKm: 0.80, coolingDeltaC: 6.8, canopyBonus: 55 },
  // Miami: Bayfront Park, Biscayne Bay Coastal Corridor, Riverwalk
  { lat: 25.7753, lng: -80.1873, radiusKm: 0.70, coolingDeltaC: 5.2, canopyBonus: 40 },
  { lat: 25.7690, lng: -80.1905, radiusKm: 0.50, coolingDeltaC: 4.5, canopyBonus: 35 },
  // Austin: Lady Bird Lake / Butler Trail, Zilker Park, Capitol Grounds
  { lat: 30.2625, lng: -97.7430, radiusKm: 0.90, coolingDeltaC: 6.0, canopyBonus: 60 },
  { lat: 30.2747, lng: -97.7404, radiusKm: 0.40, coolingDeltaC: 4.0, canopyBonus: 35 },
  // Las Vegas: Clark County Govt Center Plaza, Springs Preserve
  { lat: 36.1633, lng: -115.1558, radiusKm: 0.55, coolingDeltaC: 5.0, canopyBonus: 35 },
];

/**
 * Deterministic spatial hash function
 */
function spatialHash(lat: number, lng: number, seed: number = 0): number {
  const v = Math.sin(lat * 127.1 + lng * 311.7 + seed * 43.13) * 43758.5453123;
  return v - Math.floor(v);
}

/**
 * Deterministic Climate-Calibrated Urban Spatial Microclimate Model
 * Ground surface temperature is dynamically coupled to regional ambient weather:
 * - Shaded green parks/corridors: ambientTemp - 2.0°C to ambientTemp + 1.0°C
 * - Urban residential / moderate canopy: ambientTemp + 3.0°C to + 6.0°C
 * - Unshaded impervious asphalt arterials & parking lots: ambientTemp + 7.0°C to + 11.0°C
 */
function calculateUrbanHeatDispersion(lat: number, lng: number): {
  surfaceTempC: number;
  ambientTempC: number;
  canopyPct: number;
} {
  // 1. Regional baseline ambient temperature calibration based on geographic longitude & latitude
  let regionalAmbient = 32.0;

  if (lng < -110 && lat < 35) {
    // Sonoran Desert Valley (Phoenix): Higher ambient baseline (~36.0°C)
    regionalAmbient = 36.5;
  } else if (lat < 27) {
    // Subtropical Coastal (Miami): (~32.5°C)
    regionalAmbient = 32.5;
  } else if (lat > 33 && lng > -103 && lng < -100) {
    // Elevated Plains (Lubbock / West Texas): (~28.5°C)
    regionalAmbient = 28.5;
  } else if (lat > 29 && lat < 32) {
    // Central Texas (Austin): (~33.0°C)
    regionalAmbient = 33.0;
  } else if (lat > 35 && lng < -114) {
    // Mojave Desert (Las Vegas): (~37.0°C)
    regionalAmbient = 37.0;
  } else {
    // General US Southern tier baseline
    regionalAmbient = 30.5 + Math.sin(lat * 5.0) * 2.0;
  }

  // 2. Micro-scale street grid and building density
  const scale = 240.0;
  const gridX = Math.abs(Math.sin(lng * scale * Math.PI));
  const gridY = Math.abs(Math.cos(lat * scale * Math.PI));
  const streetAsphaltFactor = Math.pow(Math.max(gridX, gridY), 2.2);

  const macroNoise = (spatialHash(lat, lng, 1) + spatialHash(lat * 2, lng * 2, 2) * 0.5) / 1.5;
  const urbanDensity = Math.max(0.1, Math.min(1.0, streetAsphaltFactor * 0.65 + macroNoise * 0.35));

  // 3. Proximity cooling to landmark parks and water corridors
  let parkCooling = 0;
  let parkCanopyBonus = 0;

  for (const landmark of COOL_CORRIDOR_LANDMARKS) {
    const dLat = (lat - landmark.lat) * 111.0;
    const dLng = (lng - landmark.lng) * 111.0 * Math.cos((lat * Math.PI) / 180);
    const distKm = Math.hypot(dLat, dLng);

    if (distKm < landmark.radiusKm) {
      const effect = Math.cos((distKm / landmark.radiusKm) * (Math.PI / 2));
      parkCooling = Math.max(parkCooling, landmark.coolingDeltaC * effect);
      parkCanopyBonus = Math.max(parkCanopyBonus, landmark.canopyBonus * effect);
    }
  }

  // 4. Localized canopy coverage %
  const baseCanopy = Math.max(8, Math.min(75, (1 - urbanDensity) * 60 + parkCanopyBonus));
  const canopyPct = Math.round(Math.min(90, baseCanopy));

  // 5. Physically grounded Surface Temperature Calculation:
  // Asphalt absorption: +3.0°C in low-density up to +9.5°C on heavy asphalt
  // Evapotranspiration cooling: -2.5°C under high canopy
  const asphaltAbsorption = 2.5 + urbanDensity * 7.5;
  const canopyCooling = (canopyPct / 100) * 3.2;

  const rawSurfaceTemp = regionalAmbient + asphaltAbsorption - canopyCooling - parkCooling;
  const surfaceTempC = Number(Math.max(20.0, Math.min(48.0, rawSurfaceTemp)).toFixed(1));
  const ambientTempC = Number(regionalAmbient.toFixed(1));

  return { surfaceTempC, ambientTempC, canopyPct };
}

/**
 * Deterministic Spatial Microclimate Simulation Engine
 */
export function getMockHeatData(lat: number, lng: number): { point: MicroclimatePoint; assessment: HeatRiskAssessment } {
  const { surfaceTempC, ambientTempC, canopyPct } = calculateUrbanHeatDispersion(lat, lng);

  const assessment = calculateHeatRiskScore({
    surfaceTempC,
    ambientTempC,
    canopyCoveragePct: canopyPct,
  });

  const point: MicroclimatePoint = {
    id: `fg-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    latitude: lat,
    longitude: lng,
    surfaceTempCelsius: assessment.surfaceTemp,
    ambientTempCelsius: assessment.ambientTemp,
    heatRiskScore: assessment.score,
    heatRiskLevel: assessment.level,
    canopyCoveragePct: canopyPct,
    timestamp: new Date().toISOString(),
    source: 'synthesized_model',
  };

  return { point, assessment };
}

/**
 * Uniform Square Spatial Grid Generator
 */
export function getMockHeatGrid(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  
  const midLat = (swLat + neLat) / 2;
  const cosLat = Math.cos((midLat * Math.PI) / 180);
  
  const latSteps = 24;
  const stepLat = (neLat - swLat) / latSteps;
  
  const idealStepLng = stepLat / Math.max(0.15, cosLat);
  const lngSteps = Math.max(12, Math.round((neLng - swLng) / idealStepLng));
  const actualStepLng = (neLng - swLng) / lngSteps;

  for (let i = 0; i <= latSteps; i++) {
    for (let j = 0; j <= lngSteps; j++) {
      const lat = swLat + i * stepLat;
      const lng = swLng + j * actualStepLng;
      
      const { point, assessment } = getMockHeatData(lat, lng);
      // Normalized temperature weight (22°C = 0.0, 44°C = 1.0)
      const weight = Math.max(0.05, Math.min(1.0, (point.surfaceTempCelsius - 22) / 22));

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lng, lat],
        },
        properties: {
          id: point.id,
          surfaceTemp: point.surfaceTempCelsius,
          ambientTemp: point.ambientTempCelsius,
          hrsScore: assessment.score,
          hrsLevel: assessment.level,
          canopyPct: point.canopyCoveragePct,
          weight,
          source: point.source,
        },
      });
    }
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

/**
 * FortyGuard Async Engine Polling Helper
 */
async function pollFortyGuardJob(activityId: string, maxAttempts = 6): Promise<any | null> {
  const apiKey = process.env.FORTYGUARD_API_KEY || FORTYGUARD_API_KEY;
  if (!apiKey) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 400 * Math.pow(1.5, attempt)));

      const response = await fetch(`${FORTYGUARD_API_BASE_URL}/status?activity_id=${encodeURIComponent(activityId)}`, {
        method: "GET",
        headers: {
          "api-key": apiKey,
          "Accept": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 429) return null;
        continue;
      }

      const payload = await response.json();
      if (payload.status === "Completed" || payload.state === "Completed" || payload.data || payload.features) {
        return payload.data || payload;
      }
      if (payload.status === "Failed" || payload.state === "Failed") return null;
    } catch (err) {
      console.warn(`FortyGuard polling attempt ${attempt + 1} warning:`, err);
    }
  }
  return null;
}

/**
 * Live Server-side FortyGuard Location Fetcher
 */
export async function fetchFortyGuardLocation(lat: number, lng: number) {
  const apiKey = process.env.FORTYGUARD_API_KEY || FORTYGUARD_API_KEY;

  if (!apiKey) {
    return getMockHeatData(lat, lng);
  }

  const cacheKey = `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const delta = 0.0005;

    const response = await fetch(`${FORTYGUARD_API_BASE_URL}/heatmap`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        polygon_aoi: {
          type: "Polygon",
          coordinates: [[
            [lng - delta, lat - delta],
            [lng + delta, lat - delta],
            [lng + delta, lat + delta],
            [lng - delta, lat + delta],
            [lng - delta, lat - delta],
          ]],
        },
        date_time: {
          start_date: todayStr,
          filter_type: 1,
        },
      }),
    });

    if (response.ok) {
      const initData = await response.json();
      let finalResult = initData;

      if (initData.activity_id) {
        const polledData = await pollFortyGuardJob(initData.activity_id);
        if (polledData) {
          finalResult = polledData;
        }
      }

      if (finalResult && (finalResult.temperature || finalResult.surface_temperature || finalResult.features)) {
        const surfaceTemp = Number(
          finalResult.surface_temperature ||
          finalResult.surface_temp ||
          finalResult.temperature ||
          (finalResult.features?.[0]?.properties?.temperature) ||
          34.5
        );
        const ambientTemp = Number(
          finalResult.air_temperature ||
          finalResult.ambient_temperature ||
          30.5
        );
        const canopyPct = Number(finalResult.canopy_coverage || finalResult.canopy_pct || 22);

        const assessment = calculateHeatRiskScore({
          surfaceTempC: surfaceTemp,
          ambientTempC: ambientTemp,
          canopyCoveragePct: canopyPct,
        });

        const point: MicroclimatePoint = {
          id: `fg-${lat.toFixed(4)}-${lng.toFixed(4)}`,
          latitude: lat,
          longitude: lng,
          surfaceTempCelsius: assessment.surfaceTemp,
          ambientTempCelsius: assessment.ambientTemp,
          heatRiskScore: assessment.score,
          heatRiskLevel: assessment.level,
          canopyCoveragePct: canopyPct,
          timestamp: new Date().toISOString(),
          source: 'fortyguard_live',
        };

        const output = { point, assessment };
        cache.set(cacheKey, { data: output, expiresAt: Date.now() + CACHE_TTL_MS });
        return output;
      }
    }
  } catch (error) {
    console.warn("Live FortyGuard location fetch fallback:", error);
  }

  return getMockHeatData(lat, lng);
}

/**
 * Live Server-side FortyGuard Heat Grid Fetcher
 */
export async function fetchFortyGuardGrid(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): Promise<GeoJSON.FeatureCollection> {
  const apiKey = process.env.FORTYGUARD_API_KEY || FORTYGUARD_API_KEY;

  if (!apiKey) {
    return getMockHeatGrid(swLat, swLng, neLat, neLng);
  }

  const cacheKey = `grid-${swLat.toFixed(3)}-${swLng.toFixed(3)}-${neLat.toFixed(3)}-${neLng.toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const todayStr = new Date().toISOString().split("T")[0];

    const response = await fetch(`${FORTYGUARD_API_BASE_URL}/heatmap`, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        polygon_aoi: {
          type: "Polygon",
          coordinates: [[
            [swLng, swLat],
            [neLng, swLat],
            [neLng, neLat],
            [swLng, neLat],
            [swLng, swLat],
          ]],
        },
        date_time: {
          start_date: todayStr,
          filter_type: 1,
        },
      }),
    });

    if (response.ok) {
      const initData = await response.json();
      let finalGrid = initData;

      if (initData.activity_id) {
        const polledData = await pollFortyGuardJob(initData.activity_id);
        if (polledData && (polledData.features || polledData.type === "FeatureCollection")) {
          finalGrid = polledData;
        }
      }

      if (finalGrid && finalGrid.type === "FeatureCollection" && finalGrid.features?.length > 0) {
        cache.set(cacheKey, { data: finalGrid, expiresAt: Date.now() + CACHE_TTL_MS });
        return finalGrid;
      }
    }
  } catch (error) {
    console.warn("Live FortyGuard Grid fallback:", error);
  }

  return getMockHeatGrid(swLat, swLng, neLat, neLng);
}

/**
 * Unified FortyGuard Data Fetcher Wrapper
 */
export async function fetchFortyGuardData(options?: {
  lat?: number;
  lng?: number;
  bbox?: [number, number, number, number];
}) {
  if (options?.bbox) {
    const [swLat, swLng, neLat, neLng] = options.bbox;
    return fetchFortyGuardGrid(swLat, swLng, neLat, neLng);
  }
  if (options?.lat !== undefined && options?.lng !== undefined) {
    return fetchFortyGuardLocation(options.lat, options.lng);
  }
  return getMockHeatData(33.4484, -112.0740);
}
