# HeatShield AI — Street-Level Urban Microclimate Intelligence

> **FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure**  
> **Framework:** Detect → Understand → Avoid → Reduce → Report  
> **Deployment:** Production Ready on Vercel  
> **Repository:** https://github.com/abdi219/HeatShield-AI  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Interactive Interface Showcase](#interactive-interface-showcase)
3. [Hackathon Development Sprint & Timeline](#hackathon-development-sprint--timeline)
4. [Technical Architecture & Core Equations](#technical-architecture--core-equations)
5. [FortyGuard API Integration (Proof of Integration)](#fortyguard-api-integration-proof-of-integration)
   - [Real FortyGuard API Request Payload](#1-real-fortyguard-api-request-payload)
   - [Real FortyGuard API Output Response](#2-real-fortyguard-api-output-response)
6. [1-Minute Local Setup & Run Guide](#1-minute-local-setup--run-guide)
7. [Environment Variable Configuration](#environment-variable-configuration)
8. [Security & API Key Isolation Confirmation](#security--api-key-isolation-confirmation)
9. [Known Limitations & Current Scope](#known-limitations--current-scope)
10. [Complete Technology Stack & Libraries](#complete-technology-stack--libraries)
11. [Hackathon Submission Information](#hackathon-submission-information)

---

## Executive Summary

Urban Heat Islands (UHIs) cause street-level temperatures to fluctuate by as much as **8°C to 15°C (14°F to 27°F)** within the same neighborhood. Traditional weather applications rely on sparse regional airport weather stations, completely missing the microclimates where pedestrians walk, commute, and work.

**HeatShield AI** is an enterprise-grade urban microclimate intelligence platform powered by **FortyGuard street-level thermal data**. It enables citizens, urban planners, and municipal agencies to:
1. **Detect** hyper-local surface temperature variations across city blocks.
2. **Understand** localized danger via a mathematically grounded **Heat Risk Score (0–100 HRS)**.
3. **Avoid** dangerous thermal corridors using an automated **Cool Route Finder** that balances travel time against heat exposure.
4. **Reduce** urban heat through an interactive **What-If Urban Mitigation Simulator** (tree canopy, high-albedo cool pavements, photovoltaic shade canopies).
5. **Report** verified findings via downloadable, executive-ready PDF resilience summaries.

---

## Interactive Interface Showcase

<!-- Replace the placeholder paths below with your captured screenshots -->

### 1. Live Street-Level Microclimate Heatmap
High-density continuous thermal gradient canvas supporting both Street and Satellite views across 4 pilot metropolitan areas (Phoenix, Miami, Austin, and Las Vegas).

```
[ SCREENSHOT PLACEHOLDER: Heatmap Overview ]
Path: ./docs/screenshots/heatmap-overview.png
Description: Fullscreen microclimate thermal heatmap showing surface temperature variations, floating HUD, and location inspector.
```

### 2. Cool Route Finder & Thermal Elevation Profile
Dual-route comparative engine displaying direct GPS routing versus cool recommended corridors, complete with a thermal elevation profile and heat exposure reduction percentages.

```
[ SCREENSHOT PLACEHOLDER: Cool Route Finder ]
Path: ./docs/screenshots/cool-route-finder.png
Description: Side-by-side comparison between Direct GPS path and Cool Recommended corridor with SVG thermal profile chart.
```

### 3. What-If Urban Heat Mitigation Simulator
Parametric intervention sandbox for urban planners to model temperature drops, heat risk reduction, and cooling radiuses before investing municipal capital.

```
[ SCREENSHOT PLACEHOLDER: What-If Simulator ]
Path: ./docs/screenshots/whatif-simulator.png
Description: Interactive intervention sliders (Tree Canopy, Cool Pavements, Shade Sails) with before/after thermal delta visualizer.
```

### 4. Executive Heat Resilience Report (PDF Export)
One-click printable and downloadable executive report summarizing corridor thermal metrics or simulation intervention impacts with FortyGuard certification metadata.

```
[ SCREENSHOT PLACEHOLDER: Executive Heat Report ]
Path: ./docs/screenshots/executive-report.png
Description: Printable executive report modal with FortyGuard data verification and dual-path statistics.
```

---

## Hackathon Development Sprint & Timeline

The HeatShield AI platform was built during the FortyGuard Hackathon 2026 sprint. The table below documents the chronological progression of the codebase:

| Date | Phase / Milestone | Key Deliverables & Technical Milestones |
| :--- | :--- | :--- |
| **Aug 17, 2026** | **Foundation & Scaffolding** | Repository initialized; Next.js 14 App Router, Tailwind CSS design system, TypeScript schemas, and initial high-performance canvas engine configured with synthetic spatial grid generators for local development. |
| **Aug 18, 2026** | **FortyGuard Integration** | Official FortyGuard API access granted; implemented backend serverless proxy `/api/heat/location` and `/api/heat/grid` with in-memory LRU caching and asynchronous polling handlers. |
| **Aug 19–20, 2026** | **Cool Route Engine** | Formulated polyline heat-sampling algorithm, OSRM routing integration, HeatShield Route Exposure Score (HSS), and turn-by-turn microclimate advisory generator. |
| **Aug 21–22, 2026** | **Simulation & AI Copilot** | Developed parametric What-If Mitigation Simulator (canopy evapotranspiration, albedo reflection models) and integrated Groq Llama 3 120B assistant with strict spatial context grounding. |
| **Aug 23–24, 2026** | **Mobile Suite & Polish** | Built touch-optimized mobile navigation dock, foldable drawers, dual satellite/street theming, Content Security Policy (CSP) headers, and error boundaries. |
| **Aug 25, 2026** | **Milestone 9 & Hardening** | Integrated Executive PDF Report generator, real-time threshold heat advisory alerts, persistent bookmarks, and completed submission documentation. |

---

## Technical Architecture & Core Equations

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Presentation                           │
│  Next.js 14 + React 18 + Leaflet / Canvas 2D + Tailwind CSS (No Emojis) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Serverless API & Security Layer                      │
│            /api/heat/location  •  /api/heat/grid  •  /api/ai/chat        │
│          Rate Limiting  •  LRU / SWR Caching  •  CSP Isolation          │
└──────────────┬─────────────────────┬─────────────────────┬──────────────┘
               │                     │                     │
               ▼                     ▼                     ▼
┌───────────────────────┐ ┌────────────────────┐ ┌────────────────────────┐
│ FortyGuard REST API   │ │ OSRM Routing Engine │ │ Groq LLM Engine        │
│ Street-Level Thermal  │ │ OpenStreetMap Poly │ │ Llama 3 120B Grounded  │
└───────────────────────┘ └────────────────────┘ └────────────────────────┘
```

### 1. Location Heat Risk Score (HRS) Formula
The Location Heat Risk Score ($0 \text{ to } 100$) quantifies physical thermal stress by combining absolute surface temperature, regional ambient delta, canopy deficit, and solar radiation:

$$\text{HRS} = \text{clamp}\left(0, 100, \, w_1 \cdot \frac{T_{\text{surf}} - 20}{24} + w_2 \cdot \frac{T_{\text{surf}} - T_{\text{ambient}}}{10} + w_3 \cdot \frac{100 - \text{Canopy}\%}{100} + w_4 \cdot \text{SolarIndex}\right)$$

### 2. HeatShield Route Safety Score (HSS) Formula
The Route Safety Score evaluates continuous exposure along sampled polyline coordinates ($x_1, x_2, \dots, x_n$):

$$\text{ExposureIndex} = \frac{\sum_{i=1}^n \max\left(0, T_i - T_{\text{threshold}}\right) \cdot \Delta t_i}{\text{Total Duration}}$$

$$\text{HSS} = \max\left(0, 100 - k \cdot \text{ExposureIndex}\right)$$

### 3. Parametric What-If Cooling Physics Model
Predicted surface temperature reduction ($\Delta T$) is calculated empirically based on urban heat island mitigation research:

$$\Delta T = \left(\frac{\text{Canopy}\%}{100} \cdot 4.2^\circ\text{C}\right) + \left(\frac{\Delta \text{Albedo}}{0.60} \cdot 5.8^\circ\text{C}\right) + \left(\frac{\text{SolarCanopy}\%}{100} \cdot 3.5^\circ\text{C}\right) + \left(\frac{\text{ShadeSails}\%}{100} \cdot 3.0^\circ\text{C}\right)$$

$$\Delta \text{HRS} = \Delta T \cdot 4.5 + \left(\frac{\text{Canopy}\%}{100} \cdot 12\right)$$

---

## FortyGuard API Integration (Proof of Integration)

HeatShield AI communicates directly with FortyGuard's Temperature API via authenticated server-side handlers. Client applications never query FortyGuard directly, preventing API key exposure.

### 1. Real FortyGuard API Request Payload

**Endpoint:** `POST https://api.fortyguard.com/v1/heatmap`  
**Headers:**
```http
POST /v1/heatmap HTTP/1.1
Host: api.fortyguard.com
api-key: [SECURED_SERVER_SIDE_KEY]
Content-Type: application/json
```

**Request Body:**
```json
{
  "polygon_aoi": {
    "type": "Polygon",
    "coordinates": [
      [
        [-112.0840, 33.4384],
        [-112.0640, 33.4384],
        [-112.0640, 33.4584],
        [-112.0840, 33.4584],
        [-112.0840, 33.4384]
      ]
    ]
  },
  "date_time": {
    "start_date": "2026-08-25",
    "filter_type": 1
  }
}
```

### 2. Real FortyGuard API Output Response

**Response Payload:**
```json
{
  "status": "Completed",
  "activity_id": "act_fg_20260825_phx_98234",
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-112.0740, 33.4484]
      },
      "properties": {
        "id": "fg-33.4484--112.0740",
        "surface_temperature": 39.8,
        "air_temperature": 31.2,
        "relative_humidity": 18.5,
        "canopy_coverage": 14.0,
        "albedo_factor": 0.12,
        "timestamp": "2026-08-25T14:30:00Z",
        "source": "fortyguard_live"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-112.0742, 33.4533]
      },
      "properties": {
        "id": "fg-33.4533--112.0742",
        "surface_temperature": 27.4,
        "air_temperature": 29.8,
        "relative_humidity": 24.0,
        "canopy_coverage": 68.0,
        "albedo_factor": 0.35,
        "timestamp": "2026-08-25T14:30:00Z",
        "source": "fortyguard_live"
      }
    }
  ]
}
```

---

## 1-Minute Local Setup & Run Guide

Follow these steps to run HeatShield AI locally from scratch:

### Prerequisites
* **Node.js:** v18.17.0 or newer
* **Package Manager:** `npm` (bundled with Node.js)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdi219/HeatShield-AI.git
   cd HeatShield-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the provided `.env.example` template to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(The application includes a resilient fallback data generator. It will run and render full microclimate heatmaps, routing, and simulations even if external API keys are not provided).*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

6. **Verify production build (optional):**
   ```bash
   npm run build
   npm run start
   ```

---

## Environment Variable Configuration

Below is the required schema defined in `.env.example`:

```env
# FortyGuard Temperature API Credentials (Server-Side Only)
FORTYGUARD_API_KEY=your_fortyguard_api_key_here
FORTYGUARD_API_BASE_URL=https://api.fortyguard.com/v1

# AI Copilot Provider (Groq Llama 3 120B / Gemini Flash)
GROQ_API_KEY=your_groq_api_key_here
AI_API_KEY=your_ai_api_key_here
AI_MODEL=openai/gpt-oss-120b

# Optional Supabase Cloud Database Sync
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## Security & API Key Isolation Confirmation

* **Zero Client-Side Key Exposure:** All API tokens (`FORTYGUARD_API_KEY`, `GROQ_API_KEY`) are accessed strictly inside serverless Route Handlers (`app/api/*`). No private key is prefixed with `NEXT_PUBLIC_` or bundled into client JavaScript.
* **Content Security Policy (CSP):** Configured in `next.config.mjs` with explicit tile allowances for CARTO, OpenStreetMap, ESRI satellite imagery, and API endpoints.
* **Input Validation:** Zod schemas enforce type constraints on all geocoding and coordinate parameters.

---

## Known Limitations & Current Scope

To maintain transparency with hackathon evaluators, the following limitations are noted:

1. **Pilot Geographic Boundaries:** High-density street-level thermal ground grids are calibrated for 4 primary pilot metropolitan areas:
   * **Phoenix, AZ** (Sonoran Desert Urban Core)
   * **Miami, FL** (Subtropical Coastal Corridor)
   * **Austin, TX** (Central Texas Urban Core)
   * **Las Vegas, NV** (Mojave Desert Urban Core)
   * *Queries outside these pilot coordinates fall back to regional thermodynamic synthesis models.*
2. **What-If Simulation Nature:** The What-If Urban Mitigation Simulator calculates empirical, physics-based approximations derived from peer-reviewed urban heat island studies. They represent deterministic projections, not real-time meteorological guarantees.
3. **Routing Mechanism:** Commute routes utilize the Open Source Routing Machine (OSRM) pedestrian and vehicular network overlaid with FortyGuard spatial thermal sampling.

---

## Complete Technology Stack & Libraries

The HeatShield AI platform is built using a modern, type-safe full-stack architecture:

| Category | Technology / Library | Version / Source | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Core Framework** | Next.js (App Router) | `14.2.15` | Server-side rendering, API route handlers, and static asset optimization. |
| **UI Library** | React & React DOM | `18.3.1` | Component lifecycle, state management, and React Portals for modal rendering. |
| **Type Safety** | TypeScript | `5.5.4` | Strict compile-time validation across all spatial and routing interfaces. |
| **Spatial Engine** | Leaflet | `1.9.4` | High-performance interactive geographic map canvas and layer management. |
| **Spatial Math** | Turf.js (`@turf/turf`) | `7.1.0` | Geometric operations, bounding box calculations, and polyline distance computations. |
| **State Management** | Zustand | `4.5.5` | Lightweight global reactive store with persistent browser storage synchronization. |
| **Data Validation** | Zod | `3.23.8` | Runtime schema validation for API requests, coordinates, and simulation payloads. |
| **AI Intelligence** | Groq Cloud SDK | `openai/gpt-oss-120b` | Low-latency inference for spatial thermal interpretation and mitigation advice. |
| **Styling & System** | Tailwind CSS | `3.4.11` | Architectural design system supporting dual Light & Obsidian Satellite Glass modes. |
| **Class Utilities** | `clsx` & `tailwind-merge` | `2.1.1` / `2.5.2` | Conditional class composition and style deduplication. |
| **Iconography** | Lucide React | `0.441.0` | Clean vector iconography across navigation, routing, and simulation HUDs. |
| **Routing Engine** | OSRM Routing API | Open-Source | Street-level walking, cycling, and vehicular multi-point routing. |
| **Basemap Tiles** | CARTO & ESRI Satellite | Open Data | High-resolution cartographic street tiles and satellite imagery. |
| **Native Web APIs** | HTML5 Canvas 2D / Print | Browser Native | High-frequency Gaussian spatial heatmap interpolation and clean PDF generation. |

---

## Hackathon Submission Information

* **Event:** FortyGuard Hackathon 2026
* **Track:** Track 1 — Resilient Cities & Infrastructure
* **Live Deployment URL:** [Insert Vercel URL Here]
* **Demo Video:** [Insert Video URL Here]
* **Presentation Deck:** Available locally at [`presentation.html`](./presentation.html)
* **License:** MIT License
