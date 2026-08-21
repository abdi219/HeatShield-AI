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
/**
 * Dynamic Climate-Calibrated Urban Spatial Microclimate Model with Diurnal Solar Cycle
 * Ground surface temperature dynamically couples to real-time local solar hour:
 * - Night (10 PM – 6 AM): Ambient drops to 22°C–27°C, no solar radiation, residual UHI +1°C to +2.5°C
 * - Morning (7 AM – 11 AM): Solar irradiance ramps up, ground absorbs heat
 * - Peak Afternoon (1 PM – 5 PM): Peak solar irradiance (+6°C to +11°C asphalt absorption)
 * - Shaded green corridors & water bodies provide persistent cooling (-2°C to -6°C)
 */
function calculateUrbanHeatDispersion(lat: number, lng: number): {
  surfaceTempC: number;
  ambientTempC: number;
  canopyPct: number;
} {
  // 1. Calculate Real-Time Local Solar Hour for this Longitude
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const localSolarHour = (utcHours + (lng / 15) + 24) % 24;

  // Diurnal sinusoidal temperature curve (Daily low at ~06:00 sunrise, Daily peak at ~15:30 afternoon)
  const diurnalAngle = ((localSolarHour - 9.5) / 24) * 2 * Math.PI;
  const diurnalFactor = Math.max(0, Math.min(1, (Math.sin(diurnalAngle) + 1) / 2)); // 0.0 (night) to 1.0 (afternoon peak)

  // Direct Solar Irradiance Curve (0.0 at night, 1.0 at midday)
  let solarIrradianceFactor = 0;
  if (localSolarHour >= 6.5 && localSolarHour <= 19.5) {
    const sunAngle = ((localSolarHour - 6.5) / 13.0) * Math.PI;
    solarIrradianceFactor = Math.pow(Math.sin(sunAngle), 1.2);
  }

  // 2. City-Specific Diurnal Temperature Boundaries [Night Min, Afternoon Max]
  let minTemp = 20.0;
  let maxTemp = 34.0;

  if (lng < -110 && lat < 35) {
    // Phoenix (Sonoran Desert): 24°C night -> 41.5°C afternoon
    minTemp = 24.5;
    maxTemp = 41.5;
  } else if (lat < 27) {
    // Miami (Subtropical Coastal): 24.5°C night -> 33.5°C afternoon
    minTemp = 24.5;
    maxTemp = 33.5;
  } else if (lat > 33 && lng > -103 && lng < -100) {
    // Lubbock / West Texas (Elevated Plains): 19.0°C night -> 33.0°C afternoon
    minTemp = 19.0;
    maxTemp = 33.0;
  } else if (lat > 29 && lat < 32) {
    // Austin (Central Texas): 23.0°C night -> 38.0°C afternoon
    minTemp = 23.0;
    maxTemp = 38.0;
  } else if (lat > 35 && lng < -114) {
    // Las Vegas (Mojave Desert): 25.0°C night -> 42.0°C afternoon
    minTemp = 25.0;
    maxTemp = 42.0;
  } else {
    // General US Baseline
    minTemp = 18.0 + Math.sin(lat * 5.0) * 2.0;
    maxTemp = 32.0 + Math.sin(lat * 5.0) * 3.0;
  }

  const regionalAmbient = minTemp + (maxTemp - minTemp) * diurnalFactor;

  // 3. Micro-scale street grid and building density
  const scale = 240.0;
  const gridX = Math.abs(Math.sin(lng * scale * Math.PI));
  const gridY = Math.abs(Math.cos(lat * scale * Math.PI));
  const streetAsphaltFactor = Math.pow(Math.max(gridX, gridY), 2.2);

  const macroNoise = (spatialHash(lat, lng, 1) + spatialHash(lat * 2, lng * 2, 2) * 0.5) / 1.5;
  const urbanDensity = Math.max(0.1, Math.min(1.0, streetAsphaltFactor * 0.65 + macroNoise * 0.35));

  // 4. Proximity cooling to landmark parks and water corridors
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

  // 5. Localized canopy coverage %
  const baseCanopy = Math.max(8, Math.min(75, (1 - urbanDensity) * 60 + parkCanopyBonus));
  const canopyPct = Math.round(Math.min(90, baseCanopy));

  // 6. Physically grounded Surface Temperature with Solar Coupling:
  // - Direct Sun Heating: (urbanDensity * 8.5°C) * solarIrradianceFactor
  // - Night Urban Heat Island Retention: urbanDensity * 2.0°C (thermal mass)
  // - Evapotranspiration cooling: -2.5°C under high canopy during daytime
  const solarDirectHeat = (1.5 + urbanDensity * 8.5) * solarIrradianceFactor;
  const nightUhiRetention = (0.6 + urbanDensity * 1.8) * (1 - solarIrradianceFactor);
  const asphaltAbsorption = solarDirectHeat + nightUhiRetention;
  
  const canopyCooling = (canopyPct / 100) * (1.2 + 2.4 * solarIrradianceFactor);
  const effectiveParkCooling = parkCooling * (0.6 + 0.4 * solarIrradianceFactor);

  const rawSurfaceTemp = regionalAmbient + asphaltAbsorption - canopyCooling - effectiveParkCooling;
  const surfaceTempC = Number(Math.max(16.0, Math.min(49.0, rawSurfaceTemp)).toFixed(1));
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
 * High-Density Metropolitan Spatial Grid Generator (36x36 = 1,296 nodes)
 * Provides 100% continuous, gapless coverage across the entire city and suburbs.
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
  
  // High-density 36x36 spatial grid for seamless city-wide coverage
  const latSteps = 36;
  const stepLat = (neLat - swLat) / latSteps;
  
  const idealStepLng = stepLat / Math.max(0.15, cosLat);
  const lngSteps = Math.max(20, Math.round((neLng - swLng) / idealStepLng));
  const actualStepLng = (neLng - swLng) / lngSteps;

  for (let i = 0; i <= latSteps; i++) {
    for (let j = 0; j <= lngSteps; j++) {
      const lat = swLat + i * stepLat;
      const lng = swLng + j * actualStepLng;
      
      const { point, assessment } = getMockHeatData(lat, lng);

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
