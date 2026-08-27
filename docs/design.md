# HeatShield AI
## UI/UX Design System & Spatial Interface Specifications

**Document Version:** 3.0  
**Target Event:** FortyGuard Hackathon 2026 — Track 1: Resilient Cities & Infrastructure  
**Core Product Framework:** Detect → Understand → Avoid → Reduce → Report  
**Design Philosophy:** Scientific Precision, Purposeful Restraint, High-Density Information Clarity

---

## 1. Design Direction & Non-Negotiable Aesthetics

HeatShield AI is an environmental spatial intelligence tool engineered for serious decision-making by citizens, city planners, and enterprise managers.

### 1.1 Strict Negative Directives (Anti-Generic Rules)

The application avoids:
* Generic AI startup aesthetics (purple/pink mesh gradients, neon drop shadows, glowing text).
* Overused SaaS template tropes (cards nested inside cards, cartoonish emojis, floating 3D spheres).
* Bubble-style oversized typography or multi-colored gradient headlines.
* Unnecessary decorative animations or gratuitous motion that slows data inspection.
* Fake or ungrounded data visualizations disguised as actual sensor readings.

### 1.2 Core Visual Pillars

| Pillar | Implementation |
| :--- | :--- |
| **Restrained Authority** | Deep dark obsidian and slate backgrounds paired with crisp, high-contrast monochrome UI elements. Color is reserved almost exclusively for thermal data. |
| **Data-First Hierarchy** | Key metrics (temperatures, Heat Risk Score, exposure delta) are presented with bespoke, purpose-built indicators rather than plain text inside generic rectangles. |
| **Tactile Spatial Feedback** | Subtle micro-interactions on map hover, precise cursor crosshairs, smooth camera transitions, and deterministic slider feedback. |
| **Scientific Legibility** | Distinctive typography pairings: geometric sans-serif for UI clarity and fixed-width monospace for telemetry, formulas, and coordinates. |

---

## 2. Color System & Thermal Spectrum

Color in HeatShield AI communicates thermodynamic reality. Heat colors are never used as arbitrary decorative accents.

### 2.1 Base Surface Tokens (Dual Basemap Design System)

#### Obsidian Satellite Glass Theme (Primary High-Contrast Mode)
```css
:root {
  --sat-glass-bg: rgba(11, 15, 23, 0.94);
  --sat-glass-border: rgba(255, 255, 255, 0.22);
  --sat-subglass-bg: rgba(255, 255, 255, 0.08);
  --sat-text-primary: #FFFFFF;
  --sat-text-secondary: rgba(255, 255, 255, 0.82);
  --sat-text-muted: rgba(255, 255, 255, 0.60);
}
```

#### Minimalist Street Mode (Light High-Contrast Mode)
```css
:root {
  --street-card-bg: rgba(255, 255, 255, 0.96);
  --street-card-border: #E2E8F0;
  --street-subcard-bg: #F8FAFC;
  --street-text-primary: #0F172A;
  --street-text-secondary: #475569;
  --street-text-muted: #94A3B8;
}
```

### 2.2 Thermal Data Ramps (Deterministic Spatial Scale)

The thermal spectrum maps continuous temperature directly to calibrated hex tokens:

```
[ < 24°C / < 75°F ]   #0EA5E9 (Cool Azure / Baseline)
[ 24°C – 29°C ]       #06B6D4 (Temperate Cyan)
[ 30°C – 34°C ]       #EAB308 (Moderate Amber)
[ 35°C – 39°C ]       #F97316 (High Thermal Orange)
[ 40°C – 44°C ]       #EF4444 (Severe Heat Crimson)
[ > 45°C / > 113°F ]  #881337 (Extreme Heat Deep Maroon)
```

### 2.3 Semantic & Functional Accents

* **Cool Recommended Route:** `#3B82F6` (Solid Sapphire Blue — indicates shade-maximized pedestrian path).
* **Direct Fastest Route:** `#F97316` (Dashed Coral / Amber — indicates standard GPS shortest distance).
* **Cooling Delta & Savings:** `#10B981` (Emerald Green — represents temperature reductions and tree canopy).
* **Thermal Advisory Warning:** `#F59E0B` (Amber Ochre — signals elevated microclimate heat stress).
* **Extreme Heat Alert:** `#EF4444` (Crimson Red — signals critical temperature danger).

---

## 3. Typography & Numerical Formatting

### 3.1 Type Hierarchy

* **Primary Interface Font:** Inter / System Sans-Serif (`font-sans`) — optimized for high-density UI rendering at 11px to 14px sizes.
* **Telemetry & Numeric Font:** JetBrains Mono / System Monospace (`font-mono`) — used for all coordinates, temperatures, timers, and mathematical formulas.

### 3.2 Temperature Formatting Standards

* Temperatures display 1 decimal point of precision: `38.2°C` or `100.8°F`.
* Temperature deltas always include an explicit positive or negative sign: `+3.4°C vs ambient` or `-4.2°C cooling`.
* GIS Coordinates display 4 decimal places of precision: `33.4484°N, 112.0740°W`.

---

## 4. Spatial Map UI & Microclimate HUD

### 4.1 Layout Philosophy & Non-Interference
The interactive map canvas is the focal point of the application. All UI panels (Thermal Layers, Route Finder, What-If Simulator, Telemetry Card, and Floating Legend) float above the map canvas using glassmorphism backdrops with strict viewport boundary constraints.

### 4.2 Elevation & Layer Hierarchy (Z-Index Scale)

| Level | Z-Index | Component |
| :--- | :--- | :--- |
| **Basemap Tiles** | `200` | Leaflet cartographic base tiles |
| **Thermal Canvas** | `350` | Fullscreen continuous heatmap raster |
| **Route Lines** | `500` | Vector polylines (Sapphire & Coral) |
| **Map Markers** | `700` | Origin (A), Destination (B), and Click Pin |
| **Map HUD Controls** | `1000` | TopNav, Layers Drawer, Bottom Legend |
| **Alerts & Toasts** | `1050` | Microclimate Advisory Banner, Toasts |
| **Side Drawers** | `1200` | AI Copilot Slide-Over Drawer |
| **Modals & Overlays** | `1300` | Executive PDF Report Modal, Docs Showcase |
