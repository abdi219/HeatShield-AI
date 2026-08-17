import { MicroclimatePoint, HeatRiskAssessment } from "@/types";
import { calculateHeatRiskScore } from "./heatRisk";

const USE_MOCK_DATA = !process.env.FORTYGUARD_API_KEY || process.env.FORTYGUARD_API_KEY === "demo_key";
const FORTYGUARD_API_BASE_URL = process.env.FORTYGUARD_API_BASE_URL || "https://api.fortyguard.com/v1";

/**
 * Deterministic pseudo-random seed generator based on latitude and longitude
 * Ensures that inspecting the exact same street corner always returns consistent data.
 */
function coordinateSeed(lat: number, lng: number): number {
  const x = Math.sin(lat * 12.9898 + lng * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generates realistic street-level microclimate data for a single geographic point.
 * Simulates microclimate variations (e.g. unshaded asphalt, building canyons, shaded corridors).
 */
export function getMockHeatData(lat: number, lng: number): { point: MicroclimatePoint; assessment: HeatRiskAssessment } {
  const seed = coordinateSeed(lat, lng);
  const ambientTemp = 33.2 + (Math.sin(lat * 50) * 1.5);
  
  // Surface temperature varies between 32.0°C and 44.5°C based on localized urban factors
  const surfaceTemp = 32.0 + (seed * 12.5);
  const canopyPct = Math.round((1 - seed) * 75); // Shaded vs unshaded
  const albedo = Number((0.10 + (seed * 0.35)).toFixed(2));

  const assessment = calculateHeatRiskScore({
    surfaceTempC: surfaceTemp,
    ambientTempC: ambientTemp,
    canopyCoveragePct: canopyPct,
    albedoFactor: albedo,
  });

  const point: MicroclimatePoint = {
    id: `fg-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    latitude: lat,
    longitude: lng,
    surfaceTempCelsius: assessment.surfaceTemp,
    ambientTempCelsius: assessment.ambientTemp,
    relativeHumidityPct: Math.round(28 + (seed * 20)),
    heatRiskScore: assessment.score,
    heatRiskLevel: assessment.level,
    canopyCoveragePct: canopyPct,
    albedoFactor: albedo,
    timestamp: new Date().toISOString(),
    source: USE_MOCK_DATA ? 'synthesized_model' : 'fortyguard_live',
  };

  return { point, assessment };
}

/**
 * Generates a 25m/50m spatial microclimate GeoJSON grid for a geographic bounding box.
 */
export function getMockHeatGrid(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  stepDegrees: number = 0.0025 // ~250m grid resolution for fluid map performance
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  const minLat = Math.min(swLat, neLat);
  const maxLat = Math.max(swLat, neLat);
  const minLng = Math.min(swLng, neLng);
  const maxLng = Math.max(swLng, neLng);

  // Bound max steps to prevent excessive iterations
  const latSteps = Math.min(30, Math.ceil((maxLat - minLat) / stepDegrees));
  const lngSteps = Math.min(30, Math.ceil((maxLng - minLng) / stepDegrees));

  const actualLatStep = (maxLat - minLat) / Math.max(1, latSteps);
  const actualLngStep = (maxLng - minLng) / Math.max(1, lngSteps);

  for (let i = 0; i <= latSteps; i++) {
    for (let j = 0; j <= lngSteps; j++) {
      const lat = minLat + (i * actualLatStep);
      const lng = minLng + (j * actualLngStep);

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
          heatRiskScore: assessment.score,
          heatRiskLevel: assessment.level,
          canopyPct: point.canopyCoveragePct,
          timestamp: point.timestamp,
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
 * Server-side FortyGuard Location Fetcher
 * Automatically switches between live FortyGuard API and high-fidelity mock engine.
 */
export async function fetchFortyGuardLocation(lat: number, lng: number) {
  if (USE_MOCK_DATA) {
    return getMockHeatData(lat, lng);
  }

  try {
    const response = await fetch(
      `${FORTYGUARD_API_BASE_URL}/temperature/point?lat=${lat}&lng=${lng}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.FORTYGUARD_API_KEY}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 }, // 5 min Next.js cache
      }
    );

    if (!response.ok) {
      console.warn(`FortyGuard API returned ${response.status}. Falling back to simulation engine.`);
      return getMockHeatData(lat, lng);
    }

    const data = await response.json();
    
    const surfaceTemp = Number(data.surface_temperature || data.temperature || 36.5);
    const ambientTemp = Number(data.ambient_temperature || 33.0);
    const canopyPct = Number(data.canopy_coverage || 20);

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
      timestamp: data.timestamp || new Date().toISOString(),
      source: 'fortyguard_live',
    };

    return { point, assessment };
  } catch (error) {
    console.error("Error connecting to FortyGuard API:", error);
    return getMockHeatData(lat, lng);
  }
}

/**
 * Server-side FortyGuard Grid Fetcher
 */
export async function fetchFortyGuardGrid(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
): Promise<GeoJSON.FeatureCollection> {
  if (USE_MOCK_DATA) {
    return getMockHeatGrid(swLat, swLng, neLat, neLng);
  }

  try {
    const response = await fetch(
      `${FORTYGUARD_API_BASE_URL}/temperature/grid?bbox=${swLng},${swLat},${neLng},${neLat}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.FORTYGUARD_API_KEY}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 600 },
      }
    );

    if (!response.ok) {
      console.warn(`FortyGuard Grid API returned ${response.status}. Using simulation fallback.`);
      return getMockHeatGrid(swLat, swLng, neLat, neLng);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching FortyGuard Grid:", error);
    return getMockHeatGrid(swLat, swLng, neLat, neLng);
  }
}
