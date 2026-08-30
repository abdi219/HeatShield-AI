import { create } from 'zustand';
import {
  HeatRiskAssessment,
  AnalyzedRoute,
  SimulationInterventions,
  SimulationResult,
  SavedScenario,
  AIChatMessage,
  AIChatSession,
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

  // Active City Selector State
  selectedCity: string;
  setSelectedCity: (city: string) => void;

  // Toast / Pilot Zone Alerts
  toastAlert: {
    message: string;
    type?: 'warning' | 'info' | 'success';
    searchedQuery?: string;
  } | null;
  setToastAlert: (alert: AppState['toastAlert']) => void;

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

  // Thermal Heatmap Visibility Toggle
  isHeatmapVisible: boolean;
  setIsHeatmapVisible: (visible: boolean) => void;
  toggleHeatmapVisibility: () => void;

  activeHeatLayer: 'surface_temp' | 'heat_risk' | 'canopy_deficit';
  setActiveHeatLayer: (layer: 'surface_temp' | 'heat_risk' | 'canopy_deficit') => void;

  selectedLocation: {
    lat: number;
    lng: number;
    address?: string;
    data: HeatRiskAssessment | null;
    source?: string;
    activityId?: string;
  } | null;
  setSelectedLocation: (loc: AppState['selectedLocation']) => void;

  dataSourceStatus: 'live_fortyguard' | 'cached' | 'offline_mock';
  setDataSourceStatus: (status: AppState['dataSourceStatus']) => void;

  // Route State
  origin: { name: string; lat: number; lng: number } | null;
  destination: { name: string; lat: number; lng: number } | null;
  travelMode: 'walking' | 'cycling' | 'driving';
  selectedRouteId: 'cool' | 'fastest';
  pointPickingMode: 'origin' | 'destination' | null;
  setOrigin: (origin: AppState['origin']) => void;
  setDestination: (destination: AppState['destination']) => void;
  setTravelMode: (mode: AppState['travelMode']) => void;
  setSelectedRouteId: (routeId: 'cool' | 'fastest') => void;
  setPointPickingMode: (mode: 'origin' | 'destination' | null) => void;

  fastestRoute: AnalyzedRoute | null;
  coolRoute: AnalyzedRoute | null;
  isCalculatingRoutes: boolean;
  setRoutes: (fastest: AnalyzedRoute | null, cool: AnalyzedRoute | null) => void;
  setIsCalculatingRoutes: (isCalculating: boolean) => void;
  clearRoutes: () => void;
  clearCalculatedRoutes: () => void;

  // Simulation State
  simulationInterventions: SimulationInterventions;
  setSimulationInterventions: (interventions: Partial<SimulationInterventions>) => void;
  simulationResult: SimulationResult | null;
  setSimulationResult: (result: SimulationResult | null) => void;
  simulationVisualizationMode: 'mitigated' | 'baseline' | 'delta';
  setSimulationVisualizationMode: (mode: 'mitigated' | 'baseline' | 'delta') => void;
  savedScenarios: SavedScenario[];
  saveCurrentScenario: (name?: string) => void;
  loadScenario: (scenario: SavedScenario) => void;
  deleteScenario: (id: string) => void;
  isSimulating: boolean;
  setIsSimulating: (isSimulating: boolean) => void;

  // AI Assistant Drawer State
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (isOpen: boolean) => void;
  aiMessages: AIChatMessage[];
  addAIMessage: (msg: AIChatMessage) => void;
  isAIStreaming: boolean;
  setIsAIStreaming: (isStreaming: boolean) => void;
  aiSessions: AIChatSession[];
  activeSessionId: string;
  createNewChatSession: () => void;
  loadChatSession: (sessionId: string) => void;
  deleteChatSession: (sessionId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Default Tabs & Settings
  activeTab: 'map',
  setActiveTab: (tab) => set({ activeTab: tab }),

  temperatureUnit: 'celsius',
  toggleTemperatureUnit: () => set((state) => ({
    temperatureUnit: state.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius'
  })),

  selectedCity: 'Miami',
  setSelectedCity: (selectedCity) => set({
    selectedCity,
    origin: null,
    destination: null,
    fastestRoute: null,
    coolRoute: null,
    pointPickingMode: null,
    isCalculatingRoutes: false,
  }),

  toastAlert: null,
  setToastAlert: (toastAlert) => set({ toastAlert }),

  // Viewport Defaults
  viewport: {
    lat: DEFAULT_MAP_CENTER.lat,
    lng: DEFAULT_MAP_CENTER.lng,
    zoom: DEFAULT_MAP_CENTER.zoom,
    pitch: 0,
    bearing: 0,
  },
  setViewport: (newViewport) => set((state) => ({
    viewport: { ...state.viewport, ...newViewport }
  })),

  mapStyle: 'streets',
  setMapStyle: (mapStyle) => set({ mapStyle }),

  isHeatmapVisible: true,
  setIsHeatmapVisible: (isHeatmapVisible) => set({ isHeatmapVisible }),
  toggleHeatmapVisibility: () => set((state) => ({ isHeatmapVisible: !state.isHeatmapVisible })),

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
  selectedRouteId: 'cool',
  pointPickingMode: null,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setTravelMode: (travelMode) => set({ travelMode }),
  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),
  setPointPickingMode: (pointPickingMode) => set({ pointPickingMode }),
  fastestRoute: null,
  coolRoute: null,
  isCalculatingRoutes: false,
  setRoutes: (fastestRoute, coolRoute) => set({ fastestRoute, coolRoute }),
  setIsCalculatingRoutes: (isCalculatingRoutes) => set({ isCalculatingRoutes }),
  clearRoutes: () => set({
    origin: null,
    destination: null,
    fastestRoute: null,
    coolRoute: null,
    pointPickingMode: null,
    isCalculatingRoutes: false,
  }),
  clearCalculatedRoutes: () => set({
    fastestRoute: null,
    coolRoute: null,
    isCalculatingRoutes: false,
  }),

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
  simulationVisualizationMode: 'mitigated',
  setSimulationVisualizationMode: (simulationVisualizationMode) => set({ simulationVisualizationMode }),
  savedScenarios: [],
  saveCurrentScenario: (customName) => set((state) => {
    if (!state.simulationResult) return state;
    const newScenario: SavedScenario = {
      id: `scen-${Date.now()}`,
      name: customName?.trim() || `Mitigation Plan (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      timestamp: new Date().toISOString(),
      cityName: state.selectedCity,
      locationName: state.simulationResult.locationName,
      lat: state.selectedLocation ? state.selectedLocation.lat : state.viewport.lat,
      lng: state.selectedLocation ? state.selectedLocation.lng : state.viewport.lng,
      interventions: { ...state.simulationInterventions },
      result: { ...state.simulationResult },
    };
    // Cap saved scenarios to maximum 15 items to keep storage ultra-light
    const cappedScenarios = [newScenario, ...state.savedScenarios].slice(0, 15);
    return { savedScenarios: cappedScenarios };
  }),
  loadScenario: (scenario) => set({
    selectedCity: scenario.cityName,
    simulationInterventions: { ...scenario.interventions },
    simulationResult: { ...scenario.result },
    viewport: {
      lat: scenario.lat,
      lng: scenario.lng,
      zoom: 15,
      pitch: 0,
      bearing: 0,
    },
  }),
  deleteScenario: (id) => set((state) => ({
    savedScenarios: state.savedScenarios.filter((s) => s.id !== id),
  })),
  isSimulating: false,
  setIsSimulating: (isSimulating) => set({ isSimulating }),

  // AI Drawer
  isAIAssistantOpen: false,
  setIsAIAssistantOpen: (isAIAssistantOpen) => set({ isAIAssistantOpen }),
  aiSessions: [],
  activeSessionId: 'default',
  aiMessages: [
    {
      id: 'init-msg',
      role: 'assistant',
      content: 'Welcome to HeatShield AI. I am your urban resilience copilot powered by FortyGuard microclimate telemetry. Click any location or analyze a cool corridor to begin.',
      timestamp: new Date().toISOString(),
    },
  ],
  addAIMessage: (msg) => set((state) => ({ aiMessages: [...state.aiMessages, msg] })),
  isAIStreaming: false,
  setIsAIStreaming: (isAIStreaming) => set({ isAIStreaming }),

  createNewChatSession: () => set((state) => {
    const currentMsgs = state.aiMessages;
    let updatedSessions = [...state.aiSessions];

    // Save current active session if it has user messages
    const hasUserMsg = currentMsgs.some((m) => m.role === 'user');
    if (hasUserMsg) {
      const firstUserMsg =
        currentMsgs.find((m) => m.role === 'user')?.content.slice(0, 30) || 'Heat Consultation';
      const existingIdx = updatedSessions.findIndex((s) => s.id === state.activeSessionId);
      const sessionObj: AIChatSession = {
        id: state.activeSessionId === 'default' ? `session-${Date.now()}` : state.activeSessionId,
        title: firstUserMsg,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: currentMsgs,
      };
      if (existingIdx >= 0) {
        updatedSessions[existingIdx] = sessionObj;
      } else {
        updatedSessions = [sessionObj, ...updatedSessions];
      }
    }

    // Auto-prune to maximum 15 sessions (keeps memory and storage under 0.05 MB)
    updatedSessions = updatedSessions.slice(0, 15);

    const newId = `session-${Date.now()}`;
    const initialMsg: AIChatMessage = {
      id: `init-${Date.now()}`,
      role: 'assistant',
      content: `Welcome to a new chat session. I am ready to answer your questions about **${state.selectedCity}** microclimate, heat risk, cool routes, or urban cooling.`,
      timestamp: new Date().toISOString(),
    };

    return {
      aiSessions: updatedSessions,
      activeSessionId: newId,
      aiMessages: [initialMsg],
    };
  }),

  loadChatSession: (sessionId: string) => set((state) => {
    const targetSession = state.aiSessions.find((s) => s.id === sessionId);
    if (!targetSession) return state;
    return {
      activeSessionId: sessionId,
      aiMessages: targetSession.messages,
    };
  }),

  deleteChatSession: (sessionId: string) => set((state) => {
    const filtered = state.aiSessions.filter((s) => s.id !== sessionId);
    return { aiSessions: filtered };
  }),
}));
