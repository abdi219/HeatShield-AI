import { create } from 'zustand';
import { 
  HeatRiskAssessment, 
  AnalyzedRoute, 
  SimulationInterventions, 
  SimulationResult, 
  AIChatMessage, 
  TemperatureUnit 
} from '@/types';
import { DEFAULT_MAP_CENTER } from './constants';

interface AppState {
  // Navigation View
  activeTab: 'map' | 'routes' | 'simulator' | 'docs';
  setActiveTab: (tab: 'map' | 'routes' | 'simulator' | 'docs') => void;

  // Temperature Preference
  temperatureUnit: TemperatureUnit;
  toggleTemperatureUnit: () => void;

  // Spatial & Map State
  viewport: {
    lat: number;
    lng: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  setViewport: (viewport: Partial<AppState['viewport']>) => void;
  
  mapStyle: 'streets' | 'satellite';
  setMapStyle: (style: 'streets' | 'satellite') => void;
  
  activeHeatLayer: 'surface_temp' | 'heat_risk' | 'canopy_deficit';
  setActiveHeatLayer: (layer: 'surface_temp' | 'heat_risk' | 'canopy_deficit') => void;

  selectedLocation: {
    lat: number;
    lng: number;
    address?: string;
    data: HeatRiskAssessment | null;
  } | null;
  setSelectedLocation: (loc: AppState['selectedLocation']) => void;

  dataSourceStatus: 'live_fortyguard' | 'cached' | 'offline_mock';
  setDataSourceStatus: (status: AppState['dataSourceStatus']) => void;

  // Route State
  origin: { name: string; lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  travelMode: 'walking' | 'cycling' | 'driving';
  setOrigin: (origin: AppState['origin']) => void;
  setDestination: (destination: AppState['destination']) => void;
  setTravelMode: (mode: AppState['travelMode']) => void;
  
  fastestRoute: AnalyzedRoute | null;
  coolRoute: AnalyzedRoute | null;
  isCalculatingRoutes: boolean;
  setRoutes: (fastest: AnalyzedRoute | null, cool: AnalyzedRoute | null) => void;
  setIsCalculatingRoutes: (isCalculating: boolean) => void;

  // Simulation State
  simulationInterventions: SimulationInterventions;
  setSimulationInterventions: (interventions: Partial<SimulationInterventions>) => void;
  simulationResult: SimulationResult | null;
  setSimulationResult: (result: SimulationResult | null) => void;
  isSimulating: boolean;
  setIsSimulating: (isSimulating: boolean) => void;

  // AI Assistant Drawer State
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (isOpen: boolean) => void;
  aiMessages: AIChatMessage[];
  addAIMessage: (msg: AIChatMessage) => void;
  isAIStreaming: boolean;
  setIsAIStreaming: (isStreaming: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Default Tabs & Settings
  activeTab: 'map',
  setActiveTab: (tab) => set({ activeTab: tab }),

  temperatureUnit: 'celsius',
  toggleTemperatureUnit: () => set((state) => ({ 
    temperatureUnit: state.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius' 
  })),

  // Viewport Defaults
  viewport: {
    lat: DEFAULT_MAP_CENTER.lat,
    lng: DEFAULT_MAP_CENTER.lng,
    zoom: DEFAULT_MAP_CENTER.zoom,
    pitch: 30,
    bearing: 0,
  },
  setViewport: (newViewport) => set((state) => ({
    viewport: { ...state.viewport, ...newViewport }
  })),

  mapStyle: 'streets',
  setMapStyle: (mapStyle) => set({ mapStyle }),

  activeHeatLayer: 'surface_temp',
  setActiveHeatLayer: (activeHeatLayer) => set({ activeHeatLayer }),

  selectedLocation: null,
  setSelectedLocation: (selectedLocation) => set({ selectedLocation }),

  dataSourceStatus: 'live_fortyguard',
  setDataSourceStatus: (dataSourceStatus) => set({ dataSourceStatus }),

  // Routes
  origin: null,
  destination: null,
  travelMode: 'walking',
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setTravelMode: (travelMode) => set({ travelMode }),
  fastestRoute: null,
  coolRoute: null,
  isCalculatingRoutes: false,
  setRoutes: (fastestRoute, coolRoute) => set({ fastestRoute, coolRoute }),
  setIsCalculatingRoutes: (isCalculatingRoutes) => set({ isCalculatingRoutes }),

  // Simulation
  simulationInterventions: {
    treeCanopyCoveragePct: 25,
    coolPavementAlbedo: 0.35,
    solarCanopyCoveragePct: 15,
    shadeStructureDensityPct: 20,
  },
  setSimulationInterventions: (interventions) => set((state) => ({
    simulationInterventions: { ...state.simulationInterventions, ...interventions }
  })),
  simulationResult: null,
  setSimulationResult: (simulationResult) => set({ simulationResult }),
  isSimulating: false,
  setIsSimulating: (isSimulating) => set({ isSimulating }),

  // AI Assistant
  isAIAssistantOpen: false,
  setIsAIAssistantOpen: (isAIAssistantOpen) => set({ isAIAssistantOpen }),
  aiMessages: [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I'm your HeatShield AI Assistant. Click any location on the map, compare routes, or run an urban heat mitigation simulation, and I will provide scientific, data-grounded insights.",
      timestamp: new Date().toISOString(),
    }
  ],
  addAIMessage: (msg) => set((state) => ({ aiMessages: [...state.aiMessages, msg] })),
  isAIStreaming: false,
  setIsAIStreaming: (isAIStreaming) => set({ isAIStreaming }),
}));
