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

// Verified City Commute Corridors
export const CITY_COMMUTE_CORRIDORS: Record<string, Array<{ name: string; origin: { name: string; lat: number; lng: number }; destination: { name: string; lat: number; lng: number } }>> = {
  Phoenix: [
    {
      name: "Civic Space Park to Roosevelt Arts",
      origin: { name: "Civic Space Park Shade Hub", lat: 33.4533, lng: -112.0742 },
      destination: { name: "Roosevelt Row Arts District", lat: 33.4586, lng: -112.0722 },
    },
    {
      name: "CityScape to Arizona Science Center",
      origin: { name: "CityScape Plaza", lat: 33.4478, lng: -112.0736 },
      destination: { name: "Heritage Square Science Hub", lat: 33.4496, lng: -112.0645 },
    },
  ],
  Austin: [
    {
      name: "Texas Capitol to Lady Bird Trail",
      origin: { name: "Texas State Capitol Plaza", lat: 30.2747, lng: -97.7404 },
      destination: { name: "Ann and Roy Butler Trail", lat: 30.2625, lng: -97.7430 },
    },
    {
      name: "Congress Ave to Rainey District",
      origin: { name: "Congress Ave & 6th St", lat: 30.2683, lng: -97.7428 },
      destination: { name: "Rainey St Historic Corridor", lat: 30.2592, lng: -97.7383 },
    },
  ],
  Miami: [
    {
      name: "Brickell Financial to Bayfront Park",
      origin: { name: "Brickell Ave & SE 8th St", lat: 25.7663, lng: -80.1915 },
      destination: { name: "Bayfront Park Shade Pavilion", lat: 25.7753, lng: -80.1873 },
    },
    {
      name: "Government Center to Miami Riverwalk",
      origin: { name: "Downtown Government Center", lat: 25.7751, lng: -80.1952 },
      destination: { name: "Miami Riverwalk Canopy", lat: 25.7690, lng: -80.1905 },
    },
  ],
  "Las Vegas": [
    {
      name: "Fremont East to Container Park",
      origin: { name: "Fremont Street East", lat: 36.1699, lng: -115.1398 },
      destination: { name: "Downtown Container Park", lat: 36.1682, lng: -115.1377 },
    },
    {
      name: "Arts District to Clark County Plaza",
      origin: { name: "18b Arts District Hub", lat: 36.1558, lng: -115.1525 },
      destination: { name: "Clark County Govt Center Plaza", lat: 36.1633, lng: -115.1558 },
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
