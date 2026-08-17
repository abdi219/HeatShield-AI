import { CityPreset } from "@/types";

export const CITY_PRESETS: CityPreset[] = [
  {
    name: "Phoenix",
    state: "AZ",
    lat: 33.4484,
    lng: -112.0740,
    zoom: 14.5,
    description: "High urban heat island intensity with stark shaded vs unshaded contrasts.",
  },
  {
    name: "Austin",
    state: "TX",
    lat: 30.2672,
    lng: -97.7431,
    zoom: 14.8,
    description: "Rapidly urbanizing corridor featuring tree canopy variations along Lady Bird Lake.",
  },
  {
    name: "Miami",
    state: "FL",
    lat: 25.7617,
    lng: -80.1918,
    zoom: 14.6,
    description: "High heat and humidity index with urban canyon heat traps in Brickell.",
  },
  {
    name: "Las Vegas",
    state: "NV",
    lat: 36.1699,
    lng: -115.1398,
    zoom: 14.4,
    description: "Extreme surface asphalt temperatures in the Mojave Desert climate.",
  },
];

export const DEFAULT_MAP_CENTER = {
  lat: CITY_PRESETS[0].lat,
  lng: CITY_PRESETS[0].lng,
  zoom: CITY_PRESETS[0].zoom,
};

// Calibrated Scientific Thermal Scale (Restrained, Muted, Non-Neon)
export const THERMAL_COLOR_RAMP = [
  { tempC: 22, color: "#0284C7", label: "Baseline Cool (<24°C)" },
  { tempC: 28, color: "#0D9488", label: "Temperate (24-29°C)" },
  { tempC: 33, color: "#D97706", label: "Moderate Heat (30-34°C)" },
  { tempC: 38, color: "#EA580C", label: "High Heat (35-39°C)" },
  { tempC: 43, color: "#DC2626", label: "Severe Heat (40-44°C)" },
  { tempC: 48, color: "#991B1B", label: "Extreme Heat (>45°C)" },
];

export const getThermalColorForTemp = (tempC: number): string => {
  if (tempC < 24) return "#0284C7";
  if (tempC < 30) return "#0D9488";
  if (tempC < 35) return "#D97706";
  if (tempC < 40) return "#EA580C";
  if (tempC < 45) return "#DC2626";
  return "#991B1B";
};

export const getHeatRiskBadge = (score: number) => {
  if (score <= 30) return { label: "Low Risk", color: "text-sky-700", bg: "bg-sky-50", border: "border-sky-200" };
  if (score <= 60) return { label: "Moderate Risk", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  if (score <= 80) return { label: "High Risk", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
  return { label: "Extreme Risk", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
};
