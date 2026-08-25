export interface SavedRouteBookmark {
  id: string;
  name: string;
  cityName: string;
  originText: string;
  destText: string;
  originCoords: [number, number]; // [lat, lng]
  destCoords: [number, number];   // [lat, lng]
  travelMode: "walking" | "cycling" | "driving";
  coolScore: number;
  exposureReductionPct: number;
  timestamp: number;
}

export interface SavedSimulationBookmark {
  id: string;
  name: string;
  cityName: string;
  lat: number;
  lng: number;
  interventions: {
    treeCanopyCoveragePct: number;
    coolPavementAlbedoPct: number;
    shadeStructuresDensityPct: number;
    urbanGreeneryAreaSqMeters: number;
  };
  tempReductionDelta: number;
  heatRiskReductionDelta: number;
  timestamp: number;
}

const ROUTE_BOOKMARKS_KEY = "heatshield_saved_routes_v1";
const SIM_BOOKMARKS_KEY = "heatshield_saved_simulations_v1";

// ── Route Bookmarks Helpers ──
export function getSavedRouteBookmarks(): SavedRouteBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROUTE_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read route bookmarks:", err);
    return [];
  }
}

export function saveRouteBookmark(bookmark: Omit<SavedRouteBookmark, "id" | "timestamp">): SavedRouteBookmark {
  const existing = getSavedRouteBookmarks();
  const newBookmark: SavedRouteBookmark = {
    ...bookmark,
    id: `route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  const updated = [newBookmark, ...existing.filter((b) => b.name !== bookmark.name)].slice(0, 10);
  try {
    localStorage.setItem(ROUTE_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist route bookmark:", err);
  }
  return newBookmark;
}

export function deleteRouteBookmark(id: string): void {
  const existing = getSavedRouteBookmarks();
  const updated = existing.filter((b) => b.id !== id);
  try {
    localStorage.setItem(ROUTE_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete route bookmark:", err);
  }
}

// ── Simulation Bookmarks Helpers ──
export function getSavedSimulationBookmarks(): SavedSimulationBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIM_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read simulation bookmarks:", err);
    return [];
  }
}

export function saveSimulationBookmark(
  bookmark: Omit<SavedSimulationBookmark, "id" | "timestamp">
): SavedSimulationBookmark {
  const existing = getSavedSimulationBookmarks();
  const newBookmark: SavedSimulationBookmark = {
    ...bookmark,
    id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  const updated = [newBookmark, ...existing.filter((b) => b.name !== bookmark.name)].slice(0, 10);
  try {
    localStorage.setItem(SIM_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to persist simulation bookmark:", err);
  }
  return newBookmark;
}

export function deleteSimulationBookmark(id: string): void {
  const existing = getSavedSimulationBookmarks();
  const updated = existing.filter((b) => b.id !== id);
  try {
    localStorage.setItem(SIM_BOOKMARKS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete simulation bookmark:", err);
  }
}
