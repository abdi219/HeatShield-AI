# HeatShield AI — UI/UX Design System & Experience Specifications

> **Version:** 2.0 (Hackathon Edition)  
> **Core Product Framework:** Detect → Understand → Avoid → Reduce  
> **Design Philosophy:** Scientific Precision, Purposeful Restraint, High-Density Information Clarity

---

## 1. Design Direction & Non-Negotiable Aesthetics

HeatShield AI is an environmental spatial intelligence tool engineered for serious decision-making by citizens, city planners, and enterprise managers.

### 1.1 Strict Negative Directives (Anti-Generic Rules)

As mandated by Section 14 of the PRD, the application must **NOT** exhibit:
- Generic AI startup aesthetics (purple/pink mesh gradients, neon drop shadows, glowing text).
- Overused SaaS template tropes (cards nested inside cards, giant cartoonish emojis, floating 3D spheres).
- Bubble-style oversized typography or multi-colored gradient headlines.
- Unnecessary decorative animations or gratuitous motion that slows data inspection.
- Fake or ungrounded data visualizations disguised as actual sensor readings.

### 1.2 Core Visual Pillars

| Pillar | Implementation |
|---|---|
| **Restrained Authority** | Deep dark obsidian and slate backgrounds paired with crisp, high-contrast monochrome UI elements. Color is reserved almost exclusively for thermal data. |
| **Data-First Hierarchy** | Key metrics (temperatures, Heat Risk Score, exposure delta) are presented with bespoke, purpose-built indicators rather than plain text inside generic rectangles. |
| **Tactile Spatial Feedback** | Subtle micro-interactions on map hover, precise cursor crosshairs, smooth camera transitions, and deterministic slider feedback. |
| **Scientific Legibility** | Distinctive typography pairings: geometric sans-serif for UI clarity and fixed-width monospace for telemetry, formulas, and coordinates. |

---

## 2. Color System & Thermal Spectrum

Color in HeatShield AI communicates thermodynamic reality. Heat colors are never used as arbitrary decorative accents.

### 2.1 Base Surface Tokens (Dark Mode Primary)

```css
:root {
  /* Backgrounds & Canvas */
  --bg-primary: #080B10;      /* Deep Obsidian Void */
  --bg-surface: #0F141C;      /* Slate HUD & Surface Panel */
  --bg-elevated: #161D27;     /* Popovers, Tooltips & Elevated Cards */
  --bg-overlay: rgba(15, 20, 28, 0.85); /* Glassmorphism Backdrop Blur */

  /* Borders & Dividers */
  --border-subtle: #1E293B;   /* Ultra-fine card separation */
  --border-active: #334155;   /* Focused input / active tab */
  --border-highlight: #475569;/* Hovered elements */

  /* Text & Foreground */
  --text-primary: #F8FAFC;    /* 98% Light Slate — Key Readings & Titles */
  --text-secondary: #94A3B8;  /* 60% Muted Slate — Subtitles & Explanations */
  --text-tertiary: #64748B;   /* 40% Faded Slate — Meta tags, timestamps, units */
  --text-inverse: #080B10;    /* For light badges */
}
```

### 2.2 Thermal Data Ramps (Deterministic Spatial Scale)

The thermal spectrum maps continuous temperature ($^\circ\text{C}$ / $^\circ\text{F}$) directly to calibrated hex tokens:

```
[ < 24°C / < 75°F ]   #0EA5E9 (Cool Azure / Baseline)
[ 24°C – 29°C ]       #06B6D4 (Temperate Cyan)
[ 30°C – 34°C ]       #EAB308 (Moderate Amber)
[ 35°C – 39°C ]       #F97316 (High Thermal Orange)
[ 40°C – 44°C ]       #EF4444 (Severe Heat Crimson)
[ > 45°C / > 113°F ]  #881337 (Extreme Heat Deep Maroon)
```

### 2.3 Semantic & Functional Accents

- **Brand Accent:** `#38BDF8` (Sky Blue — used sparingly for active states, CTA borders, and selected nodes).
- **Cooling / Mitigated Delta:** `#10B981` (Emerald Green — represents temperature reductions and shaded corridors).
- **Warning / Unverified Area:** `#F59E0B` (Amber Ochre — indicates partial FortyGuard data or estimated boundaries).

---

## 3. Typography System

```css
/* Typography Scale */
--font-sans: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
```

| Type Role | Font Family | Weight | Size / Line-Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display Heading** | Sans | 700 (Bold) | `32px / 38px` | `-0.025em` | Hero titles, landing page headers |
| **Section Title** | Sans | 600 (Semibold) | `20px / 26px` | `-0.015em` | Modal titles, HUD view headers |
| **Card / Widget Label** | Sans | 600 (Semibold) | `13px / 16px` | `+0.05em` | All-caps metadata headers (`HEAT RISK SCORE`) |
| **Body Primary** | Sans | 400 (Regular) | `14px / 20px` | `0` | Analysis prose, descriptions, FAQs |
| **Data Metric / Value** | Mono | 600 (Semibold) | `24px / 28px` | `-0.02em` | `41.3°C`, `HRS 84`, `12.4 min` |
| **Telemetry / Code** | Mono | 400 (Regular) | `12px / 16px` | `0` | Coordinates, formulas, raw FortyGuard tags |

---

## 4. Spatial Map UI & Microclimate HUD

The interactive map is the foundational canvas of the application. The map controls and data overlays follow a floating HUD paradigm that maximizes map real estate.

```
+-------------------------------------------------------------------------------+
| [ HeatShield AI ]   [ 🔍 Search street, landmark, or city... ]   [ Live Feeds ]|
+-------------------------------------------------------------------------------+
| [ Layer Controls ]                                         [ Location Inspector]
|  (•) Surface Temp                                           Street: E 7th St  |
|  ( ) Heat Risk Score                                        Temp: 41.8°C      |
|  ( ) Shade Deficit                                          HRS: 88 (Extreme) |
|                                                             ----------------- |
| [ Nav Modes ]                                               [ Factors ]       |
|  [ Map ] [ Cool Route ] [ What-If ]                         • Low Canopy (8%) |
|                                                             • High Albedo Pave|
|                                                             [ AI Deep-Dive →] |
+-------------------------------------------------------------------------------+
| [ 24°C  ==== Amber ==== Orange ==== Crimson ==== 48°C ] (Thermal Scale Legend)|
+-------------------------------------------------------------------------------+
```

### 4.1 HUD Glass Panel Specifications
- **Background:** `rgba(15, 20, 28, 0.82)` with `backdrop-filter: blur(12px) saturate(180%)`.
- **Border:** `1px solid rgba(255, 255, 255, 0.08)`.
- **Corner Radius:** `8px` (Refined, architectural feel; no aggressive rounded pills).
- **Shadow:** `0 8px 32px -4px rgba(0, 0, 0, 0.6)`.

### 4.2 Location Inspector Card (Micro-View)
When a user clicks any point on the map:
1. A subtle target ring animates at the clicked coordinate.
2. The Inspector Card slides in from the right edge.
3. Content layout:
   - **Header:** Geocoded street name + GPS coordinates (`33.4484° N, 112.0740° W`).
   - **Hero Metric:** Large mono readout of Street-Level Surface Temp vs Regional Ambient Temp.
   - **Heat Risk Score Circular Gauge:** 0–100 SVG radial arc with dynamic color gradient.
   - **Environmental Drivers:** Breakdown bars (Asphalt fraction, Tree canopy %, Solar exposure index).
   - **Action Trigger:** Button to send current location context directly into the AI Heat Assistant.

---

## 5. Cool Route Finder Interface

The Cool Route Finder provides side-by-side comparative analysis between the **Fastest Route** (traditional GPS) and the **Cool Route** (heat-optimized navigation).

```
+------------------------------------------------------------------------------+
| [ Route Input: Start: Austin Convention Center -> End: Republic Square ]     |
+------------------------------------------------------------------------------+
| [ FASTEST ROUTE ] (Direct)            | [ COOL RECOMMENDED ROUTE ] (Shaded)  |
| ⏱️ 14 mins  •  📏 1.1 km              | ⏱️ 16 mins (+2 min)  •  📏 1.2 km    |
| 🔥 Avg Temp: 39.4°C (Peak: 43.1°C)    | 🍃 Avg Temp: 33.2°C (Peak: 35.8°C)   |
| ⚠️ Heat Exposure Index: 82/100         | 🛡️ HeatShield Score: 88/100 (+42% Cool)|
+------------------------------------------------------------------------------+
| [ Thermal Elevation Profile Chart: Distance (km) vs Temperature (°C) ]       |
|  Fastest:  /\_/\_/\-/\_  (Consistent high exposure in direct sun)            |
|  Cool:     \____/\_____  (Maintains tree canopy corridor along 4th St)       |
+------------------------------------------------------------------------------+
```

### 5.1 Route Visualization On-Map
- **Fastest Route:** Polyline rendered with segmented thermal gradient (orange to crimson) reflecting street-level heat exposure.
- **Cool Route:** Polyline rendered with vibrant emerald/cyan core with subtle halo glow to indicate recommended path.
- **Interactive Scrubber:** Hovering across the thermal profile chart moves a marker pin along the route polyline in real-time.

---

## 6. What-If Mitigation Simulator Interface

The Simulator equips urban planners and property managers with a sandbox to model spatial cooling interventions.

### 6.1 Sandbox Controls Dock
- **Zone Selector Tool:** Bounding box rectangle or custom polygon drawing tool.
- **Intervention Palette:**
  1. *Urban Tree Canopy* (Select coverage: $10\% \rightarrow 80\%$)
  2. *Reflective Cool Pavements / Roofs* (Albedo bump: $0.15 \rightarrow 0.65$)
  3. *Solar Shading Canopies* (Structure density: $20\% \rightarrow 90\%$)
  4. *Tensile Fabric Shading* (Pedestrian walkway coverage)
- **Live Parameter Sliders:** Real-time feedback with instant recalculation.

### 6.2 Visual Comparison Modes
- **Side-by-Side Dual Viewport:** Synchronized camera view showing Baseline Thermal Grid vs Mitigated Thermal Grid.
- **Curtain Split Slider:** Interactive vertical slider handle allowing the user to swipe left/right across the map to reveal cooling impact.
- **Delta Heat Map Overlay:** Heatmap layer rendering only the negative delta ($-\Delta^\circ\text{C}$), highlighting zones where temperatures drop by $2^\circ\text{C}$ to $6^\circ\text{C}$.

### 6.3 Scientific Disclaimer Banner
- Permanent banner at the bottom of the simulator:  
  *“Physics-based mathematical projection based on empirical urban microclimate literature. Projected cooling is an estimate and not guaranteed.”*

---

## 7. Grounded AI Heat Assistant Interface

The AI Assistant is an intelligent decision-support panel docked to the right of the screen.

### 7.1 Interface Specifications
- **Layout:** Slide-over drawer (`width: 380px`) that overlays or pushes the map canvas without obstructing key navigation.
- **Context Banner:** Sticky pill at the top of the chat indicating the exact data payload injected into the prompt:
  `📍 Phoenix Downtown | HRS: 76 | Active Route: Cool Path (HSS: 84)`
- **Message Rendering:** Structured Markdown with syntax-highlighted data chips, temperature callouts, and numbered mitigation recommendations.
- **Map Interaction Links:** AI responses include clickable location links (e.g., `[Inspect 2nd & Oak Corridor]`) that fly the map camera to that coordinate upon click.

---

## 8. Public Website & Supporting Pages

### 8.1 Landing Page Architecture
1. **Hero Section:**
   - Bold statement: *"Street-Level Thermal Intelligence for Resilient Cities"*.
   - Subheading: *"City-wide averages conceal extreme urban heat islands. HeatShield AI reveals street-by-street microclimates to help you detect, understand, avoid, and reduce heat exposure."*
   - Interactive Live Demo Preview widget.
   - Primary CTA: `Launch HeatShield Studio` (Zero-friction public access).
2. **Problem vs Solution Section:**
   - Interactive comparison: Generic Weather App ($36^\circ\text{C}$ Citywide) vs HeatShield Microclimate ($29^\circ\text{C}$ Shaded Park vs $44^\circ\text{C}$ Unshaded Asphalt).
3. **Core Workflow Grid (4 Columns):**
   - Detect (Spatial Map) $\rightarrow$ Understand (Heat Risk Score) $\rightarrow$ Avoid (Cool Route Finder) $\rightarrow$ Reduce (What-If Simulator).
4. **Hackathon Credibility & Integration Section:**
   - FortyGuard API integration architecture explanation, methodology summary, and open-source documentation links.

### 8.2 Technical Documentation Page
- Layout: 3-column documentation layout (Sidebar Navigation, Main Prose with Mermaid charts and LaTeX math equations, On-This-Page TOC).
- Interactive visualizers embedded in docs:
  - Interactive Heat Risk Score equation calculator.
  - FortyGuard data ingest pipeline diagram.

### 8.3 FAQ Accordion
- Accessible, clean accordions answering questions regarding data freshness, geographic boundaries, AI guardrails, and simulation methodology.

### 8.4 Custom 404 Page
- Minimalist dark aesthetic with animated radar pulse graphic.
- Clear error code `404 // Coordinate Not Found`.
- Direct action buttons: `Return to Heat Map` / `Back to Overview`.

---

## 9. Responsive Layout & Device Adaptability

| Breakpoint | Target Screen | Layout Behavior |
|---|---|---|
| **Desktop ($>1200\text{px}$)** | 1080p / 1440p / 4K Monitors | Full-screen interactive map, dual-floating HUD panels, docked 380px AI drawer, split simulation slider. |
| **Laptop ($992\text{px} - 1199\text{px}$)** | 13" - 15" Laptops | Collapsible AI drawer, stacked route cards, overlay inspector modal. |
| **Tablet ($768\text{px} - 991\text{px}$)** | iPad / Surface Tablets | Touch-friendly map controls ($44\text{px}$ touch targets), bottom-sheet inspector. |
| **Mobile ($<768\text{px}$)** | Smartphones | Full-width bottom drawer with swipe gestures; optimized for pedestrian route following. |

---

## 10. Micro-Interactions & Animation Guidelines

All animations must serve an informational purpose and respect user accessibility settings (`prefers-reduced-motion`).

- **Map Camera Transitions:** Smooth ease-in-out cubic bezier (`transition: transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)`).
- **Thermal HUD Expansion:** Fast spring animation ($180\text{ms}$) on card reveal.
- **Data Counter Morphing:** Numerical values smoothly count up/down upon location change over $300\text{ms}$.
- **Active Route Pulse:** Subtle dash-array animation along the recommended cool route to denote travel direction.
