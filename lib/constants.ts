// FortyGuard City Presets (Calibrated for High Urban Heat Vulnerability)
export const CITY_PRESETS = [
  {
    name: "Phoenix",
    state: "AZ",
    lat: 33.4484,
    lng: -112.0740,
    zoom: 14.5,
    description: "Downtown Urban Core & Transit Corridors",
  },
  {
    name: "Austin",
    state: "TX",
    lat: 30.2672,
    lng: -97.7431,
    zoom: 14.5,
    description: "Central Business District & Colorado River Corridor",
  },
  {
    name: "Miami",
    state: "FL",
    lat: 25.7617,
    lng: -80.1918,
    zoom: 14.5,
    description: "Brickell Financial District & Coastal Canopy",
  },
  {
    name: "Las Vegas",
    state: "NV",
    lat: 36.1699,
    lng: -115.1398,
    zoom: 14.5,
    description: "Downtown Arts District & High Albedo Corridors",
  },
];

export function findMatchingPilotCity(lat: number, lng: number, placeName?: string) {
  // Check text match first
  if (placeName) {
    const lower = placeName.toLowerCase();
    for (const city of CITY_PRESETS) {
      if (lower.includes(city.name.toLowerCase()) || lower.includes(`${city.name.toLowerCase()}, ${city.state.toLowerCase()}`)) {
        return city;
      }
    }
  }

  // Check spatial distance threshold (within 65km of pilot center)
  for (const city of CITY_PRESETS) {
    const dLat = (lat - city.lat) * 111.0;
    const dLng = (lng - city.lng) * 111.0 * Math.cos((lat * Math.PI) / 180);
    const distKm = Math.hypot(dLat, dLng);
    if (distKm <= 65.0) {
      return city;
    }
  }

  return null;
}

// Verified High-Impact City Commute Corridors
export const CITY_COMMUTE_CORRIDORS: Record<string, Array<{ name: string; origin: { name: string; lat: number; lng: number }; destination: { name: string; lat: number; lng: number } }>> = {
  Phoenix: [
    {
      name: "Footprint Arena to Hance Park",
      origin: { name: "Footprint Center Arena", lat: 33.4457, lng: -112.0712 },
      destination: { name: "Margaret T. Hance Deck Park", lat: 33.4628, lng: -112.0738 },
    },
    {
      name: "Art Museum to Heritage Square",
      origin: { name: "Phoenix Art Museum Plaza", lat: 33.4673, lng: -112.0735 },
      destination: { name: "Heritage Square Cultural Hub", lat: 33.4496, lng: -112.0645 },
    },
  ],
  Austin: [
    {
      name: "UT Austin to 6th Street Hub",
      origin: { name: "UT Austin Tower Plaza", lat: 30.2862, lng: -97.7394 },
      destination: { name: "Historic 6th Street Corridor", lat: 30.2678, lng: -97.7410 },
    },
    {
      name: "Texas Capitol to Lady Bird Trail",
      origin: { name: "Texas State Capitol Plaza", lat: 30.2747, lng: -97.7404 },
      destination: { name: "Ann and Roy Butler Lake Trail", lat: 30.2618, lng: -97.7435 },
    },
  ],
  Miami: [
    {
      name: "Brickell to Maurice Ferré Park",
      origin: { name: "Brickell Financial Hub", lat: 25.7668, lng: -80.1932 },
      destination: { name: "Maurice Ferré Waterfront Park", lat: 25.7850, lng: -80.1870 },
    },
    {
      name: "Vizcaya to Bayfront Promenade",
      origin: { name: "Vizcaya Station & Gardens", lat: 25.7495, lng: -80.2085 },
      destination: { name: "Bayfront Park Shaded Canopy", lat: 25.7745, lng: -80.1865 },
    },
  ],
  "Las Vegas": [
    {
      name: "Arts District to Container Park",
      origin: { name: "18b Arts District Casino Hub", lat: 36.1558, lng: -115.1525 },
      destination: { name: "Downtown Container Park Plaza", lat: 36.1685, lng: -115.1375 },
    },
    {
      name: "Fremont to Symphony Park",
      origin: { name: "Fremont Street Experience", lat: 36.1706, lng: -115.1440 },
      destination: { name: "Symphony Park Tree Promenade", lat: 36.1688, lng: -115.1542 },
    },
  ],
};

export const DEFAULT_MAP_CENTER = {
  lat: 25.7617,
  lng: -80.1918,
  zoom: 14.5,
};

// Calibrated 5-tier FortyGuard Color Scale (Hex Codes)
export const FORTYGUARD_PALETTE = {
  tier1: "#2B82C9", // 22°C - Cool Blue
  tier2: "#2CA099", // 28°C - Teal
  tier3: "#E87722", // 33°C - Orange
  tier4: "#D9381E", // 38°C - Red
  tier5: "#6B2D5C", // 43°C+ - Dark Purple
};

export const THERMAL_COLOR_RAMP = [
  { temp: 22, color: FORTYGUARD_PALETTE.tier1, label: "22°C (Cool Baseline)" },
  { temp: 28, color: FORTYGUARD_PALETTE.tier2, label: "28°C (Moderate)" },
  { temp: 33, color: FORTYGUARD_PALETTE.tier3, label: "33°C (Elevated)" },
  { temp: 38, color: FORTYGUARD_PALETTE.tier4, label: "38°C (High Risk)" },
  { temp: 43, color: FORTYGUARD_PALETTE.tier5, label: "43°C+ (Extreme)" },
];

export function getThermalColorForTemp(tempC: number): string {
  if (tempC < 25) return FORTYGUARD_PALETTE.tier1;
  if (tempC < 30) return FORTYGUARD_PALETTE.tier2;
  if (tempC < 35) return FORTYGUARD_PALETTE.tier3;
  if (tempC < 40) return FORTYGUARD_PALETTE.tier4;
  return FORTYGUARD_PALETTE.tier5;
}

export function getColorForHeatRiskScore(score: number): string {
  if (score < 30) return FORTYGUARD_PALETTE.tier1;
  if (score < 50) return FORTYGUARD_PALETTE.tier2;
  if (score < 70) return FORTYGUARD_PALETTE.tier3;
  if (score < 85) return FORTYGUARD_PALETTE.tier4;
  return FORTYGUARD_PALETTE.tier5;
}

export function getColorForCanopyDeficit(deficitPct: number): string {
  if (deficitPct < 30) return FORTYGUARD_PALETTE.tier2;
  if (deficitPct < 50) return FORTYGUARD_PALETTE.tier1;
  if (deficitPct < 70) return FORTYGUARD_PALETTE.tier3;
  return FORTYGUARD_PALETTE.tier4;
}
