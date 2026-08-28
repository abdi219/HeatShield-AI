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

// Verified High-Impact City Commute Corridors with Dual Street Alternatives
export const CITY_COMMUTE_CORRIDORS: Record<string, Array<{ name: string; origin: { name: string; lat: number; lng: number }; destination: { name: string; lat: number; lng: number } }>> = {
  Phoenix: [
    {
      name: "Encanto to Hance Deck Park",
      origin: { name: "Encanto Park Shaded Lagoon", lat: 33.4750, lng: -112.0780 },
      destination: { name: "Margaret T. Hance Deck Park", lat: 33.4628, lng: -112.0738 },
    },
    {
      name: "Grand Ave to Heritage Square",
      origin: { name: "Grand Avenue Arts District", lat: 33.4560, lng: -112.0880 },
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
      name: "Clarksville to Rainey Street",
      origin: { name: "Clarksville Historic Greenway", lat: 30.2760, lng: -97.7600 },
      destination: { name: "Rainey Street Canopy District", lat: 30.2590, lng: -97.7380 },
    },
  ],
  Miami: [
    {
      name: "Little Havana to Bayfront Park",
      origin: { name: "Little Havana Cultural Plaza", lat: 25.7720, lng: -80.2150 },
      destination: { name: "Bayfront Park Shaded Canopy", lat: 25.7780, lng: -80.1890 },
    },
    {
      name: "Design District to Downtown",
      origin: { name: "Design District Plaza", lat: 25.8130, lng: -80.1920 },
      destination: { name: "Downtown Waterfront Promenade", lat: 25.7750, lng: -80.1900 },
    },
  ],
  "Las Vegas": [
    {
      name: "Arts District to Fremont East",
      origin: { name: "18b Arts District Plaza", lat: 36.1550, lng: -115.1530 },
      destination: { name: "Fremont East Shaded District", lat: 36.1690, lng: -115.1390 },
    },
    {
      name: "Charleston to Container Park",
      origin: { name: "Charleston Historic Gateway", lat: 36.1590, lng: -115.1580 },
      destination: { name: "Downtown Container Park Plaza", lat: 36.1685, lng: -115.1375 },
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
