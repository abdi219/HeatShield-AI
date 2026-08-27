# HeatShield AI
## Product Requirements Document (PRD) — Production Edition

**Document Version:** 3.0  
**Target Event:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure  
**Core Framework:** Detect → Understand → Avoid → Reduce → Report  
**Platform:** Full-Stack Web Application (Next.js 14 App Router / React 18 / TypeScript)  
**Primary Objective:** Deliver an enterprise-grade spatial intelligence platform powered by FortyGuard street-level thermal data to detect, understand, avoid, reduce, and report urban microclimate heat stress.

---

## 1. Executive Summary & Product Overview

Urban Heat Islands (UHIs) cause street-level temperatures to fluctuate by as much as 8°C to 15°C (14°F to 27°F) within the same neighborhood. Traditional weather applications rely on sparse regional airport weather stations, completely missing the microclimates where pedestrians walk, commute, and work.

HeatShield AI is an environmental spatial intelligence platform that transforms raw FortyGuard thermal data into actionable decisions for citizens, city planners, and resilience officers.

The product operates across five unified pillars:

1. **Detect:** Visualize continuous, street-level microclimate surface temperature gradients and hotspots.
2. **Understand:** Translate raw temperature, canopy deficit, and albedo factors into a unified Heat Risk Score (0–100 HRS).
3. **Avoid:** Generate and compare commute corridors with a dual-route engine that balances travel time against cumulative heat exposure.
4. **Reduce:** Model parametric urban cooling interventions (tree canopy, cool high-albedo pavements, photovoltaic and shade canopies) using physics-based cooling equations.
5. **Report:** Generate printable, executive-ready PDF resilience audits and shareable scenario snapshots.

---

## 2. Problem Statement

Existing weather applications communicate atmospheric temperature at a metropolitan or regional level. This creates a fundamental gap:

* **Regional Weather:** "The average temperature in Phoenix is 38°C today."
* **Street-Level Reality:** "The unshaded asphalt intersection on West Van Buren Street is 47.2°C with dangerous thermal stress, while the tree-lined path one block north is 33.1°C."

HeatShield AI bridges this gap by combining hyper-local sensor telemetry, spatial canvas rendering, routing algorithms, grounded artificial intelligence, and urban cooling simulations into a unified interface.

---

## 3. Product Goals & Success Metrics

### Primary Goals
* **FortyGuard API Integration:** Establish authenticated server-side communication with FortyGuard Temperature APIs with automated fallback synthesis for resilience.
* **Continuous Thermal Map Canvas:** Render smooth 60 FPS continuous microclimate heatmaps across Street and Satellite basemaps using HTML5 Canvas 2D and Leaflet.
* **Interactive Street-Level Telemetry:** Enable one-click point inspection anywhere on the map, returning surface temperature, ambient delta, Heat Risk Score, and contributing urban factors.
* **Dual-Route Cool Corridor Engine:** Provide side-by-side comparison between the fastest direct route and a heat-minimized cool corridor, complete with turn-by-turn microclimate advisories and thermal elevation profile charts.
* **Parametric What-If Simulator:** Enable urban planners to dynamically simulate temperature drops, risk score reductions, and cooling radiuses before capital investment.
* **Grounded AI Copilot:** Deploy an interactive urban heat copilot powered by Groq Llama 3 120B strictly anchored in active screen telemetry and spatial context.
* **Executive PDF Reporting:** Enable one-click export of verified corridor and simulation reports with FortyGuard certification metadata.
* **Touch-Optimized Mobile Experience:** Deliver a thumb-ergonomic interface with a floating bottom navigation dock, non-overlapping collapsible sheets, and speed-dial thermal controls.

### Success Metrics
* Map viewport render and pan latency < 16ms (60 FPS).
* Spatial tile query response time < 50ms with in-memory caching.
* Route exposure calculation < 800ms for pedestrian corridors.
* Zero client-side API key leakage across all network requests.

---

## 4. User Personas & Core Workflows

### 4.1 Everyday Pedestrian & Commuter (Elena)
* **Goal:** Travel from Point A to Point B during peak afternoon hours without suffering heat exhaustion.
* **Workflow:** Opens Route Finder -> Enters origin and destination (or drops pins on map) -> HeatShield automatically reverse-geocodes street addresses -> Reviews Direct vs Cool Corridor -> Selects Cool Corridor to reduce heat exposure by 28% -> Follows turn-by-turn shaded guidance.

### 4.2 Municipal Urban Planner (Marcus)
* **Goal:** Prioritize urban greening and cool pavement investments in vulnerable neighborhoods.
* **Workflow:** Jumps to pilot city (e.g., Phoenix) -> Inspects high-heat anomaly zones -> Opens What-If Simulator -> Adjusts Tree Canopy to 40% and Cool Pavement Albedo to 0.45 -> Evaluates simulated 3.8°C cooling delta and 140-meter cooling radius -> Exports Executive Heat Resilience Report for council review.

### 4.3 Public Health & Emergency Response Officer (Dr. Sarah)
* **Goal:** Monitor microclimate heat risk thresholds and issue proactive warnings.
* **Workflow:** Monitors continuous Heat Risk Score layer -> Receives automated real-time Microclimate Heat Advisory banner when local street temperature exceeds 37.5°C -> Analyzes localized albedo and canopy deficit penalties -> Shares mitigation guidelines.

---

## 5. Geographic Scope & Supported Metros

High-density street-level thermal ground models and pilot benchmarks are active for:

| Metropolitan Area | Climate Zone | Baseline Ambient | Core Focus Areas |
| :--- | :--- | :--- | :--- |
| **Phoenix, AZ** | Sonoran Desert (BWh) | 38.0°C (100.4°F) | Downtown Corridor, Central Avenue, Capitol District |
| **Miami, FL** | Subtropical Coastal (Am) | 32.0°C (89.6°F) | Brickell Financial District, Downtown, Biscayne Boulevard |
| **Austin, TX** | Humid Subtropical (Cfa) | 36.0°C (96.8°F) | Congress Avenue, Rainey Street, University District |
| **Las Vegas, NV** | Mojave Desert (BWh) | 39.0°C (102.2°F) | Las Vegas Boulevard, Downtown Fremont, Arts District |
| **Dubai, UAE** | Hyper-Arid Desert (BWh) | 41.0°C (105.8°F) | Downtown Urban Core, Financial Center |

---

## 6. Functional Specifications

### 6.1 Live Microclimate Heat Map
* Fullscreen Leaflet map canvas with custom 2D Gaussian thermal interpolation.
* Dual basemap support: Minimal Street Carto tiles and High-Resolution ESRI Satellite imagery.
* Three selectable microclimate layers:
  1. Surface Temperature (°C / °F)
  2. Heat Risk Score (0–100 HRS)
  3. Tree Canopy Deficit (%)
* Continuous thermal color gradient legend spanning Cool Azure (<24°C) to Extreme Heat Deep Maroon (>45°C).
* Top-left quick city jumper with smooth fly-to animations.
* Full-layer toggle (Heat: ON / OFF) with dynamic opacity controls.

### 6.2 Street-Level Location Inspector
* Clicking any map coordinate triggers reverse-geocoding and instant thermal analysis.
* Displays:
  * Exact street address and GIS coordinates.
  * Measured ground surface temperature and delta anomaly vs ambient.
  * Heat Risk Score (0–100) and qualitative risk level (Low, Moderate, Elevated, High, Extreme).
  * Contributing urban factors (Surface Albedo Penalty %, Vegetation Deficit Penalty %, Solar Irradiance %).
* Mobile collapsible sheet with two-state glanceable summary and full detailed breakdown.

### 6.3 Cool Route Finder & Comparison Engine
* Origin (A) and Destination (B) input system supporting text search and interactive map pin dropping.
* Automatic geospatial reverse-geocoding converts dropped map coordinates into human-readable street names.
* Multi-modal travel options: Walking (default 4.8 km/h), Cycling (15 km/h), and Driving (40 km/h).
* Side-by-side comparative analytics:
  * Direct Route (GPS fastest distance) vs Cool Recommended Corridor (shade-optimized).
  * Travel time duration and distance in kilometers.
  * Average route temperature and peak heat exposure.
  * Net heat exposure reduction percentage.
* Turn-by-turn directions with localized microclimate advisories (Shaded Tree Canopy vs High Heat Exposure).
* Responsive SVG thermal elevation profile chart illustrating temperature along the route distance.
* Route saving and bookmark persistence stored locally in browser localStorage.

### 6.4 Parametric What-If Mitigation Simulator
* Parametric intervention sandbox for urban planners.
* Dynamic intervention sliders:
  * Urban Tree Canopy Coverage (0% – 100%)
  * Cool Pavement Albedo (0.10 – 0.70 albedo index)
  * Photovoltaic / Solar Shade Canopies (0% – 100%)
  * Permeable Shaded Walkway Sails (0% – 100%)
* Real-time calculation of:
  * Projected surface temperature reduction (Delta T in °C/°F).
  * Projected Heat Risk Score reduction (Delta HRS).
  * Estimated spatial cooling radius (meters).
  * Ambient co-benefit cooling.
* Visual comparison switcher: Mitigated View, Baseline View, and Delta Heat Difference.
* Plan saving, management, and named scenario persistence in browser storage.

### 6.5 Grounded AI Heat Copilot
* Interactive conversational assistant powered by Groq Llama 3 120B.
* Server-side context injection guarantees answers are strictly anchored in:
  * Active city and selected street telemetry.
  * Active route comparison data (exposure reduction, temperatures, step directions).
  * Active simulation interventions and cooling projections.
* Pre-configured quick prompt chips tailored to the active tab.
* Multi-session history management stored in browser storage.
* Expandable full-drawer view and clean Markdown message formatting.

### 6.6 Executive Heat Resilience Reports
* One-click modal generation for both Route Analysis and Mitigation Simulation.
* Printable and downloadable PDF layout formatted for municipal executive presentations.
* Includes:
  * Official FortyGuard data verification badge and timestamp.
  * Executive summary metrics and exposure delta cards.
  * Turn-by-turn thermal breakdown or parametric intervention formulas.
  * Disclaimer notes on empirical microclimate variance.

---

## 7. Technical & Non-Functional Requirements

* **Performance:** 60 FPS canvas rendering with double-buffered redraws; sub-second routing computation.
* **Security:** Zero client-side API key exposure; strict Content Security Policy (CSP); Zod parameter validation.
* **Resilience:** Dual-layer fallback mechanism ensuring 100% platform availability even during upstream API outages.
* **Responsiveness:** Full functional parity across mobile smartphones, tablets, and desktop workstations.
* **Accessibility:** High-contrast text tokens, semantic ARIA live regions for alerts, and full keyboard navigation support.

---

## 8. Compliance & Submission Scope

* **Hackathon Track:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure
* **Submission Deliverables:** Public GitHub repository, interactive deployment on Vercel, slide presentation deck, and comprehensive documentation suite.
