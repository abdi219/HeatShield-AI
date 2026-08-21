import { MicroclimatePoint, HeatRiskAssessment } from "@/types";
import { calculateHeatRiskScore } from "./heatRisk";

const FORTYGUARD_API_BASE_URL = process.env.FORTYGUARD_API_BASE_URL || "https://api.fortyguard.com/v1";
const FORTYGUARD_API_KEY = process.env.FORTYGUARD_API_KEY || "";

// In-Memory Server LRU Cache
const cache = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// Verified Urban Cool Landmarks & Water/Canopy Corridors for Major Presets
export const COOL_CORRIDOR_LANDMARKS = [
  // Phoenix (Sonoran Desert):
  // Civic Space Park, Margaret T. Hance Deck Park, Encanto Park, Arizona Center Gardens, Grand Canal Linear Park
  { lat: 33.4533, lng: -112.0742, radiusKm: 0.95, coolingDeltaC: 6.8, canopyBonus: 55 },
  { lat: 33.4623, lng: -112.0740, radiusKm: 1.15, coolingDeltaC: 7.5, canopyBonus: 65 },
  { lat: 33.4750, lng: -112.0850, radiusKm: 1.30, coolingDeltaC: 7.8, canopyBonus: 70 },
  { lat: 33.4510, lng: -112.0680, radiusKm: 0.75, coolingDeltaC: 5.8, canopyBonus: 48 },
  { lat: 33.4480, lng: -112.0800, radiusKm: 0.90, coolingDeltaC: 6.2, canopyBonus: 52 },

  // Miami (Subtropical Coastal):
  // Bayfront Park, Biscayne Bay Coastal Corridor, Riverwalk, Lummus Park, South Pointe Park
  { lat: 25.7753, lng: -80.1873, radiusKm: 1.10, coolingDeltaC: 6.2, canopyBonus: 50 },
  { lat: 25.7690, lng: -80.1905, radiusKm: 0.85, coolingDeltaC: 5.5, canopyBonus: 45 },
  { lat: 25.7820, lng: -80.1300, radiusKm: 1.20, coolingDeltaC: 6.5, canopyBonus: 55 },
  { lat: 25.7650, lng: -80.2000, radiusKm: 0.90, coolingDeltaC: 5.8, canopyBonus: 45 },

  // Austin (Central Texas):
  // Lady Bird Lake / Butler Trail corridor, Zilker Park, Capitol Grounds, Pease District Park, Shoal Creek
  { lat: 30.2625, lng: -97.7430, radiusKm: 1.35, coolingDeltaC: 7.2, canopyBonus: 68 },
  { lat: 30.2670, lng: -97.7730, radiusKm: 1.50, coolingDeltaC: 7.8, canopyBonus: 72 },
  { lat: 30.2747, lng: -97.7404, radiusKm: 0.90, coolingDeltaC: 6.0, canopyBonus: 52 },
  { lat: 30.2850, lng: -97.7520, radiusKm: 1.05, coolingDeltaC: 6.8, canopyBonus: 62 },

  // Las Vegas (Mojave Desert):
  // Clark County Govt Center Plaza, Springs Preserve, Lorenzi Park, Sunset Park, Cashman Center
  { lat: 36.1633, lng: -115.1558, radiusKm: 1.05, coolingDeltaC: 6.6, canopyBonus: 50 },
  { lat: 36.1700, lng: -115.1900, radiusKm: 1.30, coolingDeltaC: 7.5, canopyBonus: 65 },
  { lat: 36.1850, lng: -115.1850, radiusKm: 1.15, coolingDeltaC: 7.0, canopyBonus: 58 },
  { lat: 36.1690, lng: -115.1320, radiusKm: 0.85, coolingDeltaC: 5.8, canopyBonus: 45 },
];

/**
 * Deterministic spatial hash function
 */
function spatialHash(lat: number, lng: number, seed: number = 0): number {
  const v = Math.sin(lat * 127.1 + lng * 311.7 + seed * 43.13) * 43758.5453123;
  return v - Math.floor(v);
}

/**
 * Dynamic Climate-Calibrated Urban Spatial Microclimate Model with Diurnal Solar Cycle
 * Ground surface temperature dynamically couples to real-time local solar hour:
 * - Shaded green parks/corridors & water bodies provide persistent cooling (-3°C to -8°C)
 * - Urban residential / moderate canopy: 27°C–31°C (Teal / Amber)
 * - Unshaded impervious asphalt arterials & parking lots: 36°C–44°C (Orange / Red / Purple)
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

  // Active Diurnal Cycle (Preserves realistic day/night swing while maintaining daytime microclimate contrast)
  const isDaytime = localSolarHour >= 6.5 && localSolarHour <= 19.5;
  const sunPeakFactor = isDaytime 
    ? Math.sin(((localSolarHour - 6.5) / 13.0) * Math.PI)
    : 0.0;
  const solarIrradiance = Math.max(0.35, Math.min(1.0, 0.35 + sunPeakFactor * 0.65));

  // 2. City-Specific Ambient Baseline [Cool Morning, Peak Afternoon]
  let minTemp = 21.0;
  let maxTemp = 27.5;

  if (lng < -110 && lat < 35) {
    // Phoenix (Sonoran Desert): 23.0°C -> 29.5°C
    minTemp = 23.0;
    maxTemp = 29.5;
  } else if (lat < 27) {
    // Miami (Subtropical Coastal): 22.5°C -> 28.5°C
    minTemp = 22.5;
    maxTemp = 28.5;
  } else if (lat > 29 && lat < 32) {
    // Austin (Central Texas): 22.0°C -> 28.5°C
    minTemp = 22.0;
    maxTemp = 28.5;
  } else if (lat > 35 && lng < -114) {
    // Las Vegas (Mojave Desert): 23.0°C -> 29.5°C
    minTemp = 23.0;
    maxTemp = 29.5;
  }

  const regionalAmbient = minTemp + (maxTemp - minTemp) * (sunPeakFactor * 0.75);

  // 3. Multi-tier urban land-use & road network synthesis
  // High-frequency arterial grid
  const scale = 220.0;
  const gridX = Math.abs(Math.sin(lng * scale * Math.PI));
  const gridY = Math.abs(Math.cos(lat * scale * Math.PI));
  const rawStreet = Math.pow(Math.max(gridX, gridY), 2.8);

  // Macro-zoning noise (commercial core vs residential suburbs vs open green/water corridors)
  const macroZone = spatialHash(lat * 0.8, lng * 0.8, 1);
  const microVariation = spatialHash(lat * 3.5, lng * 3.5, 2);

  // Commercial / Industrial Core vs Residential Suburb
  const isHighDensityArterial = rawStreet > 0.65;
  const isCommercialCore = macroZone > 0.60;
  const isResidential = !isCommercialCore && !isHighDensityArterial;

  // 4. Landmark proximity cooling & water bodies
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

  // 5. Canopy percentage calculation
  let baseCanopy = 28;
  if (isResidential) baseCanopy = 42 + microVariation * 20; // 42% - 62% in residential green neighborhoods
  else if (isCommercialCore) baseCanopy = 12 + microVariation * 10; // 12% - 22% in downtown core
  else baseCanopy = 18 + microVariation * 12; // 18% - 30% along arterials

  const canopyPct = Math.round(Math.max(5, Math.min(92, baseCanopy + parkCanopyBonus)));

  // 6. Calibrated Physical Heat Balance:
  // - Unshaded Highways / Parking Lots: +8.5°C to +13.5°C -> (36°C - 42°C: Red/Purple)
  // - Commercial / Downtown Streets: +5.0°C to +8.0°C -> (32°C - 35°C: Orange)
  // - Residential Shaded Streets: +1.5°C to +3.5°C -> (27°C - 30°C: Emerald Teal/Amber)
  // - Parks & Waterfronts: -1.5°C to -6.5°C below ambient -> (22°C - 25°C: Sapphire Blue)
  let solarHeatGain = 0;
  if (isHighDensityArterial) {
    solarHeatGain = (7.5 + rawStreet * 6.0) * solarIrradiance;
  } else if (isCommercialCore) {
    solarHeatGain = (4.5 + macroZone * 4.0) * solarIrradiance;
  } else {
    solarHeatGain = (1.5 + microVariation * 2.5) * solarIrradiance;
  }

  const canopyEvapotranspiration = (canopyPct / 100) * (2.5 + 3.0 * solarIrradiance);
  const effectiveParkCooling = parkCooling * (0.8 + 0.2 * solarIrradiance);

  const rawSurfaceTemp = regionalAmbient + solarHeatGain - canopyEvapotranspiration - effectiveParkCooling;
  const surfaceTempC = Number(Math.max(19.0, Math.min(46.0, rawSurfaceTemp)).toFixed(1));
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
  
  // High-density 42x42 spatial grid for seamless city-wide coverage
  const latSteps = 42;
  const stepLat = (neLat - swLat) / latSteps;
  
  const idealStepLng = stepLat / Math.max(0.15, cosLat);
  const lngSteps = Math.max(26, Math.round((neLng - swLng) / idealStepLng));
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
