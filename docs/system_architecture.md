# HeatShield AI
## System Architecture & Engineering Specifications

**Document Version:** 3.0  
**Target Event:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure  
**Core Stack:** Next.js 14 (App Router) • React 18 • TypeScript • Leaflet 1.9 & Canvas 2D • Zustand 4.5 • FortyGuard Temperature API • Groq Cloud SDK (Llama 3 120B) • OSRM Routing Engine • Supabase (PostgreSQL)  
**Deployment Target:** Vercel Edge / Serverless Production Environment

---

## 1. High-Level System Architecture

HeatShield AI is engineered as an event-driven, serverless spatial intelligence platform. It cleanly separates high-performance, 60 FPS client map interactions from compute-heavy thermal equations, external sensor API proxying, and grounded AI inference on the backend.

```mermaid
flowchart TB
    subgraph Client [Client Presentation Layer — Next.js 14 / React 18]
        UI[Interactive HUD & Responsive Dock]
        MapCanvas[Leaflet + HTML5 Canvas 2D Engine]
        StateStore[Zustand Reactive Store]
        ChartEngine[Thermal Profile Visualizer]
    end

    subgraph EdgeAPI [Serverless API Gateway — Next.js Route Handlers]
        ProxyFortyGuard[/api/heat/grid & /api/heat/location]
        GeocodeAPI[/api/geocode]
        AIEngine[/api/ai/chat]
    end

    subgraph DataServices [External Services & AI Layer]
        FortyGuardAPI[(FortyGuard Street Temperature API)]
        OSRMService[(OSRM Multi-Modal Routing Engine)]
        GroqLLM[(Groq Cloud — Llama 3 120B)]
    end

    subgraph Persistence [Persistence Layer — Supabase PostgreSQL & Local Storage]
        BrowserStore[(Browser LocalStorage — Bookmarks & Scenarios)]
        SupabaseDB[(Supabase PostgreSQL — Optional Cloud Sync)]
    end

    UI <--> StateStore
    StateStore <--> MapCanvas
    StateStore <--> ChartEngine

    StateStore -->|HTTPS / JSON| EdgeAPI
    StateStore <--> BrowserStore

    ProxyFortyGuard <-->|Authenticated HTTPS & In-Memory Cache| FortyGuardAPI
    GeocodeAPI <-->|Reverse Geocoding| OSRMService
    AIEngine <-->|Injected Spatial Telemetry Context| GroqLLM
    EdgeAPI <--> SupabaseDB
```

---

## 2. Spatial Heatmap Engine Architecture

### 2.1 Double-Buffered Canvas 2D Rendering
Rather than creating thousands of heavy DOM elements, HeatShield AI renders continuous thermal fields directly to a fullscreen `<canvas>` layer attached to Leaflet.

* **Layer Stacking Hierarchy (CSS & DOM):**
  * `leaflet-tile-pane` (`z-index: 200`): Base cartographic map tiles.
  * `leaflet-thermal-canvas` (`z-index: 350`): High-frequency thermal raster gradient.
  * `leaflet-overlay-pane` (`z-index: 500`): Polyline route geometry (Sapphire Cool Route & Coral Direct Route).
  * `leaflet-marker-pane` (`z-index: 700`): Origin (A), Destination (B), and Selected Location pins (`zIndexOffset: 2000–3000`).

### 2.2 Gaussian Radial Heat Distribution
Thermal points are drawn onto an offscreen canvas using radial gradients where pixel alpha correlates with relative temperature anomaly:

```typescript
const rad = ctx.createRadialGradient(px, py, 0, px, py, radius);
rad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha})`);
rad.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
rad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
```

---

## 3. Mathematical Foundations & Core Equations

### 3.1 Location Heat Risk Score (HRS)
The Location Heat Risk Score ($0 \text{ to } 100$) quantifies physiological thermal stress by integrating measured surface temperature, local ambient anomaly, tree canopy deficit, and solar radiation index:

$$\text{HRS} = \text{clamp}\left(0, 100, \, w_1 \cdot \frac{T_{\text{surf}} - 20}{24} + w_2 \cdot \frac{T_{\text{surf}} - T_{\text{ambient}}}{10} + w_3 \cdot \frac{100 - \text{Canopy}\%}{100} + w_4 \cdot \text{SolarIndex}\right)$$

Where default weights are calibrated to: $w_1 = 40$, $w_2 = 30$, $w_3 = 20$, $w_4 = 10$.

| Score Range | Risk Category | Severity Level | Recommended Action |
| :--- | :--- | :--- | :--- |
| **0 – 30** | Low Heat Risk | Baseline | Safe for prolonged outdoor activity. |
| **31 – 50** | Moderate Risk | Advisory | Standard hydration; routine sun protection. |
| **51 – 70** | Elevated Risk | Warning | Seek intermittent tree shade along walking corridors. |
| **71 – 85** | High Heat Risk | High Alert | Continuous exposure limit < 25 mins; active cool routing. |
| **86 – 100** | Extreme Risk | Emergency | Dangerous microclimate; immediate shaded transit advised. |

### 3.2 HeatShield Route Safety Score (HSS) & Cumulative Exposure
The Route Safety Score evaluates continuous exposure along sampled polyline coordinates ($x_1, x_2, \dots, x_n$) with step durations ($\Delta t_i$):

$$\text{ExposureIndex} = \frac{\sum_{i=1}^n \max\left(0, T_i - T_{\text{threshold}}\right) \cdot \Delta t_i}{\text{Total Duration}}$$

$$\text{HSS} = \max\left(0, 100 - k \cdot \text{ExposureIndex}\right)$$

$$\text{Exposure Reduction } \% = \frac{\text{Exposure}_{\text{Direct}} - \text{Exposure}_{\text{Cool}}}{\text{Exposure}_{\text{Direct}}} \times 100$$

### 3.3 Parametric What-If Urban Cooling Physics Model
Predicted surface temperature reduction ($\Delta T$) is calculated empirically based on peer-reviewed urban heat island mitigation literature:

$$\Delta T = \left(\frac{\text{Canopy}\%}{100} \cdot 4.2^\circ\text{C}\right) + \left(\frac{\Delta \text{Albedo}}{0.60} \cdot 5.8^\circ\text{C}\right) + \left(\frac{\text{SolarCanopy}\%}{100} \cdot 3.5^\circ\text{C}\right) + \left(\frac{\text{ShadeSails}\%}{100} \cdot 3.0^\circ\text{C}\right)$$

$$\Delta \text{HRS} = \Delta T \cdot 4.5 + \left(\frac{\text{Canopy}\%}{100} \cdot 12\right)$$

$$\text{Cooling Radius (meters)} = 30 + (\text{Canopy}\% \cdot 1.2) + (\Delta \text{Albedo} \cdot 80)$$

---

## 4. Backend API Endpoints & Serverless Handlers

| Route | Method | Purpose | Caching Strategy |
| :--- | :--- | :--- | :--- |
| `/api/heat/grid` | `GET` / `POST` | Fetches spatial thermal grid bounding boxes from FortyGuard API. | In-Memory LRU Cache (`TTL = 300s`) |
| `/api/heat/location` | `GET` | Fetches point-specific microclimate telemetry for selected coordinates. | Spatial Coordinate Cache (`TTL = 600s`) |
| `/api/geocode` | `GET` | Reverse geocodes coordinates to street names and forward searches places. | In-Memory Geocode Cache (`TTL = 86400s`) |
| `/api/ai/chat` | `POST` | Injects live spatial telemetry into Groq Llama 3 120B stream. | Real-Time Non-Cached Streaming |

---

## 5. Security & Isolation Architecture

* **Zero Client-Side Token Exposure:** Private API keys (`FORTYGUARD_API_KEY`, `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are accessed strictly inside server-side route handlers (`app/api/*`). No private secret is prefixed with `NEXT_PUBLIC_`.
* **Content Security Policy (CSP):** Configured in `next.config.mjs` with explicit allowances for CARTO basemap tiles, OpenStreetMap, ESRI satellite servers, and Groq inference endpoints.
* **Input Validation:** Zod schemas enforce type constraints and range limits on all incoming request parameters.

---

## 6. Database Schema (Optional Cloud Sync)

For optional cross-device persistence, the PostgreSQL / Supabase schema supports saved corridors, scenarios, and audit logs:

```sql
-- Public user profile schema
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  preferred_temp_unit TEXT DEFAULT 'celsius',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved route bookmarks
CREATE TABLE public.saved_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  travel_mode TEXT NOT NULL,
  cool_score INTEGER NOT NULL,
  exposure_reduction_pct DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved What-If simulation plans
CREATE TABLE public.saved_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  tree_canopy_pct INTEGER NOT NULL,
  cool_pavement_albedo DOUBLE PRECISION NOT NULL,
  solar_canopy_pct INTEGER NOT NULL,
  temp_reduction_delta DOUBLE PRECISION NOT NULL,
  heat_risk_reduction_delta INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
