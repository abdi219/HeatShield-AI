/**
 * HeatShield AI — Core Domain Type Definitions
 */

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export type HeatRiskLevel = 'low' | 'moderate' | 'high' | 'extreme';

export interface MicroclimatePoint {
  id: string;
  latitude: number;
  longitude: number;
  surfaceTempCelsius: number;
  ambientTempCelsius: number;
  relativeHumidityPct?: number;
  heatRiskScore: number;
  heatRiskLevel: HeatRiskLevel;
  canopyCoveragePct?: number;
  albedoFactor?: number;
  timestamp: string;
  source: 'fortyguard_live' | 'fortyguard_cached' | 'synthesized_model';
}

export interface HeatRiskAssessment {
  score: number; // 0 - 100
  level: HeatRiskLevel;
  surfaceTemp: number;
  ambientTemp: number;
  deltaAnomaly: number;
  contributingFactors: {
    surfaceAlbedoPenalty: number;
    vegetationDeficitPenalty: number;
    solarExposurePenalty: number;
    shadeCredit: number;
  };
  recommendations: string[];
}

export interface RouteThermalSample {
  distanceMeters: number;
  cumulativeDurationSeconds: number;
  latitude: number;
  longitude: number;
  surfaceTempCelsius: number;
  isShaded: boolean;
}

export interface RouteStep {
  instruction: string;
  streetName: string;
  distanceMeters: number;
  durationSeconds: number;
  avgTempCelsius: number;
  isShaded: boolean;
  heatAdvisory: string;
}

export interface AnalyzedRoute {
  id: string;
  type: 'fastest' | 'cool_recommended';
  name: string;
  distanceMeters: number;
  durationSeconds: number;
  averageTempCelsius: number;
  peakTempCelsius: number;
  heatShieldScore: number; // 0 - 100
  exposureReductionPct: number; // Comparative % cooler than fastest
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [lng, lat]
  };
  thermalProfile: RouteThermalSample[];
  steps: RouteStep[];
  summaryAdvisory: string;
}

export interface RouteComparisonResponse {
  fastestRoute: AnalyzedRoute;
  coolRecommendedRoute: AnalyzedRoute;
  differentialSummary: {
    timeDifferenceMinutes: number;
    peakTempDifferenceCelsius: number;
    averageTempDifferenceCelsius: number;
    exposureReductionPct: number;
  };
}

export interface SimulationInterventions {
  treeCanopyCoveragePct: number;    // 0 - 100%
  coolPavementAlbedo: number;        // 0.10 - 0.70
  solarCanopyCoveragePct: number;   // 0 - 100%
  shadeStructureDensityPct: number; // 0 - 100%
}

export interface SimulationResult {
  scenarioId: string;
  locationName: string;
  baselineSurfaceTemp: number;
  baselineHeatRiskScore: number;
  simulatedSurfaceTemp: number;
  simulatedHeatRiskScore: number;
  temperatureReductionDelta: number; // -X.X °C
  heatRiskScoreReductionDelta: number;
  estimatedCoolingRadiusMeters: number;
  interventions: SimulationInterventions;
  disclaimer: string;
}

export interface SavedScenario {
  id: string;
  name: string;
  timestamp: string;
  cityName: string;
  locationName: string;
  lat: number;
  lng: number;
  interventions: SimulationInterventions;
  result: SimulationResult;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  groundedLocationContext?: {
    lat: number;
    lng: number;
    surfaceTemp: number;
    heatRiskScore: number;
  };
}

export interface CityPreset {
  name: string;
  state: string;
  lat: number;
  lng: number;
  zoom: number;
  description: string;
}

export interface LayerVisibilityState {
  surfaceHeat: boolean;
  heatRiskScore: boolean;
  canopyDeficit: boolean;
  satelliteOverlay: boolean;
}
